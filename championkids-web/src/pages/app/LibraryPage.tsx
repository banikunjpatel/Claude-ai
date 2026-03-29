/**
 * LibraryPage — beautiful activity catalogue.
 *
 * Sections
 * --------
 * A  Sticky page header
 * B  Search bar (debounced, 300ms)
 * C  Skill + age-band filter chips
 * D  Results count + sort header
 * E  Infinite-scroll activity grid
 * F  Paywall inline overlay
 * G  Empty state
 *
 * URL state: ?skill=communication&age=7-8&q=desert
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { useChildren } from '@/hooks/useChildren'
import { useActivityLibrary, useSkillCategories, useAgeBands } from '@/hooks/useActivities'
import { useEntitlement } from '@/hooks/useSubscription'
import SkillBadge from '@/components/SkillBadge'
import type { Activity, SkillCategory, AgeBand, ActivityLibraryFilters } from '@/types/activity'

// ── Types ──────────────────────────────────────────────────────────────────────

/** Activity as returned by the API — backend adds isLocked at runtime */
type ActivityRow = Activity & { isLocked?: boolean }

// ── Brand colours per skill slug (mirrors SkillBadge internals) ───────────────

const SKILL_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  'communication':           { bg: '#FAF5FC', border: '#9C51B6', text: '#612E75' },
  'leadership':              { bg: '#FFFBEB', border: '#D97706', text: '#92400E' },
  'critical-thinking':       { bg: '#EFF6FF', border: '#2563EB', text: '#1E40AF' },
  'creativity':              { bg: '#FDF2F8', border: '#DB2777', text: '#9D174D' },
  'resilience':              { bg: '#F0FDF4', border: '#16A34A', text: '#14532D' },
  'social-skills':           { bg: '#FFF7ED', border: '#EA580C', text: '#9A3412' },
  'emotional-intelligence':  { bg: '#ECFEFF', border: '#0891B2', text: '#155E75' },
}

// Static age band labels matching the backend seed data
const AGE_BAND_LABELS = ['1–2', '3–4', '5–6', '7–8', '9–10', '11–12']

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-ck-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="skeleton h-5 w-28 rounded-full" />
        <div className="skeleton h-5 w-12 rounded-full" />
      </div>
      <div className="skeleton h-5 w-3/4 mb-2" />
      <div className="skeleton h-4 w-full mb-1" />
      <div className="skeleton h-4 w-5/6 mb-4" />
      <div className="flex justify-between items-center">
        <div className="skeleton h-4 w-16" />
        <div className="skeleton h-5 w-10 rounded-full" />
      </div>
    </div>
  )
}

// ── Paywall overlay (inline on card) ─────────────────────────────────────────

function PaywallOverlay({ onDismiss, onUpgrade }: { onDismiss: () => void; onUpgrade: () => void }) {
  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl z-20 flex flex-col items-center justify-center p-5 text-center shadow-ck-lg">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-ck-neutral-400 hover:text-ck-neutral-700 transition-colors"
        aria-label="Dismiss"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <span className="text-3xl mb-3">🔒</span>
      <p className="text-base font-bold text-ck-neutral-900 mb-1">Unlock all activities</p>
      <p className="text-xs text-ck-neutral-500 mb-4">Start your free 7-day Pro trial</p>
      <button
        onClick={onUpgrade}
        className="bg-ck-primary-500 text-white rounded-full px-6 py-2.5 text-sm font-bold hover:bg-ck-primary-600 active:scale-[0.98] transition-all"
      >
        Try Pro free
      </button>
    </div>
  )
}

// ── Single activity card ──────────────────────────────────────────────────────

interface ActivityCardProps {
  activity: ActivityRow
  canAccess: boolean
  isPaywallOpen: boolean
  onOpen: () => void
  onPaywallDismiss: () => void
}

