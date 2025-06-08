'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function MessageReplyForm() {
  const [packId, setPackId] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/mercadolibre/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ packId, text: message })
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || 'Failed to send message');
      } else {
        setStatus('Message sent successfully');
        setMessage('');
      }
    } catch (err) {
      setStatus('Failed to send message');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className='max-w-sm space-y-2'>
      <Input
        placeholder='Pack ID'
        value={packId}
        onChange={(e) => setPackId(e.target.value)}
        required
      />
      <Textarea
        placeholder='Your message...'
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
      />
      <Button type='submit' disabled={loading} size='sm'>
        Send Message
      </Button>
      {status && <p className='text-sm'>{status}</p>}
    </form>
  );
}
