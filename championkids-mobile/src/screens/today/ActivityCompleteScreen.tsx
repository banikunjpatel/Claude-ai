/** Celebration screen shown after an activity is marked complete. */

import React, { useEffect } from 'react'
import { View, Text, Pressable, SafeAreaView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { ActivityCompleteScreenProps } from '@/types/navigation'

export default function ActivityCompleteScreen({ navigation }: ActivityCompleteScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6 gap-6">
        <View className="w-28 h-28 bg-green-100 rounded-full items-center justify-center">
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
        </View>

        <View className="items-center gap-2">
          <Text className="text-3xl font-bold text-gray-900 text-center">
            Champion work! 🏆
          </Text>
          <Text className="text-gray-500 text-base text-center">
            Activity completed. Keep the streak going!
          </Text>
        </View>

        <View className="w-full gap-3 mt-4">
          <Pressable
            onPress={() => navigation.popToTop()}
            className="bg-ck-primary-500 rounded-2xl py-4 items-center"
          >
            <Text className="text-white font-bold text-base">Back to Today</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}