function LibraryCard({
  activity,
  canAccess,
  isPaywallOpen,
  onOpen,
  onPaywallDismiss,
}: ActivityCardProps) {
  const navigate = useNavigate()
  const isLocked = !canAccess && activity.isLocked !== false

  function handleClick() {
    if (isLocked) {
      onOpen()
    } else {
      navigate(`/app/activities/${activity.id}`)
    }
  }

  const preview = activity.coachingPrompt
    ? activity.coachingPrompt.slice(0, 80) + (activity.coachingPrompt.length > 80 ? '…' : '')
    : ''

  return (
    <div className="relative">
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        className="bg-white rounded-2xl p-5 shadow-ck-sm hover:shadow-ck-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full flex flex-col"
        aria-label={`${activity.title} — ${activity.timeEstimateMinutes} min`}
      >
        {/* Header row */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex-shrink-0">
            {activity.skillCategory ? (
              <SkillBadge skill={activity.skillCategory} size="sm" />
            ) : (
              <span className="inline-block h-5 w-20 bg-ck-neutral-100 rounded-full" />
            )}
          </div>
          {activity.ageBand && (
            <span className="bg-ck-neutral-100 text-ck-neutral-500 rounded-full text-xs font-semibold px-2.5 py-1 whitespace-nowrap flex-shrink-0">
              Ages {activity.ageBand.label}
            </span>
          )}
        </div>

        {/* Title */}
        <p className="text-base font-bold text-ck-neutral-900 leading-snug mb-2">
          {activity.title}
        </p>

        {/* Preview text */}
        <p className="text-sm text-ck-neutral-500 leading-relaxed mb-3 flex-1">
          {preview}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-xs text-ck-neutral-400 font-medium">
            ⏱ {activity.timeEstimateMinutes} min
          </span>
          {isLocked && (
            <span className="flex items-center gap-1 bg-ck-primary-50 text-ck-primary-700 rounded-full text-xs font-semibold px-2.5 py-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Pro
            </span>
          )}
        </div>
      </div>

      {/* Inline paywall overlay */}
      {isPaywallOpen && (
        <PaywallOverlay
          onDismiss={onPaywallDismiss}
          onUpgrade={() => navigate('/app/subscribe')}
        />
      )}
    </div>
  )
}

// ── Skill chip ────────────────────────────────────────────────────────────────

function SkillChip({
  slug,
  label,
  selected,
  onSelect,
}: {
  slug: string
  label: string
  selected: boolean
  onSelect: () => void
}) {
  const style = SKILL_STYLES[slug]

  const selectedStyle = selected && style
    ? { backgroundColor: style.bg, borderColor: style.border, color: style.text }
    : undefined

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold border-[1.5px] transition-all duration-150 flex-shrink-0',
        selected && !style
          ? 'bg-ck-primary-500 text-white border-ck-primary-500'
          : !selected
          ? 'bg-white border-ck-neutral-200 text-ck-neutral-500 hover:border-ck-primary-300'
          : '',
      ].join(' ')}
      style={selectedStyle}
    >
      {label}
    </button>
  )
}

// ── Age band chip ─────────────────────────────────────────────────────────────

