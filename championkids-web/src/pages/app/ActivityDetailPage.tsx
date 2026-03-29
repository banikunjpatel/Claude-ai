/**
 * ActivityDetailPage — full coaching card view.
 *
 * Sections
 * --------
 * TopBar  — back button, breadcrumb, save icon (Phase 2)
 * Hero    — skill badge, age band, time pill, title
 * A       — Coaching Prompt card
 * B       — Follow-up Questions card  (conditional)
 * C       — Parent Tip card           (conditional)
 * D       — Variation card            (conditional)
 * Footer  — Emoji reaction picker + "We did this!" CTA  /  "Done for today!" state
 * Overlay — Celebration animation (2 s then navigate to /app/today)
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { useChildren } from '@/hooks/useChildren'
import { useActivity, useCompleteActivity, useTodayActivity } from '@/hooks/useActivities'
import { useProgressSummaryV2 } from '@/hooks/useProgress'
import SkillBadge from '@/components/SkillBadge'
import AgeBandChip from '@/components/AgeBandChip'

// ── Emoji reactions ────────────────────────────────────────────────────────────

const REACTIONS = ['😊', '😂', '🤩', '😮', '🤔'] as const

// ── Skeleton ───────────────────────────────────────────────────────────────────

function Bone({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

function PageSkeleton() {
  return (
    <div className="px-6 pt-6 animate-pulse">
      {/* Tag row */}
      <div className="flex gap-2 mb-4">
        <Bone className="h-6 w-28 rounded-full" />
        <Bone className="h-6 w-20 rounded-full" />
        <Bone className="h-6 w-16 rounded-full" />
      </div>
      {/* Title */}
      <Bone className="h-9 w-3/4 mb-3" />
      <Bone className="h-9 w-1/2 mb-6" />
      {/* Prompt card */}
      <Bone className="h-40 w-full rounded-2xl mb-4" />
      {/* Questions card */}
      <Bone className="h-32 w-full rounded-2xl mb-4" />
      {/* Tip card */}
      <Bone className="h-20 w-full rounded-2xl" />
    </div>
  )
}

// ── Celebration overlay ────────────────────────────────────────────────────────

