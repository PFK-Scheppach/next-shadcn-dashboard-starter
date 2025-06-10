import { NextRequest, NextResponse } from 'next/server';
import { uploadAttachment } from '@/lib/mercadolibre-messaging';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const siteId = (formData.get('site_id') as string) || 'MLC';

    if (!file) {
      return NextResponse.json(
        { error: 'El archivo es requerido' },
        { status: 400 }
      );
    }

    // Validar tamaño del archivo (25MB máximo)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo de 25MB' },
        { status: 400 }
      );
    }

    // Validar extensión del archivo
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.txt'];
    const fileName = file.name.toLowerCase();
    const isValidExtension = allowedExtensions.some((ext) =>
      fileName.endsWith(ext)
    );

    if (!isValidExtension) {
      return NextResponse.json(
        {
          error:
            'Extensión de archivo no válida. Solo se permiten: JPG, PNG, PDF, TXT'
        },
        { status: 400 }
      );
    }

    console.log(`📎 [API] Subiendo archivo adjunto:`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      siteId
    });

    const result = await uploadAttachment(file, siteId);

    console.log(`✅ [API] Archivo subido exitosamente:`, {
      attachment_id: result.id,
      original_name: file.name
    });

    return NextResponse.json({
      ...result,
      original_name: file.name,
      file_size: file.size,
      file_type: file.type
    });
  } catch (error: any) {
    console.error('❌ Error subiendo archivo adjunto:', error);

    // Parsear error específico de MercadoLibre
    let errorMessage = error.message;
    let statusCode = 500;

    try {
      const errorData = JSON.parse(error.message.split(' - ')[1] || '{}');
      if (errorData.error || errorData.message) {
        errorMessage = errorData.message || errorData.error;
        if (error.message.includes('400')) statusCode = 400;
        if (error.message.includes('413')) statusCode = 413; // Payload too large
      }
    } catch {
      // Si no se puede parsear, usar el mensaje original
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
