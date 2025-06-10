'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare } from 'lucide-react';
import { ReactNode, RefObject } from 'react';

interface Pack {
  seller: { id: number; nickname: string };
  buyer: { nickname: string };
}

interface ApiMessage {
  message_id: { value: string };
  message_date: { received: string };
  from: { user_id: string };
  to: { user_id: string };
  text: string;
  status: string;
}

interface ChatMessagesProps {
  pack: Pack;
  messages: ApiMessage[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  formatTime: (dateString: string) => string;
  getMessageStatusIcon: (status: string) => ReactNode;
  loading: boolean;
}

export default function ChatMessages({
  pack,
  messages,
  messagesEndRef,
  formatTime,
  getMessageStatusIcon,
  loading
}: ChatMessagesProps) {
  if (loading) {
    return (
      <div className='flex h-full items-center justify-center bg-gradient-to-b from-slate-50/30 to-white'>
        <div className='p-8 text-center'>
          <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600'></div>
          <p className='mb-1 font-semibold text-slate-700'>
            Cargando mensajes...
          </p>
          <p className='text-sm text-slate-500'>Obteniendo la conversación</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className='flex h-full items-center justify-center bg-gradient-to-b from-slate-50/30 to-white'>
        <div className='p-8 text-center'>
          <div className='mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200'>
            <MessageSquare className='h-8 w-8 text-slate-400' />
          </div>
          <h3 className='mb-2 text-lg font-semibold text-slate-700'>
            Sin mensajes aún
          </h3>
          <p className='mb-4 max-w-sm text-sm leading-relaxed text-slate-500'>
            Esta conversación está lista para comenzar. Los mensajes que envíes
            y recibas aparecerán aquí.
          </p>
          <div className='rounded-lg bg-blue-50 px-4 py-2 text-xs font-medium text-blue-700'>
            💡 Tip: Saluda al cliente para iniciar la conversación
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className='flex-1 p-6'>
      <div className='mx-auto max-w-4xl space-y-6'>
        {messages.map((message, index) => {
          const isFromSeller =
            message.from.user_id === pack.seller.id.toString();

          return (
            <div
              key={`${message.message_id.value}-${index}`}
              className={`flex items-end space-x-3 ${isFromSeller ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {/* Avatar */}
              <Avatar
                className={`h-10 w-10 shadow-md ring-2 ring-white ${isFromSeller ? 'ring-blue-100' : 'ring-slate-100'}`}
              >
                <AvatarFallback
                  className={`text-sm font-bold ${
                    isFromSeller
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                      : 'bg-gradient-to-br from-slate-400 to-slate-500 text-white'
                  }`}
                >
                  {isFromSeller
                    ? 'T'
                    : pack.buyer.nickname.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Mensaje */}
              <div className={`max-w-md lg:max-w-lg`}>
                <div
                  className={`rounded-2xl px-4 py-3 shadow-sm ${
                    isFromSeller
                      ? 'rounded-br-md bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                      : 'rounded-bl-md border border-slate-200 bg-white text-slate-900'
                  }`}
                >
                  <p className='text-sm leading-relaxed'>{message.text}</p>
                </div>

                {/* Metadata */}
                <div
                  className={`mt-2 flex items-center space-x-2 text-xs ${
                    isFromSeller
                      ? 'justify-end text-slate-500'
                      : 'justify-start text-slate-500'
                  }`}
                >
                  <span className='font-medium'>
                    {isFromSeller ? 'Tú' : pack.buyer.nickname}
                  </span>
                  <span>•</span>
                  <span>{formatTime(message.message_date.received)}</span>
                  {isFromSeller && (
                    <>
                      <span>•</span>
                      <span className='flex items-center'>
                        {getMessageStatusIcon(message.status)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