function AgeBandChipBtn({
  label,
  selected,
  onSelect,
}: {
  label: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold border-[1.5px] transition-all duration-150 flex-shrink-0',
        selected
          ? 'bg-ck-neutral-900 text-white border-ck-neutral-900'
          : 'bg-white border-ck-neutral-200 text-ck-neutral-500 hover:border-ck-neutral-400',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center mt-16 text-center px-4">
      <span className="text-5xl mb-4">🔍</span>
      <h2 className="text-xl font-bold text-ck-neutral-900 mb-2">No activities found</h2>
      <p className="text-sm text-ck-neutral-500 mb-6">
        Try different filters or a broader search
      </p>
      <button
        onClick={onClear}
        className="bg-ck-primary-500 text-white rounded-full px-6 py-2.5 text-sm font-bold hover:bg-ck-primary-600 active:scale-[0.98] transition-all"
      >
        Clear filters
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { selectedChildId } = useAppStore()
  const { data: children } = useChildren()
  const { data: entitlementData } = useEntitlement()
  const { data: rawSkillCats } = useSkillCategories()
  const { data: rawAgeBands } = useAgeBands()

  // Cast wrongly-typed hook returns to correct types
  const skillCategories = (rawSkillCats as unknown as SkillCategory[]) ?? []
  const ageBands = (rawAgeBands as unknown as AgeBand[]) ?? []

  // ── URL-driven filter state ─────────────────────────────────────────────────
  const skillParam = searchParams.get('skill') ?? ''
  const ageParam   = searchParams.get('age') ?? ''
  const searchQ    = searchParams.get('q') ?? ''

  // Local input value (updates immediately; URL updates after 300ms debounce)
  const [searchInput, setSearchInput] = useState(searchQ)

  // Paywall overlay: tracks which activity id has the overlay open
  const [paywallActivityId, setPaywallActivityId] = useState<string | null>(null)

  const canAccess = entitlementData?.hasFullAccess ?? false

  // ── Auto-select child's age band on first load ──────────────────────────────
  useEffect(() => {
    if (ageParam) return  // already set from URL
    const child = children?.find((c) => c.id === selectedChildId) ?? children?.[0]
    if (child?.ageBand?.label) {
      setSearchParams(
        (prev) => { prev.set('age', child.ageBand!.label); return prev },
        { replace: true }
      )
    }
  // Run only once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, selectedChildId])

  // ── Debounced search → URL update ──────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams(
        (prev) => {
          if (searchInput) prev.set('q', searchInput)
          else prev.delete('q')
          return prev
        },
        { replace: true }
      )
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, setSearchParams])

  // ── Build query filters (uses backend param names) ────────────────────────
  const queryFilters = {
    skill_category: skillParam || undefined,
    age_band:       ageParam   || undefined,
    search:         searchQ    || undefined,
  } as unknown as ActivityLibraryFilters

  // ── Infinite query ────────────────────────────────────────────────────────
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useActivityLibrary(queryFilters)

  const activities: ActivityRow[] = data?.pages.flatMap((page) => page.data ?? []) ?? []

  // ── Infinite-scroll sentinel ──────────────────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement>(null)

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  )

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [handleObserver])

  // ── Filter helpers ────────────────────────────────────────────────────────
  function setSkill(slug: string) {
    setSearchParams((prev) => {
      if (slug) prev.set('skill', slug)
      else prev.delete('skill')
      return prev
    }, { replace: true })
  }

  function setAge(label: string) {
    setSearchParams((prev) => {
      if (label) prev.set('age', label)
      else prev.delete('age')
      return prev
    }, { replace: true })
  }

  function clearAll() {
    setSearchInput('')
    setSearchParams({}, { replace: true })
  }

  // ── Displayed age band labels: prefer server data, fall back to static ────
  const ageBandLabels: string[] =
    ageBands.length > 0
      ? ageBands.map((b) => b.label)
      : AGE_BAND_LABELS

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-ck-neutral-50 min-h-screen">
      <div className="mx-auto max-w-6xl px-4">

        {/* ── Section A: Sticky header ──────────────────────────────── */}
        <div className="sticky top-0 bg-ck-neutral-50 z-10 pt-6 pb-4 border-b border-ck-neutral-200">
          <h1 className="text-2xl font-extrabold text-ck-neutral-900">Activity Library</h1>
          <p className="text-sm text-ck-neutral-500 mt-1">200+ coaching conversations for ages 1–12</p>

          {/* ── Section B: Search bar ────────────────────────────────── */}
          <div className="mt-4 relative">
            {/* Search icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ck-neutral-400 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search activities..."
              className="w-full bg-white border-[1.5px] border-ck-neutral-200 rounded-2xl pl-12 pr-10 py-3.5 text-[15px] text-ck-neutral-900 placeholder-ck-neutral-400 focus:outline-none focus:border-ck-primary-500 focus:ring-2 focus:ring-ck-primary-100 transition-all"
            />

            {/* Clear button */}
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(''); setSearchParams((p) => { p.delete('q'); return p }, { replace: true }) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ck-neutral-400 hover:text-ck-neutral-700 transition-colors"
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* ── Section C: Filter chips ──────────────────────────────── */}

          {/* Row 1: Skill categories */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <SkillChip
              slug=""
              label="All"
              selected={!skillParam}
              onSelect={() => setSkill('')}
            />
            {skillCategories.map((cat) => (
              <SkillChip
                key={cat.slug}
                slug={cat.slug}
                label={cat.displayName}
                selected={skillParam === cat.slug}
                onSelect={() => setSkill(skillParam === cat.slug ? '' : cat.slug)}
              />
            ))}
          </div>

          {/* Row 2: Age bands */}
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <AgeBandChipBtn
              label="All ages"
              selected={!ageParam}
              onSelect={() => setAge('')}
            />
            {ageBandLabels.map((label) => (
              <AgeBandChipBtn
                key={label}
                label={label}
                selected={ageParam === label}
                onSelect={() => setAge(ageParam === label ? '' : label)}
              />
            ))}
          </div>
        </div>

        {/* ── Section D: Results header ────────────────────────────────── */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-ck-neutral-700">
            {isLoading
              ? 'Loading…'
              : `${activities.length}${hasNextPage ? '+' : ''} activities`}
          </p>
          <select
            className="bg-white border border-ck-neutral-200 rounded-lg px-3 py-1.5 text-sm text-ck-neutral-600 focus:outline-none focus:ring-2 focus:ring-ck-primary-100"
            defaultValue="popular"
          >
            <option value="popular">Most popular</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        {/* ── Section E: Activity grid ─────────────────────────────────── */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">

          {/* Loading skeletons on first load */}
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          }

          {/* Activity cards */}
          {!isLoading && activities.map((activity) => (
            <LibraryCard
              key={activity.id}
              activity={activity}
              canAccess={canAccess}
              isPaywallOpen={paywallActivityId === activity.id}
              onOpen={() => {
                if (!canAccess && (activity.isLocked !== false)) {
                  setPaywallActivityId(activity.id)
                } else {
                  navigate(`/app/activities/${activity.id}`)
                }
              }}
              onPaywallDismiss={() => setPaywallActivityId(null)}
            />
          ))}

          {/* Inline skeletons while fetching next page */}
          {isFetchingNextPage &&
            Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={`next-${i}`} />
            ))
          }
        </div>

        {/* ── Section G: Empty state ───────────────────────────────────── */}
        {!isLoading && activities.length === 0 && (
          <NoResults onClear={clearAll} />
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4" />
      </div>

    </div>
  )
}
