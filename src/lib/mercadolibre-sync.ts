import { ConversationService } from '@/lib/db/conversations';
import { getPackMessages } from '@/lib/mercadolibre-messaging';
import { getCachedOrderInfo } from '@/lib/mercadolibre-products';

export class MercadoLibreSyncService {
  private conversationService: ConversationService;

  constructor() {
    this.conversationService = new ConversationService();
  }

  /**
   * Obtiene packs con sincronización inteligente:
   * 1. Busca en la base de datos local primero
   * 2. Si no hay datos o están desactualizados, sincroniza con la API
   */
  async getPacksWithSync(params: {
    limit?: number;
    offset?: number;
    sellerId?: string;
    daysBack?: number;
    includeMessageCount?: boolean;
    prioritizeWithMessages?: boolean;
    forceSync?: boolean;
  }) {
    const {
      limit = 50,
      offset = 0,
      sellerId,
      daysBack = 30,
      includeMessageCount = true,
      prioritizeWithMessages = true,
      forceSync = false
    } = params;

    try {
      // 1. Intentar obtener desde la base de datos local
      if (!forceSync) {
        console.log('🔍 [Sync] Checking local database first...');
        const localData = await this.conversationService.getConversations({
          limit,
          offset,
          sellerId,
          daysBack,
          includeMessageCount,
          prioritizeWithMessages
        });

        // Si tenemos datos locales recientes, usarlos
        if (localData.conversations.length > 0) {
          console.log(
            `✅ [Sync] Found ${localData.conversations.length} conversations in local DB`
          );

          // Convertir formato de DB a formato esperado por el componente
          const packs = await Promise.all(
            localData.conversations.map(async (conv) => {
              // Intentar obtener información del producto de la orden
              let productInfo = null;
              let shippingInfo = null;

              if (conv.order_id) {
                try {
                  const orderInfo = await getCachedOrderInfo(conv.order_id);
                  if (orderInfo && orderInfo.products.length > 0) {
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

                    if (orderInfo.shipping) {
                      shippingInfo = {
                        status: orderInfo.shipping.status,
                        tracking_number: orderInfo.shipping.id
                      };
                    }
                  }
                } catch (error) {
                  console.warn(
                    `⚠️ Could not load product info for order ${conv.order_id}:`,
                    error
                  );
                }
              }

              // Obtener información completa de la orden para price y currency
              let orderData = null;
              let total_amount = 0;
              let currency_id = 'CLP';
              let order_status = conv.conversation_status || 'unknown';

              if (conv.order_id) {
                try {
                  const { fetchOrderDetails } = await import(
                    '@/lib/mercadolibre'
                  );
                  orderData = await fetchOrderDetails(conv.order_id);
                  if (orderData) {
                    total_amount = orderData.total_amount || 0;
                    currency_id = orderData.currency_id || 'CLP';
                    order_status =
                      orderData.status || conv.conversation_status || 'unknown';
                  }
                } catch (error) {
                  console.warn(
                    `⚠️ Could not load order data for order ${conv.order_id}:`,
                    error
                  );
                }
              }

              return {
                id: conv.pack_id,
                order_id: conv.order_id || conv.pack_id,
                pack_id: conv.pack_id,
                is_pack_id_fallback: false,
                stage: order_status,
                status_detail: null,
                message_count: conv.total_messages || 0,
                has_messages: (conv.total_messages || 0) > 0,
                has_unread_messages: false, // TODO: Implementar lógica de no leídos
                conversation_status: conv.conversation_status || 'active',
                buyer: {
                  id: parseInt(conv.buyer_id || '0'),
                  nickname: conv.buyer_nickname || 'Unknown'
                },
                seller: {
                  id: parseInt(conv.seller_id || '0'),
                  nickname: 'Seller' // TODO: Agregar nickname del seller a la DB
                },
                date_created: conv.created_at,
                last_message_date: conv.last_message_date || conv.created_at,
                orders_count: 1,
                order_status: order_status,
                currency_id: currency_id,
                total_amount: total_amount,
                product_info: productInfo,
                shipping: shippingInfo
              };
            })
          );

          return {
            packs,
            total: localData.total,
            fromCache: true
          };
        }
      }

      // Si no hay datos locales, devolver vacío por ahora
      // En una implementación completa, aquí harías la llamada a la API de MercadoLibre
      return {
        packs: [],
        total: 0,
        fromCache: false
      };
    } catch (error) {
      console.error('❌ [Sync] Error in getPacksWithSync:', error);
      throw error;
    }
  }

