/** Zustand global store for minimal client-side state.
 *
 * Only state that is genuinely global and synchronous lives here.
 * Server state (children, activities, etc.) lives in TanStack Query.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session, User } from '@supabase/supabase-js'

interface AppState {
  // ── Auth ────────────────────────────────────────────────────────────────
  session: Session | null
  user: User | null
  isAuthLoading: boolean

  setSession: (session: Session | null) => void
  setUser: (user: User | null) => void
  setIsAuthLoading: (loading: boolean) => void

  // ── Child selection ──────────────────────────────────────────────────
  /** The child currently in focus across Today, Progress, etc. */
  selectedChildId: string | null
  setSelectedChildId: (id: string | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      session: null,
      user: null,
      isAuthLoading: true,

      setSession: (session) => set({ session }),
      setUser: (user) => set({ user }),
      setIsAuthLoading: (isAuthLoading) => set({ isAuthLoading }),

      // Child selection
      selectedChildId: null,
      setSelectedChildId: (selectedChildId) => set({ selectedChildId }),
    }),
    {
      name: 'ck-app-store',
      // Only persist the child selection — never persist auth tokens to localStorage
      partialize: (state) => ({ selectedChildId: state.selectedChildId }),
    }
  )
)
