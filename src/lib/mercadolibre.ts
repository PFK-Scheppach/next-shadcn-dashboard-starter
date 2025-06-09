export interface MercadoLibreOrder {
  id: number;
  date_created: string;
  total_amount: number;
  buyer: {
    nickname: string;
  };
}

export interface MercadoLibreMessage {
  id: string;
  text: string;
  from: {
    user_id: string;
  };
  to: {
    user_id: string;
  };
  date_created: string;
}

export interface MercadoLibreQuestion {
  id: number;
  text: string;
  status: string;
  date_created: string;
  from: {
    id: string;
    nickname: string;
  };
  answer?: {
    text: string;
    date_created: string;
  };
}

let currentToken: string | undefined = process.env.MERCADOLIBRE_ACCESS_TOKEN;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = process.env.MERCADOLIBRE_REFRESH_TOKEN;
  const clientId = process.env.MERCADOLIBRE_CLIENT_ID;
  const clientSecret = process.env.MERCADOLIBRE_CLIENT_SECRET;
  
  if (!refreshToken || !clientId || !clientSecret) {
    console.warn('MercadoLibre refresh credentials not provided');
    return null;
  }
  
  try {
    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken
      })
    });
    
    if (!res.ok) {
      console.error('Failed to refresh MercadoLibre token', await res.text());
      return null;
    }
    
    const data: { access_token: string } = await res.json();
    currentToken = data.access_token;
    return currentToken;
  } catch (error) {
    console.error('Error refreshing MercadoLibre token:', error);
    return null;
  }
}

export async function fetchOrders(): Promise<MercadoLibreOrder[]> {
  const sellerId = process.env.MERCADOLIBRE_SELLER_ID;
  if (!sellerId) {
    console.warn('MercadoLibre credentials not provided');
    return [];
  }

  if (!currentToken) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) return [];
  }

  try {
    let url = `https://api.mercadolibre.com/orders/search?seller=${sellerId}&access_token=${currentToken}`;

    let res = await fetch(url);
    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) return [];
      url = `https://api.mercadolibre.com/orders/search?seller=${sellerId}&access_token=${newToken}`;
      res = await fetch(url);
    }
    
    if (!res.ok) {
      console.error('Failed to fetch MercadoLibre orders', await res.text());
      return [];
    }

    const data = await res.json();
    return data.results as MercadoLibreOrder[];
  } catch (error) {
    console.error('Error fetching MercadoLibre orders:', error);
    return [];
  }
}

export async function sendBuyerMessage(
  orderId: number,
  text: string
): Promise<boolean> {
  const sellerId = process.env.MERCADOLIBRE_SELLER_ID;
  if (!sellerId) {
    console.warn('MercadoLibre seller id not provided');
    return false;
  }

  if (!currentToken) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) return false;
  }

  try {
    let url = `https://api.mercadolibre.com/messages/packs/${orderId}/sellers/${sellerId}?access_token=${currentToken}`;

    let res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    
    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) return false;
      url = `https://api.mercadolibre.com/messages/packs/${orderId}/sellers/${sellerId}?access_token=${newToken}`;
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
    }

    if (!res.ok) {
      console.error('Failed to send MercadoLibre message', await res.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending MercadoLibre message:', error);
    return false;
  }
}

export async function fetchMessages(): Promise<MercadoLibreMessage[]> {
  const sellerId = process.env.MERCADOLIBRE_SELLER_ID;
  if (!sellerId) {
    console.warn('MercadoLibre seller id not provided');
    return [];
  }

  if (!currentToken) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) return [];
  }

  try {
    let url = `https://api.mercadolibre.com/myfeeds?app_id=${process.env.MERCADOLIBRE_CLIENT_ID}&access_token=${currentToken}`;

    let res = await fetch(url);
    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) return [];
      url = `https://api.mercadolibre.com/myfeeds?app_id=${process.env.MERCADOLIBRE_CLIENT_ID}&access_token=${newToken}`;
      res = await fetch(url);
    }
    
    if (!res.ok) {
      console.error('Failed to fetch MercadoLibre messages', await res.text());
      return [];
    }

    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching MercadoLibre messages:', error);
    return [];
  }
}

export async function fetchQuestions(): Promise<MercadoLibreQuestion[]> {
  const sellerId = process.env.MERCADOLIBRE_SELLER_ID;
  if (!sellerId) {
    console.warn('MercadoLibre seller id not provided');
    return [];
  }

  if (!currentToken) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) return [];
  }

  try {
    let url = `https://api.mercadolibre.com/questions/search?seller_id=${sellerId}&access_token=${currentToken}`;

    let res = await fetch(url);
    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) return [];
      url = `https://api.mercadolibre.com/questions/search?seller_id=${sellerId}&access_token=${newToken}`;
      res = await fetch(url);
    }
    
    if (!res.ok) {
      console.error('Failed to fetch MercadoLibre questions', await res.text());
      return [];
    }

    const data = await res.json();
    return data.results as MercadoLibreQuestion[];
  } catch (error) {
    console.error('Error fetching MercadoLibre questions:', error);
    return [];
  }
}

export async function answerQuestion(
  questionId: number,
  text: string
): Promise<boolean> {
  if (!currentToken) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) return false;
  }

  try {
    let url = `https://api.mercadolibre.com/answers?access_token=${currentToken}`;

    let res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: questionId,
        text: text
      })
    });
    
    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) return false;
      url = `https://api.mercadolibre.com/answers?access_token=${newToken}`;
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          text: text
        })
      });
    }

    if (!res.ok) {
      console.error('Failed to answer MercadoLibre question', await res.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error answering MercadoLibre question:', error);
    return false;
  }
}
