/**
 * ProgressPage — motivating visual progress dashboard.
 *
 * Sections
 * --------
 * A  Hero stats row  (4 cards)
 * B  Skills breakdown (animated bars + All-time / This-week toggle)
 * C  Activity history  (last 10 completions)
 * D  Badges wall       (computed from progress data)
 */

import { useState, useEffect, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, isAfter, subDays } from 'date-fns'
import { useAppStore } from '@/store/useAppStore'
import { useChildren } from '@/hooks/useChildren'
import { useProgressSummaryV2, useProgressHistory } from '@/hooks/useProgress'
import SkillBadge from '@/components/SkillBadge'
import type { ProgressSummaryV2, ProgressHistoryItem, SkillBreakdownItem } from '@/api/progress'

// ── Skill catalogue (canonical 7 skills) ─────────────────────────────────────

interface SkillMeta {
  slug:      string
  name:      string
  colourHex: string
}

const SKILLS: SkillMeta[] = [
  { slug: 'communication',          name: 'Communication',          colourHex: '#9C51B6' },
  { slug: 'leadership',             name: 'Leadership',             colourHex: '#D97706' },
  { slug: 'critical-thinking',      name: 'Critical Thinking',      colourHex: '#2563EB' },
  { slug: 'creativity',             name: 'Creativity',             colourHex: '#DB2777' },
  { slug: 'resilience',             name: 'Resilience',             colourHex: '#16A34A' },
  { slug: 'social-skills',          name: 'Social Skills',          colourHex: '#EA580C' },
  { slug: 'emotional-intelligence', name: 'Emotional Intelligence', colourHex: '#0891B2' },
]

// ── Badge definitions ─────────────────────────────────────────────────────────

interface BadgeDef {
  id:    string
  name:  string
  emoji: string
  check: (p: ProgressSummaryV2) => boolean
}

const BADGES: BadgeDef[] = [
  { id: 'first-step',         name: 'First Step',          emoji: '⭐', check: (p) => p.total_completions >= 1 },
  { id: 'perfect-10',         name: 'Perfect 10',          emoji: '🎯', check: (p) => p.total_completions >= 10 },
  { id: 'half-century',       name: 'Half Century',        emoji: '🏅', check: (p) => p.total_completions >= 50 },
  { id: 'century',            name: 'Century',             emoji: '🏆', check: (p) => p.total_completions >= 100 },
  { id: '3-day-streak',       name: '3-Day Streak',        emoji: '🔥', check: (p) => p.longest_streak_days >= 3 },
  { id: 'week-warrior',       name: 'Week Warrior',        emoji: '💪', check: (p) => p.longest_streak_days >= 7 },
  { id: 'fortnight-champion', name: 'Fortnight Champion',  emoji: '⚡', check: (p) => p.longest_streak_days >= 14 },
  { id: 'monthly-master',     name: 'Monthly Master',      emoji: '👑', check: (p) => p.longest_streak_days >= 30 },
  { id: 'communicator',       name: 'Communicator',        emoji: '💬', check: (p) => p.by_skill.some((s) => s.slug === 'communication'          && s.count >= 3) },
  { id: 'leader',             name: 'Leader',              emoji: '🦁', check: (p) => p.by_skill.some((s) => s.slug === 'leadership'             && s.count >= 3) },
  { id: 'thinker',            name: 'Thinker',             emoji: '🧠', check: (p) => p.by_skill.some((s) => s.slug === 'critical-thinking'      && s.count >= 3) },
  { id: 'creator',            name: 'Creator',             emoji: '🎨', check: (p) => p.by_skill.some((s) => s.slug === 'creativity'             && s.count >= 3) },
  { id: 'champion',           name: 'Champion',            emoji: '💎', check: (p) => p.by_skill.some((s) => s.slug === 'resilience'             && s.count >= 3) },
  { id: 'connector',          name: 'Connector',           emoji: '🤝', check: (p) => p.by_skill.some((s) => s.slug === 'social-skills'          && s.count >= 3) },
  { id: 'eq-star',            name: 'EQ Star',             emoji: '❤️', check: (p) => p.by_skill.some((s) => s.slug === 'emotional-intelligence' && s.count >= 3) },
  { id: 'explorer',           name: 'Explorer',            emoji: '🗺️', check: (p) => p.skills_explored >= 5 },
]

