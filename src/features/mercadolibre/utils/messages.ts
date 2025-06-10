import {
  fetchAllMessageThreads,
  fetchAllMessagesForPack,
  sendBuyerMessage,
  type MercadoLibreThread,
  type MercadoLibreMessage
} from '@/lib/mercadolibre';

export interface MessageThread {
  packId: number;
  buyerUserId: string;
  buyerNickname: string;
  lastMessageDate: string;
  messages: Array<{
    id: string;
    text: string;
    from: { user_id: string };
    to: { user_id: string };
    message_date: {
      created: string;
      received: string;
      available: string;
      notified: string;
      read?: string;
    };
    status: string;
  }>;
}

export async function getMessageThreads(): Promise<MessageThread[]> {
  try {
    const threads = await fetchAllMessageThreads();
    const result: MessageThread[] = [];

    for (const t of threads) {
      const msgs = await fetchAllMessagesForPack(t.pack_id);
      const normalized = msgs.map((m) => ({
        ...m,
        text:
          typeof m.text === 'object' && 'plain' in m.text
            ? m.text.plain
            : m.text
      }));
      result.push({
        packId: t.pack_id,
        buyerUserId: t.other_user.id,
        buyerNickname: t.other_user.nickname || 'Cliente',
        lastMessageDate: t.last_message.message_date.created,
        messages: normalized
      });
    }

    return result;
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
    const threads = await fetchAllMessageThreads(fromDate, toDate);
    const result: MessageThread[] = [];

    for (const t of threads) {
      const msgs = await fetchAllMessagesForPack(t.pack_id);
      const normalized = msgs.map((m) => ({
        ...m,
        text:
          typeof m.text === 'object' && 'plain' in m.text
            ? m.text.plain
            : m.text
      }));
      result.push({
        packId: t.pack_id,
        buyerUserId: t.other_user.id,
        buyerNickname: t.other_user.nickname || 'Cliente',
        lastMessageDate: t.last_message.message_date.created,
        messages: normalized
      });
    }

    return result;
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
    const res = await fetch('/api/mercadolibre/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        packId,
        buyerId: buyerUserId,
        message: text
      })
    });

    if (!res.ok) {
      console.error('Failed to send message:', await res.text());
      return false;
    }

    const data = await res.json();
    return !!data.success;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
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
