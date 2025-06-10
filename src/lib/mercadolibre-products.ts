import { tokenManager } from './mercadolibre-token-manager';

export interface ProductInfo {
  title: string;
  thumbnail: string;
  quantity: number;
  unit_price: number;
  item_id?: string;
  category_id?: string;
  permalink?: string;
}

export interface OrderInfo {
  id: string;
  status: string;
  date_created: string;
  buyer: {
    id: number;
    nickname: string;
  };
  seller: {
    id: number;
    nickname: string;
  };
  total_amount: number;
  currency_id: string;
  shipping?: {
    id?: string;
    status?: string;
  };
  products: ProductInfo[];
}

/**
 * Obtiene información detallada de una orden desde MercadoLibre
 */
export async function getOrderInfo(orderId: string): Promise<OrderInfo | null> {
  try {
    const accessToken = await tokenManager.getValidToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    console.log(`🔄 Fetching order info for: ${orderId}`);

    const response = await fetch(
      `https://api.mercadolibre.com/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(
        `❌ Error fetching order ${orderId}:`,
        response.status,
        response.statusText
      );
      return null;
    }

    const order = await response.json();

    // Extraer información de productos de la orden
    const products: ProductInfo[] = [];

    if (order.order_items && Array.isArray(order.order_items)) {
      for (const item of order.order_items) {
        const productInfo: ProductInfo = {
          title: item.item?.title || 'Producto sin título',
          thumbnail:
            item.item?.thumbnail || item.item?.pictures?.[0]?.url || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          item_id: item.item?.id,
          category_id: item.item?.category_id,
          permalink: item.item?.permalink
        };

        products.push(productInfo);
      }
    }

    // Si no hay items en order_items, intentar con la estructura alternativa
    if (products.length === 0 && order.items && Array.isArray(order.items)) {
      for (const item of order.items) {
        const productInfo: ProductInfo = {
          title: item.title || 'Producto sin título',
          thumbnail: item.thumbnail || item.pictures?.[0]?.url || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          item_id: item.id,
          category_id: item.category_id,
          permalink: item.permalink
        };

        products.push(productInfo);
      }
    }

    console.log(`✅ Order ${orderId} loaded with ${products.length} products`);

    return {
      id: order.id.toString(),
      status: order.status,
      date_created: order.date_created,
      buyer: {
        id: order.buyer?.id || 0,
        nickname: order.buyer?.nickname || 'Unknown'
      },
      seller: {
        id: order.seller?.id || 0,
        nickname: order.seller?.nickname || 'Unknown'
      },
      total_amount: order.total_amount || 0,
      currency_id: order.currency_id || 'CLP',
      shipping: order.shipping
        ? {
            id: order.shipping.id?.toString(),
            status: order.shipping.status
          }
        : undefined,
      products
    };
  } catch (error) {
    console.error(`❌ Error getting order info for ${orderId}:`, error);
    return null;
  }
}

/**
 * Obtiene información detallada de un producto desde MercadoLibre
 */
export async function getItemInfo(itemId: string): Promise<ProductInfo | null> {
  try {
    const accessToken = await tokenManager.getValidToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    console.log(`🔄 Fetching item info for: ${itemId}`);

    const response = await fetch(
      `https://api.mercadolibre.com/items/${itemId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(
        `❌ Error fetching item ${itemId}:`,
        response.status,
        response.statusText
      );
      return null;
    }

    const item = await response.json();

    return {
      title: item.title || 'Producto sin título',
      thumbnail: item.thumbnail || item.pictures?.[0]?.url || '',
      quantity: 1, // Por defecto, la cantidad viene de la orden
      unit_price: item.price || 0,
      item_id: item.id,
      category_id: item.category_id,
      permalink: item.permalink
    };
  } catch (error) {
    console.error(`❌ Error getting item info for ${itemId}:`, error);
    return null;
  }
}

/**
 * Cache simple en memoria para evitar múltiples llamadas a la misma orden
 */
const orderCache = new Map<string, OrderInfo>();
const ORDER_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export async function getCachedOrderInfo(
  orderId: string
): Promise<OrderInfo | null> {
  const cacheKey = `order_${orderId}`;
  const cached = orderCache.get(cacheKey);

  if (cached) {
    console.log(`🎯 Using cached order info for ${orderId}`);
    return cached;
  }

  const orderInfo = await getOrderInfo(orderId);

  if (orderInfo) {
    orderCache.set(cacheKey, orderInfo);

    // Limpiar cache después del TTL
    setTimeout(() => {
      orderCache.delete(cacheKey);
    }, ORDER_CACHE_TTL);
  }

  return orderInfo;
}
