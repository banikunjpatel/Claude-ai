/**
 * ChampionKids — React Native root component.
 *
 * Provider order (outermost → innermost):
 *   GestureHandlerRootView        — required by react-native-gesture-handler
 *   BottomSheetModalProvider      — required by @gorhom/bottom-sheet
 *   QueryClientProvider           — TanStack Query
 *   AuthProvider                  — Supabase auth context
 *   RootNavigator (NavigationContainer inside)
 */

import './global.css'

import React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StyleSheet } from 'react-native'
import * as Sentry from '@sentry/react-native'

import { AuthProvider } from '@/auth/AuthProvider'
import RootNavigator    from '@/navigation/RootNavigator'
import { getConfig }    from '@/config'
import { useAppFonts }  from '@/theme/fonts'

// ── Sentry ────────────────────────────────────────────────────────────────────

const config = getConfig()

if (config.sentryDsn) {
  Sentry.init({
    dsn:         config.sentryDsn,
    environment: config.appEnv,
    tracesSampleRate: config.appEnv === 'production' ? 0.2 : 1.0,
  })
}

// ── TanStack Query ────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,           // 30 seconds
      retry:     (failCount, err: any) => {
        // Don't retry auth errors
        if (err?.statusCode === 401 || err?.statusCode === 403) return false
        return failCount < 2
      },
    },
  },
})

// ── Root component ────────────────────────────────────────────────────────────

function App() {
  const [fontsLoaded] = useAppFonts()
  if (!fontsLoaded) return null

  return (
    <GestureHandlerRootView style={styles.root}>
      <BottomSheetModalProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </QueryClientProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
})

export default Sentry.wrap(App)
