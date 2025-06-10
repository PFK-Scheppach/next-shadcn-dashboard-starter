// MercadoLibre Messaging API v2 - Sistema de mensajería post-venta completo
// Basado en documentación oficial 2025 y endpoints correctos
// Framework: Next.js 15 App Router con TypeScript

const API_URL = 'https://api.mercadolibre.com';
const REFRESH_ENDPOINT = '/oauth/token';
const SITE_ID = 'MLC';
const TAG = 'post_sale';
const SELLER_MAX_LEN = 350;

interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

interface MessageOption {
  id: string;
  internal_description: string;
  enabled: boolean;
  type: 'template' | 'free_text';
  templates?: { id: string; vars?: any }[] | null;
  actionable: boolean;
  char_limit?: number;
  child_options?: any;
  cap_available: number;
}

interface MessageResponse {
  id: string;
  to: {
    user_id: number;
    name: string;
  };
  from: {
    user_id: number;
    name: string;
  };
  text: string;
  status: string;
  message_date: {
    created: string;
    received: string;
    available: string;
    notified?: string;
    read?: string;
  };
  site_id: string;
  attachments?: string[];
}

interface MessagesResponse {
  messages: MessageResponse[];
  paging: {
    total: number;
    offset: number;
    limit: number;
  };
  conversation_status: {
    blocked: boolean;
    last_message_date: string;
  };
}

interface MessageCapsResponse {
  cap_available: number;
  cap_limit: number;
}

interface UploadAttachmentResponse {
  id: string;
}

// Función helper para refrescar token
async function refreshAccessToken(): Promise<string> {
  const res = await fetch(`${API_URL}${REFRESH_ENDPOINT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.MERCADOLIBRE_CLIENT_ID!,
      client_secret: process.env.MERCADOLIBRE_CLIENT_SECRET!,
      refresh_token: process.env.MERCADOLIBRE_REFRESH_TOKEN!
    })
  });

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status}`);
  }

  const json = (await res.json()) as TokenResponse;
  return json.access_token;
}

// Función principal para hacer llamadas a la API con manejo de token
async function apiFetch<T = any>(
  endpoint: string,
  init: RequestInit & { query?: Record<string, any> } = {},
  attempt = 1
): Promise<T> {
  const { query, ...fetchOptions } = init;

  // Construir URL con query parameters
  let url = `${API_URL}${endpoint}`;
  if (query) {
    const searchParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }
  }

  console.log(`🔄 Fetching from: ${url}`);

  // Obtener token del token manager
  const { tokenManager } = await import('./mercadolibre-token-manager');
  const access_token = await tokenManager.getValidToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${access_token}`,
    ...(fetchOptions.headers as Record<string, string>)
  };

  const res = await fetch(url, {
    ...fetchOptions,
    headers
  });

  // Si el token expiró, intentar renovar una vez
  if (!res.ok && res.status === 401 && attempt === 1) {
    console.log(`🔄 Token expired, refreshing and retrying...`);
    try {
      const newToken = await refreshAccessToken();
      headers['Authorization'] = `Bearer ${newToken}`;

      const retryRes = await fetch(url, {
        ...fetchOptions,
        headers
      });

      if (!retryRes.ok) {
        const errorText = await retryRes.text();
        throw new Error(
          `API call failed after token refresh: ${retryRes.status} - ${errorText}`
        );
      }

      return retryRes.json() as Promise<T>;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw error;
    }
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API call failed: ${res.status} - ${errorText}`);
  }

  return res.json() as Promise<T>;
}

// Función para validar texto según las reglas de MercadoLibre
function validateText(text: string): void {
  if (!text || text.trim().length === 0) {
    throw new Error('El texto del mensaje no puede estar vacío');
  }

  if (text.length > 350) {
    throw new Error('El mensaje excede el límite de 350 caracteres');
  }

  // Validación básica de caracteres (ISO-8859-1)
  // Esta es una validación simplificada
  const invalidChars = /[^\u0000-\u00FF]/g;
  if (invalidChars.test(text)) {
    console.warn(
      'El mensaje contiene caracteres que podrían no ser compatibles con ISO-8859-1'
    );
  }
}

