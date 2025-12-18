
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ijcxeispefnbfwiviyux.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY3hlaXNwZWZuYmZ3aXZpeXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3OTgyNDcsImV4cCI6MjA3NjM3NDI0N30.2ILPIMF6rqsLZimqWHm5txhB3q_3fbXIlQUMKEhV37g";

// Global singleton to prevent multiple instances during HMR
declare global {
    var __supabase__: SupabaseClient | undefined;
}

export const supabase: SupabaseClient = globalThis.__supabase__ ?? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'sb-stoodioz-auth-token',
    },
});

if (typeof window !== 'undefined') {
    globalThis.__supabase__ = supabase;
}

export const getSupabase = (): SupabaseClient => {
    return supabase;
};

export async function performLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Clear all app specific local data
        const keysToRemove = ['last_view', 'selected_entity_id', 'sb-stoodioz-auth-token'];
        keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
        console.error('Logout failed', e);
        throw e;
    }
}
