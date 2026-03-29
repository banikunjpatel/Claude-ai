import { apiClient } from './client'
import type { APIResponse } from '@/types/api'
import type { Entitlement, Subscription } from '@/types/subscription'

export interface CheckoutSessionResponse {
  checkoutUrl: string
}

export interface PortalSessionResponse {
  portalUrl: string
}

export async function fetchEntitlement(): Promise<Entitlement> {
  const { data } = await apiClient.get<APIResponse<Entitlement>>('/v1/subscriptions/entitlement')
  return data.data
}

export async function fetchSubscription(): Promise<Subscription | null> {
  const { data } = await apiClient.get<APIResponse<Subscription | null>>(
    '/v1/subscriptions/current',
  )
  return data.data
}

export async function createCheckoutSession(planType: string): Promise<string> {
  const { data } = await apiClient.post<APIResponse<CheckoutSessionResponse>>(
    '/v1/subscriptions/checkout',
    { planType },
  )
  return data.data.checkoutUrl
}

export async function createPortalSession(): Promise<string> {
  const { data } = await apiClient.post<APIResponse<PortalSessionResponse>>(
    '/v1/subscriptions/portal',
  )
  return data.data.portalUrl
}

export async function cancelSubscription(): Promise<Subscription> {
  const { data } = await apiClient.post<APIResponse<Subscription>>(
    '/v1/subscriptions/cancel',
  )
  return data.data
}
