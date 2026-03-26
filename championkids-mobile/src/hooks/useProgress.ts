import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { fetchCompletionHistory, fetchProgressSummary } from '@/api/progress'

export const progressKeys = {
  summary: (childId: string) => ['progress', childId, 'summary'] as const,
  history: (childId: string) => ['progress', childId, 'history'] as const,
}

export function useProgressSummary(childId: string | null) {
  return useQuery({
    queryKey: progressKeys.summary(childId ?? ''),
    queryFn:  () => fetchProgressSummary(childId!),
    enabled:  !!childId,
  })
}

export function useCompletionHistory(childId: string | null) {
  return useInfiniteQuery({
    queryKey:         progressKeys.history(childId ?? ''),
    queryFn:          ({ pageParam }) =>
      fetchCompletionHistory(childId!, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled:          !!childId,
  })
}
