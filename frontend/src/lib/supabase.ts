import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../config/supabase.config';

// Tipos para TypeScript baseados no schema atual
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'admin' | 'user' | 'manager';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'user' | 'manager';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'user' | 'manager';
          created_at?: string;
          updated_at?: string;
        };
      };
      whatsapp_instances: {
        Row: {
          instance_name: string;
          status: 'connected' | 'disconnected' | 'connecting' | 'qr_ready';
          phone_number: string | null;
          webhook_url: string | null;
          created_at: string;
          updated_at: string;
          qr_code: string | null;
          user_id: string | null;
        };
        Insert: {
          instance_name: string;
          status?: 'connected' | 'disconnected' | 'connecting' | 'qr_ready';
          phone_number?: string | null;
          webhook_url?: string | null;
          created_at?: string;
          updated_at?: string;
          qr_code?: string | null;
          user_id?: string | null;
        };
        Update: {
          instance_name?: string;
          status?: 'connected' | 'disconnected' | 'connecting' | 'qr_ready';
          phone_number?: string | null;
          webhook_url?: string | null;
          created_at?: string;
          updated_at?: string;
          qr_code?: string | null;
          user_id?: string | null;
        };
      };
    };
  };
}

// Criar cliente Supabase (única instância)
export const supabase = createClient<Database>(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: supabaseConfig.auth
});
