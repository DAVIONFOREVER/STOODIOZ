import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

// This function provides a lazy-initialized Supabase client.
// It prevents the app from crashing on startup if environment variables are missing
// by deferring the client creation and key check until an API call is actually made.
export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Use environment variables to configure Supabase client, checking multiple sources.
  const supabaseUrl = (process as any).env.VITE_SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL;
  const supabaseAnonKey = (process as any).env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  const areKeysValid = (key: string | undefined) => key && key.trim() !== '' && !key.startsWith('{{');

  if (!areKeysValid(supabaseUrl) || !areKeysValid(supabaseAnonKey)) {
    // This will now correctly fail if the environment variables are not set.
    return null;
  }

  supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!);
  return supabaseInstance;
};