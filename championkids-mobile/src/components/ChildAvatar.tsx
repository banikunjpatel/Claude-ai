import React from 'react'
import { View, Text, Image } from 'react-native'

// 8 preset avatar background colors
const AVATAR_COLORS = [
  '#9C51B6', '#FFE66D', '#6C5CE7', '#FD79A8',
  '#00B894', '#E17055', '#74B9FF', '#FDCB6E',
]

function colorForName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

interface Props {
  name:      string
  avatarUrl?: string | null
  size?:     number
}

export default function ChildAvatar({ name, avatarUrl, size = 40 }: Props) {
  const initial = name.charAt(0).toUpperCase()
  const bg      = colorForName(name)

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    )
  }

  return (
    <View
      style={{
        width:           size,
        height:          size,
        borderRadius:    size / 2,
        backgroundColor: bg,
        alignItems:      'center',
        justifyContent:  'center',
      }}
    >
      <Text
        style={{
          color:      '#FFFFFF',
          fontSize:   size * 0.4,
          fontWeight: '700',
        }}
      >
        {initial}
      </Text>
    </View>
  )
}
