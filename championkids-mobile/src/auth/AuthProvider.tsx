/** Supabase auth context.
 *
 * Wrap the app with <AuthProvider> to expose the current session and user
 * via the `useAuth` hook. Listens to `onAuthStateChange` so any tab/session
 * change propagates automatically.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

// ── Context shape ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  session:        Session | null
  user:           User | null
  isAuthLoading:  boolean
  signOut:        () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: PropsWithChildren) {
  const [session,       setSession]       = useState<Session | null>(null)
  const [user,          setUser]          = useState<User | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    // Hydrate from stored session on mount
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      setIsAuthLoading(false)
    })

    // Subscribe to future auth events (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s)
        setUser(s?.user ?? null)
        setIsAuthLoading(false)
      },
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    // onAuthStateChange will set session/user to null
  }

  return (
    <AuthContext.Provider value={{ session, user, isAuthLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Internal hook (re-exported via useAuth.ts) ────────────────────────────────

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>')
  }
  return ctx
}
