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
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(`sb-${projectRef}-`)) localStorage.removeItem(k)
    }
    localStorage.removeItem('last_view')
  } catch (e) {
    console.warn('Storage purge warning:', e)
  }
}

export async function performLogout() {
  const client = getSupabase()
  try {
    // 1) Remove channels and disconnect Realtime
    await Promise.allSettled(client.getChannels().map((ch) => client.removeChannel(ch)))
    client.removeAllChannels?.()
    await client.realtime.disconnect()

    // 2) Clear Realtime auth so reconnections aren’t authenticated
    await client.realtime.setAuth(null as unknown as string)

    // 3) Destroy auth session (global optional)
    await (client.auth as any).signOut({ scope: 'global' })

    // 4) Purge Supabase storage keys for this project
    purgeLocalStorage('ijcxeispefnbfwiviyux')
  } catch (e) {
    console.warn('Logout cleanup warning:', e)
  }
}