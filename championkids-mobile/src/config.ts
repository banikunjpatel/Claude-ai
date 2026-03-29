/** Runtime environment variable validation for Expo.
 *
 * All variables are prefixed with EXPO_PUBLIC_ so they are inlined at build time
 * by the Expo bundler and accessible via process.env.
 *
 * Call `getConfig()` once at app startup; it throws immediately if any required
 * variable is missing so misconfigured builds fail fast.
 */

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function optionalEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback
}

export interface AppConfig {
  apiBaseUrl: string
  supabaseUrl: string
  supabaseAnonKey: string
  sentryDsn: string
  appEnv: 'development' | 'staging' | 'production'
}

let _config: AppConfig | null = null

export function getConfig(): AppConfig {
  if (_config) return _config

  const appEnvRaw = optionalEnv('EXPO_PUBLIC_APP_ENV', 'development')
  if (
    appEnvRaw !== 'development' &&
    appEnvRaw !== 'staging' &&
    appEnvRaw !== 'production'
  ) {
    throw new Error(
      `EXPO_PUBLIC_APP_ENV must be 'development', 'staging', or 'production'. Got: ${appEnvRaw}`,
    )
  }

  _config = {
    apiBaseUrl:       requireEnv('EXPO_PUBLIC_API_BASE_URL'),
    supabaseUrl:      requireEnv('EXPO_PUBLIC_SUPABASE_URL'),
    supabaseAnonKey:  requireEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    sentryDsn:        optionalEnv('EXPO_PUBLIC_SENTRY_DSN'),
    appEnv:           appEnvRaw as AppConfig['appEnv'],
  }

  return _config
}

export const isDev  = () => getConfig().appEnv === 'development'
export const isProd = () => getConfig().appEnv === 'production'
