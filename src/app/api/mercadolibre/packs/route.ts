import { NextRequest, NextResponse } from 'next/server';
import { tokenManager } from '@/lib/mercadolibre-token-manager';

// Helper function to get message count for a pack using direct API calls with token manager
async function getPackMessageCount(packId: string): Promise<{
  messageCount: number;
  hasMessages: boolean;
  lastMessageDate?: string;
  conversationStatus?: string;
}> {
  try {
    console.log(`🔍 [API] Checking messages for pack ${packId}`);

    // Usar token manager para obtener token válido
    const access_token = await tokenManager.getValidToken();

    if (!access_token) {
      throw new Error('No access token available for message count');
    }

    const sellerId = process.env.MERCADOLIBRE_SELLER_ID;
    const messagesUrl = `https://api.mercadolibre.com/messages/packs/${packId}/sellers/${sellerId}?tag=post_sale&mark_as_read=false&limit=50`;

    const response = await fetch(messagesUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      // Si es 404, probablemente no hay mensajes
      if (response.status === 404) {
        console.log(`📭 Pack ${packId} has no messages (404)`);
        return {
          messageCount: 0,
          hasMessages: false,
          conversationStatus: 'unknown'
        };
      }
      throw new Error(`API call failed: ${response.status}`);
    }

    const messagesData = await response.json();
    const messages = messagesData.messages || [];
    const messageCount = messages.length;
    const hasMessages = messageCount > 0;

    // Get the most recent message date if any
    const lastMessageDate =
      messages.length > 0 ? messages[0].message_date?.created : undefined;

    const conversationStatus = messagesData.conversation_status?.blocked
      ? 'blocked'
      : 'active';

    console.log(`✅ [API] Pack ${packId} has ${messageCount} messages`);

    return {
      messageCount,
      hasMessages,
      lastMessageDate,
      conversationStatus
    };
  } catch (error) {
    console.error(`❌ Error fetching message count for pack ${packId}:`, error);
    return {
      messageCount: 0,
      hasMessages: false,
      conversationStatus: 'error'
    };
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const daysBack = parseInt(searchParams.get('days_back') || '30'); // Aumentar a 30 días por defecto
    const includeMessageCount =
      searchParams.get('include_messages') !== 'false'; // Default to true
    const prioritizeWithMessages =
      searchParams.get('prioritize_messages') !== 'false'; // Default to true
    const showAll = searchParams.get('show_all') === 'true'; // Nuevo parámetro para mostrar absolutamente todo

    console.log(`📦 [API] Obteniendo TODOS los packs de conversaciones`, {
      limit,
      offset,
      daysBack: showAll ? 'ALL' : daysBack,
      includeMessageCount,
      prioritizeWithMessages,
      showAll
    });

    const access_token = await tokenManager.getValidToken();

    if (!access_token) {
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 401 }
      );
    }

    const sellerId = process.env.MERCADOLIBRE_SELLER_ID;

    // MercadoLibre tiene límite máximo de 51 por request, necesitamos paginar
    const maxLimit = 50; // Usar 50 para estar seguros
    let allOrders: any[] = [];

    // Determinar cuántas páginas obtener según el modo
    const maxPages = showAll ? 20 : 10; // 20 páginas = ~1000 órdenes para show_all

    console.log(
      `🔄 Fetching ${showAll ? 'ALL' : 'recent'} orders (max ${maxPages} pages of ${maxLimit} each)`
    );

    // Obtener órdenes paginando
    for (let page = 0; page < maxPages; page++) {
      const offset = page * maxLimit;
      const ordersUrl = `https://api.mercadolibre.com/orders/search?seller=${sellerId}&sort=date_desc&limit=${maxLimit}&offset=${offset}`;

      console.log(`🔄 Fetching page ${page + 1}/${maxPages}: ${ordersUrl}`);

      const ordersResponse = await fetch(ordersUrl, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!ordersResponse.ok) {
        const errorData = await ordersResponse.json();
        console.error(`❌ Error fetching orders page ${page + 1}:`, errorData);

        // Si es la primera página, es un error crítico
        if (page === 0) {
          return NextResponse.json(
            { error: 'Failed to fetch orders', details: errorData },
            { status: ordersResponse.status }
          );
        }
        // Si no es la primera página, solo logging y continuar
        break;
      }

      const pageData = await ordersResponse.json();
      const pageOrders = pageData.results || [];

      console.log(`✅ Page ${page + 1}: Found ${pageOrders.length} orders`);

      // Si no hay más órdenes, terminar paginación
      if (pageOrders.length === 0) {
        console.log(
          `📄 No more orders found at page ${page + 1}, stopping pagination`
        );
        break;
      }

      allOrders.push(...pageOrders);

      // Pequeña pausa entre requests para ser respetuosos con la API
      if (page < maxPages - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    let orders = allOrders;

    console.log(`📊 Found ${orders.length} total orders from API`);

    // Solo filtrar por fecha si no se solicita mostrar todo y hay un límite razonable
    if (!showAll && daysBack > 0 && daysBack < 365) {
      try {
        const cutoffDate = new Date(
          new Date().getTime() - daysBack * 24 * 60 * 60 * 1000
        );
        const ordersBeforeFilter = orders.length;
        orders = orders.filter((order: any) => {
          if (!order.date_created) return false;
          const orderDate = new Date(order.date_created);
          return orderDate >= cutoffDate;
        });
        console.log(
          `📊 Filtered from ${ordersBeforeFilter} to ${orders.length} orders from last ${daysBack} days`
        );
      } catch (error) {
        console.error('Error filtering orders by date:', error);
        // Continue without filtering if there's an error
      }
    }

    // Incluir TODAS las órdenes: con pack_id Y sin pack_id (usando order_id como fallback)
    const packsMap = new Map();

    for (const order of orders) {
      // Usar pack_id si existe, sino usar order_id como pack_id
      const packId = order.pack_id
        ? order.pack_id.toString()
        : order.id.toString();
      const isPackIdFallback = !order.pack_id;

      if (!packsMap.has(packId)) {
        packsMap.set(packId, {
          id: packId,
          order_id: order.id,
          pack_id: order.pack_id,
          is_pack_id_fallback: isPackIdFallback,
          stage: order.status,
          status_detail: order.status_detail || null,
          message_count: 0,
          has_messages: false,
          has_unread_messages: false,
          conversation_status: 'unknown', // No pre-juzgar el estado
          buyer: {
            id: order.buyer.id,
            nickname: order.buyer.nickname
          },
          seller: {
            id: order.seller.id,
            nickname: order.seller.nickname
          },
          date_created: order.date_created,
          last_message_date: order.date_created,
          orders_count: 1,
          order_status: order.status,
          currency_id: order.currency_id,
          total_amount: order.total_amount
        });
      } else {
        // If pack already exists, increment order count
        const existingPack = packsMap.get(packId);
        existingPack.orders_count += 1;
        packsMap.set(packId, existingPack);
      }
    }

    let packs = Array.from(packsMap.values());

    console.log(
      `📦 Found ${packs.length} unique packs from ${orders.length} orders`
    );
    console.log(
      `📦 Breakdown: ${packs.filter((p) => !p.is_pack_id_fallback).length} with pack_id, ${packs.filter((p) => p.is_pack_id_fallback).length} using order_id as fallback`
    );

    // Si se solicita incluir message count, obtener mensajes para cada pack
    if (includeMessageCount && packs.length > 0) {
      console.log(`🔍 Fetching message counts for ${packs.length} packs...`);

      // Process packs in batches to avoid overwhelming the API
      const batchSize = 5; // Reducir tamaño del batch para ser más cuidadosos
      const packsWithMessages = [];

      for (let i = 0; i < packs.length; i += batchSize) {
        const batch = packs.slice(i, i + batchSize);

        const batchPromises = batch.map(async (pack) => {
          try {
            const messageInfo = await getPackMessageCount(pack.id);

            return {
              ...pack,
              message_count: messageInfo.messageCount,
              has_messages: messageInfo.hasMessages,
              conversation_status: messageInfo.conversationStatus || 'unknown',
              last_message_date:
                messageInfo.lastMessageDate || pack.last_message_date
            };
          } catch (error) {
            // Si hay error obteniendo mensajes, mantener el pack pero sin info de mensajes
            console.warn(
              `⚠️ Could not get message count for pack ${pack.id}:`,
              error
            );
            return {
              ...pack,
              message_count: 0,
              has_messages: false,
              conversation_status: 'error',
              last_message_date: pack.last_message_date
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        packsWithMessages.push(...batchResults);

        // Small delay between batches to be respectful to the API
        if (i + batchSize < packs.length) {
          await new Promise((resolve) => setTimeout(resolve, 200)); // Aumentar delay
        }

        console.log(
          `✅ Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(packs.length / batchSize)}`
        );
      }

      packs = packsWithMessages;
      console.log(`✅ Message counts fetched for all packs`);
    }

    // Ordenar packs: primero los que tienen mensajes, luego por fecha
    if (prioritizeWithMessages) {
      packs.sort((a, b) => {
        // First, prioritize packs with messages
        if (a.has_messages && !b.has_messages) return -1;
        if (!a.has_messages && b.has_messages) return 1;

        // If both have messages or both don't, sort by message count (desc) then by date
        if (a.has_messages && b.has_messages) {
          if (a.message_count !== b.message_count) {
            return b.message_count - a.message_count;
          }
        }

        // Finally, sort by last message date or creation date
        const dateA = new Date(a.last_message_date || a.date_created);
        const dateB = new Date(b.last_message_date || b.date_created);
        return dateB.getTime() - dateA.getTime();
      });

      console.log(
        `📊 Packs sorted - ${packs.filter((p) => p.has_messages).length} with messages, ${packs.filter((p) => !p.has_messages).length} without messages`
      );
    }

    // Apply pagination after sorting
    const totalPacks = packs.length;
    const paginatedPacks = packs.slice(offset, offset + limit);

    console.log(
      `✅ [API] Returning ${paginatedPacks.length} packs (${offset}-${offset + paginatedPacks.length} of ${totalPacks})`
    );

    return NextResponse.json({
      packs: paginatedPacks,
      total: totalPacks,
      summary: {
        total_packs: totalPacks,
        packs_with_messages: packs.filter((p) => p.has_messages).length,
        packs_without_messages: packs.filter((p) => !p.has_messages).length,
        packs_with_pack_id: packs.filter((p) => !p.is_pack_id_fallback).length,
        packs_using_order_id: packs.filter((p) => p.is_pack_id_fallback).length,
        conversation_statuses: {
          active: packs.filter((p) => p.conversation_status === 'active')
            .length,
          blocked: packs.filter((p) => p.conversation_status === 'blocked')
            .length,
          unknown: packs.filter((p) => p.conversation_status === 'unknown')
            .length,
          error: packs.filter((p) => p.conversation_status === 'error').length
        },
        order_statuses: {
          confirmed: packs.filter((p) => p.order_status === 'confirmed').length,
          paid: packs.filter((p) => p.order_status === 'paid').length,
          shipped: packs.filter((p) => p.order_status === 'shipped').length,
          delivered: packs.filter((p) => p.order_status === 'delivered').length,
          cancelled: packs.filter((p) => p.order_status === 'cancelled').length,
          other: packs.filter(
            (p) =>
              ![
                'confirmed',
                'paid',
                'shipped',
                'delivered',
                'cancelled'
              ].includes(p.order_status)
          ).length
        },
        days_searched: showAll ? 'ALL' : daysBack,
        search_parameters: {
          show_all: showAll,
          include_messages: includeMessageCount,
          prioritize_messages: prioritizeWithMessages,
          orders_fetched: orders.length,
          max_pages: maxPages,
          orders_per_page: maxLimit,
          total_orders_fetched: orders.length
        }
      },
      paging: {
        limit,
        offset,
        total: totalPacks,
        has_next: offset + limit < totalPacks,
        has_prev: offset > 0
      }
    });
  } catch (error: any) {
    console.error('❌ Error fetching packs:', error);

    return NextResponse.json(
      { error: 'Failed to fetch packs', message: error.message },
      { status: 500 }
    );
  }
}
