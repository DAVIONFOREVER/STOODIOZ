// lib/supabase.ts

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

const HEALTH_CHECK_TIMEOUT_MS = 7000;
const HEALTH_CHECK_STRIPE_MS = 12000;

/**
 * Real reachability check: GET a tiny REST endpoint. Only mark unreachable on network error or non-2xx.
 * Optional timeout override for Stripe redirect (longer so first call after redirect can complete).
 */
export function getSupabaseReachable(timeoutMs: number = HEALTH_CHECK_TIMEOUT_MS): Promise<boolean> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    if (typeof window !== 'undefined') {
      console.error('[STOODIOZ] Health check skipped: missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    }
    return Promise.resolve(false);
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  const healthUrl = `${url.replace(/\/$/, '')}/rest/v1/profiles?select=id&limit=1`;
  return fetch(healthUrl, {
    method: 'GET',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
  })
    .then((res) => {
      clearTimeout(t);
      const ok = res.ok;
      if (typeof window !== 'undefined') {
        const ref = url.replace(/^https?:\/\/([^.]+)\.supabase\.co.*/, '$1') || 'MISSING';
        if (ok) {
          console.info('[STOODIOZ] Supabase reachable (health check 200). Project ref:', ref);
        } else {
          console.warn('[STOODIOZ] Supabase health check non-200:', res.status, 'Project ref:', ref);
        }
      }
      return ok;
    })
    .catch((err) => {
      clearTimeout(t);
      if (typeof window !== 'undefined') {
        const ref = url.replace(/^https?:\/\/([^.]+)\.supabase\.co.*/, '$1') || 'MISSING';
        console.warn('[STOODIOZ] Supabase health check failed:', err?.message || err, 'Project ref:', ref);
      }
      return false;
    });
}

/** When Stripe return/checkout in progress, use longer health timeout so first request can complete. */
export function getSupabaseReachableForStripe(): Promise<boolean> {
  return getSupabaseReachable(HEALTH_CHECK_STRIPE_MS);
}

/**
 * Fetch wrapper so requests don't hang forever.
 * Must be longer than apiService DB_TIMEOUT_MS or the client aborts before the app timeout.
 */
const SUPABASE_FETCH_TIMEOUT_MS = 50_000;

function fetchWithTimeout(timeoutMs = SUPABASE_FETCH_TIMEOUT_MS) {
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
 * SINGLETON Supabase client. Do NOT recreate per call.
 */
export function getSupabase(): SupabaseClient {
  if (supabase) return supabase;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (typeof window !== 'undefined') {
    console.info('[STOODIOZ] Supabase env at runtime:', url || 'MISSING', anonKey ? `${anonKey.slice(0, 12)}...` : 'MISSING');
  }
  if (!url || !anonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Restart dev server after changing .env.');
  }

  supabase = createClient(url, anonKey, {
    global: {
      fetch: fetchWithTimeout(SUPABASE_FETCH_TIMEOUT_MS),
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  });

  return supabase;
}

/**
 * Set Realtime auth token. Call after getSession() on app boot so Realtime works before any queries.
 */
export function setRealtimeAuth(accessToken: string | null): void {
  const s = supabase;
  if (!s?.realtime) return;
  try {
    (s.realtime as any).setAuth(accessToken ?? undefined);
  } catch (_) {}
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
