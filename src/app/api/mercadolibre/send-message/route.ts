import { NextRequest, NextResponse } from 'next/server';
import {
  sendBuyerMessage,
  answerQuestion,
  fetchOrderDetails
} from '@/lib/mercadolibre';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, questionId, packId, message, buyerId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!orderId && !questionId && !packId) {
      return NextResponse.json(
        { error: 'orderId, packId or questionId is required' },
        { status: 400 }
      );
    }

    let success = false;

    if (packId && buyerId) {
      success = await sendBuyerMessage(packId, message, buyerId);
    } else if (orderId) {
      const order = await fetchOrderDetails(orderId.toString());
      if (!order || !order.pack_id || !order.buyer?.id) {
        return NextResponse.json(
          { error: 'Order not found or missing data' },
          { status: 404 }
        );
      }
      const buyer = buyerId ?? String(order.buyer.id);
      success = await sendBuyerMessage(order.pack_id, message, buyer);
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
