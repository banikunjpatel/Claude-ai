/**
 * TodayPage — redesigned dashboard.
 *
 * Sections
 * --------
 * A  Greeting header
 * B  Streak banner
 * C  Hero activity card (today's pick)
 * D  Quick stats row
 * E  Skills bar chart (when completions > 0)
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { useAppStore } from '@/store/useAppStore'
import { useChildren } from '@/hooks/useChildren'
import { useTodayActivity, useCompleteActivity } from '@/hooks/useActivities'
import { useProgressSummaryV2 } from '@/hooks/useProgress'
import SkillBadge from '@/components/SkillBadge'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

// ── Skeleton pieces ───────────────────────────────────────────────────────────

function SkeletonBar({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

function LoadingSkeleton() {
  return (
    <div className="animate-fade-in">
      {/* Greeting */}
      <div className="mb-6">
        <SkeletonBar className="h-7 w-48 mb-2" />
        <SkeletonBar className="h-4 w-64" />
      </div>

      {/* Streak banner */}
      <SkeletonBar className="h-16 w-full rounded-2xl mb-6" />

      {/* Hero card */}
      <div className="bg-white rounded-2xl p-6 shadow-ck-md mb-6">
        <div className="flex justify-between mb-4">
          <SkeletonBar className="h-6 w-28 rounded-full" />
          <SkeletonBar className="h-6 w-16 rounded-full" />
        </div>
        <SkeletonBar className="h-8 w-3/4 mb-3" />
        <SkeletonBar className="h-4 w-full mb-2" />
        <SkeletonBar className="h-4 w-5/6 mb-2" />
        <SkeletonBar className="h-4 w-4/6 mb-6" />
        <SkeletonBar className="h-12 w-full rounded-full" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-ck-sm">
            <SkeletonBar className="h-8 w-12 mx-auto mb-2" />
            <SkeletonBar className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── No-child / error empty state ─────────────────────────────────────────────

function EmptyCard({
  emoji,
  heading,
  sub,
  cta,
  onCta,
}: {
  emoji: string
  heading: string
  sub: string
  cta: string
  onCta: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-8 py-14 shadow-ck-md text-center animate-fade-in">
      <span className="text-5xl mb-4">{emoji}</span>
      <h2 className="text-xl font-extrabold text-ck-neutral-900 mb-2">{heading}</h2>
      <p className="text-sm text-ck-neutral-500 mb-6 max-w-xs">{sub}</p>
      <button
        onClick={onCta}
        className="bg-ck-primary-500 text-white rounded-full px-8 py-3 text-sm font-bold hover:bg-ck-primary-600 active:scale-[0.98] transition-all"
      >
        {cta}
      </button>
    </div>
  )
}

// ── Section A: Greeting ───────────────────────────────────────────────────────

