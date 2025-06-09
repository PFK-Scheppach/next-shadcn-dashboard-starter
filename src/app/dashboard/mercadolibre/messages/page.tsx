import { Suspense } from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Clock, User } from 'lucide-react';
import { getMessageThreads, formatMessageDate } from '@/features/mercadolibre/utils/messages';
import { MessageReplyForm } from '@/features/mercadolibre/components/message-reply-form';

export const metadata: Metadata = {
  title: 'Mensajes MercadoLibre | Dashboard',
  description: 'Gestiona los mensajes de tus compradores en MercadoLibre',
};

async function MessagesList() {
  const threads = await getMessageThreads();

  if (threads.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay mensajes</h3>
          <p className="text-muted-foreground text-center">
            Cuando recibas mensajes de compradores, aparecerán aquí.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {threads.map((thread) => (
        <Card key={thread.orderId} className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {thread.buyerNickname}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4" />
                  Orden #{thread.orderId} • {formatMessageDate(thread.lastMessageDate)}
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {thread.messages.length} mensaje{thread.messages.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-3">
              {thread.messages.slice(-3).map((message, index) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${
                    message.from.user_id === process.env.MERCADOLIBRE_SELLER_ID
                      ? 'bg-blue-50 ml-8'
                      : 'bg-gray-50 mr-8'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatMessageDate(message.date_created)}
                  </span>
                </div>
              ))}
            </div>
            
            <MessageReplyForm
              orderId={thread.orderId}
              recipientName={thread.buyerNickname}
              placeholder="Responder al comprador..."
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-20 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Mensajes MercadoLibre</h1>
        <p className="text-muted-foreground">
          Gestiona las conversaciones con tus compradores
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <MessagesList />
      </Suspense>
    </div>
  );
} 