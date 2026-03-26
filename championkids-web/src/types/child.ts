/** TypeScript types for child profiles. */

import type { AgeBand } from './activity'

export interface Child {
  id: string
  parentId: string
  name: string
  dateOfBirth: string       // ISO date string "YYYY-MM-DD"
  avatarUrl: string | null
  ageBand: AgeBand          // computed at API layer — never stored as a fixed field
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateChildInput {
  name: string
  dateOfBirth: string
  avatarUrl?: string
}

export interface UpdateChildInput {
  name?: string
  dateOfBirth?: string
  avatarUrl?: string | null
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
