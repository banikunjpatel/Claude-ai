import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelSubscription,
  createCheckoutSession,
  createPortalSession,
  fetchEntitlement,
  fetchSubscription,
} from '@/api/subscriptions'

export const subscriptionKeys = {
  entitlement:  ['entitlement']  as const,
  subscription: ['subscription'] as const,
}

export function useEntitlement() {
  return useQuery({
    queryKey:     subscriptionKeys.entitlement,
    queryFn:      fetchEntitlement,
    staleTime:    60_000,   // 1 minute — entitlement changes rarely mid-session
  })
}

export function useSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.subscription,
    queryFn:  fetchSubscription,
  })
}

export function useCheckoutSession() {
  return useMutation({
    mutationFn: (planType: string) => createCheckoutSession(planType),
  })
}

export function usePortalSession() {
  return useMutation({
    mutationFn: createPortalSession,
  })
}

export function useCancelSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: cancelSubscription,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: subscriptionKeys.subscription })
      qc.invalidateQueries({ queryKey: subscriptionKeys.entitlement })
    },
  })
}