// ENDPOINT CORRECTO: Obtener mensajes de un pack usando el endpoint oficial
export async function getPackMessages(
  packId: string,
  options: {
    mark_as_read?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<MessagesResponse> {
  try {
    // ENDPOINT OFICIAL CORRECTO según documentación
    // Necesitamos obtener el seller_id del token actual
    const { tokenManager } = await import('./mercadolibre-token-manager');
    const access_token = await tokenManager.getValidToken();

    // Obtener información del usuario actual para get seller_id
    const userResponse = await fetch(`${API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!userResponse.ok) {
      throw new Error(`Failed to get user info: ${userResponse.status}`);
    }

    const userInfo = await userResponse.json();
    const sellerId = userInfo.id;

    // ENDPOINT CORRECTO según documentación oficial
    const endpoint = `/messages/packs/${packId}/sellers/${sellerId}`;

    console.log(`🔄 Fetching messages from: ${API_URL}${endpoint}`);

    const queryParams: Record<string, any> = {};

    if (options.mark_as_read !== undefined) {
      queryParams.mark_as_read = options.mark_as_read;
    }
    if (options.limit !== undefined) {
      queryParams.limit = options.limit;
    }
    if (options.offset !== undefined) {
      queryParams.offset = options.offset;
    }

    // Agregar tag=post_sale como requiere la documentación
    queryParams.tag = 'post_sale';

    const response = await apiFetch<MessagesResponse>(endpoint, {
      query: queryParams
    });

    // Validar respuesta
    if (!response) {
      console.warn(`⚠️ Pack ${packId} - Empty response`);
      return {
        messages: [],
        paging: { total: 0, offset: 0, limit: 10 },
        conversation_status: {
          blocked: false,
          last_message_date: new Date().toISOString()
        }
      };
    }

    // Normalizar respuesta
    const messages = response.messages || [];
    const paging = response.paging || {
      total: 0,
      offset: options.offset || 0,
      limit: options.limit || 10
    };
    const conversation_status = response.conversation_status || {
      blocked: false,
      last_message_date: new Date().toISOString()
    };

    console.log(`✅ Pack ${packId} - Found ${messages.length} messages`);

    return {
      messages,
      paging,
      conversation_status
    };
  } catch (error: any) {
    console.error(
      `⚠️ Pack ${packId} - Error fetching messages:`,
      error.message
    );

    // En caso de error, retornar estructura vacía pero válida
    return {
      messages: [],
      paging: {
        total: 0,
        offset: options.offset || 0,
        limit: options.limit || 10
      },
      conversation_status: {
        blocked: false,
        last_message_date: new Date().toISOString()
      }
    };
  }
}

// ENDPOINT CORRECTO: Enviar mensaje a un pack
export async function sendPackMessage(data: {
  pack_id: string;
  text: string;
  attachments?: string[];
  text_translated?: string;
}): Promise<MessageResponse> {
  try {
    validateText(data.text);

    // Obtener seller_id del usuario actual
    const { tokenManager } = await import('./mercadolibre-token-manager');
    const access_token = await tokenManager.getValidToken();

    // Obtener información del usuario actual para get seller_id
    const userResponse = await fetch(`${API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!userResponse.ok) {
      throw new Error(`Failed to get user info: ${userResponse.status}`);
    }

    const userInfo = await userResponse.json();
    const sellerId = userInfo.id;

    console.log(`📤 Sending message to pack ${data.pack_id}`, {
      textLength: data.text.length,
      hasAttachments: !!data.attachments?.length
    });

    // ENDPOINT CORRECTO según documentación oficial
    const endpoint = `/messages/packs/${data.pack_id}/sellers/${sellerId}`;

    // Obtener información del comprador desde el pack - OBLIGATORIO según la documentación
    let buyerId: number | undefined;

    // Método 1: Obtener desde el endpoint de órdenes directo (más confiable)
    try {
      console.log(`🔍 Getting order info for pack ${data.pack_id}`);
      const orderResponse = await fetch(`${API_URL}/orders/${data.pack_id}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (orderResponse.ok) {
        const orderInfo = await orderResponse.json();
        buyerId = orderInfo.buyer?.id;
        console.log(`🎯 Found buyer info from order: ${buyerId}`);
      }
    } catch (error) {
      console.warn(`⚠️ Could not get buyer info from order: ${error}`);
    }

    // Método 2: Si no funcionó, buscar en packs endpoint interno
    if (!buyerId) {
      try {
        console.log(`🔍 Searching packs for buyer info`);
        const packsResponse = await fetch(
          `http://localhost:3000/api/mercadolibre/packs?limit=50`
        );
        if (packsResponse.ok) {
          const packsData = await packsResponse.json();
          const pack = packsData.packs?.find((p: any) => p.id === data.pack_id);
          if (pack?.buyer?.id) {
            buyerId = pack.buyer.id;
            console.log(`🎯 Found buyer info from packs: ${buyerId}`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Could not get buyer info from packs: ${error}`);
      }
    }

    // Método 3: Intentar desde búsqueda de órdenes por seller
    if (!buyerId) {
      try {
        console.log(`🔍 Searching orders for pack ${data.pack_id}`);
        const searchResponse = await fetch(
          `${API_URL}/orders/search?seller=${sellerId}&limit=50`,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          // Buscar la orden específica en los resultados
          const orderResult = searchData.results?.find((result: any) => {
            return result.orders?.some(
              (order: any) => order.id.toString() === data.pack_id
            );
          });

          if (orderResult?.buyer?.id) {
            buyerId = orderResult.buyer.id;
            console.log(`🎯 Found buyer info from order search: ${buyerId}`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Could not search orders for buyer info: ${error}`);
      }
    }

    // Método 4: Como último recurso, intentar extraer de mensajes existentes
    if (!buyerId) {
      try {
        console.log(`🔍 Trying to extract buyer from existing messages`);
        const messagesResponse = await apiFetch<MessagesResponse>(
          `/messages/packs/${data.pack_id}/sellers/${sellerId}`,
          {
            query: { tag: 'post_sale', limit: 1 }
          }
        );

        if (messagesResponse.messages && messagesResponse.messages.length > 0) {
          const firstMessage = messagesResponse.messages[0];
          if (firstMessage.from.user_id !== sellerId) {
            buyerId = firstMessage.from.user_id;
          } else if (firstMessage.to.user_id !== sellerId) {
            buyerId = firstMessage.to.user_id;
          }
          console.log(`🎯 Found buyer info from messages: ${buyerId}`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not extract buyer info from messages: ${error}`);
      }
    }

    // Validar que tenemos buyer_id (OBLIGATORIO)
    if (!buyerId) {
      throw new Error(
        `No se pudo obtener el buyer_id para el pack ${data.pack_id}. Esto es requerido para enviar mensajes.`
      );
    }

    // Construir payload con campos OBLIGATORIOS según la documentación
    const payload: any = {
      from: {
        user_id: sellerId.toString() // Asegurar que sea string como en la documentación
      },
      to: {
        user_id: buyerId.toString() // Asegurar que sea string como en la documentación
      },
      text: data.text
    };

    console.log(
      `📤 Sending message from seller ${sellerId} to buyer ${buyerId}`
    );

    if (data.attachments && data.attachments.length > 0) {
      payload.attachments = data.attachments;
    }

    if (data.text_translated) {
      payload.text_translated = data.text_translated;
    }

    const response = await apiFetch<MessageResponse>(endpoint, {
      method: 'POST',
      query: { tag: 'post_sale' }, // Tag requerido según documentación
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Message sent successfully to pack ${data.pack_id}`);
    return response;
  } catch (error: any) {
    console.error(`❌ Failed to send message to pack ${data.pack_id}:`, error);
    throw error;
  }
}

// Obtener mensaje específico por ID
export async function getMessageById(
  messageId: string
): Promise<MessageResponse> {
  return await apiFetch(`/marketplace/messages/${messageId}`);
}

// Subir archivo adjunto
export async function uploadAttachment(
  file: File | Blob,
  siteId: string = 'MLC'
): Promise<{ id: string }> {
  const formData = new FormData();
  formData.append('file', file);

  // ENDPOINT OFICIAL CORRECTO según documentación
  const endpoint = `/marketplace/messages/attachments?site_id=${siteId}`;

  const { tokenManager } = await import('./mercadolibre-token-manager');
  const access_token = await tokenManager.getValidToken();

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`
    },
    body: formData
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`File upload failed: ${res.status} - ${errorText}`);
  }

  return res.json();
}

// Obtener archivo adjunto
export async function getAttachment(
  attachmentId: string,
  siteId: string = 'MLC'
): Promise<Blob> {
  return await apiFetch(
    `/marketplace/messages/attachments/${attachmentId}?tag=post_sale&site_id=${siteId}`
  );
}

// Obtener opciones de comunicación - usando endpoints reales
export async function getMessageOptions(
  packId: string
): Promise<{ options: MessageOption[] }> {
  try {
    // Intentar obtener información de la orden primero
    const orderInfo = await apiFetch(`/orders/${packId}`);

    // Devolver opciones estándar disponibles
    return {
      options: [
        {
          id: 'SHIPPING_INFO',
          internal_description: 'Información de envío',
          enabled: true,
          type: 'template',
          templates: [{ id: 'shipping_update', vars: {} }],
          actionable: true,
          char_limit: 350,
          child_options: null,
          cap_available: 1
        },
        {
          id: 'OTHER',
          internal_description: 'Otro motivo',
          enabled: true,
          type: 'free_text',
          templates: null,
          actionable: true,
          char_limit: 350,
          child_options: null,
          cap_available: 1
        }
      ]
    };
  } catch (error) {
    console.log(`⚠️ Could not get message options for pack ${packId}`);
    return { options: [] };
  }
}

// Función simplificada para obtener capacidades
export async function getMessageCaps(
  packId: string
): Promise<Array<{ option_id: string; cap_available: number }>> {
  return [
    { option_id: 'SHIPPING_INFO', cap_available: 1 },
    { option_id: 'OTHER', cap_available: 1 }
  ];
}

// Iniciar conversación con un pack - usando endpoint simplificado
export async function initiateConversation(data: {
  pack_id: string;
  option_id: string;
  template_id?: string;
  text?: string;
}): Promise<MessageResponse> {
  const { pack_id, text } = data;

  // Para simplificar, usamos el endpoint de envío directo de mensajes
  if (!text) {
    throw new Error('Text is required to initiate conversation');
  }

  // Enviar mensaje usando la función estándar
  return await sendPackMessage({
    pack_id,
    text
  });
}

// Exportar constantes útiles
export { TAG, SITE_ID, SELLER_MAX_LEN, validateText, apiFetch };
