import { NextRequest, NextResponse } from 'next/server';
import { tokenManager } from '@/lib/mercadolibre-token-manager';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 [API] Fetching order details for ${orderId}`);

    // Obtener token válido
    const access_token = await tokenManager.getValidToken();
    if (!access_token) {
      return NextResponse.json(
        { error: 'No se pudo obtener token de acceso' },
        { status: 401 }
      );
    }

    // Obtener información de la orden
    const orderResponse = await fetch(
      `https://api.mercadolibre.com/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      console.error(`❌ Error fetching order ${orderId}:`, errorData);
      return NextResponse.json(
        { error: 'Failed to fetch order', details: errorData },
        { status: orderResponse.status }
      );
    }

    const orderData = await orderResponse.json();

    console.log(`✅ [API] Order ${orderId} fetched successfully`);

    return NextResponse.json(orderData);
  } catch (error: any) {
    console.error('❌ Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order', message: error.message },
      { status: 500 }
    );
  }
}
