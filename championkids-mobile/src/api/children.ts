import { apiClient } from './client'
import type { APIResponse } from '@/types/api'
import type { Child, CreateChildInput, UpdateChildInput } from '@/types/child'

export async function fetchChildren(): Promise<Child[]> {
  const { data } = await apiClient.get<APIResponse<Child[]>>('/v1/children')
  return data.data
}

export async function fetchChild(childId: string): Promise<Child> {
  const { data } = await apiClient.get<APIResponse<Child>>(`/v1/children/${childId}`)
  return data.data
}

export async function createChild(input: CreateChildInput): Promise<Child> {
  const { data } = await apiClient.post<APIResponse<Child>>('/v1/children', input)
  return data.data
}

export async function updateChild(childId: string, input: UpdateChildInput): Promise<Child> {
  const { data } = await apiClient.patch<APIResponse<Child>>(`/v1/children/${childId}`, input)
  return data.data
}

export async function deleteChild(childId: string): Promise<void> {
  await apiClient.delete(`/v1/children/${childId}`)
}