function GreetingHeader({
  firstName,
  childName,
}: {
  firstName: string
  childName: string | null
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h1 className="text-[26px] font-extrabold text-ck-neutral-900 leading-tight">
          {getGreeting()}, {firstName} 👋
        </h1>
        <p className="text-sm text-ck-neutral-500 mt-1">
          {childName
            ? `Here's today's activity for ${childName}`
            : "Let's get coaching today"}
        </p>
      </div>

      {/* Child avatar pill (placeholder for Phase 2 multi-child switcher) */}
      {childName && (
        <div className="flex flex-col items-center gap-1 ml-4 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-ck-primary-100 text-ck-primary-700 flex items-center justify-center text-base font-bold">
            {childName[0].toUpperCase()}
          </div>
          <span className="text-xs font-semibold text-ck-neutral-500 max-w-[56px] truncate">
            {childName}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Section B: Streak banner ──────────────────────────────────────────────────

function StreakBanner({
  streak,
  childName,
}: {
  streak: number
  childName: string | null
}) {
  if (streak > 0) {
    return (
      <div className="flex items-center gap-3 bg-ck-primary-50 border border-ck-primary-200 rounded-2xl px-5 py-3 mt-1 mb-6">
        <span className="text-2xl flex-shrink-0">🔥</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ck-primary-700 text-sm leading-snug">
            {streak} day streak — keep it going!
          </p>
          {childName && (
            <p className="text-xs text-ck-primary-600 mt-0.5">
              You coached {childName} yesterday too!
            </p>
          )}
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-ck-primary-400 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 bg-ck-neutral-50 border border-ck-neutral-200 rounded-2xl px-5 py-3 mt-1 mb-6">
      <span className="text-2xl flex-shrink-0 grayscale opacity-50">🔥</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ck-neutral-500 text-sm">Start your streak today!</p>
        <p className="text-xs text-ck-neutral-400 mt-0.5">
          Complete today's activity to begin
        </p>
      </div>
    </div>
  )
}

// ── Section C: Hero activity card ─────────────────────────────────────────────

interface HeroCardProps {
  title: string
  coachingPrompt: string
  followUpQuestions: string[]
  parentTip: string | null
  timeEstimateMinutes: number
  skillCategory?: { displayName: string; slug?: string; colourHex?: string } | null
  isCompleted: boolean
  onComplete: () => void
  isCompleting: boolean
}

function HeroActivityCard({
  title,
  coachingPrompt,
  followUpQuestions,
  parentTip,
  timeEstimateMinutes,
  skillCategory,
  isCompleted,
  onComplete,
  isCompleting,
}: HeroCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isLong = coachingPrompt.length > 180

  function swapActivity() {
    console.log('swap activity requested')
  }

  return (
    <div className="mt-2 mb-6 animate-slide-up">
      <div className="bg-white rounded-2xl p-6 shadow-ck-md relative overflow-hidden">

        {/* Decorative accent — top-right corner */}
        <div
          className="absolute top-0 right-0 pointer-events-none"
          style={{
            width: 140,
            height: 140,
            background: 'linear-gradient(135deg, #FAF5FC 0%, #E4CBF0 100%)',
            borderRadius: '0 24px 0 100%',
            opacity: 0.6,
          }}
        />

        {/* Header row */}
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-2">
          {skillCategory ? (
            <SkillBadge skill={skillCategory} size="md" />
          ) : (
            <span />
          )}
          <span className="flex items-center gap-1 bg-green-50 text-green-700 rounded-full px-3 py-1 text-xs font-semibold">
            ⏱ {timeEstimateMinutes} min
          </span>
        </div>

        {/* Title */}
        <h2 className="relative z-10 mt-4 text-2xl font-extrabold text-ck-neutral-900 leading-tight">
          {title}
        </h2>

        {/* Coaching prompt */}
        <div className="mt-3 relative z-10">
          <p
            className={[
              'text-base text-ck-neutral-700 leading-relaxed',
              !expanded && isLong ? 'line-clamp-3' : '',
            ].join(' ')}
          >
            {coachingPrompt}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="mt-1 text-ck-primary-600 text-sm font-semibold cursor-pointer hover:text-ck-primary-700 transition-colors"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Follow-up questions preview */}
        {followUpQuestions.length > 0 && (
          <div className="mt-4 relative z-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-ck-neutral-400 mb-2">
              Follow-up questions
            </p>
            <div className="bg-ck-neutral-100 rounded-lg px-3 py-2 text-sm text-ck-neutral-600">
              {followUpQuestions[0]}
            </div>
            {followUpQuestions.length > 1 && (
              <p className="text-xs text-ck-neutral-400 mt-1">
                + {followUpQuestions.length - 1} more{' '}
                {followUpQuestions.length - 1 === 1 ? 'question' : 'questions'}
              </p>
            )}
          </div>
        )}

        {/* Parent tip */}
        {parentTip && (
          <div className="mt-4 relative z-10 rounded-xl bg-ck-primary-50 border border-ck-primary-100 p-3">
            <p className="text-xs font-semibold text-ck-primary-700 mb-0.5">💡 Parent Tip</p>
            <p className="text-sm text-ck-primary-700 leading-relaxed">{parentTip}</p>
          </div>
        )}

        {/* Completed banner */}
        {isCompleted && (
          <div className="mt-5 relative z-10 flex items-center justify-center gap-2 rounded-xl bg-green-50 border border-green-100 p-4 text-green-700">
            <span className="text-xl">🎉</span>
            <p className="font-semibold text-sm">Activity completed! Great coaching today.</p>
          </div>
        )}

        {/* CTA buttons */}
        {!isCompleted && (
          <div className="mt-6 relative z-10 flex gap-3">
            <button
              onClick={onComplete}
              disabled={isCompleting}
              className="flex-1 bg-ck-primary-500 text-white rounded-full py-4 text-base font-bold hover:bg-ck-primary-600 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCompleting ? 'Saving…' : "Let's do this! →"}
            </button>
            <button
              onClick={swapActivity}
              className="bg-white border border-ck-neutral-200 rounded-full py-4 px-5 text-sm font-semibold text-ck-neutral-500 hover:bg-ck-neutral-50 active:scale-[0.98] transition-all flex-shrink-0"
            >
              Try another
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Section D: Quick stats ────────────────────────────────────────────────────

function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-ck-sm text-center">
      <p className="text-3xl font-extrabold text-ck-primary-500">{value}</p>
      <p className="text-xs font-semibold text-ck-neutral-400 uppercase tracking-wider mt-1">
        {label}
      </p>
    </div>
  )
}

// ── Section E: Skills bar chart ───────────────────────────────────────────────

interface SkillBar {
  name: string
  count: number
  colourHex: string
}

function SkillsChart({ skills }: { skills: SkillBar[] }) {
  const maxCount = Math.max(...skills.map((s) => s.count), 1)

  return (
    <div className="mt-6 animate-fade-in">
      <h3 className="text-base font-bold text-ck-neutral-900 mb-4">Skills this week</h3>
      <div className="bg-white rounded-2xl p-5 shadow-ck-sm flex flex-col gap-3">
        {skills.map((skill) => (
          <div key={skill.name} className="flex items-center gap-3">
            <span className="text-xs font-semibold text-ck-neutral-700 w-36 flex-shrink-0 truncate">
              {skill.name}
            </span>
            <div className="flex-1 bg-ck-neutral-100 h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(skill.count / maxCount) * 100}%`,
                  backgroundColor: skill.colourHex || '#9C51B6',
                }}
              />
            </div>
            <span className="text-xs font-bold text-ck-neutral-400 w-4 text-right flex-shrink-0">
              {skill.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TodayPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { selectedChildId, setSelectedChildId } = useAppStore()
  const { data: children, isLoading: childrenLoading } = useChildren()

  // Derive first name from Supabase user_metadata
  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'there'

  // Auto-select first child when none is stored
  const effectiveChildId =
    selectedChildId ?? (children && children.length > 0 ? children[0].id : null)

  const selectedChild = children?.find((c) => c.id === effectiveChildId) ?? null

  const {
    data: todaySelection,
    isLoading: activityLoading,
    isError: activityError,
  } = useTodayActivity(effectiveChildId)

  const { data: progress } = useProgressSummaryV2(effectiveChildId)
  const completeActivity = useCompleteActivity()

  const isLoading = childrenLoading || activityLoading
  const noChildren = !childrenLoading && (!children || children.length === 0)

  const currentStreak = progress?.current_streak_days ?? 0
  const totalCompleted = progress?.total_completions ?? 0
  const skillsExplored = progress?.skills_explored ?? 0
  const bySkill = (progress?.by_skill ?? []).filter((s) => s.count > 0)

  function handleComplete() {
    if (!todaySelection || !effectiveChildId) return
    completeActivity.mutate({
      activityId: todaySelection.activityId,
      childId: effectiveChildId,
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-8 min-h-screen bg-ck-neutral-50">

      {/* Section A — Greeting */}
      <GreetingHeader
        firstName={firstName}
        childName={selectedChild?.name ?? null}
      />

      {/* Child selector (mobile only, when multiple children exist) */}
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

      {/* Loading skeleton */}
      {isLoading && <LoadingSkeleton />}

      {/* No children — onboarding prompt */}
      {!isLoading && noChildren && (
        <EmptyCard
          emoji="🌟"
          heading="No activity yet"
          sub="Add your child's profile to get started with personalised daily activities."
          cta="Add child"
          onCta={() => navigate('/app/children/add')}
        />
      )}

      {/* Error state */}
      {!isLoading && !noChildren && activityError && (
        <EmptyCard
          emoji="😔"
          heading="Couldn't load today's activity"
          sub="Check your connection and try again."
          cta="Retry"
          onCta={() => window.location.reload()}
        />
      )}

      {/* Main content — child exists and activity loaded */}
      {!isLoading && !noChildren && !activityError && (
        <>
          {/* Section B — Streak banner */}
          <StreakBanner
            streak={currentStreak}
            childName={selectedChild?.name ?? null}
          />

          {/* Section C — Hero activity card */}
          {todaySelection?.activity ? (
            <HeroActivityCard
              title={todaySelection.activity.title}
              coachingPrompt={todaySelection.activity.coachingPrompt}
              followUpQuestions={todaySelection.activity.followUpQuestions ?? []}
              parentTip={todaySelection.activity.parentTip ?? null}
              timeEstimateMinutes={todaySelection.activity.timeEstimateMinutes}
              skillCategory={todaySelection.activity.skillCategory ?? null}
              isCompleted={todaySelection.completed}
              onComplete={handleComplete}
              isCompleting={completeActivity.isPending}
            />
          ) : (
            <EmptyCard
              emoji="🌱"
              heading="No activity available"
              sub="We're adding fresh activities — check back soon!"
              cta="Browse library"
              onCta={() => navigate('/app/library')}
            />
          )}

          {/* Section D — Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard value={totalCompleted} label="Completed" />
            <StatCard value={currentStreak} label="Day streak" />
            <StatCard value={skillsExplored} label="Skills" />
          </div>

          {/* Section E — Skills chart */}
          {totalCompleted > 0 && bySkill.length > 0 && (
            <SkillsChart skills={bySkill.map((s) => ({
              name: s.name,
              count: s.count,
              colourHex: s.colour_hex,
            }))} />
          )}
        </>
      )}

      {/* Bottom padding for mobile nav */}
      <div className="h-8" />
    </div>
  )
}
