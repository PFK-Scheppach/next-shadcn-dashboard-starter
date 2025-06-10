import { NextRequest, NextResponse } from 'next/server';
import { MercadoLibreSyncService } from '@/lib/mercadolibre-sync';

const syncService = new MercadoLibreSyncService();

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
    const forceSync = searchParams.get('force_sync') === 'true';

    if (!packId) {
      return NextResponse.json(
        { error: 'packId es requerido' },
        { status: 400 }
      );
    }

    console.log(
      `🔍 [API] Obteniendo mensajes para pack ${packId} (con cache DB)`,
      {
        markAsRead,
        limit,
        offset,
        forceSync
      }
    );

    // Usar el servicio de sincronización que maneja el cache de base de datos
    const messagesResult = await syncService.getMessagesWithSync(packId, {
      limit,
      offset,
      forceSync
    });

    // Preparar respuesta en el formato esperado por el frontend
    const messagesData = {
      messages: messagesResult.messages,
      paging: {
        limit,
        offset,
        total: messagesResult.total
      },
      conversation_status: {
        blocked: false // Asumimos no bloqueado por defecto
      },
      pack_id: packId,
      cached: messagesResult.fromCache,
      error: messagesResult.error || null
    };

    console.log(`✅ [API] Mensajes obtenidos exitosamente:`, {
      pack_id: packId,
      total_messages: messagesResult.total,
      returned_messages: messagesResult.messages.length,
      cached: messagesResult.fromCache,
      paging: messagesData.paging
    });

    return NextResponse.json(messagesData);
  } catch (error: any) {
    console.error('❌ Error obteniendo mensajes del pack:', error);

    // Parsear error específico de MercadoLibre
    let errorMessage = error.message;
    let statusCode = 500;

    try {
      if (error.message.includes('API call failed:')) {
        const errorParts = error.message.split(' - ');
        if (errorParts.length > 1) {
          const errorData = JSON.parse(errorParts[1]);
          if (errorData.message || errorData.error) {
            errorMessage = errorData.message || errorData.error;
            if (error.message.includes('403')) statusCode = 403;
            if (error.message.includes('404')) statusCode = 404;
          }
        }
      }
    } catch {
      // Si no se puede parsear, usar el mensaje original
    }

    return NextResponse.json(
      {
        error: errorMessage,
        cached: false
      },
      { status: statusCode }
    );
  }
}
