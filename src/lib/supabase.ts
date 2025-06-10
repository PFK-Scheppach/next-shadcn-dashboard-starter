import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client for browser/public operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client for server-side operations with full access
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types for better TypeScript support
export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string;
          pack_id: string;
          seller_id: string;
          buyer_id: string | null;
          buyer_nickname: string | null;
          order_id: string | null;
          total_messages: number;
          last_message_date: string | null;
          last_sync_date: string;
          conversation_status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pack_id: string;
          seller_id: string;
          buyer_id?: string | null;
          buyer_nickname?: string | null;
          order_id?: string | null;
          total_messages?: number;
          last_message_date?: string | null;
          last_sync_date?: string;
          conversation_status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pack_id?: string;
          seller_id?: string;
          buyer_id?: string | null;
          buyer_nickname?: string | null;
          order_id?: string | null;
          total_messages?: number;
          last_message_date?: string | null;
          last_sync_date?: string;
          conversation_status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          message_id: string;
          conversation_id: string;
          pack_id: string;
          from_user_id: string;
          to_user_id: string;
          text: string;
          text_translated: string | null;
          message_date: string;
          status: string;
          moderation_status: string | null;
          moderation_reason: string | null;
          attachments: any | null; // JSON field
          is_first_message: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          conversation_id: string;
          pack_id: string;
          from_user_id: string;
          to_user_id: string;
          text: string;
          text_translated?: string | null;
          message_date: string;
          status?: string;
          moderation_status?: string | null;
          moderation_reason?: string | null;
          attachments?: any | null;
          is_first_message?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          conversation_id?: string;
          pack_id?: string;
          from_user_id?: string;
          to_user_id?: string;
          text?: string;
          text_translated?: string | null;
          message_date?: string;
          status?: string;
          moderation_status?: string | null;
          moderation_reason?: string | null;
          attachments?: any | null;
          is_first_message?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sync_status: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          last_sync_date: string;
          sync_status: string;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          last_sync_date?: string;
          sync_status?: string;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          last_sync_date?: string;
          sync_status?: string;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
