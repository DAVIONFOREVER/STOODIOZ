
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

export async function performLogout() {
  const client = getSupabase();
  if (!client) return;

  try {
    // 1. Signal other tabs to log out immediately
    localStorage.setItem('app:logout', String(Date.now()));

    // 2. Disconnect Realtime
    try {
        const channels = client.getChannels();
        for (const ch of channels) { client.removeChannel(ch); }
        await client.realtime.disconnect();
    } catch (wsError) {
        console.warn('WS disconnect warning:', wsError);
    }

    // 3. Global sign out (Revokes refresh tokens on server)
    await client.auth.signOut({ scope: 'global' });

    // 4. Cleanup local storage
    localStorage.removeItem('sb-ijcxeispefnbfwiviyux-auth');
    localStorage.removeItem('last_view');
  } catch (e) {
    console.warn('Logout cleanup warning:', e);
  }
}
