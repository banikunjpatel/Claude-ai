import { apiClient } from './client'
import type { APIResponse } from '@/types/api'
import type { ActivityCompletion } from '@/types/activity'

export interface StreakData {
  currentStreak:    number
  longestStreak:    number
  lastCompletedAt:  string | null
}

export interface ProgressSummary {
  totalCompletions:   number
  thisWeek:           number
  thisMonth:          number
  streak:             StreakData
  skillBreakdown:     Array<{ skillCategoryId: string; displayName: string; count: number }>
}

export async function fetchProgressSummary(childId: string): Promise<ProgressSummary> {
  const { data } = await apiClient.get<APIResponse<ProgressSummary>>(
    `/v1/children/${childId}/progress`,
  )
  return data.data
}

export async function fetchCompletionHistory(
  childId: string,
  cursor?: string,
  limit = 20,
): Promise<{ items: ActivityCompletion[]; nextCursor: string | null }> {
  const { data } = await apiClient.get<
    APIResponse<ActivityCompletion[]> & { meta: { nextCursor: string | null } }
  >(`/v1/children/${childId}/completions`, {
    params: { cursor, limit },
  })
  return {
    items:      data.data,
    nextCursor: data.meta?.nextCursor ?? null,
  }
}
