import { NextRequest, NextResponse } from 'next/server';
import { tokenManager } from '@/lib/mercadolibre-token-manager';

export async function POST(req: NextRequest) {
  try {
    const { pack_id, text } = await req.json();

    if (!pack_id || !text?.trim()) {
      return NextResponse.json(
        { error: 'pack_id y text son requeridos' },
        { status: 400 }
      );
    }

    console.log(`📤 [API] Enviando mensaje a pack ${pack_id}`);

    const accessToken = await tokenManager.getValidToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No hay token de acceso disponible' },
        { status: 401 }
      );
    }

    const sellerId = process.env.MERCADOLIBRE_SELLER_ID;
    if (!sellerId) {
      return NextResponse.json(
        { error: 'MERCADOLIBRE_SELLER_ID no configurado' },
        { status: 500 }
      );
    }

    // Enviar mensaje usando la API de MercadoLibre
    const sendResponse = await fetch(
      `https://api.mercadolibre.com/messages/packs/${pack_id}/sellers/${sellerId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text.trim()
        })
      }
    );

    if (!sendResponse.ok) {
      const errorData = await sendResponse.json();
      console.error(`❌ Error enviando mensaje:`, errorData);

      return NextResponse.json(
        {
          error: 'Error al enviar mensaje',
          details: errorData.message || sendResponse.statusText
        },
        { status: sendResponse.status }
      );
    }

    const messageData = await sendResponse.json();
    console.log(`✅ [API] Mensaje enviado exitosamente:`, messageData);

    return NextResponse.json({
      success: true,
      message: 'Mensaje enviado correctamente',
      data: messageData
    });
  } catch (error: any) {
    console.error('❌ Error en endpoint de envío de mensajes:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error.message
      },
      { status: 500 }
    );
  }
}
