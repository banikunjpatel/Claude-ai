/** Subscription / upgrade page. */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import {
  useEntitlement,
  useSubscription,
  useCreateCheckout,
  useStartTrial,
} from '@/hooks/useSubscription'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { AppError } from '@/types/api'

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function SubscriptionPage() {
  const navigate = useNavigate()
  const { data: entitlement, isLoading: entLoading, refetch: refetchEnt } = useEntitlement()
  const { data: subscription, isLoading: subLoading } = useSubscription()
  const createCheckout = useCreateCheckout()
  const startTrial     = useStartTrial()

  const [checkoutError, setCheckoutError] = useState('')
  const [trialError,    setTrialError]    = useState('')

  const isLoading = entLoading || subLoading

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const status        = entitlement?.status
  const isInTrial     = entitlement?.isInTrial ?? false
  const daysRemaining = entitlement?.trialDaysRemaining ?? null
  const planType      = entitlement?.planType ?? 'free'

  // Show "start free trial" only when there is genuinely no subscription record.
  // If the backend already has one (even expired) we must NOT call startTrial
  // again — it will 422 with "already exists".
  const hasNoSubscription = !subscription

  async function handleStartTrial(plan: 'individual' | 'family') {
    setTrialError('')
    try {
      await startTrial.mutateAsync({ planType: plan })
      await refetchEnt()
      navigate('/app/today', { replace: true })
    } catch (err: unknown) {
      const appErr = err as AppError
      // "Already exists" means the backend auto-created a subscription on
      // signup.  Refetch to get the latest state and stay on the page so the
      // user can see their actual subscription details.
      if (
        appErr.message?.toLowerCase().includes('already exists') ||
        appErr.statusCode === 409
      ) {
        await refetchEnt()
        return
      }
      setTrialError(appErr.message || 'Could not start your trial. Please try again.')
    }
  }

  async function handleCheckout(plan: 'individual' | 'family') {
    setCheckoutError('')
    try {
      await createCheckout.mutateAsync({
        planType:   plan,
        successUrl: `${window.location.origin}/app/subscription/success`,
        cancelUrl:  `${window.location.origin}/app/subscribe`,
      })
      // On success the hook redirects to Stripe via window.location.href
    } catch (err: unknown) {
      const appErr = err as AppError
      setCheckoutError(appErr.message || 'Could not open checkout. Please try again.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">

      {/* ── Heading ──────────────────────────────────── */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-ck-neutral-900">Choose your plan</h1>
        <p className="mt-2 text-ck-neutral-500">
          Start free. Upgrade when you're ready.
        </p>
      </div>

      {/* ── Subscription details card (always shown when a record exists) ── */}
      {subscription && (
        <div className={[
          'mb-6 rounded-2xl border p-5',
          isInTrial
            ? 'bg-ck-primary-50 border-ck-primary-200'
            : status === 'active'
              ? 'bg-green-50 border-green-200'
              : 'bg-amber-50 border-amber-200',
        ].join(' ')}>
          <div className="flex items-center justify-between mb-3">
            <p className={[
              'text-sm font-bold uppercase tracking-widest',
              isInTrial    ? 'text-ck-primary-600' :
              status === 'active' ? 'text-green-700' : 'text-amber-700',
            ].join(' ')}>
              {isInTrial
                ? '🎁 Free trial'
                : status === 'active'
                  ? '✓ Active subscription'
                  : '⚠️ Subscription issue'}
            </p>
            <span className={[
              'text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize',
              isInTrial    ? 'bg-ck-primary-100 text-ck-primary-700' :
              status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700',
            ].join(' ')}>
              {status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-ck-neutral-400 font-medium">Plan</p>
              <p className="font-bold text-ck-neutral-800 capitalize mt-0.5">{subscription.planType}</p>
            </div>
            <div>
              <p className="text-ck-neutral-400 font-medium">Created</p>
              <p className="font-bold text-ck-neutral-800 mt-0.5">{fmtDate(subscription.createdAt)}</p>
            </div>
            {subscription.trialEnd && (
              <div>
                <p className="text-ck-neutral-400 font-medium">Trial ends</p>
                <p className="font-bold text-ck-neutral-800 mt-0.5">{fmtDate(subscription.trialEnd)}</p>
              </div>
            )}
            {subscription.currentPeriodEnd && (
              <div>
                <p className="text-ck-neutral-400 font-medium">Period ends</p>
                <p className="font-bold text-ck-neutral-800 mt-0.5">{fmtDate(subscription.currentPeriodEnd)}</p>
              </div>
            )}
            {isInTrial && daysRemaining !== null && (
              <div>
                <p className="text-ck-neutral-400 font-medium">Days remaining</p>
                <p className="font-bold text-ck-primary-600 mt-0.5">{daysRemaining} days</p>
              </div>
            )}
          </div>

          {/* Show warning if status is expired but subscription was created recently (within 8 days) */}
          {(status === 'expired' || status === 'cancelled') && subscription.createdAt && (
            (() => {
              const created = new Date(subscription.createdAt)
              const daysSinceCreated = Math.floor((Date.now() - created.getTime()) / 86_400_000)
              return daysSinceCreated <= 8 ? (
                <div className="mt-3 rounded-xl bg-amber-100 border border-amber-300 px-3 py-2 text-xs text-amber-800">
                  <strong>⚠️ This looks wrong.</strong> Your account was created{' '}
                  {daysSinceCreated === 0 ? 'today' : `${daysSinceCreated} day${daysSinceCreated === 1 ? '' : 's'} ago`}{' '}
                  but the subscription shows as <strong>{status}</strong>.
                  This is a backend configuration issue.{' '}
                  <a
                    href="mailto:support@championkids.app?subject=Subscription%20showing%20as%20expired%20on%20new%20account"
                    className="underline font-semibold"
                  >
                    Contact support →
                  </a>
                </div>
              ) : null
            })()
          )}
        </div>
      )}

      {/* ── FREE TRIAL OFFER (only when no subscription record at all) ── */}
      {hasNoSubscription && (
        <div className="mb-8 bg-gradient-to-r from-ck-primary-600 to-ck-primary-500 rounded-2xl p-6 text-center text-white">
          <p className="text-3xl mb-2">🎁</p>
          <h2 className="text-xl font-bold mb-1">Start your 7-day free trial</h2>
          <p className="text-white/80 text-sm mb-5">No credit card required. Full access for 7 days.</p>

          {trialError && (
            <p className="mb-4 rounded-lg bg-white/20 px-3 py-2 text-sm font-medium">
              ⚠️ {trialError}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => handleStartTrial('individual')}
              disabled={startTrial.isPending}
              className="bg-white text-ck-primary-600 font-bold px-6 py-3 rounded-full hover:bg-ck-neutral-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {startTrial.isPending ? 'Starting…' : 'Start free trial (1 child)'}
            </button>
            <button
              onClick={() => handleStartTrial('family')}
              disabled={startTrial.isPending}
              className="bg-white/20 text-white border border-white/40 font-bold px-6 py-3 rounded-full hover:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {startTrial.isPending ? 'Starting…' : 'Start free trial (family)'}
            </button>
          </div>
        </div>
      )}

      {/* ── Paid plan cards ──────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card padding="lg">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-ck-neutral-900">Individual</h2>
              <p className="mt-1 text-sm text-ck-neutral-500">1 child profile</p>
            </div>
            <p className="text-3xl font-bold text-ck-neutral-900">
              £3.99 <span className="text-base font-normal text-ck-neutral-400">/ month</span>
            </p>
            <ul className="flex flex-col gap-2 text-sm text-ck-neutral-600">
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
              {status === 'active' && planType === 'individual' ? 'Current plan' : 'Upgrade — £3.99/mo'}
            </Button>
          </div>
        </Card>

        <Card padding="lg" className="border-ck-primary-500 ring-1 ring-ck-primary-500">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-ck-neutral-900">Family</h2>
                <p className="mt-1 text-sm text-ck-neutral-500">Up to 4 child profiles</p>
              </div>
              <span className="rounded-full bg-ck-primary-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                Most popular
              </span>
            </div>
            <p className="text-3xl font-bold text-ck-neutral-900">
              £7.99 <span className="text-base font-normal text-ck-neutral-400">/ month</span>
            </p>
            <ul className="flex flex-col gap-2 text-sm text-ck-neutral-600">
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
              {status === 'active' && planType === 'family' ? 'Current plan' : 'Upgrade — £7.99/mo'}
            </Button>
          </div>
        </Card>
      </div>

      {checkoutError && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center">
          ⚠️ {checkoutError}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-ck-neutral-400">
        7-day free trial · Cancel anytime · Billing managed securely by Stripe
      </p>
    </div>
  )
}
