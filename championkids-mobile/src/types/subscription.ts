/** TypeScript types for subscriptions and entitlements. */

export type SubscriptionStatus = 'trial' | 'active' | 'grace' | 'expired' | 'cancelled'
export type SubscriptionPlatform = 'stripe' | 'apple' | 'google'
export type PlanType = 'free' | 'individual' | 'family'

export interface Subscription {
  id: string
  userId: string
  platform: SubscriptionPlatform
  planType: PlanType
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  trialEnd: string | null
  cancelAtPeriodEnd: boolean
  createdAt: string
}

export interface Entitlement {
  userId: string
  planType: PlanType
  status: SubscriptionStatus
  maxChildren: number
  hasFullAccess: boolean
  isInTrial: boolean
  trialDaysRemaining: number | null
  currentPeriodEnd: string | null
}
