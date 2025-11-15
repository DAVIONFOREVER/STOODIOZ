import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

// This function provides a lazy-initialized Supabase client.
// It prevents the app from crashing on startup if environment variables are missing
// by deferring the client creation and key check until an API call is actually made.
// The ApiKeyGate component should prevent any API calls from being made if keys are missing.
export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = (process as any).env.VITE_SUPABASE_URL;
  const supabaseAnonKey = (process as any).env.VITE_SUPABASE_ANON_KEY;

  const areKeysValid = (key: string | undefined) => key && key.trim() !== '' && !key.startsWith('{{');

  if (!areKeysValid(supabaseUrl) || !areKeysValid(supabaseAnonKey)) {
    console.warn("Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not set correctly.");
    return null;
  }

  // Initialize the client with session persistence enabled.
  supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  
  return supabaseInstance;
};