function CelebrationOverlay({
  childName,
  streak,
}: {
  childName: string
  streak: number
}) {
  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 mx-6 text-center shadow-ck-lg animate-slide-up">
        <p className="text-6xl">🎉</p>
        <h2 className="text-2xl font-extrabold text-ck-neutral-900 mt-4">Amazing!</h2>
        <p className="text-sm text-ck-neutral-500 mt-1">
          {childName} is becoming a champion!
        </p>
        <div className="mt-4 bg-ck-primary-50 rounded-xl p-3">
          <p className="font-bold text-ck-primary-700">
            🔥 Day {streak} streak!
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Card section header ────────────────────────────────────────────────────────

function CardHeader({
  label,
  barColour,
}: {
  label: string
  barColour: 'purple' | 'blue'
}) {
  const barClass   = barColour === 'purple' ? 'bg-ck-primary-500' : 'bg-ck-info'
  const textClass  = barColour === 'purple' ? 'text-ck-primary-700' : 'text-ck-info'
  const wrapClass  = barColour === 'purple'
    ? 'bg-ck-primary-50 border-b border-ck-primary-100'
    : 'bg-blue-50 border-b border-blue-100'

  return (
    <div className={`flex items-center gap-2 px-5 py-3 ${wrapClass}`}>
      <div className={`w-1 h-4 rounded-full flex-shrink-0 ${barClass}`} />
      <span className={`text-sm font-bold ${textClass}`}>{label}</span>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ActivityDetailPage() {
  const { activityId } = useParams<{ activityId: string }>()
  const navigate = useNavigate()

  const { selectedChildId } = useAppStore()
  const { data: children } = useChildren()

  const effectiveChildId =
    selectedChildId ?? (children && children.length > 0 ? children[0].id : null)

  const selectedChild = children?.find((c) => c.id === effectiveChildId)
  const childName     = selectedChild?.name ?? 'Your child'

  const { data: activity, isLoading }   = useActivity(activityId ?? null)
  const { data: todaySelection }        = useTodayActivity(effectiveChildId)
  const { data: progress }              = useProgressSummaryV2(effectiveChildId)
  const completeActivity                = useCompleteActivity()

  const [selectedReaction, setSelectedReaction] = useState<string | null>(null)
  const [showCelebration,  setShowCelebration]  = useState(false)

  // True when this specific activity was already completed today
  const isCompletedToday =
    todaySelection?.activityId === activityId && todaySelection?.completed === true

  // Optimistic streak for celebration overlay (+1 for the just-completed day)
  const celebrationStreak = (progress?.current_streak_days ?? 0) + 1

  function handleComplete() {
    if (!activityId || !effectiveChildId) return
    completeActivity.mutate(
      { activityId, childId: effectiveChildId, reaction: selectedReaction ?? undefined },
      { onSuccess: () => setShowCelebration(true) },
    )
  }

  // Auto-navigate to /app/today after the celebration plays
  useEffect(() => {
    if (!showCelebration) return
    const t = setTimeout(() => navigate('/app/today'), 2000)
    return () => clearTimeout(t)
  }, [showCelebration, navigate])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-ck-neutral-50 min-h-screen pb-16">

      {/* ── Sticky top bar ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-ck-neutral-100">
        <div className="max-w-2xl mx-auto flex items-center gap-4 px-6 py-4">

          {/* Back */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-9 h-9 rounded-xl bg-ck-neutral-100 flex items-center justify-center flex-shrink-0 hover:bg-ck-neutral-200 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-ck-neutral-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Breadcrumb */}
          <p className="text-sm text-ck-neutral-400 font-medium flex-1 min-w-0 truncate">
            Today{' '}
            <span className="text-ck-neutral-300 mx-1">/</span>
            <span className="text-ck-neutral-600">
              {activity?.title ?? 'Activity'}
            </span>
          </p>

          {/* Favourite — Phase 2 placeholder */}
          <button
            type="button"
            aria-label="Save activity"
            className="w-9 h-9 rounded-xl bg-ck-neutral-100 flex items-center justify-center flex-shrink-0 text-ck-neutral-400 hover:text-ck-primary-500 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Page content ───────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto">

        {isLoading ? (
          <PageSkeleton />

        ) : activity ? (
          <>
            {/* ── Hero section ──────────────────────────────────────────── */}
            <div className="bg-white px-6 pt-6 pb-8">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {activity.skillCategory && (
                  <SkillBadge skill={activity.skillCategory} size="md" />
                )}
                {activity.ageBand && (
                  <AgeBandChip label={activity.ageBand.label} />
                )}
                <span className="flex items-center gap-1 bg-green-50 text-green-700 rounded-full px-3 py-1 text-xs font-semibold">
                  ⏱ {activity.timeEstimateMinutes} min
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-extrabold text-ck-neutral-900 leading-tight mb-2">
                {activity.title}
              </h1>

              <div className="h-px bg-ck-neutral-100 mt-6" />
            </div>

            {/* ── A: Coaching Prompt ─────────────────────────────────────── */}
            <div className="mx-6 mt-6 bg-white rounded-2xl shadow-ck-sm overflow-hidden">
              <CardHeader label="Your coaching prompt" barColour="purple" />
              <div className="px-5 py-5">
                <p className="text-base text-ck-neutral-800 leading-relaxed">
                  {activity.coachingPrompt}
                </p>
              </div>
            </div>

            {/* ── B: Follow-up Questions ─────────────────────────────────── */}
            {activity.followUpQuestions.length > 0 && (
              <div className="mx-6 mt-4 bg-white rounded-2xl shadow-ck-sm overflow-hidden">
                <CardHeader label="Follow-up questions" barColour="blue" />
                <div className="px-5 py-3">
                  {activity.followUpQuestions.map((q, i) => (
                    <div
                      key={i}
                      className={[
                        'flex items-start gap-3 py-3',
                        i < activity.followUpQuestions.length - 1
                          ? 'border-b border-ck-neutral-50'
                          : '',
                      ].join(' ')}
                    >
                      <span className="w-6 h-6 rounded-full bg-ck-primary-100 text-ck-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-ck-neutral-700 leading-relaxed flex-1">{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── C: Parent Tip ──────────────────────────────────────────── */}
            {activity.parentTip && (
              <div className="mx-6 mt-4 bg-amber-50 rounded-2xl px-5 py-4 border border-amber-200">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">💡</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
                      Parent tip
                    </p>
                    <p className="text-sm text-amber-900 leading-relaxed">
                      {activity.parentTip}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── D: Variation ───────────────────────────────────────────── */}
            {activity.variation && (
              <div className="mx-6 mt-4 bg-ck-neutral-50 rounded-2xl px-5 py-4 border border-ck-neutral-200">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">🔄</span>
                  <div>
                    <p className="text-xs font-bold uppercase text-ck-neutral-500 mb-1">
                      Try this variation
                    </p>
                    <p className="text-sm text-ck-neutral-700 leading-relaxed">
                      {activity.variation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Spacer so content isn't hidden behind the fixed footer */}
            <div className="h-40" />
          </>

        ) : (
          /* Not-found state */
          <div className="flex flex-col items-center justify-center mt-20 px-6 text-center">
            <p className="text-5xl mb-4">😔</p>
            <h2 className="text-xl font-bold text-ck-neutral-900 mb-2">Activity not found</h2>
            <p className="text-sm text-ck-neutral-500 mb-6">
              This activity may have been removed or is unavailable.
            </p>
            <button
              type="button"
              onClick={() => navigate('/app/today')}
              className="bg-ck-primary-500 text-white rounded-full px-8 py-3 text-sm font-bold hover:bg-ck-primary-600 transition-all"
            >
              Back to today
            </button>
          </div>
        )}
      </div>

      {/* ── Fixed completion footer ─────────────────────────────────────────── */}
      {activity && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-ck-neutral-100">
          <div className="max-w-2xl mx-auto px-6 py-4">

            {isCompletedToday ? (
              /* Already done today */
              <div className="bg-green-50 border border-green-200 rounded-2xl py-4 text-center">
                <p className="text-ck-success font-bold">✓ Done for today!</p>
                <p className="text-xs text-ck-neutral-500 mt-1">
                  Come back tomorrow for a new activity
                </p>
              </div>

            ) : (
              <>
                {/* Emoji reaction picker */}
                <div className="mb-3">
                  <p className="text-xs font-semibold text-ck-neutral-400 mb-2 text-center">
                    How did it go?
                  </p>
                  <div className="flex justify-center gap-3">
                    {REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        aria-label={`React with ${emoji}`}
                        onClick={() =>
                          setSelectedReaction((prev) => (prev === emoji ? null : emoji))
                        }
                        className={[
                          'w-12 h-12 rounded-full text-2xl transition-all duration-150',
                          selectedReaction === emoji
                            ? 'bg-ck-primary-100 ring-2 ring-ck-primary-400 scale-110'
                            : 'bg-ck-neutral-100 hover:bg-ck-neutral-200',
                        ].join(' ')}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={completeActivity.isPending}
                  className="w-full bg-ck-primary-500 text-white rounded-full py-4 text-base font-bold hover:bg-ck-primary-600 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {completeActivity.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12" cy="12" r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Saving…
                    </span>
                  ) : (
                    'We did this! ✓'
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Celebration overlay ─────────────────────────────────────────────── */}
      {showCelebration && (
        <CelebrationOverlay childName={childName} streak={celebrationStreak} />
      )}
    </div>
  )
}
