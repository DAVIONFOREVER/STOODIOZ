
import React, { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../providers/AuthProvider'

export default function LoginForm() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
  }

  if (user) {
    return <div className="text-sm text-green-400">You are logged in.</div>
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <div className="w-full max-w-sm bg-zinc-800 p-6 rounded-xl border border-zinc-700 shadow-xl">
        <h2 className="text-2xl font-bold text-slate-100 mb-6 text-center">Sign In</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-orange-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-orange-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="text-red-400 text-xs bg-red-500/10 p-2 rounded">{error}</div>}
          <button
            type="submit"
            className="w-full rounded-md bg-orange-500 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60 transition-colors"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
