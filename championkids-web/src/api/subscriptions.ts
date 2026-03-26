/** Subscription and entitlement API calls. */

import apiClient from './client'
import type { APIResponse } from '@/types/api'
import type { Subscription, Entitlement } from '@/types/subscription'

export interface CheckoutSession {
  checkoutUrl: string
  sessionId: string
}

export interface CustomerPortalSession {
  portalUrl: string
}

export const subscriptionsApi = {
  getEntitlement: () =>
    apiClient.get<APIResponse<Entitlement>>('/subscription/entitlement').then((r) => r.data),

  getSubscription: () =>
    apiClient.get<APIResponse<Subscription>>('/subscription').then((r) => r.data),

  createStripeCheckout: (planType: 'individual' | 'family', successUrl: string, cancelUrl: string) =>
    apiClient
      .post<APIResponse<CheckoutSession>>('/subscription/checkout', {
        planType,
        successUrl,
        cancelUrl,
      })
      .then((r) => r.data),

  getCustomerPortal: (returnUrl: string) =>
    apiClient
      .post<APIResponse<CustomerPortalSession>>('/subscription/portal', { returnUrl })
      .then((r) => r.data),

  cancelSubscription: () =>
    apiClient.post('/subscription/cancel').then((r) => r.data),

  startTrial: (planType: 'individual' | 'family', referralCode?: string) =>
    apiClient
      .post<APIResponse<Subscription>>('/subscription/trial', { planType, referralCode })
      .then((r) => r.data),
}
