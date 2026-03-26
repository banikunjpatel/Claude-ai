/** Axios instance with auth and error-normalisation interceptors.
 *
 * Request interceptor:  attaches the Supabase session token as Bearer.
 * Response interceptor: on 401 clears auth and redirects to /login;
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

    // 401: session is dead → clear auth and redirect
    if (status === 401) {
      await supabase.auth.signOut()
      window.location.href = '/login'
    }

    // Build a normalised AppError from the backend envelope
    const envelope = error.response?.data
    const appError: AppError = envelope?.success === false
      ? {
          code:       envelope.error.code,
          message:    envelope.error.message,
          statusCode: envelope.error.statusCode,
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
