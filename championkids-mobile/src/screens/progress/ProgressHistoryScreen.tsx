import React from 'react'
import { View, Text, FlatList, ActivityIndicator, SafeAreaView } from 'react-native'
import type { ProgressHistoryScreenProps } from '@/types/navigation'
import { useCompletionHistory } from '@/hooks/useProgress'
import LoadingState from '@/components/LoadingState'
import ErrorState   from '@/components/ErrorState'
import EmptyState   from '@/components/EmptyState'
import type { ActivityCompletion } from '@/types/activity'

export default function ProgressHistoryScreen({ route }: ProgressHistoryScreenProps) {
  const { childId } = route.params

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCompletionHistory(childId)

  const completions = data?.pages.flatMap((p) => p.items) ?? []

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState onRetry={refetch} />

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FlatList<ActivityCompletion>
        data={completions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <EmptyState
            icon="trophy-outline"
            title="No completions yet"
            description="Complete activities to build your history."
          />
        }
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-base font-semibold text-gray-900 mb-1">
              {item.activity?.title ?? 'Activity'}
            </Text>
            <View className="flex-row items-center gap-3">
              <Text className="text-sm text-gray-500">
                {new Date(item.completedAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </Text>
              {item.durationSeconds && (
                <Text className="text-sm text-gray-400">
                  {Math.round(item.durationSeconds / 60)} min
                </Text>
              )}
            </View>
            {item.notes && (
              <Text className="text-sm text-gray-600 mt-2 italic">"{item.notes}"</Text>
            )}
          </View>
        )}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetchingNextPage
            ? <ActivityIndicator size="small" color="#9C51B6" style={{ marginTop: 16 }} />
            : null
        }
      />
    </SafeAreaView>
  )
}
