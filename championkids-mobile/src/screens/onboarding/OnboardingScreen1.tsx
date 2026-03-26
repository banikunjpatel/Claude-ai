import React from 'react'
import { View, Text, Pressable, SafeAreaView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Onboarding1Props } from '@/types/navigation'

export default function OnboardingScreen1({ navigation }: Onboarding1Props) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-8 pb-8 justify-between">
        {/* Illustration area */}
        <View className="flex-1 items-center justify-center gap-6">
          <View className="w-40 h-40 bg-ck-primary-100 rounded-full items-center justify-center">
            <Ionicons name="heart" size={72} color="#9C51B6" />
          </View>
          <View className="items-center gap-2">
            <Text className="text-2xl font-bold text-gray-900 text-center">
              Daily activities designed for your child
            </Text>
            <Text className="text-gray-500 text-base text-center leading-relaxed">
              Every day we pick one perfect activity matched to your child's age and development stage.
            </Text>
          </View>
        </View>

        {/* Progress dots */}
        <View className="flex-row justify-center gap-2 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-ck-primary-500' : 'bg-gray-200'}`}
            />
          ))}
        </View>

        <Pressable
          onPress={() => navigation.navigate('Onboarding2')}
          className="bg-ck-primary-500 rounded-2xl py-4 items-center"
        >
          <Text className="text-white font-bold text-base">Next</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
