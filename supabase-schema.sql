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
    entity_type VARCHAR(50) NOT NULL, -- 'conversation' o 'message'
    entity_id VARCHAR(50) NOT NULL,
    last_sync_date TIMESTAMPTZ DEFAULT NOW(),
    sync_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'synced', 'error'
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
-- Por ahora permitimos todo acceso desde el backend
CREATE POLICY "Allow all operations on conversations" ON public.conversations
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on messages" ON public.messages
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on sync_status" ON public.sync_status
    FOR ALL USING (true); 