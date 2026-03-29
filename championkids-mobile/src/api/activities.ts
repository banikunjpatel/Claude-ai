import { apiClient } from './client'
import type { APIResponse } from '@/types/api'
import type {
  Activity,
  ActivityCompletion,
  ActivityLibraryFilters,
  DailySelection,
} from '@/types/activity'

export interface LibraryPage {
  items:      Activity[]
  nextCursor: string | null
}

export interface CompleteActivityInput {
  durationSeconds?: number
  notes?:           string
}

// ── Daily selection ───────────────────────────────────────────────────────────

export async function fetchTodaySelections(childId: string): Promise<DailySelection[]> {
  const { data } = await apiClient.get<APIResponse<DailySelection[]>>(
    `/v1/children/${childId}/daily-selections/today`,
  )
  return data.data
}

export async function completeActivity(
  childId: string,
  activityId: string,
  input: CompleteActivityInput = {},
): Promise<ActivityCompletion> {
  const { data } = await apiClient.post<APIResponse<ActivityCompletion>>(
    `/v1/children/${childId}/activities/${activityId}/complete`,
    input,
  )
  return data.data
}

// ── Library ───────────────────────────────────────────────────────────────────

export async function fetchLibrary(
  filters: ActivityLibraryFilters = {},
): Promise<LibraryPage> {
  const { data } = await apiClient.get<
    APIResponse<Activity[]> & { meta: { nextCursor: string | null } }
  >('/v1/activities', { params: filters })

  return {
    items:      data.data,
    nextCursor: data.meta?.nextCursor ?? null,
  }
}

export async function fetchActivity(activityId: string): Promise<Activity> {
  const { data } = await apiClient.get<APIResponse<Activity>>(
    `/v1/activities/${activityId}`,
  )
  return data.data
}
