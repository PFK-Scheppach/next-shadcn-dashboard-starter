import { supabaseAdmin } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type ConversationRow = Database['public']['Tables']['conversations']['Row'];
type ConversationInsert =
  Database['public']['Tables']['conversations']['Insert'];
type ConversationUpdate =
  Database['public']['Tables']['conversations']['Update'];

type MessageRow = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];
type MessageUpdate = Database['public']['Tables']['messages']['Update'];

type SyncStatusRow = Database['public']['Tables']['sync_status']['Row'];
type SyncStatusInsert = Database['public']['Tables']['sync_status']['Insert'];

export class ConversationService {
  /**
   * Obtiene todas las conversaciones desde la base de datos
   */
  async getConversations(params: {
    limit?: number;
    offset?: number;
    sellerId?: string;
    daysBack?: number;
    includeMessageCount?: boolean;
    prioritizeWithMessages?: boolean;
  }): Promise<{
    conversations: ConversationRow[];
    total: number;
  }> {
    let query = supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact' });

    if (params.sellerId) {
      query = query.eq('seller_id', params.sellerId);
    }

    if (params.daysBack && params.daysBack < 365) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - params.daysBack);
      query = query.or(
        `last_message_date.gte.${daysAgo.toISOString()},last_message_date.is.null,created_at.gte.${daysAgo.toISOString()}`
      );
    }

    // Ordenar por fecha del último mensaje o total de mensajes
    if (params.prioritizeWithMessages) {
      query = query.order('total_messages', { ascending: false });
    } else {
      query = query.order('last_message_date', {
        ascending: false,
        nullsFirst: false
      });
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(
        params.offset,
        params.offset + (params.limit || 50) - 1
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching conversations:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      conversations: data || [],
      total: count || 0
    };
  }

  /**
   * Obtiene una conversación específica por pack_id
   */
  async getConversationByPackId(
    packId: string
  ): Promise<ConversationRow | null> {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('pack_id', packId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found
      console.error('Error fetching conversation:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Crea o actualiza una conversación
   */
  async upsertConversation(
    conversation: ConversationInsert
  ): Promise<ConversationRow> {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .upsert(conversation, {
        onConflict: 'pack_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting conversation:', error);
      throw new Error(
        `Database error: ${error?.message || JSON.stringify(error)}`
      );
    }

    return data;
  }

  /**
   * Obtiene el conteo de mensajes para un pack específico
   */
  async getMessageCount(packId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('pack_id', packId);

    if (error) {
      console.error('Error counting messages:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Obtiene mensajes de una conversación
   */
  async getMessages(params: {
    packId?: string;
    conversationId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    messages: MessageRow[];
    total: number;
  }> {
    let query = supabaseAdmin.from('messages').select('*', { count: 'exact' });

    if (params.packId) {
      query = query.eq('pack_id', params.packId);
    }

    if (params.conversationId) {
      query = query.eq('conversation_id', params.conversationId);
    }

    query = query.order('message_date', { ascending: true });

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(
        params.offset,
        params.offset + (params.limit || 50) - 1
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      messages: data || [],
      total: count || 0
    };
  }

  /**
   * Crea o actualiza un mensaje
   */
  async upsertMessage(message: MessageInsert): Promise<MessageRow> {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .upsert(message, {
        onConflict: 'message_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting message:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Actualizar el contador de mensajes en la conversación
    await this.updateConversationMessageCount(message.pack_id);

    return data;
  }

  /**
   * Guarda múltiples mensajes de una vez
   */
  async upsertMessages(messages: MessageInsert[]): Promise<MessageRow[]> {
    if (messages.length === 0) return [];

    const { data, error } = await supabaseAdmin
      .from('messages')
      .upsert(messages, {
        onConflict: 'message_id',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error('Error upserting messages:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Actualizar contador para cada pack único
    const uniquePackIds = Array.from(new Set(messages.map((m) => m.pack_id)));
    for (const packId of uniquePackIds) {
      await this.updateConversationMessageCount(packId);
    }

    return data || [];
  }

  /**
   * Actualiza el contador de mensajes de una conversación
   */
  private async updateConversationMessageCount(packId: string): Promise<void> {
    // Contar mensajes
    const { count, error: countError } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('pack_id', packId);

    if (countError) {
      console.error('Error counting messages:', countError);
      return;
    }

    // Obtener fecha del último mensaje
    const { data: lastMessage, error: lastError } = await supabaseAdmin
      .from('messages')
      .select('message_date')
      .eq('pack_id', packId)
      .order('message_date', { ascending: false })
      .limit(1)
      .single();

    if (lastError && lastError.code !== 'PGRST116') {
      console.error('Error getting last message:', lastError);
      return;
    }

    // Actualizar conversación
    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({
        total_messages: count || 0,
        last_message_date: lastMessage?.message_date || null,
        last_sync_date: new Date().toISOString()
      })
      .eq('pack_id', packId);

    if (updateError) {
      console.error('Error updating conversation count:', updateError);
    }
  }

  /**
   * Marca una conversación como sincronizada
   */
  async markAsSynced(
    entityType: 'conversation' | 'message',
    entityId: string
  ): Promise<void> {
    const { error } = await supabaseAdmin.from('sync_status').upsert(
      {
        entity_type: entityType,
        entity_id: entityId,
        sync_status: 'synced',
        last_sync_date: new Date().toISOString(),
        error_message: null
      },
      {
        onConflict: 'entity_type,entity_id'
      }
    );

    if (error) {
      console.error('Error marking as synced:', error);
    }
  }

  /**
   * Marca una entidad con error de sincronización
   */
  async markSyncError(
    entityType: 'conversation' | 'message',
    entityId: string,
    errorMessage: string
  ): Promise<void> {
    const { error } = await supabaseAdmin.from('sync_status').upsert(
      {
        entity_type: entityType,
        entity_id: entityId,
        sync_status: 'error',
        last_sync_date: new Date().toISOString(),
        error_message: errorMessage
      },
      {
        onConflict: 'entity_type,entity_id'
      }
    );

    if (error) {
      console.error('Error marking sync error:', error);
    }
  }

  /**
   * Verifica si una entidad necesita sincronización
   */
  async needsSync(
    entityType: 'conversation' | 'message',
    entityId: string,
    maxAgeMinutes: number = 30
  ): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('sync_status')
      .select('last_sync_date, sync_status')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking sync status:', error);
      return true; // Si hay error, asumir que necesita sync
    }

    if (!data) {
      return true; // No existe, necesita sync
    }

    if (data.sync_status === 'error') {
      return true; // Si hay error, reintentar
    }

    // Verificar si es muy viejo
    const lastSync = new Date(data.last_sync_date);
    const now = new Date();
    const ageInMinutes = (now.getTime() - lastSync.getTime()) / (1000 * 60);

    return ageInMinutes > maxAgeMinutes;
  }

  /**
   * Obtiene conversaciones que necesitan sincronización
   */
  async getConversationsNeedingSync(limit: number = 10): Promise<string[]> {
    const maxAge = new Date();
    maxAge.setMinutes(maxAge.getMinutes() - 30); // 30 minutos

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('pack_id')
      .or(`last_sync_date.is.null,last_sync_date.lt.${maxAge.toISOString()}`)
      .limit(limit);

    if (error) {
      console.error('Error getting conversations needing sync:', error);
      return [];
    }

    return data?.map((c) => c.pack_id) || [];
  }
}
