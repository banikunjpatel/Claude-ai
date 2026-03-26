import React from 'react'
import { View, Text, Pressable, SafeAreaView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Onboarding3Props } from '@/types/navigation'

export default function OnboardingScreen3({ navigation }: Onboarding3Props) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-8 pb-8 justify-between">
        <View className="flex-1 items-center justify-center gap-6">
          <View className="w-40 h-40 bg-purple-100 rounded-full items-center justify-center">
            <Ionicons name="bar-chart" size={72} color="#6C5CE7" />
          </View>
          <View className="items-center gap-2">
            <Text className="text-2xl font-bold text-gray-900 text-center">
              Watch your champion grow
            </Text>
            <Text className="text-gray-500 text-base text-center leading-relaxed">
              Track streaks, progress across 7 skill areas, and celebrate every milestone together.
            </Text>
          </View>
        </View>

        <View className="flex-row justify-center gap-2 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              className={`w-2 h-2 rounded-full ${i === 2 ? 'bg-ck-primary-500' : 'bg-gray-200'}`}
            />
          ))}
        </View>

        <View className="flex-row gap-3">
          <Pressable
            onPress={() => navigation.goBack()}
            className="flex-1 border border-gray-200 rounded-2xl py-4 items-center"
          >
            <Text className="text-gray-600 font-semibold">Back</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Onboarding4')}
            className="flex-1 bg-ck-primary-500 rounded-2xl py-4 items-center"
          >
            <Text className="text-white font-bold">Next</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}
