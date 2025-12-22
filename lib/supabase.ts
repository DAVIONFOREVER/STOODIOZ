// lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Vite env (preferred)
const VITE_URL =
  (import.meta as any)?.env?.VITE_SUPABASE_URL ||
  (import.meta as any)?.env?.SUPABASE_URL;

const VITE_ANON_KEY =
  (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any)?.env?.VITE_SUPABASE_KEY ||
  (import.meta as any)?.env?.SUPABASE_ANON_KEY ||
  (import.meta as any)?.env?.SUPABASE_KEY;

// If you sometimes inject env via define/process.env
const PROCESS_URL = (globalThis as any)?.process?.env?.VITE_SUPABASE_URL || (globalThis as any)?.process?.env?.SUPABASE_URL;
const PROCESS_KEY =
  (globalThis as any)?.process?.env?.VITE_SUPABASE_ANON_KEY ||
  (globalThis as any)?.process?.env?.VITE_SUPABASE_KEY ||
  (globalThis as any)?.process?.env?.SUPABASE_ANON_KEY ||
  (globalThis as any)?.process?.env?.SUPABASE_KEY;

const SUPABASE_URL: string | undefined = VITE_URL || PROCESS_URL;
const SUPABASE_ANON_KEY: string | undefined = VITE_ANON_KEY || PROCESS_KEY;

let _supabase: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (_supabase) return _supabase;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Fail fast with a clear message (better than silent undefined client)
    throw new Error(
      '[supabase] Missing env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL/SUPABASE_ANON_KEY).'
    );
  }

  _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return _supabase;
};

// Convenience named export (your App.tsx uses this)
export const supabase = (() => {
  try {
    return getSupabase();
  } catch (e) {
    // During build-time some tools evaluate modules; keep a safe placeholder until runtime.
    // Any auth call will still throw if env is missing.
    return (null as unknown) as SupabaseClient;
  }
})();

export const performLogout = async (): Promise<void> => {
  const client = getSupabase();
  await client.auth.signOut();
};

