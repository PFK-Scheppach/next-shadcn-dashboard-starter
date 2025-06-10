# MercadoLibre Messaging Implementation - Oficial API

## 🔍 **Problema Identificado**

La implementación anterior de mensajería fallaba porque usaba endpoints **que no existen** en la API oficial de MercadoLibre:

### ❌ **Endpoints Incorrectos (NO EXISTEN)**
```typescript
// INCORRECTO - Este endpoint NO existe
/messages/threads/search?seller=${sellerId}&site_id=${siteId}&tag=post_sale
```

### ✅ **Endpoints Oficiales Correctos**
```typescript
// CORRECTO - Para obtener mensajes de un pack específico
/messages/packs/{pack_id}/sellers/{user_id}

// CORRECTO - Para enviar mensajes
/messages/packs/{pack_id}/sellers/{user_id}?tag=post_sale
```

## 📋 **Arquitectura de la Solución**

### **1. Enfoque Pack-Based**
MercadoLibre organiza los mensajes por **packs** (grupos de órdenes), no por "threads":

```typescript
// Flujo correcto:
Órdenes → Pack IDs → Mensajes por Pack → Threads de Conversación
```

### **2. Estructura de Datos Actualizada**

```typescript
// Nueva interfaz MessageThread
interface MessageThread {
  pack_id: number;           // ❌ Antes: packId
  buyer: {                   // ❌ Antes: buyerUserId, buyerNickname
    id: string;
    nickname: string;
  };
  messages: MercadoLibreMessage[];
  lastMessageDate: string;
}
```

## 🚀 **Implementación Técnica**

### **1. Función Principal: fetchMessageThreadsByDateRange**

```typescript
// src/lib/mercadolibre.ts
export async function fetchMessageThreadsByDateRange(
  fromDate?: Date,
  toDate?: Date
): Promise<Array<{ pack_id: number; buyer: { id: string; nickname: string }; messages: MercadoLibreMessage[] }>>
```

**Algoritmo:**
1. **Obtener órdenes** por rango de fechas
2. **Extraer pack_ids únicos** y información de compradores
3. **Obtener mensajes** para cada pack usando API oficial
4. **Filtrar packs con mensajes** (muchos packs no tienen mensajes)
5. **Retornar estructura unificada**

### **2. API Endpoint: /api/mercadolibre/threads**

```typescript
// src/app/api/mercadolibre/threads/route.ts
GET /api/mercadolibre/threads?from=DATE&to=DATE
```

**Características:**
- ✅ Soporte de filtros de fecha opcionales
- ✅ Usar mes actual por defecto
- ✅ Logging comprehensivo
- ✅ Manejo de errores robusto

### **3. Utilidades Client-Side Actualizadas**

```typescript
// src/features/mercadolibre/utils/messages.ts

// Obtener threads de mensajes
export async function getMessageThreadsByDateRange(
  fromDate?: Date,
  toDate?: Date
): Promise<MessageThread[]>

// Enviar mensajes (orden corregido de parámetros)
export async function sendMessage(
  packId: number,
  buyerUserId: string,
  message: string
): Promise<boolean>
```

## 🔧 **Componentes Actualizados**

### **1. Página de Mensajes**
- ✅ Usa nueva interfaz `MessageThread`
- ✅ Eliminada exportación de `metadata` en cliente
- ✅ Propiedades actualizadas: `pack_id`, `buyer.id`, `buyer.nickname`

### **2. Lista de Mensajes Mejorada**
- ✅ Compatibilidad con nueva estructura
- ✅ Normalización de texto de mensajes
- ✅ Filtros y paginación funcionando

### **3. Formulario de Respuesta**
- ✅ Orden correcto de parámetros en `sendMessage`
- ✅ Manejo de errores mejorado

## 📊 **Optimizaciones de Rate Limiting**

### **Estrategias Implementadas:**
1. **Throttling**: 300ms delay entre llamadas de API
2. **Filtro inteligente**: Mes actual por defecto
3. **Batch processing**: Procesar packs secuencialmente
4. **Graceful failures**: Continuar si falla un pack individual

```typescript
// Ejemplo de throttling
await sleep(300); // Entre cada pack
```

## 🚦 **Flujo de Datos Completo**

```mermaid
graph TD
    A[Usuario solicita mensajes] --> B[API /api/mercadolibre/threads]
    B --> C[fetchMessageThreadsByDateRange]
    C --> D[fetchOrdersByDateRange]
    D --> E[Extraer pack_ids únicos]
    E --> F[Para cada pack_id]
    F --> G[fetchAllMessagesForPack]
    G --> H[API oficial: /messages/packs/{pack_id}/sellers/{user_id}]
    H --> I[Normalizar mensajes]
    I --> J[Agregar info de comprador]
    J --> K[Retornar MessageThread[]]
    K --> L[Renderizar en UI]
```

## 🛠️ **Testing y Validación**

### **Verificación de Funcionamiento:**

1. **Logging Comprehensivo**: Cada paso está loggeado con emojis para fácil identificación
2. **Manejo de Errores**: Fallos gracefules sin detener todo el proceso
3. **Rate Limiting**: Respeta límites de la API de MercadoLibre
4. **Formato de Datos**: Estructura consistente para frontend

### **Logs Esperados:**
```
🔄 [MercadoLibre Messages] Using pack-based approach (official API)
📦 Found 5 packs to check for messages (current month)
💬 Found 3 messages for pack 2000006999011069 (buyer: GEOYETI)
✅ Total message threads found: 2
```

## 📝 **Documentación de API Oficial**

**Fuentes Oficiales Consultadas:**
- MercadoLibre Developer Site (developers.mercadolibre.com)
- API Reference para Messaging
- Post-sale Messages API

## ⚠️ **Limitaciones y Consideraciones**

### **Limitaciones de la API:**
1. **Sin endpoint de threads**: No existe búsqueda directa de conversaciones
2. **Rate limits**: Máximo ~100 requests/minuto por usuario
3. **Pack-based only**: Solo mensajes relacionados a órdenes
4. **Filtros limitados**: No filtros avanzados en mensajes

### **Consideraciones de Performance:**
1. **Caché recomendado**: Para órdenes frecuentemente consultadas
2. **Filtros de fecha**: Siempre usar rangos acotados
3. **Paginación**: Implementar para grandes volúmenes

## 🎯 **Resultado Final**

### **✅ Funcionalidades Implementadas:**
- ✅ Obtener conversaciones de mensajes reales
- ✅ Enviar respuestas a compradores
- ✅ Interfaz completa con filtros de fecha
- ✅ Estadísticas en tiempo real
- ✅ Rate limiting y manejo de errores
- ✅ Compatibilidad con MercadoLibre Chile

### **✅ Problemas Resueltos:**
- ❌ "resource not found" → ✅ API endpoints correctos
- ❌ Threads vacíos → ✅ Mensajes reales de packs
- ❌ Envío fallando → ✅ Formato correcto de mensajes
- ❌ Rate limiting → ✅ Throttling implementado

## 🚀 **Próximos Pasos**

1. **Caché de Redis**: Para órdenes frecuentemente accedidas
2. **WebSockets**: Para notificaciones en tiempo real
3. **Filtros avanzados**: Por estado de mensaje, comprador, etc.
4. **Analytics**: Métricas de respuesta y engagement

---

**📅 Implementado:** Enero 2025  
**🧑‍💻 Basado en:** API oficial de MercadoLibre Chile  
**🔗 Compatibilidad:** Next.js 15, MercadoLibre API v1 