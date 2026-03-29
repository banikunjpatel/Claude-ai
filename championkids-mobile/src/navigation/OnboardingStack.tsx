import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { OnboardingStackParamList } from '@/types/navigation'

import SplashScreen        from '@/screens/onboarding/SplashScreen'
import OnboardingScreen1   from '@/screens/onboarding/OnboardingScreen1'
import OnboardingScreen2   from '@/screens/onboarding/OnboardingScreen2'
import OnboardingScreen3   from '@/screens/onboarding/OnboardingScreen3'
import OnboardingScreen4   from '@/screens/onboarding/OnboardingScreen4'
import OnboardingCompleteScreen from '@/screens/onboarding/OnboardingCompleteScreen'

const Stack = createNativeStackNavigator<OnboardingStackParamList>()

export default function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash"             component={SplashScreen} />
      <Stack.Screen name="Onboarding1"        component={OnboardingScreen1} />
      <Stack.Screen name="Onboarding2"        component={OnboardingScreen2} />
      <Stack.Screen name="Onboarding3"        component={OnboardingScreen3} />
      <Stack.Screen name="Onboarding4"        component={OnboardingScreen4} />
      <Stack.Screen name="OnboardingComplete" component={OnboardingCompleteScreen} />
    </Stack.Navigator>
  )
}
