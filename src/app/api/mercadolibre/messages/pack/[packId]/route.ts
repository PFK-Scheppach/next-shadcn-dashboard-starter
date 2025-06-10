import { NextRequest, NextResponse } from 'next/server';
import { getPackMessages } from '@/lib/mercadolibre-messaging';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { packId } = resolvedParams;
    const { searchParams } = new URL(request.url);

    const markAsRead = searchParams.get('mark_as_read') !== 'false';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!packId) {
      return NextResponse.json(
        { error: 'packId es requerido' },
        { status: 400 }
      );
    }

    console.log(`🔍 [API] Obteniendo mensajes para pack ${packId}`, {
      markAsRead,
      limit,
      offset
    });

    const messagesData = await getPackMessages(packId, {
      mark_as_read: markAsRead,
      limit,
      offset
    });

    console.log(`✅ [API] Mensajes obtenidos exitosamente:`, {
      pack_id: packId,
      total_messages: messagesData.messages.length,
      conversation_blocked: messagesData.conversation_status.blocked,
      paging: messagesData.paging
    });

    return NextResponse.json(messagesData);
  } catch (error: any) {
    console.error('❌ Error obteniendo mensajes del pack:', error);

    // Parsear error específico de MercadoLibre
    let errorMessage = error.message;
    let statusCode = 500;

    try {
      const errorData = JSON.parse(error.message.split(' - ')[1] || '{}');
      if (errorData.error || errorData.message) {
        errorMessage = errorData.message || errorData.error;
        if (error.message.includes('403')) statusCode = 403;
        if (error.message.includes('404')) statusCode = 404;
      }
    } catch {
      // Si no se puede parsear, usar el mensaje original
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
