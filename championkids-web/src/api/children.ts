/** Children API calls. */

import apiClient from './client'
import type { APIResponse } from '@/types/api'
import type { Child, CreateChildInput, UpdateChildInput } from '@/types/child'

export const childrenApi = {
  getChildren: () =>
    apiClient.get<APIResponse<Child[]>>('/children').then((r) => r.data),

  getChild: (childId: string) =>
    apiClient.get<APIResponse<Child>>(`/children/${childId}`).then((r) => r.data),

  createChild: (data: CreateChildInput) =>
    apiClient.post<APIResponse<Child>>('/children', data).then((r) => r.data),

  updateChild: (childId: string, data: UpdateChildInput) =>
    apiClient.put<APIResponse<Child>>(`/children/${childId}`, data).then((r) => r.data),

  deleteChild: (childId: string) =>
    apiClient.delete(`/children/${childId}`).then((r) => r.data),
}
