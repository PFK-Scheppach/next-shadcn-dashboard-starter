import { NextRequest, NextResponse } from 'next/server';
import {
  sendBuyerMessage,
  answerQuestion,
  fetchOrders
} from '@/lib/mercadolibre';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, questionId, message, buyerId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!orderId && !questionId) {
      return NextResponse.json(
        { error: 'Either orderId or questionId is required' },
        { status: 400 }
      );
    }

    let success = false;

    if (orderId) {
      // If buyerId is not provided, we need to get it from the order
      if (!buyerId) {
        const orders = await fetchOrders();
        const order = orders.find((o) => o.id === parseInt(orderId));
        if (!order || !order.pack_id) {
          return NextResponse.json(
            { error: 'Order not found or pack_id missing' },
            { status: 404 }
          );
        }
        // For now, we'll use a placeholder buyerId since we need to implement buyer ID extraction
        return NextResponse.json(
          { error: 'buyerId is required for sending buyer messages' },
          { status: 400 }
        );
      }

      // Find the pack_id for this order
      const orders = await fetchOrders();
      const order = orders.find((o) => o.id === parseInt(orderId));
      if (!order || !order.pack_id) {
        return NextResponse.json(
          { error: 'Order not found or pack_id missing' },
          { status: 404 }
        );
      }

      success = await sendBuyerMessage(order.pack_id, message, buyerId);
    } else if (questionId) {
      success = await answerQuestion(questionId, message);
    }

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in send-message API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
