/** Singleton Supabase client for the mobile app.
 *
 * Uses `SBStorageAdapter` (expo-secure-store with chunking) so sessions are
 * stored securely and never touch AsyncStorage.
 *
 * Import `supabase` wherever you need auth operations.
 * Import `getSupabaseSession` for the Axios request interceptor.
 */

import { createClient } from '@supabase/supabase-js'
import { getConfig } from '@/config'
import { SBStorageAdapter } from './tokenStorage'

const { supabaseUrl, supabaseAnonKey } = getConfig()

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage:            SBStorageAdapter,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,   // not a browser; no URL-based OAuth callbacks
  },
})

/** Returns the current access token or null. Used by the Axios interceptor. */
export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

/** Returns the current refresh token or null. Used by the Axios 401 handler. */
export async function getRefreshToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.refresh_token ?? null
}

/** Clears all auth state from SecureStore and Supabase in-memory store. */
export async function clearTokens(): Promise<void> {
  await supabase.auth.signOut()
}
