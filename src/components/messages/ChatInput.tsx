'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
}

export default function ChatInput({ value, onChange, onSend, sending }: ChatInputProps) {
  return (
    <div className='border-t border-gray-200 bg-white p-4'>
      <div className='flex space-x-2'>
        <Input
          placeholder='Escribe un mensaje...'
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          disabled={sending}
          className='flex-1'
        />
        <Button onClick={onSend} disabled={!value.trim() || sending} className='bg-blue-500 hover:bg-blue-600'>
          {sending ? (
            <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
          ) : (
            <Send className='h-4 w-4' />
          )}
        </Button>
      </div>
    </div>
  );
}
