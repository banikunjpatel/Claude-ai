/** Progress and streak API calls. */

import apiClient from './client'
import type { APIResponse } from '@/types/api'

// ── Legacy types (used by existing ProgressPage / useProgressSummary) ──────────

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

// ── New types (used by ProfilePage child cards and new progress summary) ───────

export interface SkillBreakdownItem {
  slug: string
  name: string
  count: number
  icon_name: string
  colour_hex: string
}

export interface ProgressSummaryV2 {
  child_id: string
  current_streak_days: number
  longest_streak_days: number
  last_activity_date: string | null
  total_completions: number
  completions_this_week: number
  by_skill: SkillBreakdownItem[]
  skills_explored: number
}

export interface ProgressHistoryItem {
  id: string
  activity_id: string
  activity_title: string
  skill_slug: string
  skill_name: string
  skill_colour: string
  completed_at: string
  parent_reaction: string | null
}

export interface ProgressHistoryMeta {
  limit: number
  next_cursor: string | null
  is_history_limited: boolean
}

export interface ProgressHistoryResponse {
  data: ProgressHistoryItem[]
  meta: ProgressHistoryMeta
}

// ── API functions ──────────────────────────────────────────────────────────────

export const progressApi = {
  // ── Legacy (existing hooks continue to work) ────────────────────────────────
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

  // ── New v2 endpoints ────────────────────────────────────────────────────────
  getProgressSummary: (childId: string) =>
    apiClient
      .get<APIResponse<ProgressSummaryV2>>(`/progress/${childId}/summary`)
      .then((r) => r.data),

  getProgressHistory: (
    childId: string,
    params?: { cursor?: string; limit?: number },
  ) =>
    apiClient
      .get<{ success: boolean } & ProgressHistoryResponse>(
        `/progress/${childId}/history`,
        { params },
      )
      .then((r) => r.data),
}
