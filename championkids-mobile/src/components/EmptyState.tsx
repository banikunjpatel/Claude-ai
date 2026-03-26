import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps } from 'react'

interface Props {
  icon?:       ComponentProps<typeof Ionicons>['name']
  title:       string
  description?: string
  actionLabel?: string
  onAction?:   () => void
}

export default function EmptyState({
  icon = 'folder-open-outline',
  title,
  description,
  actionLabel,
  onAction,
}: Props) {
  return (
    <View className="flex-1 items-center justify-center px-8 gap-4">
      <Ionicons name={icon} size={56} color="#D1D5DB" />
      <Text className="text-gray-800 text-lg font-semibold text-center">{title}</Text>
      {description && (
        <Text className="text-gray-500 text-sm text-center">{description}</Text>
      )}
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="bg-ck-primary-500 rounded-xl px-6 py-3 mt-2"
        >
          <Text className="text-white font-semibold">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  )
}