// ── Skeleton helpers ──────────────────────────────────────────────────────────

function Bone({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} />
}

function SectionSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-ck-sm space-y-4">
      {[80, 65, 50, 70, 55].map((w, i) => (
        <div key={i} className="flex items-center gap-4">
          <Bone className="h-4 w-32 flex-shrink-0" />
          <div className="flex-1 h-2.5 bg-ck-neutral-100 rounded-full overflow-hidden">
            <Bone className="h-full rounded-full" style={{ width: `${w}%` }} />
          </div>
          <Bone className="h-4 w-4" />
        </div>
      ))}
    </div>
  )
}

// ── Section A: Hero stat card ─────────────────────────────────────────────────

interface StatCardProps {
  value:     number | string
  label:     string
  accent?:   boolean   // streak highlight
  emoji?:    string
  dimmed?:   boolean   // streak = 0
}

function StatCard({ value, label, accent = false, emoji, dimmed = false }: StatCardProps) {
  return (
    <div
      className={[
        'rounded-2xl p-5 text-center shadow-ck-sm',
        accent
          ? 'bg-ck-primary-50 border border-ck-primary-200'
          : 'bg-white',
      ].join(' ')}
    >
      <p
        className={[
          'text-4xl font-extrabold leading-none',
          accent   ? 'text-ck-primary-600' :
          dimmed   ? 'text-ck-neutral-300'  : 'text-ck-primary-500',
        ].join(' ')}
      >
        {value}
      </p>
      {emoji && (
        <p className="text-xl mt-1">{emoji}</p>
      )}
      <p className="text-xs font-semibold uppercase tracking-wider text-ck-neutral-400 mt-2">
        {label}
      </p>
    </div>
  )
}

// ── Section B: Skills breakdown ───────────────────────────────────────────────

interface SkillBarRowProps {
  skill:    SkillMeta
  count:    number
  maxCount: number
  animated: boolean
}

function SkillBarRow({ skill, count, maxCount, animated }: SkillBarRowProps) {
  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0

  return (
    <div className="flex items-center gap-0">
      <span className="w-40 text-sm font-semibold text-ck-neutral-700 flex-shrink-0 truncate pr-2">
        {skill.name}
      </span>
      <div className="flex-1 h-2.5 bg-ck-neutral-100 rounded-full mx-4 relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width:           animated ? `${pct}%` : '0%',
            backgroundColor: skill.colourHex,
          }}
        />
      </div>
      <span className="text-sm font-bold text-ck-neutral-500 w-6 text-right flex-shrink-0">
        {count}
      </span>
    </div>
  )
}

interface SkillsBreakdownProps {
  bySkill:          SkillBreakdownItem[]
  historyItems:     ProgressHistoryItem[]
  loading:          boolean
}

