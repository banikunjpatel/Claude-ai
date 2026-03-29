/** Supabase auth context provider.
 *
 * Wraps the app, listens to onAuthStateChange, and keeps Zustand in sync.
 * Route guards and API interceptors read from the Zustand store — they do NOT
 * call supabase.auth.getSession() on every render.
 */

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import { useAppStore } from '@/store/useAppStore'

interface AuthContextValue {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ user: User; session: Session }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { session, user, isAuthLoading, setSession, setUser, setIsAuthLoading } = useAppStore()

  useEffect(() => {
    // mounted flag prevents the stale getSession() callback (from React Strict
    // Mode's first effect run) from overwriting state after the effect is cleaned
    // up and re-run.
    let mounted = true

    // Hydrate from the existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)
      setIsAuthLoading(false)
    })

    // Keep store in sync for the lifetime of the app
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsAuthLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [setSession, setUser, setIsAuthLoading])

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data as { user: User; session: Session }
  }

  async function signOut() {
    await supabase.auth.signOut()
    // Store is updated via onAuthStateChange above
  }

  return (
    <AuthContext.Provider value={{ user, session, isLoading: isAuthLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Hook to access auth state from any component. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
