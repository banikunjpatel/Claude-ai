/** Auto-navigates to Onboarding1 after 2 seconds. */

import React, { useEffect } from 'react'
import { View, Text, Image } from 'react-native'
import type { SplashScreenProps } from '@/types/navigation'

export default function SplashScreen({ navigation }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Onboarding1')
    }, 2000)
    return () => clearTimeout(timer)
  }, [navigation])

  return (
    <View className="flex-1 bg-ck-primary-500 items-center justify-center">
      <View className="items-center gap-4">
        <View className="w-24 h-24 bg-white rounded-3xl items-center justify-center shadow-lg">
          <Text className="text-5xl">🏆</Text>
        </View>
        <Text className="text-4xl font-bold text-white tracking-tight">ChampionKids</Text>
        <Text className="text-ck-primary-100 text-base">Raising champions, 5 min at a time</Text>
      </View>
    </View>
  )
}
