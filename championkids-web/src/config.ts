/** Typed, validated environment configuration.
 *
 * Throws at module load time if any required variable is missing so the app
 * fails loudly in CI rather than silently sending requests to undefined URLs.
 */

function requireEnv(key: string): string {
  const value = import.meta.env[key] as string | undefined
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Copy .env.example to .env.local and set all values before running.`
    )
  }
  return value
}

const config = {
  apiBaseUrl:       requireEnv('VITE_API_BASE_URL'),
  supabaseUrl:      requireEnv('VITE_SUPABASE_URL'),
  supabaseAnonKey:  requireEnv('VITE_SUPABASE_ANON_KEY'),
  /** Optional — Sentry is disabled when this is empty. */
  sentryDsn:        (import.meta.env.VITE_SENTRY_DSN as string | undefined) ?? '',
  environment:      (import.meta.env.VITE_ENVIRONMENT as string | undefined) ?? 'development',
} as const

export type Config = typeof config
export default config
