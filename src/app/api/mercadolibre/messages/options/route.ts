import { NextRequest, NextResponse } from 'next/server';
import {
  getMessageOptions,
  getMessageCaps
} from '@/lib/mercadolibre-messaging';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const packId = searchParams.get('pack_id');

    if (!packId) {
      return NextResponse.json(
        { error: 'pack_id es requerido' },
        { status: 400 }
      );
    }

    console.log(
      `🔍 [API] Obteniendo opciones de comunicación para pack ${packId}`
    );

    // Obtener opciones y capacidades disponibles
    const [optionsData, capsData] = await Promise.all([
      getMessageOptions(packId),
      getMessageCaps(packId)
    ]);

    // Combinar datos para respuesta completa
    const response = {
      options: optionsData.options,
      caps: capsData,
      pack_id: packId
    };

    console.log(`✅ [API] Opciones obtenidas exitosamente:`, {
      total_options: optionsData.options.length,
      available_caps: capsData.length
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ Error obteniendo opciones de comunicación:', error);

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
