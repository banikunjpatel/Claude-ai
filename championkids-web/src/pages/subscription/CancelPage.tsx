/** Stripe checkout cancellation landing page. */

import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'

export default function SubscriptionCancelPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-4 text-center">
      <div className="max-w-md">
        <div className="mb-6 text-6xl">↩️</div>
        <h1 className="text-3xl font-bold text-neutral-900">No worries</h1>
        <p className="mt-3 text-neutral-500">
          You haven't been charged. You can upgrade whenever you're ready.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link to="/app/subscribe">
            <Button variant="primary" size="lg" fullWidth>
              View plans
            </Button>
          </Link>
          <Link to="/app/today">
            <Button variant="ghost" fullWidth>
              Back to today's activity
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
