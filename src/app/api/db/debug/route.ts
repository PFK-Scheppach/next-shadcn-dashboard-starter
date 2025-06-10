import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Obtener todas las conversaciones sin filtros
    const {
      data: allConversations,
      error: allError,
      count: totalCount
    } = await supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (allError) {
      throw new Error(`Error fetching conversations: ${allError.message}`);
    }

    // Obtener unique seller_ids
    const { data: sellerIds, error: sellerError } = await supabaseAdmin
      .from('conversations')
      .select('seller_id')
      .not('seller_id', 'is', null);

    if (sellerError) {
      throw new Error(`Error fetching seller_ids: ${sellerError.message}`);
    }

    const uniqueSellerIds = Array.from(
      new Set(sellerIds?.map((s) => s.seller_id) || [])
    );

    // Contar por seller_id
    const sellerStats = await Promise.all(
      uniqueSellerIds.map(async (sellerId) => {
        const { count, error } = await supabaseAdmin
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', sellerId);

        return {
          seller_id: sellerId,
          count: count || 0,
          is_current: sellerId === process.env.MERCADOLIBRE_SELLER_ID
        };
      })
    );

    return NextResponse.json({
      success: true,
      total_conversations: totalCount,
      current_seller_id: process.env.MERCADOLIBRE_SELLER_ID,
      seller_stats: sellerStats.sort((a, b) => b.count - a.count),
      sample_conversations:
        allConversations?.slice(0, 5).map((c) => ({
          pack_id: c.pack_id,
          seller_id: c.seller_id,
          buyer_nickname: c.buyer_nickname,
          total_messages: c.total_messages,
          created_at: c.created_at
        })) || []
    });
  } catch (error: any) {
    console.error('❌ Error in debug endpoint:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch debug data',
        message: error.message
      },
      { status: 500 }
    );
  }
}
