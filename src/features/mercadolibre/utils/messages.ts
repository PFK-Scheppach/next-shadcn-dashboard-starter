export async function getMercadoLibreMessages() {
  const token = process.env.MERCADOLIBRE_ACCESS_TOKEN;
  const seller = process.env.MERCADOLIBRE_USER_ID;

  if (!token || !seller) {
    return null;
  }

  const res = await fetch(
    `https://api.mercadolibre.com/messages/packs?seller=${seller}&limit=10`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return data;
}

export async function sendMercadoLibreMessage(packId: string, text: string) {
  const token = process.env.MERCADOLIBRE_ACCESS_TOKEN;
  const seller = process.env.MERCADOLIBRE_USER_ID;

  if (!token || !seller) {
    return null;
  }

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

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return data;
}
