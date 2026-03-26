import React from 'react'
import { View, Text, FlatList, Pressable, SafeAreaView } from 'react-native'
import type { TodayScreenProps } from '@/types/navigation'
import { useAppStore } from '@/store/useAppStore'
import { useTodaySelections } from '@/hooks/useActivities'
import { useChildren } from '@/hooks/useChildren'
import { useProgressSummary } from '@/hooks/useProgress'
import { ActivityCardPreview, ActivityCardSkeleton } from '@/components/ActivityCard'
import StreakCounter from '@/components/StreakCounter'
import ChildAvatar   from '@/components/ChildAvatar'
import EmptyState    from '@/components/EmptyState'
import ErrorState    from '@/components/ErrorState'
import type { DailySelection } from '@/types/activity'

export default function TodayScreen({ navigation }: TodayScreenProps) {
  const selectedChildId    = useAppStore((s) => s.selectedChildId)
  const setSelectedChildId = useAppStore((s) => s.setSelectedChildId)

  const { data: children } = useChildren()
  const activeChildId      = selectedChildId ?? children?.[0]?.id ?? null

  const {
    data:       selections,
    isLoading,
    isError,
    refetch,
  } = useTodaySelections(activeChildId)

  const { data: progress } = useProgressSummary(activeChildId)

  const activeChild = children?.find((c) => c.id === activeChildId)

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-5 pt-4 pb-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-gray-500 uppercase tracking-wide">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            <Text className="text-xl font-bold text-gray-900 mt-0.5">
              {activeChild ? `${activeChild.name}'s Activities` : "Today's Activities"}
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            {progress && <StreakCounter streak={progress.streak.currentStreak} />}
            {activeChild && (
              <Pressable onPress={() => {}}>
                <ChildAvatar name={activeChild.name} avatarUrl={activeChild.avatarUrl} size={36} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Child selector */}
        {children && children.length > 1 && (
          <View className="flex-row gap-2 mt-3">
            {children.map((child) => (
              <Pressable
                key={child.id}
                onPress={() => setSelectedChildId(child.id)}
                className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                  child.id === activeChildId
                    ? 'bg-ck-primary-500 border-ck-primary-500'
                    : 'bg-white border-gray-200'
                }`}
              >
                <ChildAvatar name={child.name} avatarUrl={child.avatarUrl} size={20} />
                <Text className={`text-sm font-medium ${child.id === activeChildId ? 'text-white' : 'text-gray-700'}`}>
                  {child.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="px-4 pt-4 gap-3">
          <ActivityCardSkeleton />
          <ActivityCardSkeleton />
          <ActivityCardSkeleton />
        </View>
      ) : isError ? (
        <ErrorState message="Couldn't load today's activities." onRetry={refetch} />
      ) : !selections?.length ? (
        <EmptyState
          icon="today-outline"
          title="No activities today"
          description="Check back tomorrow for a new set of activities."
        />
      ) : (
        <FlatList<DailySelection>
          data={selections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <ActivityCardPreview
              activity={item.activity}
              completed={item.completed}
              onPress={() =>
                navigation.navigate('ActivityDetail', { activityId: item.activityId })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  )
}
