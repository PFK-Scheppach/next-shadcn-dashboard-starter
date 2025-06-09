import { 
  fetchMessages, 
  sendBuyerMessage,
  type MercadoLibreMessage 
} from '@/lib/mercadolibre';

export interface MessageThread {
  orderId: number;
  buyerNickname: string;
  messages: MercadoLibreMessage[];
  lastMessageDate: string;
}

export async function getMessageThreads(): Promise<MessageThread[]> {
  try {
    const messages = await fetchMessages();
    
    // Group messages by conversation/order
    const threadsMap = new Map<number, MessageThread>();
    
    messages.forEach((message) => {
      // Extract order ID from message (this might need adjustment based on actual API response)
      const orderId = extractOrderIdFromMessage(message);
      if (!orderId) return;
      
      if (!threadsMap.has(orderId)) {
        threadsMap.set(orderId, {
          orderId,
          buyerNickname: 'Unknown', // This would need to be fetched from order details
          messages: [],
          lastMessageDate: message.date_created
        });
      }
      
      const thread = threadsMap.get(orderId)!;
      thread.messages.push(message);
      
      // Update last message date if this message is newer
      if (new Date(message.date_created) > new Date(thread.lastMessageDate)) {
        thread.lastMessageDate = message.date_created;
      }
    });
    
    // Sort threads by last message date (newest first)
    return Array.from(threadsMap.values()).sort(
      (a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
    );
  } catch (error) {
    console.error('Error getting message threads:', error);
    return [];
  }
}

export async function sendMessage(orderId: number, text: string): Promise<boolean> {
  try {
    return await sendBuyerMessage(orderId, text);
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}

function extractOrderIdFromMessage(message: MercadoLibreMessage): number | null {
  // This is a simplified extraction - the actual implementation would depend on 
  // how MercadoLibre structures their message data
  // You might need to parse the message ID or use other fields
  try {
    // This is a placeholder - adjust based on actual API response structure
    const parts = message.id.split('-');
    const orderId = parseInt(parts[0]);
    return isNaN(orderId) ? null : orderId;
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
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
} 