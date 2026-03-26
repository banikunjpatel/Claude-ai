/** Bridge screen shown briefly after onboarding — navigates to Auth/SignUp. */

import React, { useEffect } from 'react'
import { View, Text } from 'react-native'
import type { OnboardingCompleteProps } from '@/types/navigation'
import { useAppStore } from '@/store/useAppStore'

export default function OnboardingCompleteScreen({ navigation }: OnboardingCompleteProps) {
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete)

  useEffect(() => {
    setOnboardingComplete(true)
    // RootNavigator will swap to Auth stack automatically once onboardingComplete=true
    // But navigate explicitly as a fallback in case stack hasn't re-rendered yet
    const timer = setTimeout(() => {
      // The RootNavigator will handle switching to Auth stack
    }, 100)
    return () => clearTimeout(timer)
  }, [setOnboardingComplete])

  return (
    <View className="flex-1 bg-ck-primary-500 items-center justify-center gap-4">
      <Text className="text-6xl">🎉</Text>
      <Text className="text-2xl font-bold text-white">You're all set!</Text>
      <Text className="text-ck-primary-100 text-base text-center px-8">
        Create your account to start your champion journey.
      </Text>
    </View>
  )
}
