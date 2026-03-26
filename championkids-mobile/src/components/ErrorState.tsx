import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface Props {
  message?: string
  onRetry?: () => void
}

export default function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}: Props) {
  return (
    <View className="flex-1 items-center justify-center px-8 gap-4">
      <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
      <Text className="text-gray-700 text-base text-center">{message}</Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          className="bg-ck-primary-500 rounded-xl px-6 py-3"
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </Pressable>
      )}
    </View>
  )
}
