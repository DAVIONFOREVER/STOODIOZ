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

  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  const areKeysValid = (key: string | undefined) => key && key.trim() !== '' && !key.startsWith('{{');

  if (!areKeysValid(supabaseUrl) || !areKeysValid(supabaseAnonKey)) {
    // Return null instead of throwing an error to prevent build crashes.
    // The ApiKeyGate component will handle showing the setup instructions.
    return null;
  }

  supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!);
  return supabaseInstance;
};