  /**
   * Obtiene mensajes con sincronización inteligente
   */
  async getMessagesWithSync(
    packId: string,
    params: {
      limit?: number;
      offset?: number;
      forceSync?: boolean;
    }
  ) {
    const { limit = 10, offset = 0, forceSync = false } = params;

    try {
      // 1. Verificar si necesita sincronización
      const needsSync =
        forceSync ||
        (await this.conversationService.needsSync('message', packId, 30));

      if (!needsSync) {
        console.log(
          `🔍 [Sync] Getting messages for pack ${packId} from local DB`
        );
        const localData = await this.conversationService.getMessages({
          packId,
          limit,
          offset
        });

        if (localData.messages.length > 0) {
          console.log(
            `✅ [Sync] Found ${localData.messages.length} messages in local DB`
          );
          return {
            messages: this.convertDbMessagesToApiFormat(localData.messages),
            total: localData.total,
            fromCache: true
          };
        }
      }

      // 2. Si necesita sync, obtener de la API y guardar en DB
      console.log(`🔄 [Sync] Fetching messages for pack ${packId} from API...`);
      const apiData = await getPackMessages(packId, { limit: 50, offset: 0 });

      // 3. Guardar en la base de datos
      if (apiData.messages && apiData.messages.length > 0) {
        console.log(
          `💾 [Sync] Saving ${apiData.messages.length} messages to database...`
        );
        await this.saveMessagesToDatabase(packId, apiData.messages);
        await this.conversationService.markAsSynced('message', packId);
      }

      // 4. Retornar datos paginados
      const messages = apiData.messages?.slice(offset, offset + limit) || [];

      return {
        messages,
        total: apiData.paging?.total || messages.length,
        fromCache: false
      };
    } catch (error) {
      console.error(
        `❌ [Sync] Error getting messages for pack ${packId}:`,
        error
      );
      await this.conversationService.markSyncError(
        'message',
        packId,
        error instanceof Error ? error.message : 'Unknown error'
      );

      // Fallback a datos locales
      try {
        const fallbackData = await this.conversationService.getMessages({
          packId,
          limit,
          offset
        });

        return {
          messages: this.convertDbMessagesToApiFormat(fallbackData.messages),
          total: fallbackData.total,
          fromCache: true,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      } catch (fallbackError) {
        console.error('❌ [Sync] Fallback also failed:', fallbackError);
        throw error;
      }
    }
  }

  /**
   * Guarda mensajes en la base de datos
   */
  private async saveMessagesToDatabase(packId: string, messages: any[]) {
    const conversation =
      await this.conversationService.getConversationByPackId(packId);
    if (!conversation) {
      console.error(`❌ [Sync] Conversation not found for pack ${packId}`);
      return;
    }

    const messageInserts = messages.map((msg) => ({
      message_id: msg.message_id?.value || msg.message_id || msg.id,
      conversation_id: conversation.id,
      pack_id: packId,
      from_user_id: msg.from.user_id,
      to_user_id: msg.to.user_id,
      text: msg.text,
      text_translated: msg.text_translated || null,
      message_date: msg.message_date.received,
      status: msg.status,
      moderation_status: msg.moderation?.status,
      moderation_reason: msg.moderation?.reason,
      attachments: msg.attachments?.length > 0 ? msg.attachments : null,
      is_first_message: msg.first_message || false
    }));

    await this.conversationService.upsertMessages(messageInserts);
  }

  /**
   * Convierte mensajes de DB al formato de la API
   */
  private convertDbMessagesToApiFormat(dbMessages: any[]) {
    return dbMessages.map((msg) => ({
      message_id: { value: msg.message_id },
      message_date: { received: msg.message_date },
      from: { user_id: msg.from_user_id },
      to: { user_id: msg.to_user_id },
      text: msg.text,
      text_translated: msg.text_translated,
      status: msg.status,
      moderation: {
        status: msg.moderation_status,
        reason: msg.moderation_reason
      },
      attachments: msg.attachments || [],
      first_message: msg.is_first_message
    }));
  }

  /**
   * Sincroniza una conversación específica desde la API
   */
  async syncConversation(packId: string, orderData: any) {
    try {
      const conversation = {
        pack_id: packId,
        seller_id: orderData.seller?.id?.toString() || 'unknown',
        buyer_id: orderData.buyer?.id?.toString(),
        buyer_nickname: orderData.buyer?.nickname,
        order_id: orderData.id?.toString(),
        total_messages: 0,
        last_message_date: null,
        last_sync_date: new Date().toISOString(),
        conversation_status: orderData.status
      };

      await this.conversationService.upsertConversation(conversation);
      await this.conversationService.markAsSynced('conversation', packId);

      console.log(`✅ [Sync] Conversation ${packId} synced successfully`);
    } catch (error) {
      console.error(`❌ [Sync] Error syncing conversation ${packId}:`, error);
      await this.conversationService.markSyncError(
        'conversation',
        packId,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}
