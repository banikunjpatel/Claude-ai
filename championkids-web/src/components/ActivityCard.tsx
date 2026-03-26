/** Activity card with preview and detail variants plus a skeleton loading state. */

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import SkillBadge from '@/components/SkillBadge'
import AgeBandChip from '@/components/AgeBandChip'
import type { Activity } from '@/types/activity'

interface ActivityCardProps {
  activity?:   Activity
  variant?:    'preview' | 'detail'
  isLoading?:  boolean
  onComplete?: () => void
  className?:  string
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={['animate-pulse rounded-lg bg-neutral-200', className].join(' ')} />
  )
}

function ActivityCardSkeleton({ variant }: { variant: 'preview' | 'detail' }) {
  return (
    <Card padding="lg" className="w-full">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-7 w-3/4" />
        {variant === 'detail' && (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <div className="mt-2 flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </>
        )}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
    </Card>
  )
}

// ── Preview variant ───────────────────────────────────────────────────────────

function PreviewCard({ activity, onComplete }: { activity: Activity; onComplete?: () => void }) {
  return (
    <Card padding="lg" hover={!!onComplete} className="w-full animate-fade-in">
      <div className="flex flex-col gap-3">
        {/* Skill + age band chips */}
        <div className="flex flex-wrap items-center gap-2">
          {activity.skillCategory && (
            <SkillBadge skill={activity.skillCategory} />
          )}
          {activity.ageBand && (
            <AgeBandChip label={activity.ageBand.label} />
          )}
          <span className="ml-auto flex items-center gap-1 text-xs text-neutral-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {activity.timeEstimateMinutes} min
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-neutral-900 leading-snug">
          {activity.title}
        </h3>

        {/* Coaching prompt preview — first sentence only */}
        <p className="text-sm text-neutral-500 line-clamp-2">
          {activity.coachingPrompt}
        </p>

        {/* CTA */}
        {onComplete && (
          <div className="pt-2">
            <Button variant="primary" fullWidth onClick={onComplete}>
              Let's go
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

// ── Detail variant ────────────────────────────────────────────────────────────

function DetailCard({ activity, onComplete }: { activity: Activity; onComplete?: () => void }) {
  return (
    <Card padding="lg" className="w-full animate-slide-up">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2">
          {activity.skillCategory && (
            <SkillBadge skill={activity.skillCategory} size="md" />
          )}
          {activity.ageBand && (
            <AgeBandChip label={activity.ageBand.label} />
          )}
          <span className="ml-auto flex items-center gap-1 text-xs text-neutral-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {activity.timeEstimateMinutes} min
          </span>
        </div>

        <h2 className="text-2xl font-bold text-neutral-900 leading-tight">
          {activity.title}
        </h2>

        {/* Coaching prompt */}
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Coaching Prompt
          </p>
          <p className="text-base text-neutral-700 leading-relaxed">
            {activity.coachingPrompt}
          </p>
        </div>

        {/* Follow-up questions */}
        {activity.followUpQuestions?.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Follow-up Questions
            </p>
            <ul className="flex flex-col gap-2">
              {activity.followUpQuestions.map((q, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: activity.skillCategory?.colourHex ?? '#9C51B6' }}
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Parent tip */}
        {activity.parentTip && (
          <div className="rounded-xl bg-ck-primary-50 p-3">
            <p className="mb-1 text-xs font-semibold text-ck-primary-700">💡 Parent Tip</p>
            <p className="text-sm text-ck-primary-700">{activity.parentTip}</p>
          </div>
        )}

        {/* Variation */}
        {activity.variation && (
          <div className="rounded-xl bg-ck-primary-100 p-3">
            <p className="mb-1 text-xs font-semibold text-ck-primary-700">✨ Try This Variation</p>
            <p className="text-sm text-ck-primary-700">{activity.variation}</p>
          </div>
        )}

        {/* Complete button */}
        {onComplete && (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onComplete}
            className="mt-2"
          >
            Mark as Complete
          </Button>
        )}
      </div>
    </Card>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function ActivityCard({
  activity,
  variant = 'preview',
  isLoading = false,
  onComplete,
  className = '',
}: ActivityCardProps) {
  if (isLoading || !activity) {
    return (
      <div className={className}>
        <ActivityCardSkeleton variant={variant} />
      </div>
    )
  }

  return (
    <div className={className}>
      {variant === 'preview'
        ? <PreviewCard activity={activity} onComplete={onComplete} />
        : <DetailCard  activity={activity} onComplete={onComplete} />
      }
    </div>
  )
}
