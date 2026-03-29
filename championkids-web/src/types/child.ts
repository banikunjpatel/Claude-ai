/** TypeScript types for child profiles. */

import type { AgeBand } from './activity'

export interface Child {
  id: string
  parentId: string
  name: string
  display_name?: string
  dateOfBirth: string
  date_of_birth?: string
  avatarUrl: string | null
  avatar_id?: number
  /** Computed at API layer. Can be null if age is outside supported range. */
  ageBand: AgeBand | null
  skill_focuses?: string[]
  streak?: number
  total_completions?: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateChildInput {
  display_name: string
  date_of_birth: string
  avatar_id: number
  skill_focuses: string[]
}

export interface UpdateChildInput {
  display_name?: string
  date_of_birth?: string
  avatar_id?: number
  skill_focuses?: string[]
}

export interface ChildSkillFocus {
  id: string
  childId: string
  skillCategoryId: string
  priorityOrder: number
}

export interface AgeBandTransition {
  id: string
  childId: string
  fromAgeBandId: string
  toAgeBandId: string
  transitionedOn: string
}
