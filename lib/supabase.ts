import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ijcxeispefnbfwiviyux.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY3hlaXNwZWZuYmZ3aXZpeXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3OTgyNDcsImV4cCI6MjA3NjM3NDI0N30.2ILPIMF6rqsLZimqWHm5txhB3q_3fbXIlQUMKEhV37g";

declare global {
    var __supabase__: SupabaseClient | undefined;
}

export const supabase: SupabaseClient = globalThis.__supabase__ ?? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'sb-ijcxeispefnbfwiviyux-auth',
    },
});

if (typeof window !== 'undefined') {
    globalThis.__supabase__ = supabase;
}

export const getSupabase = (): SupabaseClient | null => {
    return supabase;
};

/**
 * Performs a hard reset of the application state and session.
 */
export async function performLogout() {
  const client = getSupabase();
  if (!client) return;

  try {
    // 1. Sign out from Supabase (Clears server session and cookies)
    await client.auth.signOut({ scope: 'global' });
    
    // 2. Clear all Realtime channels
    const channels = client.getChannels();
    for (const ch of channels) {
        client.removeChannel(ch);
    }

    // 3. Clear ALL local storage (The nuclear option for reliability)
    localStorage.clear();
    sessionStorage.clear();
    
    // 4. Force a clean state for the browser
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
  } catch (e) {
    console.warn('Logout cleanup warning:', e);
    localStorage.clear(); // Always clear even if API fails
  }
}