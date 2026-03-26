import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  completeActivity,
  fetchActivity,
  fetchLibrary,
  fetchTodaySelections,
  type CompleteActivityInput,
} from '@/api/activities'
import type { ActivityLibraryFilters } from '@/types/activity'

export const activityKeys = {
  today:   (childId: string)                        => ['today', childId]          as const,
  library: (filters: ActivityLibraryFilters)        => ['library', filters]        as const,
  detail:  (activityId: string)                     => ['activity', activityId]    as const,
}

export function useTodaySelections(childId: string | null) {
  return useQuery({
    queryKey: activityKeys.today(childId ?? ''),
    queryFn:  () => fetchTodaySelections(childId!),
    enabled:  !!childId,
  })
}

export function useLibrary(filters: ActivityLibraryFilters = {}) {
  return useInfiniteQuery({
    queryKey:     activityKeys.library(filters),
    queryFn:      ({ pageParam }) => fetchLibrary({ ...filters, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })
}

export function useActivity(activityId: string) {
  return useQuery({
    queryKey: activityKeys.detail(activityId),
    queryFn:  () => fetchActivity(activityId),
    enabled:  !!activityId,
  })
}

export function useCompleteActivity(childId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn:  ({ activityId, input }: { activityId: string; input?: CompleteActivityInput }) =>
      completeActivity(childId, activityId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: activityKeys.today(childId) })
      qc.invalidateQueries({ queryKey: ['progress', childId] })
    },
  })
}
