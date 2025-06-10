import {
  fetchMessageThreadsByDateRange,
  sendBuyerMessage,
  type MercadoLibreMessage
} from '@/lib/mercadolibre';

// Nueva interfaz basada en la implementación real de la API
export interface MessageThread {
  pack_id: number;
  buyer: {
    id: string;
    nickname: string;
  };
  messages: MercadoLibreMessage[];
  lastMessageDate: string;
}

// Función para obtener mensajes usando la nueva implementación oficial
export async function getMessageThreadsByDateRange(
  fromDate?: Date,
  toDate?: Date
): Promise<MessageThread[]> {
  console.log(
    '🔄 [Message Utils] Getting message threads using official pack-based API'
  );

  try {
    const packThreads = await fetchMessageThreadsByDateRange(fromDate, toDate);

    // Convertir al formato esperado por el frontend
    const messageThreads: MessageThread[] = packThreads.map((packThread) => ({
      pack_id: packThread.pack_id,
      buyer: packThread.buyer,
      messages: packThread.messages,
      lastMessageDate:
        packThread.messages.length > 0
          ? packThread.messages[packThread.messages.length - 1].message_date
              .created
          : new Date().toISOString()
    }));

    console.log(
      `✅ [Message Utils] Successfully retrieved ${messageThreads.length} message threads`
    );
    return messageThreads;
  } catch (error) {
    console.error('❌ [Message Utils] Error getting message threads:', error);
    return [];
  }
}

// Función por defecto que usa el mes actual
export async function getMessageThreads(): Promise<MessageThread[]> {
  console.log('🔄 [Message Utils] Getting message threads for current month');
  return getMessageThreadsByDateRange();
}

// Función para enviar mensajes
export async function sendMessage(
  packId: number,
  buyerUserId: string,
  message: string
): Promise<boolean> {
  console.log(
    `📤 [Message Utils] Sending message to pack ${packId}, buyer ${buyerUserId}`
  );

  try {
    const success = await sendBuyerMessage(packId, message, buyerUserId);
    if (success) {
      console.log('✅ [Message Utils] Message sent successfully');
    } else {
      console.error('❌ [Message Utils] Failed to send message');
    }
    return success;
  } catch (error) {
    console.error('❌ [Message Utils] Error sending message:', error);
    return false;
  }
}

// Función helper para formatear fechas
export function formatMessageDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
}

// Función helper para normalizar texto de mensajes
export function normalizeMessageText(text: string | { plain: string }): string {
  return typeof text === 'string' ? text : text.plain;
}
