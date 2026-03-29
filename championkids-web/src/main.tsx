import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import * as Sentry from '@sentry/react'

import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import config from './config'
import './index.css'

// ── Sentry ──────────────────────────────────────────────────────────────────

if (config.sentryDsn) {
  Sentry.init({
    dsn:         config.sentryDsn,
    environment: config.environment,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate:    config.environment === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}

// ── TanStack Query client ────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            60 * 1000,   // 1 minute
      retry:                1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

// ── Mount ────────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
      {config.environment !== 'production' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  </React.StrictMode>
)
