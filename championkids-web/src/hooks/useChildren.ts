/** TanStack Query hooks for child-profile data. */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { childrenApi } from '@/api/children'
import type { CreateChildInput, UpdateChildInput } from '@/types/child'

export const childrenKeys = {
  all:    ['children'] as const,
  lists:  () => [...childrenKeys.all, 'list'] as const,
  detail: (id: string) => [...childrenKeys.all, 'detail', id] as const,
}

export function useChildren() {
  return useQuery({
    queryKey: childrenKeys.lists(),
    queryFn:  () => childrenApi.getChildren().then((r) => r.data),
  })
}

export function useChild(childId: string | null) {
  return useQuery({
    queryKey: childrenKeys.detail(childId ?? ''),
    queryFn:  () => childrenApi.getChild(childId!).then((r) => r.data),
    enabled:  !!childId,
  })
}

export function useCreateChild() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateChildInput) => childrenApi.createChild(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: childrenKeys.lists() }),
  })
}

export function useUpdateChild(childId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateChildInput) =>
      childrenApi.updateChild(childId, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: childrenKeys.lists() })
      qc.invalidateQueries({ queryKey: childrenKeys.detail(childId) })
    },
  })
}

export function useDeleteChild() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (childId: string) => childrenApi.deleteChild(childId),
    onSuccess: () => qc.invalidateQueries({ queryKey: childrenKeys.lists() }),
  })
}
