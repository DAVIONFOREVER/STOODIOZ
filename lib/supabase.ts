import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

// This function provides a lazy-initialized Supabase client.
// It prevents the app from crashing on startup if environment variables are missing
// by deferring the client creation and key check until an API call is actually made.
// The ApiKeyGate component should prevent any API calls from being made if keys are missing.
export const getSupabase = (): SupabaseClient => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  const areKeysValid = (key: string | undefined) => key && key.trim() !== '' && !key.startsWith('{{');

  if (!areKeysValid(supabaseUrl) || !areKeysValid(supabaseAnonKey)) {
    throw new Error("Supabase URL and Anon Key are required. Please check your Vercel environment variables.");
  }

  supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!);
  return supabaseInstance;
};
