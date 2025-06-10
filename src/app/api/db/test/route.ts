import { NextRequest, NextResponse } from 'next/server';
import { ConversationService } from '@/lib/db/conversations';

export async function GET() {
  try {
    console.log('🧪 [Test] Testing database connection...');

    const conversationService = new ConversationService();

    // Test 1: Verificar conexión básica
    const testResult = await conversationService.getConversations({
      limit: 1,
      offset: 0
    });

    console.log('✅ [Test] Database connection successful');

    // Test 2: Verificar estructura de la respuesta
    const stats = {
      total_conversations: testResult.total,
      database_connected: true,
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? 'configured'
        : 'missing',
      service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY
        ? 'configured'
        : 'missing',
      anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? 'configured'
        : 'missing'
    };

    console.log('📊 [Test] Database stats:', stats);

    return NextResponse.json({
      success: true,
      message: 'Database connection working correctly',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ [Test] Database connection failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.stack,
        environment_check: {
          supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL
            ? 'configured'
            : 'missing',
          service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY
            ? 'configured'
            : 'missing',
          anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            ? 'configured'
            : 'missing'
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
