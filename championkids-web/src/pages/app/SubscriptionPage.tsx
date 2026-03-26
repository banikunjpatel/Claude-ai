/** Subscription / upgrade page — full implementation in Week 11. */

import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useEntitlement, useCreateCheckout, useStartTrial } from '@/hooks/useSubscription'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function SubscriptionPage() {
  const { data: entitlement, isLoading } = useEntitlement()
  const createCheckout = useCreateCheckout()
  const startTrial = useStartTrial()

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  function handleCheckout(planType: 'individual' | 'family') {
    createCheckout.mutate({
      planType,
      successUrl: `${window.location.origin}/app/subscription/success`,
      cancelUrl:  `${window.location.origin}/app/subscription/cancel`,
    })
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-neutral-900">Choose your plan</h1>
        <p className="mt-2 text-neutral-500">
          Start free. Upgrade when you're ready.
        </p>
      </div>

      {entitlement && (
        <div className="mb-6 rounded-xl bg-ck-primary-50 p-4 text-center text-sm text-ck-primary-700">
          Current plan: <strong className="capitalize">{entitlement.planType}</strong>
          {entitlement.isInTrial && entitlement.trialDaysRemaining != null && (
            <> · {entitlement.trialDaysRemaining} trial days remaining</>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Individual plan */}
        <Card padding="lg">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Individual</h2>
              <p className="mt-1 text-sm text-neutral-500">1 child profile</p>
            </div>
            <p className="text-3xl font-bold text-neutral-900">
              £3.99 <span className="text-base font-normal text-neutral-400">/ month</span>
            </p>
            <ul className="flex flex-col gap-2 text-sm text-neutral-600">
              <li>✓ Daily personalised activity</li>
              <li>✓ All 7 skill categories</li>
              <li>✓ Progress tracking</li>
              <li>✓ Streak counter</li>
            </ul>
            <Button
              variant="outline"
              fullWidth
              onClick={() => handleCheckout('individual')}
              isLoading={createCheckout.isPending}
            >
              Get started
            </Button>
          </div>
        </Card>

        {/* Family plan */}
        <Card padding="lg" className="border-ck-primary-500 ring-1 ring-ck-primary-500">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">Family</h2>
                <p className="mt-1 text-sm text-neutral-500">Up to 4 child profiles</p>
              </div>
              <span className="rounded-full bg-ck-primary-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                Most popular
              </span>
            </div>
            <p className="text-3xl font-bold text-neutral-900">
              £7.99 <span className="text-base font-normal text-neutral-400">/ month</span>
            </p>
            <ul className="flex flex-col gap-2 text-sm text-neutral-600">
              <li>✓ Everything in Individual</li>
              <li>✓ Up to 4 children</li>
              <li>✓ Per-child progress tracking</li>
              <li>✓ Family dashboard</li>
            </ul>
            <Button
              variant="primary"
              fullWidth
              onClick={() => handleCheckout('family')}
              isLoading={createCheckout.isPending}
            >
              Get started
            </Button>
          </div>
        </Card>
      </div>

      <p className="mt-6 text-center text-xs text-neutral-400">
        7-day free trial · Cancel anytime · Billing managed securely by Stripe
      </p>
    </div>
  )
}
