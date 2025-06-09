'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { sendMessage } from '../utils/messages';
import { replyToQuestion } from '../utils/questions';

const messageSchema = z.object({
  message: z.string().min(1, 'El mensaje es requerido').max(1000, 'El mensaje no puede exceder 1000 caracteres'),
});

type MessageFormValues = z.infer<typeof messageSchema>;

interface MessageReplyFormProps {
  orderId?: number;
  questionId?: number;
  recipientName: string;
  onSuccess?: () => void;
  placeholder?: string;
  title?: string;
}

export function MessageReplyForm({
  orderId,
  questionId,
  recipientName,
  onSuccess,
  placeholder = 'Escribe tu mensaje aquí...',
  title
}: MessageReplyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message: '',
    },
  });

  const onSubmit = async (data: MessageFormValues) => {
    if (!orderId && !questionId) {
      toast.error('Error: No se pudo identificar el destinatario');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let success = false;
      
      if (orderId) {
        success = await sendMessage(orderId, data.message);
      } else if (questionId) {
        success = await replyToQuestion(questionId, data.message);
      }

      if (success) {
        toast.success('Mensaje enviado exitosamente');
        form.reset();
        onSuccess?.();
      } else {
        toast.error('Error al enviar el mensaje. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error inesperado al enviar el mensaje');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayTitle = title || (questionId ? 'Responder Pregunta' : 'Enviar Mensaje');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          {displayTitle}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Para: <span className="font-medium">{recipientName}</span>
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensaje</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={placeholder}
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormMessage />
                    <span className="text-xs text-muted-foreground">
                      {field.value.length}/1000
                    </span>
                  </div>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                Limpiar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 