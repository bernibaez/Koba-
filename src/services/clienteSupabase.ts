import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True cuando hay URL y anon key configuradas (no placeholders). */
export function isSupabaseConfigured(): boolean {
  if (!url || !anonKey) return false;
  if (url.includes('YOUR_PROJECT') || anonKey.includes('YOUR_SUPABASE')) return false;
  return url.startsWith('http') && anonKey.length > 20;
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase no configurado. Copia .env.example a .env y pega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
    );
  }
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

/** Cliente opcional: null si no hay env (permite fallback demo local). */
export function tryGetSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  return getSupabase();
}
