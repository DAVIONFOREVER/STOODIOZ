import React, { useEffect, useState, createContext, useContext, type PropsWithChildren } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

type AuthContextValue = {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true })
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (mounted) {
          setUser(data.session?.user ?? null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching session:', error)
        if (mounted) setLoading(false)
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    void init()

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}