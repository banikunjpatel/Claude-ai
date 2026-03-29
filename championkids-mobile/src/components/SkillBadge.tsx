import React from 'react'
import { View, Text } from 'react-native'
import type { SkillCategory } from '@/types/activity'
import { Skill, Radius, Fonts } from '@/theme'
import type { SkillSlug } from '@/theme'

interface Props {
  skillCategory: Pick<SkillCategory, 'displayName' | 'colourHex'> & { slug?: string }
  size?: 'sm' | 'md'
}

export default function SkillBadge({ skillCategory, size = 'md' }: Props) {
  const skillStyle = Skill[skillCategory.slug as SkillSlug] ?? { bg: '#F2E5F7', text: '#612E75', color: '#9C51B6' }

  return (
    <View
      style={{ backgroundColor: skillStyle.bg, borderColor: skillStyle.color, borderWidth: 1 }}
      className={`rounded-full px-2 ${size === 'sm' ? 'py-0.5' : 'py-1'}`}
    >
      <Text
        style={{ color: skillStyle.text }}
        className={`font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
      >
        {skillCategory.displayName}
      </Text>
    </View>
  )
}
