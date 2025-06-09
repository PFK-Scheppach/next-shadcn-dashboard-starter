'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  message: string;
  type: string;
  timestamp: number;
  read?: boolean;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Connect to Server-Sent Events
    const eventSource = new EventSource('/api/notifications/stream');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('Connected to notification stream');
    };

    eventSource.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);

        // Don't show connection messages as notifications
        if (notification.type === 'connection') return;

        setNotifications((prev) => {
          // Check if notification already exists
          if (prev.some((n) => n.id === notification.id)) {
            return prev;
          }

          // Add new notification and keep only last 50
          const updated = [notification, ...prev].slice(0, 50);
          return updated;
        });

        // Show toast for new notifications
        showNotificationToast(notification);
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      console.error('Notification stream connection lost');
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const showNotificationToast = (notification: Notification) => {
    const toastOptions = {
      description: new Date(notification.timestamp).toLocaleTimeString()
    };

    switch (notification.type) {
      case 'success':
        toast.success(notification.message, toastOptions);
        break;
      case 'error':
        toast.error(notification.message, toastOptions);
        break;
      case 'warning':
        toast.warning(notification.message, toastOptions);
        break;
      case 'order':
        toast.success(`📦 ${notification.message}`, toastOptions);
        break;
      case 'message':
        toast.info(`💬 ${notification.message}`, toastOptions);
        break;
      case 'question':
        toast.info(`❓ ${notification.message}`, toastOptions);
        break;
      default:
        toast.info(notification.message, toastOptions);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'error':
        return <AlertCircle className='h-4 w-4 text-red-500' />;
      case 'warning':
        return <AlertCircle className='h-4 w-4 text-yellow-500' />;
      case 'order':
        return <div className='h-4 w-4'>📦</div>;
      case 'message':
        return <MessageSquare className='h-4 w-4 text-blue-500' />;
      case 'question':
        return <div className='h-4 w-4'>❓</div>;
      default:
        return <Info className='h-4 w-4 text-blue-500' />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50';
      case 'error':
        return 'border-l-red-500 bg-red-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'order':
        return 'border-l-purple-500 bg-purple-50';
      case 'message':
        return 'border-l-blue-500 bg-blue-50';
      case 'question':
        return 'border-l-orange-500 bg-orange-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div className='relative'>
      {/* Notification Bell */}
      <Button
        variant='ghost'
        size='sm'
        className='relative'
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className='h-5 w-5' />
        {unreadCount > 0 && (
          <Badge
            variant='destructive'
            className='absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center p-0 text-xs'
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
        {/* Connection status indicator */}
        <div
          className={`absolute right-0 bottom-0 h-2 w-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <Card className='absolute top-12 right-0 z-50 max-h-96 w-96 shadow-lg'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='text-lg'>Notificaciones</CardTitle>
                <CardDescription>
                  {notifications.length === 0
                    ? 'No hay notificaciones'
                    : `${unreadCount} sin leer de ${notifications.length} total`}
                </CardDescription>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setIsOpen(false)}
              >
                <X className='h-4 w-4' />
              </Button>
            </div>

            {notifications.length > 0 && (
              <div className='flex gap-2'>
                <Button variant='outline' size='sm' onClick={markAllAsRead}>
                  Marcar todo como leído
                </Button>
                <Button variant='outline' size='sm' onClick={clearAll}>
                  Limpiar todo
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className='p-0'>
            <ScrollArea className='max-h-64'>
              {notifications.length === 0 ? (
                <div className='text-muted-foreground p-6 text-center'>
                  <Bell className='mx-auto mb-2 h-8 w-8 opacity-50' />
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                <div className='space-y-1'>
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 border-l-4 p-3 transition-colors hover:bg-gray-50 ${getNotificationColor(
                        notification.type
                      )} ${notification.read ? 'opacity-60' : ''}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className='mt-0.5 flex-shrink-0'>
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className='min-w-0 flex-1'>
                        <p className='text-sm font-medium text-gray-900'>
                          {notification.message}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>

                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-6 w-6 p-0 opacity-50 hover:opacity-100'
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                      >
                        <X className='h-3 w-3' />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
