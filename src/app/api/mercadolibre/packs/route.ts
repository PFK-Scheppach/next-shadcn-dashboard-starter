import { NextRequest, NextResponse } from 'next/server';
import { tokenManager } from '@/lib/mercadolibre-token-manager';
import { MercadoLibreSyncService } from '@/lib/mercadolibre-sync';
import { getCachedOrderInfo } from '@/lib/mercadolibre-products';

const syncService = new MercadoLibreSyncService();

// Helper function to fetch and sync packs when cache is empty or stale
async function fetchAndSyncPacksFromAPI(
  limit: number = 50,
  daysBack: number = 30,
  sellerId?: string
): Promise<any[]> {
  console.log('🔄 [API] Fetching fresh data from MercadoLibre...');

  const access_token = await tokenManager.getValidToken();
  if (!access_token) {
    throw new Error('No access token available');
  }

  const maxLimit = 50;
  let allOrders: any[] = [];
  const maxPages = Math.min(Math.ceil(limit / maxLimit), 10); // Límite máximo de páginas

  // Obtener órdenes paginando
  for (let page = 0; page < maxPages; page++) {
    const offset = page * maxLimit;
    const ordersUrl = `https://api.mercadolibre.com/orders/search?seller=${sellerId}&sort=date_desc&limit=${maxLimit}&offset=${offset}`;

    const ordersResponse = await fetch(ordersUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!ordersResponse.ok) {
      const errorData = await ordersResponse.json();
      console.error(`❌ Error fetching orders page ${page + 1}:`, errorData);
      if (page === 0) {
        throw new Error(`Failed to fetch orders: ${JSON.stringify(errorData)}`);
      }
      break;
    }

    const pageData = await ordersResponse.json();
    const pageOrders = pageData.results || [];

    if (pageOrders.length === 0) {
      console.log(
        `📄 No more orders found at page ${page + 1}, stopping pagination`
      );
      break;
    }

    allOrders.push(...pageOrders);

    // Rate limiting
    if (page < maxPages - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log(`📊 Found ${allOrders.length} orders from API`);

  // Filtrar por fecha si es necesario
  if (daysBack > 0 && daysBack < 365) {
    const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    allOrders = allOrders.filter((order: any) => {
      if (!order.date_created) return false;
      const orderDate = new Date(order.date_created);
      return orderDate >= cutoffDate;
    });
    console.log(
      `📊 Filtered to ${allOrders.length} orders from last ${daysBack} days`
    );
  }

  // Sincronizar conversaciones y obtener información del producto
  const packsMap = new Map();
  console.log(
    `🔄 [API] Enriqueciendo ${allOrders.length} órdenes con información de productos...`
  );

  for (const order of allOrders) {
    const packId = order.pack_id
      ? order.pack_id.toString()
      : order.id.toString();

    if (!packsMap.has(packId)) {
      // Sincronizar conversación en la base de datos
      try {
        await syncService.syncConversation(packId, order);
      } catch (error) {
        console.error(`❌ Error syncing conversation ${packId}:`, error);
      }

      // Obtener información detallada de la orden con productos
      let productInfo = null;
      let shippingInfo = null;

      try {
        const orderInfo = await getCachedOrderInfo(order.id.toString());
        if (orderInfo && orderInfo.products.length > 0) {
          // Tomar el primer producto (la mayoría de órdenes tienen 1 producto)
          const firstProduct = orderInfo.products[0];
          productInfo = {
            title: firstProduct.title,
            thumbnail: firstProduct.thumbnail,
            quantity: orderInfo.products.reduce(
              (sum, p) => sum + p.quantity,
              0
            ),
            unit_price: firstProduct.unit_price
          };

          // Información de envío si está disponible
          if (orderInfo.shipping) {
            shippingInfo = {
              status: orderInfo.shipping.status,
              tracking_number: orderInfo.shipping.id
            };
          }
        }
      } catch (error) {
        console.warn(
          `⚠️ Could not load product info for order ${order.id}:`,
          error
        );
      }

      packsMap.set(packId, {
        id: packId,
        order_id: order.id,
        pack_id: order.pack_id,
        is_pack_id_fallback: !order.pack_id,
        stage: order.status,
        buyer: {
          id: order.buyer.id,
          nickname: order.buyer.nickname
        },
        seller: {
          id: order.seller.id,
          nickname: order.seller.nickname
        },
        date_created: order.date_created,
        order_status: order.status,
        currency_id: order.currency_id,
        total_amount: order.total_amount,
        product_info: productInfo,
        shipping: shippingInfo
      });

      // Rate limiting para evitar sobrecargar la API
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return Array.from(packsMap.values());
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const daysBack = parseInt(searchParams.get('days_back') || '30');
    const includeMessageCount =
      searchParams.get('include_messages') !== 'false';
    const prioritizeWithMessages =
      searchParams.get('prioritize_messages') !== 'false';
    const forceSync = searchParams.get('force_sync') === 'true';
    const sellerId = process.env.MERCADOLIBRE_SELLER_ID;

    console.log('📦 [API] Obteniendo packs con cache de base de datos', {
      limit,
      offset,
      daysBack,
      includeMessageCount,
      prioritizeWithMessages,
      forceSync
    });

    // 1. Intentar obtener desde el servicio de sincronización (cache)
    let result;
    try {
      result = await syncService.getPacksWithSync({
        limit: limit + offset, // Obtener más para paginar después
        offset: 0,
        sellerId,
        daysBack,
        includeMessageCount,
        prioritizeWithMessages,
        forceSync
      });
    } catch (cacheError) {
      console.error(
        '❌ Error accessing cache, falling back to API:',
        cacheError
      );

      // 2. Si falla el cache, obtener directamente de la API
      const freshPacks = await fetchAndSyncPacksFromAPI(
        limit * 2,
        daysBack,
        sellerId
      );
      result = {
        packs: freshPacks,
        total: freshPacks.length,
        fromCache: false
      };
    }

    // 3. Si no hay datos en cache y no hay fallo, sincronizar desde API
    if (result.packs.length === 0 && !forceSync) {
      console.log('📭 No data in cache, fetching from API...');
      const freshPacks = await fetchAndSyncPacksFromAPI(
        limit * 2,
        daysBack,
        sellerId
      );
      result = {
        packs: freshPacks,
        total: freshPacks.length,
        fromCache: false
      };
    }

    // 4. Aplicar paginación
    const totalPacks = result.total;
    const paginatedPacks = result.packs.slice(offset, offset + limit);

    // 5. Enriquecer con conteo de mensajes si se solicita
    let finalPacks = paginatedPacks;
    if (includeMessageCount && paginatedPacks.length > 0) {
      console.log(
        `🔍 [API] Enriqueciendo ${paginatedPacks.length} packs con conteo de mensajes...`
      );

      finalPacks = await Promise.all(
        paginatedPacks.map(async (pack) => {
          try {
            const messagesResult = await syncService.getMessagesWithSync(
              pack.id,
              {
                limit: 1,
                offset: 0,
                forceSync: false // Solo forzar si no hay datos
              }
            );

            return {
              ...pack,
              message_count: messagesResult.total,
              has_messages: messagesResult.total > 0,
              conversation_status:
                messagesResult.total > 0 ? 'active' : 'unknown',
              last_message_date: pack.date_created // Por ahora usar fecha de creación
            };
          } catch (error) {
            console.warn(
              `⚠️ Could not get message count for pack ${pack.id}:`,
              error
            );
            return {
              ...pack,
              message_count: 0,
              has_messages: false,
              conversation_status: 'error',
              last_message_date: pack.date_created
            };
          }
        })
      );
    }

    // 6. Ordenar si se solicita priorizar mensajes
    if (prioritizeWithMessages && includeMessageCount) {
      finalPacks.sort((a, b) => {
        // Priorizar packs con mensajes
        if (a.has_messages && !b.has_messages) return -1;
        if (!a.has_messages && b.has_messages) return 1;

        // Si ambos tienen mensajes, ordenar por cantidad
        if (a.has_messages && b.has_messages) {
          if (a.message_count !== b.message_count) {
            return b.message_count - a.message_count;
          }
        }

        // Finalmente ordenar por fecha
        const dateA = new Date(a.last_message_date || a.date_created);
        const dateB = new Date(b.last_message_date || b.date_created);
        return dateB.getTime() - dateA.getTime();
      });
    }

    console.log(
      `✅ [API] Returning ${finalPacks.length} packs (${offset}-${offset + finalPacks.length} of ${totalPacks}) [${result.fromCache ? 'CACHED' : 'FRESH'}]`
    );

    return NextResponse.json({
      packs: finalPacks,
      total: totalPacks,
      cached: result.fromCache,
      summary: {
        total_packs: totalPacks,
        packs_with_messages: finalPacks.filter((p) => p.has_messages).length,
        packs_without_messages: finalPacks.filter((p) => !p.has_messages)
          .length,
        data_source: result.fromCache ? 'database_cache' : 'mercadolibre_api',
        search_parameters: {
          include_messages: includeMessageCount,
          prioritize_messages: prioritizeWithMessages,
          days_back: daysBack,
          force_sync: forceSync
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
      {
        error: 'Failed to fetch packs',
        message: error.message,
        cached: false
      },
      { status: 500 }
    );
  }
}
