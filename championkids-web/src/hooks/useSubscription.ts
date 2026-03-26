/** TanStack Query hooks for subscriptions and entitlements. */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { subscriptionsApi } from '@/api/subscriptions'

export const subscriptionKeys = {
  all:         ['subscription'] as const,
  entitlement: ['subscription', 'entitlement'] as const,
  detail:      ['subscription', 'detail'] as const,
}

export function useEntitlement() {
  return useQuery({
    queryKey: subscriptionKeys.entitlement,
    queryFn:  () => subscriptionsApi.getEntitlement().then((r) => r.data),
    staleTime: 60 * 1000,  // 1 minute — entitlement is near-real-time
  })
}

export function useSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.detail,
    queryFn:  () => subscriptionsApi.getSubscription().then((r) => r.data),
  })
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: ({
      planType,
      successUrl,
      cancelUrl,
    }: {
      planType: 'individual' | 'family'
      successUrl: string
      cancelUrl: string
    }) =>
      subscriptionsApi
        .createStripeCheckout(planType, successUrl, cancelUrl)
        .then((r) => r.data),
    onSuccess: ({ checkoutUrl }) => {
      window.location.href = checkoutUrl
    },
  })
}

export function useCustomerPortal() {
  return useMutation({
    mutationFn: (returnUrl: string) =>
      subscriptionsApi.getCustomerPortal(returnUrl).then((r) => r.data),
    onSuccess: ({ portalUrl }) => {
      window.location.href = portalUrl
    },
  })
}

export function useCancelSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => subscriptionsApi.cancelSubscription(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subscriptionKeys.all })
    },
  })
}

export function useStartTrial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      planType,
      referralCode,
    }: {
      planType: 'individual' | 'family'
      referralCode?: string
    }) => subscriptionsApi.startTrial(planType, referralCode).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subscriptionKeys.all })
    },
  })
}
