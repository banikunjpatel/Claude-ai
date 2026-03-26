/** Progress and streak API calls. */

import apiClient from './client'
import type { APIResponse } from '@/types/api'

export interface StreakData {
  childId: string
  currentStreak: number
  longestStreak: number
  lastCompletedDate: string | null
}

export interface SkillProgress {
  skillCategoryId: string
  skillCategoryName: string
  colourHex: string
  completedCount: number
  totalMinutes: number
}

export interface ProgressSummary {
  childId: string
  totalActivities: number
  totalMinutes: number
  streak: StreakData
  skillBreakdown: SkillProgress[]
  weeklyActivity: { date: string; count: number }[]
}

export const progressApi = {
  getSummary: (childId: string) =>
    apiClient
      .get<APIResponse<ProgressSummary>>(`/children/${childId}/progress`)
      .then((r) => r.data),

  getStreak: (childId: string) =>
    apiClient
      .get<APIResponse<StreakData>>(`/children/${childId}/streak`)
      .then((r) => r.data),

  getSkillBreakdown: (childId: string) =>
    apiClient
      .get<APIResponse<SkillProgress[]>>(`/children/${childId}/progress/skills`)
      .then((r) => r.data),
}
