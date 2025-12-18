
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
// This ensures we don't break the rest of the app while fixing the auth core.
export const getSupabase = (): SupabaseClient | null => {
    return supabase;
};

// Robust Logout Handler (Call this from UI)
export async function performLogout() {
    try {
        // 1. Stop realtime to avoid resubscribing with stale token
        try {
            const channels = supabase.getChannels();
            for (const ch of channels) {
                supabase.removeChannel(ch);
            }
            await supabase.realtime.disconnect();
        } catch (e) {
            console.warn("Realtime disconnect warning:", e);
        }

        // 2. Global sign-out clears all sessions (multi-device)
        // Cast to any to bypass potential type mismatch with older definitions of signOut params
        const { error } = await (supabase.auth as any).signOut({ scope: 'global' });
        if (error) throw error;

        // 3. As a safety net, clear persisted storage the client may have used
        try {
            localStorage.removeItem('sb-ijcxeispefnbfwiviyux-auth');
            sessionStorage.removeItem('sb-ijcxeispefnbfwiviyux-auth');
            // Clear app-specific persistence
            localStorage.removeItem('last_view');
        } catch (e) {
            // ignore
        }
    } catch (e) {
        console.error('Logout failed', e);
        throw e;
    }
}
