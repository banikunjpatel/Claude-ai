/** Subscription management page — redirects to Stripe customer portal. */

import { useEffect } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorState from '@/components/ui/ErrorState'
import { useCustomerPortal } from '@/hooks/useSubscription'

export default function ManageSubscriptionPage() {
  const portal = useCustomerPortal()

  useEffect(() => {
    portal.mutate(`${window.location.origin}/app/profile`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (portal.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <ErrorState
          title="Couldn't open billing portal"
          message="Please try again or contact support."
          onRetry={() => portal.mutate(`${window.location.origin}/app/profile`)}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-neutral-500">Opening billing portal…</p>
    </div>
  )
}
