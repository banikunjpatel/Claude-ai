import React, { useState } from 'react'
import {
  View, Text, FlatList, TextInput, Pressable, SafeAreaView, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { LibraryScreenProps } from '@/types/navigation'
import { useLibrary } from '@/hooks/useActivities'
import { ActivityCardPreview, ActivityCardSkeleton } from '@/components/ActivityCard'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import type { Activity } from '@/types/activity'

export default function LibraryScreen({ navigation: _ }: LibraryScreenProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Simple debounce
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>()
  function handleSearchChange(text: string) {
    setSearch(text)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(text), 400)
  }

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useLibrary({ search: debouncedSearch || undefined })

  const activities = data?.pages.flatMap((p) => p.items) ?? []

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Search bar */}
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2 gap-2">
          <Ionicons name="search-outline" size={18} color="#6B7280" />
          <TextInput
            className="flex-1 text-gray-900 text-sm"
            placeholder="Search activities…"
            value={search}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => { setSearch(''); setDebouncedSearch('') }}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {isLoading ? (
        <View className="px-4 pt-4 gap-3">
          {[1, 2, 3, 4].map((k) => <ActivityCardSkeleton key={k} />)}
        </View>
      ) : isError ? (
        <ErrorState message="Couldn't load the library." onRetry={refetch} />
      ) : activities.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No activities found"
          description={debouncedSearch ? `No results for "${debouncedSearch}"` : 'The library is empty.'}
        />
      ) : (
        <FlatList<Activity>
          data={activities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <ActivityCardPreview
              activity={item}
              onPress={() => {}}   // Library view — no navigation to detail in this spec
            />
          )}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage
              ? <ActivityIndicator size="small" color="#9C51B6" style={{ marginTop: 16 }} />
              : null
          }
        />
      )}
    </SafeAreaView>
  )
}
