/** Axios instance with auth and error-normalisation interceptors.
 *
 * Request interceptor:  attaches the Supabase session token as Bearer.
 * Response interceptor: on 401 checks whether the Supabase session is still
 *                       valid before signing out — prevents a misconfigured
 *                       backend from destroying a live session;
 *                       always normalises the error shape to { code, message, statusCode }.
 */

import axios, { AxiosError } from 'axios'
import config from '@/config'
import { supabase } from '@/auth/supabaseClient'
import type { APIError, AppError } from '@/types/api'

const apiClient = axios.create({
  baseURL: `${config.apiBaseUrl}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// ── Request interceptor: attach auth token ────────────────────────────────

apiClient.interceptors.request.use(async (cfg) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    cfg.headers.Authorization = `Bearer ${session.access_token}`
  }
  return cfg
})

// ── Response interceptor: normalise errors ────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<APIError>) => {
    const status = error.response?.status

    // 401: only sign the user out if the Supabase session is genuinely gone.
    // A 401 can come from a misconfigured backend even when the token is valid —
    // calling signOut() in that case would destroy a live session and trap the
    // user in a login loop.
    if (status === 401) {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // No valid session — the token has truly expired or been revoked.
        await supabase.auth.signOut()
        window.location.href = '/login'
      }
      // If a session still exists the 401 is backend-side (wrong JWT_SECRET,
      // missing env var, etc.).  Propagate the error so TanStack Query can
      // surface it in the UI without logging the user out.
    }

    // Build a normalised AppError from the backend envelope.
    // The backend can send one of three shapes:
    //   1. Our envelope:  { success: false, error: { code, message, statusCode } }
    //   2. FastAPI detail: { detail: "Some error message" }
    //   3. Network / unknown error (no parseable body)
    const envelope = error.response?.data as Record<string, unknown> | undefined
    const appError: AppError =
      envelope?.success === false
        ? {
            code:       (envelope.error as AppError).code,
            message:    (envelope.error as AppError).message,
            statusCode: (envelope.error as AppError).statusCode,
          }
        : typeof envelope?.detail === 'string'
          ? {
              code:       'API_ERROR',
              message:    envelope.detail,
              statusCode: status ?? 400,
            }
          : {
              code:       'NETWORK_ERROR',
              message:    error.message || 'An unexpected error occurred.',
              statusCode: status ?? 0,
            }

    return Promise.reject(appError)
  }
)

export default apiClient
