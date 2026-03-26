/** Root stack: switches between Onboarding, Auth, and App based on auth state.
 *
 * Decision tree:
 *   isAuthLoading → nothing (splash-like blank)
 *   !user && !onboardingComplete → Onboarding stack
 *   !user && onboardingComplete  → Auth stack
 *   user                         → App tabs
 */

import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/types/navigation'
import { navigationRef } from './navigationRef'
import { useAuth } from '@/auth/useAuth'
import { useAppStore } from '@/store/useAppStore'

import OnboardingStack from './OnboardingStack'
import AuthStack       from './AuthStack'
import AppTabs         from './AppTabs'

const Stack = createNativeStackNavigator<RootStackParamList>()

// Deep link configuration
const linking = {
  prefixes: ['championkids://', 'https://championkids.app'],
  config: {
    screens: {
      Auth: {
        screens: {
          ResetPassword: 'reset-password',
        },
      },
      App: {
        screens: {
          ProfileTab: {
            screens: {
              Subscription: 'subscription/success',
            },
          },
        },
      },
    },
  },
}

export default function RootNavigator() {
  const { user, isAuthLoading } = useAuth()
  const onboardingComplete      = useAppStore((s) => s.onboardingComplete)

  if (isAuthLoading) return null

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!user && !onboardingComplete ? (
          <Stack.Screen name="Onboarding" component={OnboardingStack} />
        ) : !user ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <Stack.Screen name="App" component={AppTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
