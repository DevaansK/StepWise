import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const isValidUrl = (url?: string) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  isValidUrl(supabaseUrl) &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder') &&
  supabaseAnonKey.length > 20
);

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const isSupabaseConfigured = (): boolean => isConfigured;

export async function testSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  if (!supabase) {
    return {
      connected: false,
      message: 'Supabase credentials (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) are not configured. Running in high-fidelity local state mode.',
    };
  }

  try {
    const { data, error } = await supabase.from('departments').select('count').limit(1);
    if (error) {
      return { connected: false, message: `Supabase query error: ${error.message}` };
    }
    return { connected: true, message: 'Successfully connected to Supabase PostgreSQL database.' };
  } catch (err: any) {
    return { connected: false, message: `Connection failed: ${err.message || String(err)}` };
  }
}
