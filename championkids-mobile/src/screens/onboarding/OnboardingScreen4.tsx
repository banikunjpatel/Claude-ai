/** Final onboarding slide — CTA to sign up or log in. */

import React from 'react'
import { View, Text, Pressable, SafeAreaView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Onboarding4Props } from '@/types/navigation'
import { useAppStore } from '@/store/useAppStore'

export default function OnboardingScreen4({ navigation }: Onboarding4Props) {
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete)

  function handleGetStarted() {
    setOnboardingComplete(true)
    navigation.navigate('OnboardingComplete')
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-8 pb-8 justify-between">
        <View className="flex-1 items-center justify-center gap-6">
          <View className="w-40 h-40 bg-pink-100 rounded-full items-center justify-center">
            <Ionicons name="trophy" size={72} color="#FD79A8" />
          </View>
          <View className="items-center gap-2">
            <Text className="text-2xl font-bold text-gray-900 text-center">
              Ready to raise a champion?
            </Text>
            <Text className="text-gray-500 text-base text-center leading-relaxed">
              Join thousands of families already building stronger, happier kids — one activity at a time.
            </Text>
          </View>
        </View>

        <View className="flex-row justify-center gap-2 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              className={`w-2 h-2 rounded-full ${i === 3 ? 'bg-ck-primary-500' : 'bg-gray-200'}`}
            />
          ))}
        </View>

        <View className="gap-3">
          <Pressable
            onPress={handleGetStarted}
            className="bg-ck-primary-500 rounded-2xl py-4 items-center"
          >
            <Text className="text-white font-bold text-base">Get Started</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.goBack()}
            className="py-3 items-center"
          >
            <Text className="text-gray-500">Back</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}
