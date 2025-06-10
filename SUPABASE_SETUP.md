# Configuración de Base de Datos Supabase para Cache de Conversaciones

## ✅ Pasos de Configuración

### 1. Configurar Variables de Entorno

Actualiza tu archivo `.env.local` con estas variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://sugzjtycryxixucsqrdo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

**Para obtener las keys:**
1. Ve a [supabase.com](https://supabase.com) y entra a tu proyecto
2. Ve a Settings → API
3. Copia el `anon public` key y `service_role` key

### 2. Ejecutar el Schema SQL

Ve a tu dashboard de Supabase → SQL Editor y ejecuta el siguiente script:

```sql
-- Crear las tablas para el sistema de mensajería de MercadoLibre

-- Tabla de conversaciones (packs)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_id VARCHAR(50) UNIQUE NOT NULL,
    seller_id VARCHAR(50) NOT NULL,
    buyer_id VARCHAR(50),
    buyer_nickname VARCHAR(255),
    order_id VARCHAR(50),
    total_messages INTEGER DEFAULT 0,
    last_message_date TIMESTAMPTZ,
    last_sync_date TIMESTAMPTZ DEFAULT NOW(),
    conversation_status VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id VARCHAR(100) UNIQUE NOT NULL,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    pack_id VARCHAR(50) NOT NULL,
    from_user_id VARCHAR(50) NOT NULL,
    to_user_id VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    text_translated TEXT,
    message_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'available',
    moderation_status VARCHAR(50),
    moderation_reason TEXT,
    attachments JSONB,
    is_first_message BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de estado de sincronización
CREATE TABLE IF NOT EXISTS public.sync_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    last_sync_date TIMESTAMPTZ DEFAULT NOW(),
    sync_status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entity_type, entity_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_conversations_pack_id ON public.conversations(pack_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON public.conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON public.conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_date ON public.conversations(last_message_date DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_last_sync_date ON public.conversations(last_sync_date DESC);

CREATE INDEX IF NOT EXISTS idx_messages_message_id ON public.messages(message_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_pack_id ON public.messages(pack_id);
CREATE INDEX IF NOT EXISTS idx_messages_from_user_id ON public.messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_message_date ON public.messages(message_date DESC);

CREATE INDEX IF NOT EXISTS idx_sync_status_entity ON public.sync_status(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_status_last_sync ON public.sync_status(last_sync_date DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON public.conversations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON public.messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_sync_status_updated_at 
    BEFORE UPDATE ON public.sync_status 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_status ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (ajustar según necesidades)
CREATE POLICY "Allow all operations on conversations" ON public.conversations
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on messages" ON public.messages
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on sync_status" ON public.sync_status
    FOR ALL USING (true);
```

### 3. Probar la Conexión

Una vez configurado, prueba la conexión visitando:
```
http://localhost:3000/api/db/test
```

Deberías ver una respuesta como:
```json
{
  "success": true,
  "message": "Database connection working correctly",
  "stats": {
    "total_conversations": 0,
    "database_connected": true,
    "supabase_url": "configured",
    "service_role_key": "configured",
    "anon_key": "configured"
  }
}
```

## 🚀 Funcionamiento del Sistema

### Cache Inteligente
- **Primer acceso**: Los datos se obtienen de la API de MercadoLibre y se guardan en la base de datos
- **Accesos posteriores**: Los datos se sirven desde la base de datos (mucho más rápido)
- **Sincronización**: Los datos se actualizan automáticamente cuando es necesario

### Beneficios
- ⚡ **Performance**: Consultas instantáneas desde la base de datos
- 📊 **Límites de API**: Reduce drásticamente las llamadas a MercadoLibre
- 🔄 **Sincronización**: Datos siempre actualizados cuando es necesario
- 📈 **Escalabilidad**: Preparado para manejar grandes volúmenes de datos

### Endpoints Actualizados
- `GET /api/mercadolibre/packs` - Ahora usa cache de DB
- `GET /api/mercadolibre/messages/pack/[packId]` - Ahora usa cache de DB
- `GET /api/db/test` - Prueba la conexión a la base de datos

### Parámetros Especiales
- `?force_sync=true` - Fuerza sincronización desde API (omite cache)
- `?include_messages=false` - No incluye conteo de mensajes (más rápido)

## 🔧 Monitoreo

Los logs del servidor mostrarán:
- 🔍 `[Sync]` - Operaciones de sincronización
- 💾 `[DB]` - Operaciones de base de datos  
- 🔄 `[API]` - Llamadas a MercadoLibre
- ✅ `CACHED` vs `FRESH` - Origen de los datos

## ⚠️ Importante para Producción

1. **Variables de entorno**: Asegúrate de configurar todas las variables en tu servidor de producción
2. **Políticas de seguridad**: Revisa las políticas RLS en Supabase según tus necesidades
3. **Monitoreo**: Vigila los logs para detectar errores de sincronización
4. **Backup**: Configura backups automáticos en Supabase 