function SkillsBreakdown({ bySkill, historyItems, loading }: SkillsBreakdownProps) {
  const [period, setPeriod] = useState<'alltime' | 'week'>('alltime')
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  // Reset animation when period changes so bars re-animate
  useEffect(() => {
    setAnimated(false)
    const t = setTimeout(() => setAnimated(true), 50)
    return () => clearTimeout(t)
  }, [period])

  // Build this-week counts from history
  const weekCutoff = subDays(new Date(), 7)
  const weekCounts: Record<string, number> = {}
  historyItems
    .filter((h) => isAfter(new Date(h.completed_at), weekCutoff))
    .forEach((h) => {
      weekCounts[h.skill_slug] = (weekCounts[h.skill_slug] ?? 0) + 1
    })

  // Merge canonical skill list with API data
  const allTimeCounts: Record<string, number> = {}
  bySkill.forEach((s) => { allTimeCounts[s.slug] = s.count })

  const skillRows = SKILLS.map((s) => ({
    skill: s,
    count: period === 'alltime'
      ? (allTimeCounts[s.slug] ?? 0)
      : (weekCounts[s.slug] ?? 0),
  }))

  const maxCount = Math.max(...skillRows.map((r) => r.count), 1)

  return (
    <div className="mt-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ck-neutral-900">Skills breakdown</h2>

        {/* Segmented control */}
        <div className="flex items-center bg-ck-neutral-100 rounded-full p-0.5">
          <button
            type="button"
            onClick={() => setPeriod('alltime')}
            className={[
              'rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-150',
              period === 'alltime'
                ? 'bg-ck-primary-500 text-white shadow-ck-sm'
                : 'text-ck-neutral-500 hover:text-ck-neutral-700',
            ].join(' ')}
          >
            All time
          </button>
          <button
            type="button"
            onClick={() => setPeriod('week')}
            className={[
              'rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-150',
              period === 'week'
                ? 'bg-ck-primary-500 text-white shadow-ck-sm'
                : 'text-ck-neutral-500 hover:text-ck-neutral-700',
            ].join(' ')}
          >
            This week
          </button>
        </div>
      </div>

      {loading ? (
        <SectionSkeleton />
      ) : (
        <div className="bg-white rounded-2xl p-6 shadow-ck-sm flex flex-col gap-5">
          {skillRows.map((row) => (
            <SkillBarRow
              key={row.skill.slug}
              skill={row.skill}
              count={row.count}
              maxCount={maxCount}
              animated={animated}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Section C: Activity history row ──────────────────────────────────────────

function HistoryRow({
  item,
  isLast,
}: {
  item: ProgressHistoryItem
  isLast: boolean
}) {
  const bgAlpha = '26'  // ~15% opacity in hex
  const colour  = item.skill_colour || '#9C51B6'

  return (
    <div
      className={[
        'flex items-center gap-4 py-3',
        !isLast ? 'border-b border-ck-neutral-100' : '',
      ].join(' ')}
    >
      {/* Skill icon circle */}
      <div
        className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
        style={{ backgroundColor: colour + bgAlpha }}
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: colour }}
        />
      </div>

      {/* Middle */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ck-neutral-900 truncate">
          {item.activity_title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {item.skill_name && (
            <SkillBadge
              skill={{ displayName: item.skill_name, slug: item.skill_slug }}
              size="sm"
            />
          )}
          <span className="text-xs text-ck-neutral-400">
            {format(new Date(item.completed_at), 'MMM d')}
          </span>
        </div>
      </div>

      {/* Right — reaction or checkmark */}
      {item.parent_reaction ? (
        <span className="text-lg flex-shrink-0">{item.parent_reaction}</span>
      ) : (
        <span className="text-ck-success flex-shrink-0 font-bold text-base">✓</span>
      )}
    </div>
  )
}

// ── Section D: Badge card ─────────────────────────────────────────────────────

function BadgeCard({ badge, earned }: { badge: BadgeDef; earned: boolean }) {
  if (earned) {
    return (
      <div className="bg-white rounded-xl p-3 shadow-ck-sm text-center">
        <p className="text-3xl mb-2">{badge.emoji}</p>
        <p className="text-xs font-bold text-ck-neutral-700 leading-tight">{badge.name}</p>
      </div>
    )
  }

  return (
    <div className="bg-ck-neutral-100 rounded-xl p-3 text-center opacity-50">
      <div className="flex items-center justify-center h-9 mb-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7 text-ck-neutral-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <p className="text-xs text-ck-neutral-400 leading-tight">{badge.name}</p>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyProgress({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center mt-12 text-center px-4">
      <span className="text-6xl mb-4">🌱</span>
      <h2 className="text-xl font-bold text-ck-neutral-900 mb-2">
        Your coaching journey starts today
      </h2>
      <p className="text-sm text-ck-neutral-500 mb-6 max-w-xs">
        Complete your first activity to see progress here
      </p>
      <button
        onClick={onStart}
        className="bg-ck-primary-500 text-white rounded-full px-8 py-3 text-sm font-bold hover:bg-ck-primary-600 active:scale-[0.98] transition-all"
      >
        Start today's activity
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const navigate  = useNavigate()
  const { selectedChildId } = useAppStore()
  const { data: children } = useChildren()

  const effectiveChildId =
    selectedChildId ?? (children && children.length > 0 ? children[0].id : null)

  const selectedChild = children?.find((c) => c.id === effectiveChildId)

  const { data: summary, isLoading: summaryLoading } =
    useProgressSummaryV2(effectiveChildId)

  const { data: historyResult, isLoading: historyLoading } =
    useProgressHistory(effectiveChildId)

  const historyItems: ProgressHistoryItem[] = historyResult?.data ?? []
  const isLoading = summaryLoading || historyLoading

  // Stats
  const total       = summary?.total_completions    ?? 0
  const curStreak   = summary?.current_streak_days  ?? 0
  const bestStreak  = summary?.longest_streak_days  ?? 0
  const skillsExp   = summary?.skills_explored      ?? 0
  const bySkill     = summary?.by_skill             ?? []

  // Earned badges
  const earnedBadgeIds = new Set(
    summary ? BADGES.filter((b) => b.check(summary)).map((b) => b.id) : []
  )

  const childName = selectedChild?.name ?? 'Your child'

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-ck-neutral-50 min-h-screen pb-12">
      <div className="mx-auto max-w-4xl px-4 py-6 md:py-8">

        {/* Header */}
        <h1 className="text-2xl font-extrabold text-ck-neutral-900">
          {childName}'s Progress
        </h1>
        <p className="text-sm text-ck-neutral-500 mt-1">
          Building 21st century skills together
        </p>

        {/* Empty state (no completions yet) */}
        {!isLoading && total === 0 && (
          <EmptyProgress onStart={() => navigate('/app/today')} />
        )}

        {/* ── Section A: Hero stats ──────────────────────────────────── */}
        {!isLoading && total > 0 && (
          <>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                value={total}
                label="Activities"
                emoji="🎯"
              />
              <StatCard
                value={curStreak}
                label="Day streak"
                emoji={curStreak > 0 ? '🔥' : undefined}
                accent={curStreak > 0}
                dimmed={curStreak === 0}
              />
              <StatCard
                value={bestStreak}
                label="Best streak"
                emoji={bestStreak > 0 && bestStreak === curStreak ? '🏆' : undefined}
              />
              <StatCard
                value={`${skillsExp} / 7`}
                label="Skills"
                emoji="✨"
              />
            </div>

            {/* ── Section B: Skills breakdown ────────────────────────── */}
            <SkillsBreakdown
              bySkill={bySkill}
              historyItems={historyItems}
              loading={false}
            />

            {/* ── Section C: Activity history ────────────────────────── */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-ck-neutral-900">
                  Recent activities
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('/app/progress/history')}
                  className="text-sm text-ck-primary-600 font-semibold hover:text-ck-primary-700 transition-colors"
                >
                  View all →
                </button>
              </div>

              {historyLoading ? (
                <div className="bg-white rounded-2xl p-6 shadow-ck-sm space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Bone className="w-10 h-10 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Bone className="h-4 w-3/4" />
                        <Bone className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : historyItems.length === 0 ? (
                <p className="text-sm text-ck-neutral-400 text-center py-8">
                  No completions yet
                </p>
              ) : (
                <div className="bg-white rounded-2xl px-6 py-2 shadow-ck-sm">
                  {historyItems.slice(0, 10).map((item, idx) => (
                    <HistoryRow
                      key={item.id}
                      item={item}
                      isLast={idx === Math.min(historyItems.length, 10) - 1}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Section D: Badges wall ──────────────────────────────── */}
            <div className="mt-8">
              <h2 className="text-lg font-bold text-ck-neutral-900 mb-4">
                Badges earned
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {BADGES.map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    earned={earnedBadgeIds.has(badge.id)}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="mt-6 space-y-6 animate-pulse">
            {/* Stats skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-ck-sm text-center">
                  <Bone className="h-10 w-16 mx-auto mb-2" />
                  <Bone className="h-3 w-20 mx-auto" />
                </div>
              ))}
            </div>

            {/* Skills skeleton */}
            <div>
              <Bone className="h-6 w-40 mb-4" />
              <SectionSkeleton />
            </div>

            {/* History skeleton */}
            <div>
              <Bone className="h-6 w-36 mb-4" />
              <div className="bg-white rounded-2xl p-6 shadow-ck-sm space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Bone className="w-10 h-10 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Bone className="h-4 w-3/4" />
                      <Bone className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
