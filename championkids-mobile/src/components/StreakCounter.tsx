import React from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface Props {
  streak: number
  size?:  'sm' | 'md' | 'lg'
}

const SIZE_MAP = {
  sm: { icon: 14, text: 'text-sm', container: 'px-2 py-0.5' },
  md: { icon: 18, text: 'text-base', container: 'px-3 py-1' },
  lg: { icon: 24, text: 'text-xl font-bold', container: 'px-4 py-2' },
}

export default function StreakCounter({ streak, size = 'md' }: Props) {
  const s = SIZE_MAP[size]
  const color = streak > 0 ? '#F59E0B' : '#9CA3AF'

  return (
    <View className={`flex-row items-center gap-1 bg-amber-50 rounded-full ${s.container}`}>
      <Ionicons name="flame" size={s.icon} color={color} />
      <Text className={`${s.text} text-amber-600 font-semibold`}>{streak}</Text>
    </View>
  )
}
