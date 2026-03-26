/** TanStack Query hooks for activities. */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { activitiesApi } from '@/api/activities'
import type { ActivityLibraryFilters } from '@/types/activity'
import { progressKeys } from './useProgress'

export const activityKeys = {
  all:       ['activities'] as const,
  today:     (childId: string) => ['activities', 'today', childId] as const,
  library:   (filters: ActivityLibraryFilters) => ['activities', 'library', filters] as const,
  detail:    (id: string) => ['activities', 'detail', id] as const,
  history:   (childId: string) => ['activities', 'history', childId] as const,
  categories: ['skill-categories'] as const,
  ageBands:   ['age-bands'] as const,
}

export function useTodayActivity(childId: string | null) {
  return useQuery({
    queryKey: activityKeys.today(childId ?? ''),
    queryFn:  () => activitiesApi.getTodayActivity(childId!).then((r) => r.data),
    enabled:  !!childId,
    staleTime: 5 * 60 * 1000,   // 5 minutes — daily selection doesn't change mid-day
  })
}

export function useActivityLibrary(filters: ActivityLibraryFilters = {}) {
  return useInfiniteQuery({
    queryKey: activityKeys.library(filters),
    queryFn:  ({ pageParam }) =>
      activitiesApi.getLibrary({ ...filters, cursor: pageParam as string | undefined })
        .then((r) => r),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor ?? undefined,
  })
}

export function useActivity(activityId: string | null) {
  return useQuery({
    queryKey: activityKeys.detail(activityId ?? ''),
    queryFn:  () => activitiesApi.getActivity(activityId!).then((r) => r.data),
    enabled:  !!activityId,
  })
}

export function useCompleteActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      activityId,
      childId,
      durationSeconds,
    }: {
      activityId: string
      childId: string
      durationSeconds?: number
    }) => activitiesApi.completeActivity(activityId, childId, durationSeconds).then((r) => r.data),
    onSuccess: (_data, { childId }) => {
      // Refresh the today card, completion history, and progress
      qc.invalidateQueries({ queryKey: activityKeys.today(childId) })
      qc.invalidateQueries({ queryKey: activityKeys.history(childId) })
      qc.invalidateQueries({ queryKey: progressKeys.summary(childId) })
      qc.invalidateQueries({ queryKey: progressKeys.streak(childId) })
    },
  })
}

export function useActivityHistory(childId: string | null) {
  return useQuery({
    queryKey: activityKeys.history(childId ?? ''),
    queryFn:  () => activitiesApi.getCompletionHistory(childId!).then((r) => r.data),
    enabled:  !!childId,
  })
}

export function useSkillCategories() {
  return useQuery({
    queryKey: activityKeys.categories,
    queryFn:  () => activitiesApi.getSkillCategories().then((r) => r.data),
    staleTime: Infinity,  // reference data — never changes at runtime
  })
}

export function useAgeBands() {
  return useQuery({
    queryKey: activityKeys.ageBands,
    queryFn:  () => activitiesApi.getAgeBands().then((r) => r.data),
    staleTime: Infinity,
  })
}
