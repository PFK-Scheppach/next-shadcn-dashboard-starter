import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory store for demo purposes
// In production, use Redis or a proper message queue
class NotificationStore {
  private subscribers = new Set<WritableStreamDefaultWriter>();
  private notifications: Array<{
    id: string;
    message: string;
    timestamp: number;
    type: string;
  }> = [];

  addSubscriber(writer: WritableStreamDefaultWriter) {
    this.subscribers.add(writer);

    // Send recent notifications to new subscriber
    this.notifications.slice(-10).forEach((notification) => {
      this.sendToWriter(writer, notification);
    });
  }

  removeSubscriber(writer: WritableStreamDefaultWriter) {
    this.subscribers.delete(writer);
  }

  broadcast(notification: { message: string; type: string }) {
    const notificationWithId = {
      id: crypto.randomUUID(),
      ...notification,
      timestamp: Date.now()
    };

    this.notifications.push(notificationWithId);

    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(-100);
    }

    // Send to all subscribers
    this.subscribers.forEach((writer) => {
      this.sendToWriter(writer, notificationWithId);
    });
  }

  private sendToWriter(writer: WritableStreamDefaultWriter, notification: any) {
    try {
      const data = `data: ${JSON.stringify(notification)}\n\n`;
      writer.write(new TextEncoder().encode(data));
    } catch (error) {
      console.error('Error sending notification to subscriber:', error);
      this.subscribers.delete(writer);
    }
  }
}

const notificationStore = new NotificationStore();

export async function GET(req: NextRequest) {
  // Create a readable stream for Server-Sent Events
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  // Set up SSE headers
  const response = new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });

  // Add subscriber
  notificationStore.addSubscriber(writer);

  // Send initial connection message
  try {
    await writer.write(
      new TextEncoder().encode(
        `data: ${JSON.stringify({
          id: crypto.randomUUID(),
          message: 'Connected to notification stream',
          type: 'connection',
          timestamp: Date.now()
        })}\n\n`
      )
    );
  } catch (error) {
    console.error('Error sending initial message:', error);
  }

  // Handle client disconnect
  req.signal.addEventListener('abort', () => {
    notificationStore.removeSubscriber(writer);
    writer.close();
  });

  return response;
}

// POST endpoint to send notifications (for internal use)
export async function POST(req: NextRequest) {
  try {
    const { message, type = 'info' } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    notificationStore.broadcast({ message, type });

    return NextResponse.json({
      success: true,
      message: 'Notification sent'
    });
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

// Export the notification store for use in other API routes
export { notificationStore };
