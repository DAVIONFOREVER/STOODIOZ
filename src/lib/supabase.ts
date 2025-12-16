
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  (import.meta as any).env.VITE_SUPABASE_URL!,
  (import.meta as any).env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sb-ijcxeispefnbfwiviyux-auth',
    },
  }
)

export const getSupabase = () => supabase

function purgeLocalStorage(projectRef = 'ijcxeispefnbfwiviyux') {
  try {
    // 1. Aggressively clear ALL Supabase keys (starts with 'sb-')
    // This fixes the issue if the Project ID doesn't match the hardcoded string
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('sb-')) localStorage.removeItem(k);
    }
    
    // 2. Clear app state
    localStorage.removeItem('last_view');
  } catch (e) {
    console.warn('Storage purge warning:', e);
  }
}

export async function performLogout() {
  const client = getSupabase()
  try {
    // 1) Remove channels and disconnect Realtime
    const channels = client.getChannels()
    if (channels.length > 0) {
        await Promise.allSettled(channels.map((ch) => client.removeChannel(ch)))
    }
    
    // 2) Disconnect socket
    if (client.realtime) {
        await client.realtime.disconnect()
    }

    // 3) Attempt Server-Side Sign Out
    // We await this, but if it fails, we catch it so we can still purge local data
    await (client.auth as any).signOut({ scope: 'global' })
    
  } catch (e) {
    console.warn('Logout network/cleanup warning (non-fatal):', e)
  } finally {
    // 4) ALWAYS Purge Storage, even if the above errors out
    purgeLocalStorage() // Use the updated aggressive purge
  }
}
