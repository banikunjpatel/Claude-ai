/** TypeScript types for child profiles. */

import type { AgeBand } from './activity'

export interface Child {
  id: string
  parentId: string
  name: string
  dateOfBirth: string
  avatarUrl: string | null
  ageBand: AgeBand
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
