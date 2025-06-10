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
      <div className='flex h-full items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='text-gray-600'>Cargando mensajes...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='text-center text-gray-500'>
          <MessageSquare className='mx-auto mb-2 h-12 w-12 opacity-50' />
          <p>No hay mensajes en esta conversación</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className='flex-1 p-4'>
      <div className='space-y-4'>
        {messages.map((message, index) => {
          const isFromSeller =
            message.from.user_id === pack.seller.id.toString();
          return (
            <div
              key={`${message.message_id.value}-${index}`}
              className={`flex ${isFromSeller ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md ${isFromSeller ? 'order-2' : 'order-1'}`}
              >
                <div
                  className={`rounded-lg px-4 py-2 ${isFromSeller ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'}`}
                >
                  <p className='text-sm'>{message.text}</p>
                </div>
                <div
                  className={`mt-1 text-xs text-gray-500 ${isFromSeller ? 'text-right' : 'text-left'}`}
                >
                  <span>{isFromSeller ? 'Tú' : pack.buyer.nickname}</span>
                  <span className='ml-2'>
                    {formatTime(message.message_date.received)}
                  </span>
                  {isFromSeller && getMessageStatusIcon(message.status)}
                </div>
              </div>

              <Avatar
                className={`h-8 w-8 ${isFromSeller ? 'order-1 mr-2' : 'order-2 ml-2'}`}
              >
                <AvatarFallback
                  className={
                    isFromSeller
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-400 text-white'
                  }
                >
                  {isFromSeller
                    ? 'T'
                    : pack.buyer.nickname.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
