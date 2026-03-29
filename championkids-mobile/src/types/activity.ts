/** TypeScript types for activities, skill categories, and age bands. */

export type ActivityStatus = 'draft' | 'published' | 'archived'

export interface SkillCategory {
  id: string
  slug: string
  displayName: string
  description: string
  iconName: string
  colourHex: string
  sortOrder: number
  isActive: boolean
}

export interface AgeBand {
  id: string
  label: string
  minAgeYears: number
  maxAgeYears: number
  sortOrder: number
}

export interface Activity {
  id: string
  title: string
  slug: string
  skillCategoryId: string
  skillCategory?: SkillCategory
  ageBandId: string
  ageBand?: AgeBand
  coachingPrompt: string
  followUpQuestions: string[]
  parentTip: string | null
  variation: string | null
  timeEstimateMinutes: number
  status: ActivityStatus
  publishedAt: string | null
  audioUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface DailySelection {
  id: string
  childId: string
  activityId: string
  activity: Activity
  selectedForDate: string
  completed: boolean
  completedAt: string | null
}

export interface ActivityCompletion {
  id: string
  childId: string
  activityId: string
  activity?: Activity
  completedAt: string
  durationSeconds: number | null
  notes: string | null
}

export interface ActivityLibraryFilters {
  skillCategoryId?: string
  ageBandId?: string
  search?: string
  cursor?: string
  limit?: number
}
