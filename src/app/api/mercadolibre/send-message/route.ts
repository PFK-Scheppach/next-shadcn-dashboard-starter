import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const token = process.env.MERCADOLIBRE_ACCESS_TOKEN;
  const seller = process.env.MERCADOLIBRE_USER_ID;

  if (!token || !seller) {
    return NextResponse.json(
      { error: 'MercadoLibre credentials are not configured.' },
      { status: 400 }
    );
  }

  try {
    const { packId, text } = await req.json();

    const res = await fetch(
      `https://api.mercadolibre.com/messages/packs/${packId}/sellers/${seller}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
