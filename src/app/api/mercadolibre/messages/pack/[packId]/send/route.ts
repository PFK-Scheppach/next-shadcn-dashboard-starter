import { NextRequest, NextResponse } from 'next/server';
import { sendPackMessage } from '@/lib/mercadolibre-messaging';

// Helper function to handle token refresh
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = process.env.MERCADOLIBRE_REFRESH_TOKEN;
  const clientId = process.env.MERCADOLIBRE_CLIENT_ID;
  const clientSecret = process.env.MERCADOLIBRE_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    console.warn('❌ MercadoLibre refresh credentials not provided');
    return null;
  }

  try {
    console.log('🔄 Refreshing MercadoLibre access token...');
    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken
      })
    });

    if (!res.ok) {
      console.error('❌ Failed to refresh token:', await res.text());
      return null;
    }

    const data = await res.json();
    console.log('✅ Token refreshed successfully');
    return data.access_token;
  } catch (error) {
    console.error('❌ Error refreshing token:', error);
    return null;
  }
}

// Helper function to make API calls with automatic token refresh
async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let accessToken: string | undefined = process.env.MERCADOLIBRE_ACCESS_TOKEN;

  if (!accessToken) {
    console.log('🔄 No access token found, attempting to refresh...');
    const refreshedToken = await refreshAccessToken();
    if (!refreshedToken) {
      throw new Error('No access token available');
    }
    accessToken = refreshedToken;
  }

  // Add authorization header
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  const response = await fetch(url, { ...options, headers });

  // If token expired, try to refresh and retry once
  if (response.status === 401) {
    console.log('🔄 Token expired, refreshing and retrying...');
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders = {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
        'Content-Type': 'application/json'
      };
      return fetch(url, { ...options, headers: retryHeaders });
    }
  }

  return response;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { packId } = resolvedParams;
    const body = await request.json();
    const { text, attachments, text_translated } = body;

    if (!packId) {
      return NextResponse.json(
        { error: 'packId es requerido' },
        { status: 400 }
      );
    }

    if (!text) {
      return NextResponse.json({ error: 'text es requerido' }, { status: 400 });
    }

    console.log(`📤 [API] Enviando mensaje al pack ${packId}`, {
      text_length: text.length,
      has_attachments: !!attachments?.length,
      has_translation: !!text_translated
    });

    const result = await sendPackMessage({
      pack_id: packId,
      text,
      attachments,
      text_translated
    });

    console.log(`✅ [API] Mensaje enviado exitosamente:`, {
      message_id: result.id,
      status: result.status
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('❌ Error enviando mensaje:', error);

    // Parsear error específico de MercadoLibre
    let errorMessage = error.message;
    let statusCode = 500;

    try {
      const errorData = JSON.parse(error.message.split(' - ')[1] || '{}');
      if (errorData.error || errorData.message) {
        errorMessage = errorData.message || errorData.error;
        if (error.message.includes('400')) statusCode = 400;
        if (error.message.includes('403')) statusCode = 403;
        if (error.message.includes('404')) statusCode = 404;
      }
    } catch {
      // Si no se puede parsear, usar el mensaje original
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
