import {
  fetchMessageThreads,
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
    from: {
      user_id: string;
    };
    to: {
      user_id: string;
    };
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

function normalizeMessageText(text: string | { plain: string }): string {
  return typeof text === 'string' ? text : text.plain;
}

function convertMessage(message: MercadoLibreMessage) {
  return {
    id: message.id,
    text: normalizeMessageText(message.text),
    from: message.from,
    to: message.to,
    message_date: message.message_date,
    status: message.status
  };
}

export async function getMessageThreads(): Promise<MessageThread[]> {
  try {
    const threads = await fetchMessageThreads();
    return threads.map((t) => ({
      packId: t.pack_id,
      buyerUserId: t.other_user.id,
      buyerNickname: t.other_user.nickname || 'Cliente',
      lastMessageDate: t.last_message.message_date.created,
      messages: [convertMessage(t.last_message)]
    }));
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
    const threads = await fetchMessageThreads(fromDate, toDate);
    return threads.map((t) => ({
      packId: t.pack_id,
      buyerUserId: t.other_user.id,
      buyerNickname: t.other_user.nickname || 'Cliente',
      lastMessageDate: t.last_message.message_date.created,
      messages: [convertMessage(t.last_message)]
    }));
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

export function isMessageFromSeller(message: {
  from: { user_id: string };
}): boolean {
  return message.from.user_id === process.env.MERCADOLIBRE_SELLER_ID;
}
