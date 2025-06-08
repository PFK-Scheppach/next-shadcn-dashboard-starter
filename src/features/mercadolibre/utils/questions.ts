export async function getMercadoLibreQuestions() {
  const token = process.env.MERCADOLIBRE_ACCESS_TOKEN;
  const seller = process.env.MERCADOLIBRE_USER_ID;

  if (!token || !seller) {
    return null;
  }

  const res = await fetch(
    `https://api.mercadolibre.com/questions/search?seller_id=${seller}&limit=10`,
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
