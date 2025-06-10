import { NextResponse } from 'next/server';
import { tokenManager } from '@/lib/mercadolibre-token-manager';

export async function GET() {
  try {
    const tokenInfo = tokenManager.getTokenInfo();
    const currentToken = await tokenManager.getValidToken();

    return NextResponse.json({
      has_token: !!currentToken,
      token_info: tokenInfo
        ? {
            expires_at: new Date(tokenInfo.expires_at).toISOString(),
            last_refreshed: new Date(tokenInfo.last_refreshed).toISOString(),
            time_until_expiry: tokenInfo.expires_at - Date.now()
          }
        : null,
      current_time: new Date().toISOString(),
      env_token_available: !!process.env.MERCADOLIBRE_ACCESS_TOKEN
    });
  } catch (error) {
    console.error('Error getting token status:', error);
    return NextResponse.json(
      { error: 'Failed to get token status', details: error },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    console.log('🔄 Manual token refresh requested');
    const token = await tokenManager.getValidToken();

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      has_token: !!token
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token', details: error },
      { status: 500 }
    );
  }
}
