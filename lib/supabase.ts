// lib/supabase.ts

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

/**
 * Fetch wrapper that NEVER hangs.
 * Any request >12s is aborted so your UI cannot stall forever.
 */
function fetchWithTimeout(timeoutMs = 12000) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  };
}

/**
 * SINGLETON Supabase client.
 * This is CRITICAL — do NOT recreate the client per call.
 */
export function getSupabase(): SupabaseClient {
  if (supabase) return supabase;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  }

  supabase = createClient(url, anonKey, {
    global: {
      fetch: fetchWithTimeout(12000),
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

  return supabase;
}

/**
 * Canonical logout used everywhere.
 */
export async function performLogout(): Promise<void> {
  const s = getSupabase();
  try {
    await s.auth.signOut();
  } catch {
    // swallow
  }
}
