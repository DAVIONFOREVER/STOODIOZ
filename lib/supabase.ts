import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Hardcode the keys as requested by the user.
const supabaseUrl = "https://ijcxeispefnbfwiviyux.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY3hlaXNwZWZuYmZ3aXZpeXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3OTgyNDcsImV4cCI6MjA3NjM3NDI0N30.2ILPIMF6rqsLZimqWHm5txhB3q_3fbXIlQUMKEhV37g";

// Use a global variable to store the client instance during development
// to prevent multiple instances during Hot Module Replacement (HMR).
const globalSupabase = globalThis as unknown as { _supabaseInstance: SupabaseClient | null };

export const getSupabase = (): SupabaseClient | null => {
  if (globalSupabase._supabaseInstance) {
    return globalSupabase._supabaseInstance;
  }

  const areKeysValid = (key: string | undefined) => key && key.trim() !== '' && !key.startsWith('{{');

  if (!areKeysValid(supabaseUrl) || !areKeysValid(supabaseAnonKey)) {
    return null;
  }

  globalSupabase._supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!);
  return globalSupabase._supabaseInstance;
};