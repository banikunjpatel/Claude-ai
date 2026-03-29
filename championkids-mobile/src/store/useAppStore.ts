/** Global app state — non-sensitive UI state only.
 *
 * Auth tokens are NEVER stored here. They live in expo-secure-store via
 * the Supabase client's own session management.
 *
 * Persisted to AsyncStorage (non-sensitive):
 *   - selectedChildId
 *   - onboardingComplete
 *
 * NOT persisted (runtime only):
 *   - onboardingData (transient wizard state)
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ── Onboarding wizard state ───────────────────────────────────────────────────

export interface OnboardingChildData {
  name:        string
  dateOfBirth: string
  avatarUrl?:  string
}

export interface OnboardingData {
  parentName:   string
  skillFocuses: string[]
  children:     OnboardingChildData[]
}

// ── Store shape ───────────────────────────────────────────────────────────────

interface AppState {
  // Persisted
  selectedChildId:    string | null
  onboardingComplete: boolean

  // Runtime only (not persisted)
  onboardingData: OnboardingData

  // Actions
  setSelectedChildId:     (id: string | null)            => void
  setOnboardingComplete:  (complete: boolean)             => void
  setOnboardingData:      (data: Partial<OnboardingData>) => void
  setParentName:          (name: string)                  => void
  toggleSkillFocus:       (slug: string)                  => void
  addOnboardingChild:     (child: OnboardingChildData)    => void
  resetOnboardingData:    ()                              => void
}

const DEFAULT_ONBOARDING_DATA: OnboardingData = {
  parentName:   '',
  skillFocuses: [],
  children:     [],
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Persisted initial values
      selectedChildId:    null,
      onboardingComplete: false,

      // Runtime initial values
      onboardingData: DEFAULT_ONBOARDING_DATA,

      // ── Actions ──────────────────────────────────────────────────────────

      setSelectedChildId: (id) => set({ selectedChildId: id }),

      setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),

      setOnboardingData: (data) =>
        set((state) => ({
          onboardingData: { ...state.onboardingData, ...data },
        })),

      setParentName: (name) =>
        set((state) => ({
          onboardingData: { ...state.onboardingData, parentName: name },
        })),

      toggleSkillFocus: (slug) =>
        set((state) => {
          const current = state.onboardingData.skillFocuses
          const next = current.includes(slug)
            ? current.filter((s) => s !== slug)
            : current.length < 3
              ? [...current, slug]
              : current
          return { onboardingData: { ...state.onboardingData, skillFocuses: next } }
        }),

      addOnboardingChild: (child) =>
        set((state) => ({
          onboardingData: {
            ...state.onboardingData,
            children: [...state.onboardingData.children, child],
          },
        })),

      resetOnboardingData: () =>
        set({ onboardingData: DEFAULT_ONBOARDING_DATA }),
    }),
    {
      name: 'ck-app-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist non-sensitive UI preferences
      partialize: (state) => ({
        selectedChildId:    state.selectedChildId,
        onboardingComplete: state.onboardingComplete,
      }),
    },
  ),
)
