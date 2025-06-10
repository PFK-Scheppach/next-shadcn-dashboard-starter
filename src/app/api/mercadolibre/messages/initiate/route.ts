import { NextRequest, NextResponse } from 'next/server';
import { initiateConversation } from '@/lib/mercadolibre-messaging';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pack_id, option_id, template_id, text } = body;

    if (!pack_id || !option_id) {
      return NextResponse.json(
        { error: 'pack_id y option_id son requeridos' },
        { status: 400 }
      );
    }

    // Validar que se proporcione texto para opciones de texto libre
    if ((option_id === 'OTHER' || option_id === 'SEND_INVOICE_LINK') && !text) {
      return NextResponse.json(
        { error: 'El texto es requerido para opciones de texto libre' },
        { status: 400 }
      );
    }

    // Validar que se proporcione template_id para opciones de template
    if (
      (option_id === 'REQUEST_VARIANTS' ||
        option_id === 'REQUEST_BILLING_INFO') &&
      !template_id
    ) {
      return NextResponse.json(
        { error: 'template_id es requerido para opciones de template' },
        { status: 400 }
      );
    }

    console.log(`🚀 [API] Iniciando conversación para pack ${pack_id}`, {
      option_id,
      template_id,
      has_text: !!text
    });

    const result = await initiateConversation({
      pack_id,
      option_id,
      template_id,
      text
    });

    console.log(`✅ [API] Conversación iniciada exitosamente:`, {
      message_id: result.id,
      status: result.status
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('❌ Error iniciando conversación:', error);

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
        if (error.message.includes('409')) statusCode = 409;
      }
    } catch {
      // Si no se puede parsear, usar el mensaje original
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
