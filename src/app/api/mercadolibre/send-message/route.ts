import { NextRequest, NextResponse } from 'next/server';
import { sendBuyerMessage, answerQuestion } from '@/lib/mercadolibre';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, questionId, message } = body;

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
      success = await sendBuyerMessage(orderId, message);
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