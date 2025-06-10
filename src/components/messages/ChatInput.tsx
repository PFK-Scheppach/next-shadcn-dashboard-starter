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

export default function ChatInput({
  value,
  onChange,
  onSend,
  sending
}: ChatInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !sending) {
      onSend();
    }
  };

  return (
    <div className='bg-white'>
      <form onSubmit={handleSubmit} className='flex items-end space-x-3'>
        <div className='flex-1'>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder='Escribe tu mensaje aquí...'
            disabled={sending}
            className='min-h-[44px] w-full resize-none rounded-xl border-2 border-slate-200 px-4 py-3 text-sm transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
          />
        </div>
        <Button
          type='submit'
          disabled={!value.trim() || sending}
          size='lg'
          className={`h-[52px] min-w-[52px] rounded-xl shadow-lg transition-all duration-200 ${
            value.trim() && !sending
              ? 'transform bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-200 hover:scale-105 hover:from-blue-600 hover:to-blue-700'
              : 'cursor-not-allowed bg-slate-300'
          }`}
        >
          {sending ? (
            <div className='h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
          ) : (
            <Send className='h-5 w-5' />
          )}
        </Button>
      </form>

      {/* Contador de caracteres y tips */}
      <div className='mt-2 flex items-center justify-between text-xs text-slate-500'>
        <div className='flex items-center space-x-4'>
          <span>💡 Presiona Enter para enviar</span>
          <span>•</span>
          <span>Shift + Enter para nueva línea</span>
        </div>
        <span
          className={`font-mono ${value.length > 300 ? 'text-orange-500' : value.length > 350 ? 'text-red-500' : ''}`}
        >
          {value.length}/350
        </span>
      </div>
    </div>
  );
}
