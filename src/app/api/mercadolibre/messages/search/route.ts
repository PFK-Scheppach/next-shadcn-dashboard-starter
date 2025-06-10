import { NextRequest, NextResponse } from 'next/server';
import { tokenManager } from '@/lib/mercadolibre-token-manager';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [API] Starting comprehensive message search');

    const access_token = await tokenManager.getValidToken();

    if (!access_token) {
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 401 }
      );
    }

    const sellerId = process.env.MERCADOLIBRE_SELLER_ID;

    if (!sellerId) {
      return NextResponse.json({ error: 'Missing seller ID' }, { status: 500 });
    }

    // Get recent orders from last week (limit to avoid timeout)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const ordersUrl = `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.date_created.from=${oneWeekAgo.toISOString()}&limit=50`;

    console.log('📦 Fetching recent orders from last week...');

    const ordersResponse = await fetch(ordersUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!ordersResponse.ok) {
      const errorData = await ordersResponse.json();
      console.error('❌ Failed to fetch orders:', errorData);
      return NextResponse.json({
        messages: [],
        total: 0,
        error: errorData
      });
    }

    const ordersData = await ordersResponse.json();
    const orders = ordersData.results || [];

    console.log(`📊 Found ${orders.length} orders in last week`);

    const packsToCheck = orders
      .filter((order: any) => order.pack_id)
      .map((order: any) => ({
        pack_id: order.pack_id,
        buyer_id: order.buyer.id,
        buyer_nickname: order.buyer.nickname
      }));

    console.log(`📨 Checking ${packsToCheck.length} packs for messages...`);

    const messagesFound: any[] = [];

    // Check messages for each pack (limit to first 10 to avoid timeout)
    for (let i = 0; i < Math.min(packsToCheck.length, 10); i++) {
      const pack = packsToCheck[i];

      console.log(
        `📨 [${i + 1}] Checking messages for pack ${pack.pack_id} (buyer: ${pack.buyer_nickname})`
      );

      try {
        const messagesUrl = `https://api.mercadolibre.com/messages/packs/${pack.pack_id}/sellers/${sellerId}?tag=post_sale`;

        const messagesResponse = await fetch(messagesUrl, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          const messages = messagesData.results || [];

          if (messages.length > 0) {
            console.log(
              `✅ Found ${messages.length} messages in pack ${pack.pack_id}`
            );
            messagesFound.push({
              pack_id: pack.pack_id,
              buyer: {
                id: pack.buyer_id,
                nickname: pack.buyer_nickname
              },
              messages: messages
            });
          } else {
            console.log(
              `📭 No messages found in pack ${pack.pack_id} via ${messagesUrl}`
            );
          }
        } else {
          const errorData = await messagesResponse.json();
          console.log(
            `❌ Failed to get messages for pack ${pack.pack_id}:`,
            errorData.message || errorData.error
          );
        }
      } catch (error) {
        console.error(`❌ Error checking pack ${pack.pack_id}:`, error);
      }
    }

    console.log(
      `📊 Message search completed: Found ${messagesFound.length} packs with messages`
    );

    return NextResponse.json({
      messages: messagesFound,
      total: messagesFound.length,
      orders_checked: orders.length,
      packs_checked: Math.min(packsToCheck.length, 10)
    });
  } catch (error) {
    console.error('❌ Error in message search:', error);
    return NextResponse.json(
      { error: 'Failed to search messages' },
      { status: 500 }
    );
  }
}
