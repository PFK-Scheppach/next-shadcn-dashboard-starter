import {
  fetchMessages,
  fetchMessagesByDateRange,
  sendBuyerMessage,
  type MercadoLibreMessage
} from '@/lib/mercadolibre';

export interface MessageThread {
  packId: number;
  buyerUserId: string;
  buyerNickname: string;
  messages: MercadoLibreMessage[];
  lastMessageDate: string;
}

export async function getMessageThreads(): Promise<MessageThread[]> {
  try {
    const messages = await fetchMessages();

    // Group messages by pack ID and buyer
    const threadsMap = new Map<string, MessageThread>();

    messages.forEach((message) => {
      // Create a unique key for each conversation (pack + buyer)
      const key = `${message.from.user_id}_${message.to.user_id}`;
      const isFromSeller =
        message.from.user_id === process.env.MERCADOLIBRE_SELLER_ID;
      const buyerUserId = isFromSeller
        ? message.to.user_id
        : message.from.user_id;

      // Extract pack ID from message resources (new API structure)
      const packId = extractPackIdFromMessage(message);
      if (!packId) return;

      if (!threadsMap.has(key)) {
        threadsMap.set(key, {
          packId,
          buyerUserId,
          buyerNickname: 'Cliente', // This would need to be fetched from user details if needed
          messages: [],
          lastMessageDate: message.message_date.created
        });
      }

      const thread = threadsMap.get(key)!;
      thread.messages.push(message);

      // Update last message date if this message is newer
      if (
        new Date(message.message_date.created) >
        new Date(thread.lastMessageDate)
      ) {
        thread.lastMessageDate = message.message_date.created;
      }
    });

    // Sort threads by last message date (newest first)
    return Array.from(threadsMap.values()).sort(
      (a, b) =>
        new Date(b.lastMessageDate).getTime() -
        new Date(a.lastMessageDate).getTime()
    );
  } catch (error) {
    console.error('Error getting message threads:', error);
    return [];
  }
}

export async function getMessageThreadsByDateRange(
  fromDate?: Date,
  toDate?: Date
): Promise<MessageThread[]> {
  try {
    const messages = await fetchMessagesByDateRange(fromDate, toDate);

    // Group messages by pack ID and buyer
    const threadsMap = new Map<string, MessageThread>();

    messages.forEach((message) => {
      // Create a unique key for each conversation (pack + buyer)
      const key = `${message.from.user_id}_${message.to.user_id}`;
      const isFromSeller =
        message.from.user_id === process.env.MERCADOLIBRE_SELLER_ID;
      const buyerUserId = isFromSeller
        ? message.to.user_id
        : message.from.user_id;

      // Extract pack ID from message resources (new API structure)
      const packId = extractPackIdFromMessage(message);
      if (!packId) return;

      if (!threadsMap.has(key)) {
        threadsMap.set(key, {
          packId,
          buyerUserId,
          buyerNickname: 'Cliente', // This would need to be fetched from user details if needed
          messages: [],
          lastMessageDate: message.message_date.created
        });
      }

      const thread = threadsMap.get(key)!;
      thread.messages.push(message);

      // Update last message date if this message is newer
      if (
        new Date(message.message_date.created) >
        new Date(thread.lastMessageDate)
      ) {
        thread.lastMessageDate = message.message_date.created;
      }
    });

    // Sort threads by last message date (newest first)
    return Array.from(threadsMap.values()).sort(
      (a, b) =>
        new Date(b.lastMessageDate).getTime() -
        new Date(a.lastMessageDate).getTime()
    );
  } catch (error) {
    console.error('Error getting message threads by date range:', error);
    return [];
  }
}

export async function sendMessage(
  packId: number,
  text: string,
  buyerUserId: string
): Promise<boolean> {
  try {
    return await sendBuyerMessage(packId, text, buyerUserId);
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}

function extractPackIdFromMessage(message: MercadoLibreMessage): number | null {
  try {
    // Check if message has resources array with pack information
    if ('message_resources' in message) {
      const resources = (message as any).message_resources;
      if (Array.isArray(resources)) {
        const packResource = resources.find((r: any) => r.name === 'packs');
        if (packResource && packResource.id) {
          return parseInt(packResource.id);
        }
      }
    }

    // Fallback: try to extract from message ID or generate a default
    if (message.id) {
      // Try to find a numeric pattern in the message ID
      const numericMatch = message.id.match(/\d+/);
      if (numericMatch) {
        return parseInt(numericMatch[0]);
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function formatMessageDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    return 'Hace unos minutos';
  } else if (diffInHours < 24) {
    return `Hace ${Math.floor(diffInHours)} horas`;
  } else {
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}

export function isMessageFromSeller(message: MercadoLibreMessage): boolean {
  return message.from.user_id === process.env.MERCADOLIBRE_SELLER_ID;
}
