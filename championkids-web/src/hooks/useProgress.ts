/** TanStack Query hooks for progress and streaks. */

import { useQuery } from '@tanstack/react-query'
import { progressApi } from '@/api/progress'

export const progressKeys = {
  all:     ['progress'] as const,
  summary: (childId: string) => ['progress', 'summary', childId] as const,
  streak:  (childId: string) => ['progress', 'streak', childId] as const,
  skills:  (childId: string) => ['progress', 'skills', childId] as const,
}

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
