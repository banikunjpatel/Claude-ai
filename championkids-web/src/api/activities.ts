/** Activities API calls. */

import apiClient from './client'
import type { APIResponse, PaginationMeta } from '@/types/api'
import type { Activity, ActivityCompletion, DailySelection, ActivityLibraryFilters } from '@/types/activity'

export interface LibraryPage {
  items: Activity[]
  meta: PaginationMeta
}

export const activitiesApi = {
  getTodayActivity: (childId: string) =>
    apiClient
      .get<APIResponse<DailySelection>>(`/activities/today/${childId}`)
      .then((r) => r.data),

  getLibrary: (filters: ActivityLibraryFilters = {}) =>
    apiClient
      .get<APIResponse<Activity[]>>('/activities', { params: filters })
      .then((r) => r.data),

  getActivity: (activityId: string) =>
    apiClient
      .get<APIResponse<Activity>>(`/activities/${activityId}`)
      .then((r) => r.data),

  completeActivity: (activityId: string, childId: string, durationSeconds?: number) =>
    apiClient
      .post<APIResponse<ActivityCompletion>>(`/activities/${activityId}/complete`, {
        childId,
        durationSeconds,
      })
      .then((r) => r.data),

  getCompletionHistory: (childId: string, limit = 20, cursor?: string) =>
    apiClient
      .get<APIResponse<ActivityCompletion[]>>(`/children/${childId}/completions`, {
        params: { limit, cursor },
      })
      .then((r) => r.data),

  getSkillCategories: () =>
    apiClient.get<APIResponse<Activity[]>>('/skill-categories').then((r) => r.data),

  getAgeBands: () =>
    apiClient.get<APIResponse<Activity[]>>('/age-bands').then((r) => r.data),
}
