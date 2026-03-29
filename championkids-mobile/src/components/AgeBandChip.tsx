import React from 'react'
import { View, Text } from 'react-native'
import type { AgeBand } from '@/types/activity'

interface Props {
  ageBand: Pick<AgeBand, 'label'>
}

export default function AgeBandChip({ ageBand }: Props) {
  return (
    <View className="bg-gray-100 rounded-full px-2 py-0.5">
      <Text className="text-xs text-gray-600 font-medium">{ageBand.label}</Text>
    </View>
  )
}
