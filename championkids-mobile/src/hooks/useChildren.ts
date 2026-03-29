import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createChild,
  deleteChild,
  fetchChild,
  fetchChildren,
  updateChild,
} from '@/api/children'
import type { CreateChildInput, UpdateChildInput } from '@/types/child'

export const childrenKeys = {
  all:    ['children']                    as const,
  detail: (id: string) => ['children', id] as const,
}

export function useChildren() {
  return useQuery({
    queryKey: childrenKeys.all,
    queryFn:  fetchChildren,
  })
}

export function useChild(childId: string) {
  return useQuery({
    queryKey: childrenKeys.detail(childId),
    queryFn:  () => fetchChild(childId),
    enabled:  !!childId,
  })
}

export function useCreateChild() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn:  (input: CreateChildInput) => createChild(input),
    onSuccess:   () => qc.invalidateQueries({ queryKey: childrenKeys.all }),
  })
}

export function useUpdateChild(childId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn:  (input: UpdateChildInput) => updateChild(childId, input),
    onSuccess:   () => {
      qc.invalidateQueries({ queryKey: childrenKeys.all })
      qc.invalidateQueries({ queryKey: childrenKeys.detail(childId) })
    },
  })
}

export function useDeleteChild() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn:  (childId: string) => deleteChild(childId),
    onSuccess:   () => qc.invalidateQueries({ queryKey: childrenKeys.all }),
  })
}
