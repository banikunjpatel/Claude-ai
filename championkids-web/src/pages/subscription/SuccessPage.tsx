/** Stripe checkout success landing page. */

import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'

export default function SubscriptionSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-4 text-center">
      <div className="max-w-md">
        <div className="mb-6 text-6xl">🎉</div>
        <h1 className="text-3xl font-bold text-neutral-900">You're all set!</h1>
        <p className="mt-3 text-neutral-500">
          Welcome to ChampionKids. Your subscription is active and your first activity is ready.
        </p>
        <Link to="/app/today" className="mt-8 block">
          <Button variant="primary" size="lg" fullWidth>
            Start today's activity
          </Button>
        </Link>
      </div>
    </div>
  )
}
