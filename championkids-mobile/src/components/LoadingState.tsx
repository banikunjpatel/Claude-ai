import React from 'react'
import { View, ActivityIndicator, Text } from 'react-native'

interface Props {
  message?: string
}

export default function LoadingState({ message }: Props) {
  return (
    <View className="flex-1 items-center justify-center gap-3">
      <ActivityIndicator size="large" color="#9C51B6" />
      {message && <Text className="text-gray-500 text-sm">{message}</Text>}
    </View>
  )
}
