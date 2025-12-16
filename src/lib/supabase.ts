
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ijcxeispefnbfwiviyux.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY3hlaXNwZWZuYmZ3aXZpeXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3OTgyNDcsImV4cCI6MjA3NjM3NDI0N30.2ILPIMF6rqsLZimqWHm5txhB3q_3fbXIlQUMKEhV37g";

// Global variable to prevent duplicate instances in HMR (Hot Module Replacement) during dev
declare global {
    var __supabase__: SupabaseClient | undefined;
}

// Create a single, stable client with explicit options
export const supabase: SupabaseClient = globalThis.__supabase__ ?? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Ensures the session persists across reloads and refreshes tokens
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'sb-ijcxeispefnbfwiviyux-auth', // Unique storage key per project
    },
    realtime: {
        params: {
            eventsPerSecond: 5,
        },
    },
});

if (typeof window !== 'undefined') {
    globalThis.__supabase__ = supabase;
}

// Backward compatibility wrapper for existing files calling getSupabase()
export const getSupabase = (): SupabaseClient | null => {
    return supabase;
};

// Robust Logout Handler
export async function performLogout() {
  const client = getSupabase()
  if (!client) return;

  try {
    // 1. Disconnect Realtime to stop incoming events
    // We catch individual errors here to ensure we proceed to auth signout
    try {
        const channels = client.getChannels();
        if (channels.length > 0) {
            await Promise.all(channels.map((ch) => client.removeChannel(ch)));
        }
        await client.realtime.disconnect();
    } catch (wsError) {
        console.warn('Realtime disconnect warning:', wsError);
    }

    // 2. Sign out from Auth (Invalidates token on server)
    const { error } = await client.auth.signOut({ scope: 'global' });
    if (error) throw error;

  } catch (e) {
    console.warn('Logout API warning (non-fatal):', e);
  }
}
