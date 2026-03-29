/** Axios client with JWT injection and refresh-token retry.
 *
 * Flow on 401:
 *   1. Attempt token refresh via supabase.auth.refreshSession()
 *   2. If successful, retry the original request once with the new token
 *   3. If refresh fails, call clearTokens() then navigate to Auth/Login
 *
 * The navigation is done through `navigationRef` so this module has no React
 * component dependency.
 */

import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'
import { getConfig } from '@/config'
import { supabase, clearTokens } from '@/auth/supabaseClient'
import { navigationRef } from '@/navigation/navigationRef'
import type { APIError, AppError } from '@/types/api'

// ── Client setup ──────────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: getConfig().apiBaseUrl,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor — attach Bearer token ─────────────────────────────────

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// ── Response interceptor — handle 401 with refresh retry ─────────────────────

// Track whether we are already refreshing to prevent parallel retry storms
let _isRefreshing = false
let _pendingRequests: Array<(token: string | null) => void> = []

function processQueue(token: string | null) {
  _pendingRequests.forEach((cb) => cb(token))
  _pendingRequests = []
}

// Extend the config type to track the retry flag
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<APIError>) => {
    const originalConfig = error.config as RetryableConfig | undefined

    if (error.response?.status === 401 && originalConfig && !originalConfig._retry) {
      if (_isRefreshing) {
        // Queue this request until the in-flight refresh completes
        return new Promise((resolve, reject) => {
          _pendingRequests.push((token) => {
            if (!token || !originalConfig) {
              reject(error)
              return
            }
            originalConfig.headers.Authorization = `Bearer ${token}`
            resolve(apiClient(originalConfig))
          })
        })
      }

      originalConfig._retry = true
      _isRefreshing = true

      try {
        const { data: { session }, error: refreshError } =
          await supabase.auth.refreshSession()

        if (refreshError || !session?.access_token) {
          throw refreshError ?? new Error('No session after refresh')
        }

        const newToken = session.access_token
        processQueue(newToken)
        originalConfig.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalConfig)
      } catch {
        processQueue(null)
        await clearTokens()
        if (navigationRef.isReady()) {
          navigationRef.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          })
        }
        return Promise.reject(error)
      } finally {
        _isRefreshing = false
      }
    }

    // Normalise error shape to AppError
    const apiErr = error.response?.data
    const appError: AppError = {
      code:       apiErr?.error?.code       ?? 'UNKNOWN_ERROR',
      message:    apiErr?.error?.message    ?? error.message ?? 'An unexpected error occurred',
      statusCode: apiErr?.error?.statusCode ?? error.response?.status ?? 0,
    }

    return Promise.reject(appError)
  },
)
