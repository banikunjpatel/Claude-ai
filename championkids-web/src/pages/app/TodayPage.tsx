/** Today's activity page — full implementation in Week 7.
 *
 * Currently shows the ActivityCard with real data from the selection agent,
 * a child selector, and a streak counter.  The "complete" flow, celebration
 * animation, and audio player are added in Week 7.
 */

import { format } from 'date-fns'
import ActivityCard from '@/components/ActivityCard'
import StreakCounter from '@/components/StreakCounter'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { useAppStore } from '@/store/useAppStore'
import { useChildren } from '@/hooks/useChildren'
import { useTodayActivity, useCompleteActivity } from '@/hooks/useActivities'
import { useStreak } from '@/hooks/useProgress'

export default function TodayPage() {
  const { selectedChildId, setSelectedChildId } = useAppStore()
  const { data: children, isLoading: childrenLoading } = useChildren()

  // Auto-select first child if none selected
  const effectiveChildId =
    selectedChildId ??
    (children && children.length > 0 ? children[0].id : null)

  const {
    data: todaySelection,
    isLoading: activityLoading,
    isError: activityError,
    refetch,
  } = useTodayActivity(effectiveChildId)

  const { data: streak } = useStreak(effectiveChildId)
  const completeActivity = useCompleteActivity()

  const today = format(new Date(), 'EEEE, MMMM d')
  const selectedChild = children?.find((c) => c.id === effectiveChildId)

  function handleComplete() {
    if (!todaySelection || !effectiveChildId) return
    completeActivity.mutate({
      activityId: todaySelection.activityId,
      childId:    effectiveChildId,
    })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-8 min-h-screen bg-ck-neutral-50">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-sm text-ck-neutral-400">{today}</p>
          <h1 className="mt-0.5 text-2xl font-bold text-ck-neutral-900">
            Today's Activity
            {selectedChild && (
              <span className="ml-2 text-base font-normal text-ck-neutral-400">
                for {selectedChild.name}
              </span>
            )}
          </h1>
        </div>

        {/* Streak widget */}
        {streak && (
          <StreakCounter
            currentStreak={streak.currentStreak}
            longestStreak={streak.longestStreak}
            size="sm"
          />
        )}
      </div>

      {/* Child selector (mobile — desktop uses sidebar) */}
      {children && children.length > 1 && (
        <div className="mb-4 lg:hidden">
          <select
            value={effectiveChildId ?? ''}
            onChange={(e) => setSelectedChildId(e.target.value || null)}
            className="w-full rounded-xl border border-ck-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ck-primary-500"
            aria-label="Select child"
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* No children onboarded */}
      {!childrenLoading && (!children || children.length === 0) && (
        <EmptyState
          title="Add your first child to get started"
          description="ChampionKids tailors every activity to your child's age and the skills you want to build."
          action={{ label: 'Add a child', onClick: () => window.location.href = '/app/children/add' }}
        />
      )}

      {/* Activity card */}
      {effectiveChildId && (
        <>
          {activityError && (
            <ErrorState
              message="We couldn't load today's activity."
              onRetry={refetch}
            />
          )}

          {!activityError && (
            <ActivityCard
              activity={todaySelection?.activity}
              variant="detail"
              isLoading={activityLoading}
              onComplete={todaySelection?.completed ? undefined : handleComplete}
            />
          )}

          {todaySelection?.completed && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-green-50 p-4 text-green-700">
              <span className="text-xl">🎉</span>
              <p className="font-medium">Activity completed! Great coaching today.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
