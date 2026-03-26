/** Three render variants:
 *  - skeleton: loading placeholder with animated pulse
 *  - preview:  compact card for list views
 *  - detail:   full card with coaching prompt and actions
 */

import React from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import type { Activity, DailySelection } from '@/types/activity'
import SkillBadge   from './SkillBadge'
import AgeBandChip  from './AgeBandChip'

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function ActivityCardSkeleton() {
  const opacity = useSharedValue(1)
  React.useEffect(() => {
    opacity.value = withRepeat(withTiming(0.4, { duration: 800 }), -1, true)
  }, [opacity])
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View style={animStyle} className="bg-white rounded-2xl p-4 shadow-sm">
      <View className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
      <View className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
      <View className="h-3 bg-gray-200 rounded w-5/6 mb-2" />
      <View className="h-3 bg-gray-200 rounded w-2/3" />
    </Animated.View>
  )
}

// ── Preview card ──────────────────────────────────────────────────────────────

interface PreviewProps {
  activity:   Activity
  completed?: boolean
  onPress:    () => void
}

export function ActivityCardPreview({ activity, completed, onPress }: PreviewProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`bg-white rounded-2xl p-4 shadow-sm ${completed ? 'opacity-60' : ''}`}
    >
      <View className="flex-row items-start justify-between mb-2">
        <Text className="text-base font-semibold text-gray-900 flex-1 mr-2" numberOfLines={2}>
          {activity.title}
        </Text>
        {completed && (
          <View className="bg-green-100 rounded-full p-1">
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          </View>
        )}
      </View>

      <View className="flex-row items-center gap-2 flex-wrap">
        {activity.skillCategory && (
          <SkillBadge skillCategory={activity.skillCategory} size="sm" />
        )}
        {activity.ageBand && (
          <AgeBandChip ageBand={activity.ageBand} />
        )}
        <View className="flex-row items-center gap-1">
          <Ionicons name="time-outline" size={12} color="#6B7280" />
          <Text className="text-xs text-gray-500">{activity.timeEstimateMinutes} min</Text>
        </View>
      </View>
    </Pressable>
  )
}

// ── Detail card ───────────────────────────────────────────────────────────────

interface DetailProps {
  selection:   DailySelection
  onComplete:  () => void
  isCompleting?: boolean
}

export function ActivityCardDetail({ selection, onComplete, isCompleting }: DetailProps) {
  const { activity, completed } = selection

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="bg-white rounded-2xl p-5 shadow-sm mx-4 my-2">
        {/* Header */}
        <View className="flex-row items-center gap-2 mb-3 flex-wrap">
          {activity.skillCategory && (
            <SkillBadge skillCategory={activity.skillCategory} />
          )}
          {activity.ageBand && (
            <AgeBandChip ageBand={activity.ageBand} />
          )}
          <View className="flex-row items-center gap-1 ml-auto">
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text className="text-sm text-gray-500">{activity.timeEstimateMinutes} min</Text>
          </View>
        </View>

        <Text className="text-xl font-bold text-gray-900 mb-4">{activity.title}</Text>

        {/* Coaching prompt */}
        <View className="bg-ck-primary-50 rounded-xl p-4 mb-4">
          <Text className="text-xs font-semibold text-ck-primary-700 uppercase tracking-wide mb-2">
            Coaching Prompt
          </Text>
          <Text className="text-base text-gray-800 leading-relaxed">
            {activity.coachingPrompt}
          </Text>
        </View>

        {/* Follow-up questions */}
        {activity.followUpQuestions.length > 0 && (
          <View className="mb-4">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Follow-up Questions
            </Text>
            {activity.followUpQuestions.map((q, i) => (
              <View key={i} className="flex-row items-start gap-2 mb-1">
                <Text className="text-ck-primary-500 font-bold">•</Text>
                <Text className="text-sm text-gray-700 flex-1">{q}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Parent tip */}
        {activity.parentTip && (
          <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
            <Text className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-1">
              Parent Tip
            </Text>
            <Text className="text-sm text-gray-700">{activity.parentTip}</Text>
          </View>
        )}

        {/* Complete button */}
        {!completed && (
          <Pressable
            onPress={onComplete}
            disabled={isCompleting}
            className={`bg-ck-primary-500 rounded-2xl py-4 items-center mt-2 ${isCompleting ? 'opacity-60' : ''}`}
          >
            <Text className="text-white font-bold text-base">
              {isCompleting ? 'Completing…' : 'Mark as Complete'}
            </Text>
          </Pressable>
        )}

        {completed && (
          <View className="flex-row items-center justify-center gap-2 py-3">
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text className="text-green-600 font-semibold">Completed!</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
