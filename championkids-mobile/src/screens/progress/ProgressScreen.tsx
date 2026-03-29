import React from 'react'
import { View, Text, ScrollView, SafeAreaView, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { ProgressScreenProps } from '@/types/navigation'
import { useAppStore } from '@/store/useAppStore'
import { useProgressSummary } from '@/hooks/useProgress'
import { useChildren } from '@/hooks/useChildren'
import StreakCounter from '@/components/StreakCounter'
import LoadingState  from '@/components/LoadingState'
import ErrorState    from '@/components/ErrorState'

export default function ProgressScreen({ navigation }: ProgressScreenProps) {
  const selectedChildId = useAppStore((s) => s.selectedChildId)
  const { data: children } = useChildren()
  const activeChildId = selectedChildId ?? children?.[0]?.id ?? null

  const { data: progress, isLoading, isError, refetch } = useProgressSummary(activeChildId)
  const activeChild = children?.find((c) => c.id === activeChildId)

  if (isLoading) return <LoadingState />
  if (isError || !progress) return <ErrorState onRetry={refetch} />

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {/* Child header */}
        {activeChild && (
          <Text className="text-xl font-bold text-gray-900 mb-4">{activeChild.name}'s Progress</Text>
        )}

        {/* Streak banner */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-gray-500">Current streak</Text>
            <Text className="text-3xl font-bold text-gray-900">
              {progress.streak.currentStreak} <Text className="text-base font-normal text-gray-500">days</Text>
            </Text>
          </View>
          <StreakCounter streak={progress.streak.currentStreak} size="lg" />
        </View>

        {/* Stats row */}
        <View className="flex-row gap-3 mb-4">
          {[
            { label: 'This week',  value: progress.thisWeek },
            { label: 'This month', value: progress.thisMonth },
            { label: 'Total',      value: progress.totalCompletions },
          ].map((stat) => (
            <View key={stat.label} className="flex-1 bg-white rounded-2xl p-4 shadow-sm items-center">
              <Text className="text-2xl font-bold text-ck-primary-600">{stat.value}</Text>
              <Text className="text-xs text-gray-500 mt-1">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Skill breakdown */}
        {progress.skillBreakdown.length > 0 && (
          <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">Skill areas</Text>
            {progress.skillBreakdown.map((skill) => (
              <View key={skill.skillCategoryId} className="flex-row items-center justify-between mb-2">
                <Text className="text-sm text-gray-700 flex-1">{skill.displayName}</Text>
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-2 bg-ck-primary-200 rounded-full"
                    style={{
                      width: Math.max(
                        8,
                        (skill.count / Math.max(...progress.skillBreakdown.map((s) => s.count))) * 80,
                      ),
                    }}
                  />
                  <Text className="text-sm font-semibold text-gray-900 w-6 text-right">
                    {skill.count}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* History link */}
        {activeChildId && (
          <Pressable
            onPress={() => navigation.navigate('ProgressHistory', { childId: activeChildId })}
            className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="list-outline" size={20} color="#9C51B6" />
              <Text className="text-base font-medium text-gray-900">View full history</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
