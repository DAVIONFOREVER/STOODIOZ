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

  // Hardcode the keys as requested by the user.
  const supabaseUrl = "https://ijcxeispefnbfwiviyux.supabase.co";
  const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY3hlaXNwZWZuYmZ3aXZpeXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3OTgyNDcsImV4cCI6MjA3NjM3NDI0N30.2ILPIMF6rqsLZimqWHm5txhB3q_3fbXIlQUMKEhV37g";

  const areKeysValid = (key: string | undefined) => key && key.trim() !== '' && !key.startsWith('{{');

  if (!areKeysValid(supabaseUrl) || !areKeysValid(supabaseAnonKey)) {
    // This check will now always pass, but is kept as a safeguard.
    return null;
  }

  supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!);
  return supabaseInstance;
};