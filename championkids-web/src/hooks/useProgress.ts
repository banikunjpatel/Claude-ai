/** TanStack Query hooks for progress and streaks. */

import { useQuery, useQueries } from '@tanstack/react-query'
import { progressApi } from '@/api/progress'
import type { ProgressSummaryV2 } from '@/api/progress'

export const progressKeys = {
  all:     ['progress'] as const,
  summary: (childId: string) => ['progress', 'summary', childId] as const,
  summaryV2: (childId: string) => ['progress', 'summaryV2', childId] as const,
  streak:  (childId: string) => ['progress', 'streak', childId] as const,
  skills:  (childId: string) => ['progress', 'skills', childId] as const,
  history: (childId: string) => ['progress', 'history', childId] as const,
}

// ── Legacy hooks (used by ProgressPage and ActivityCard) ──────────────────────

export function useProgressSummary(childId: string | null) {
  return useQuery({
    queryKey: progressKeys.summary(childId ?? ''),
    queryFn:  () => progressApi.getSummary(childId!).then((r) => r.data),
    enabled:  !!childId,
  })
}

export function useStreak(childId: string | null) {
  return useQuery({
    queryKey: progressKeys.streak(childId ?? ''),
    queryFn:  () => progressApi.getStreak(childId!).then((r) => r.data),
    enabled:  !!childId,
  })
}

export function useSkillBreakdown(childId: string | null) {
  return useQuery({
    queryKey: progressKeys.skills(childId ?? ''),
    queryFn:  () => progressApi.getSkillBreakdown(childId!).then((r) => r.data),
    enabled:  !!childId,
  })
}

// ── New v2 hooks ──────────────────────────────────────────────────────────────

export function useProgressSummaryV2(childId: string | null) {
  return useQuery({
    queryKey: progressKeys.summaryV2(childId ?? ''),
    queryFn:  () => progressApi.getProgressSummary(childId!).then((r) => r.data),
    enabled:  !!childId,
    staleTime: 60 * 1000,   // 1 minute
  })
}

export function useProgressHistory(childId: string | null) {
  return useQuery({
    queryKey: progressKeys.history(childId ?? ''),
    queryFn:  () => progressApi.getProgressHistory(childId!),
    enabled:  !!childId,
  })
}

/**
 * Fetch progress summaries for multiple children in parallel.
 *
 * Uses TanStack Query's `useQueries` to run all fetches concurrently
 * — do NOT call individual `useProgressSummaryV2` hooks inside a `.map()`
 * as that violates the Rules of Hooks.
 *
 * Returns an array of query results in the same order as `childIds`.
 * Access data as: `results[i].data` → `ProgressSummaryV2 | undefined`
 *
 * Example:
 *   const childIds = children.map(c => c.id)
 *   const results  = useChildrenProgress(childIds)
 *   const progressMap = Object.fromEntries(
 *     childIds.map((id, i) => [id, results[i].data])
 *   )
 */
export function useChildrenProgress(childIds: string[]) {
  return useQueries({
    queries: childIds.map((id) => ({
      queryKey: progressKeys.summaryV2(id),
      queryFn:  (): Promise<ProgressSummaryV2> =>
        progressApi.getProgressSummary(id).then((r) => r.data),
      enabled: childIds.length > 0,
      staleTime: 60 * 1000,
    })),
  })
}
