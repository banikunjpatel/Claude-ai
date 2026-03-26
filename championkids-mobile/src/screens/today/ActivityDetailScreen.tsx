import React from 'react'
import { View } from 'react-native'
import type { ActivityDetailScreenProps } from '@/types/navigation'
import { useAppStore } from '@/store/useAppStore'
import { useTodaySelections } from '@/hooks/useActivities'
import { useCompleteActivity } from '@/hooks/useActivities'
import { ActivityCardDetail, ActivityCardSkeleton } from '@/components/ActivityCard'
import LoadingState from '@/components/LoadingState'
import ErrorState   from '@/components/ErrorState'

export default function ActivityDetailScreen({ route, navigation }: ActivityDetailScreenProps) {
  const { activityId } = route.params

  const selectedChildId = useAppStore((s) => s.selectedChildId)
  const childId         = selectedChildId ?? ''

  const { data: selections, isLoading, isError } = useTodaySelections(childId || null)
  const completeActivity = useCompleteActivity(childId)

  const selection = selections?.find((s) => s.activityId === activityId)

  if (isLoading) return <LoadingState />
  if (isError || !selection) return <ErrorState message="Activity not found." onRetry={() => navigation.goBack()} />

  async function handleComplete() {
    if (!selection) return
    try {
      await completeActivity.mutateAsync({ activityId: selection.activityId })
      navigation.navigate('ActivityComplete', {
        activityId: selection.activityId,
        childId,
      })
    } catch {
      // error handled by mutation
    }
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ActivityCardDetail
        selection={selection}
        onComplete={handleComplete}
        isCompleting={completeActivity.isPending}
      />
    </View>
  )
}
