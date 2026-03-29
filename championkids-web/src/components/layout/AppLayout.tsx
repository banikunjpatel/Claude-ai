/**
 * AppLayout — premium navigation shell.
 *
 * Desktop (≥ md / 768 px):  fixed sidebar (w-64) + main content offset by ml-64
 * Mobile  (< md):           fixed top bar (h-14) + fixed bottom tab bar (h-16)
 */

import { type ReactNode } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { useEntitlement } from '@/hooks/useSubscription'

// ── Nav definition ────────────────────────────────────────────────────────────

interface NavDef {
  to:         string
  label:      string
  icon:       ReactNode
  matchPaths: string[]
}

// ── Inline SVG icons (24 × 24, stroke-based) ─────────────────────────────────

const HomeIcon = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const GridIcon = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3"  y="3"  width="7" height="7" />
    <rect x="14" y="3"  width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3"  y="14" width="7" height="7" />
  </svg>
)

const ChartIcon = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4"  />
    <line x1="6"  y1="20" x2="6"  y2="14" />
  </svg>
)

const PersonIcon = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const NAV_ITEMS: NavDef[] = [
  {
    to:         '/app/today',
    label:      'Today',
    icon:       HomeIcon,
    matchPaths: ['/app/today'],
  },
  {
    to:         '/app/library',
    label:      'Library',
    icon:       GridIcon,
    matchPaths: ['/app/library', '/app/activities'],
  },
  {
    to:         '/app/progress',
    label:      'Progress',
    icon:       ChartIcon,
    matchPaths: ['/app/progress'],
  },
  {
    to:         '/app/profile',
    label:      'Profile',
    icon:       PersonIcon,
    matchPaths: ['/app/profile', '/app/children', '/app/subscribe', '/app/subscription'],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(fullName: string | undefined): string {
  if (!fullName?.trim()) return '?'
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return parts[0][0].toUpperCase()
}

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/app/today'))        return 'Today'
  if (pathname.startsWith('/app/library') ||
      pathname.startsWith('/app/activities'))    return 'Library'
  if (pathname.startsWith('/app/progress'))     return 'Progress'
  if (pathname.startsWith('/app/profile') ||
      pathname.startsWith('/app/children'))      return 'Profile'
  if (pathname.startsWith('/app/subscribe') ||
      pathname.startsWith('/app/subscription'))  return 'Subscription'
  return 'ChampionKids'
}

// ── AppLayout ─────────────────────────────────────────────────────────────────

/** Optional — reserved for future use via layout context */
export interface AppLayoutProps {
  children?: ReactNode
  pageTitle?: string
}

export default function AppLayout(_props: AppLayoutProps) {
  const { user, signOut }       = useAuth()
  const navigate                = useNavigate()
  const { pathname }            = useLocation()
  const { data: entitlement }   = useEntitlement()

  // User display
  const fullName    = user?.user_metadata?.['full_name'] as string | undefined
  const initials    = getInitials(fullName)
  const displayName = fullName ?? user?.email ?? 'User'

  // Trial banner
  const isInTrial          = entitlement?.isInTrial ?? false
  const trialDaysRemaining = entitlement?.trialDaysRemaining ?? 7
  const daysUsed           = Math.max(0, 7 - trialDaysRemaining)
  const trialProgress      = Math.min(100, Math.round((daysUsed / 7) * 100))

  // Active route detection
  function isNavActive(item: NavDef): boolean {
    return item.matchPaths.some((p) => pathname.startsWith(p))
  }

  const pageTitle = getPageTitle(pathname)

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-ck-neutral-50">

      {/* ── Desktop sidebar (≥ md) ────────────────────────────────────────── */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white h-screen fixed left-0 top-0 border-r border-ck-neutral-100 z-20">

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-ck-neutral-100 flex-shrink-0">
          <div className="w-9 h-9 bg-ck-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-extrabold text-sm">CK</span>
          </div>
          <span className="text-ck-primary-800 font-bold text-base">ChampionKids</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="Main navigation">
          <p className="px-3 mb-2 text-xs font-semibold tracking-widest text-ck-neutral-300">
            MAIN
          </p>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(item)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={[
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150',
                    active
                      ? 'bg-ck-primary-50 text-ck-primary-700 font-semibold'
                      : 'text-ck-neutral-500 hover:bg-ck-neutral-50 hover:text-ck-neutral-700',
                  ].join(' ')}
                >
                  {/* Icon box */}
                  <div
                    className={[
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      active
                        ? 'bg-ck-primary-100 text-ck-primary-600'
                        : 'bg-ck-neutral-100 text-ck-neutral-400',
                    ].join(' ')}
                  >
                    {item.icon}
                  </div>

                  <span className="text-sm">{item.label}</span>

                  {/* Active dot */}
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-ck-primary-500 flex-shrink-0" />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="px-4 py-4 border-t border-ck-neutral-100 flex-shrink-0">

          {/* Trial banner */}
          {isInTrial && (
            <div className="bg-ck-primary-50 rounded-xl p-3 mb-3">
              <p className="text-xs font-bold text-ck-primary-700">7-day free trial</p>
              <div className="bg-ck-primary-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-ck-primary-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${trialProgress}%` }}
                />
              </div>
              <p className="text-xs text-ck-primary-500 mt-1">
                {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining
              </p>
              <button
                type="button"
                onClick={() => navigate('/app/subscribe')}
                className="text-xs font-bold text-ck-primary-600 hover:text-ck-primary-700 transition-colors mt-0.5 block"
              >
                Upgrade →
              </button>
            </div>
          )}

          {/* User row */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-ck-primary-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {initials}
            </div>
            <span className="text-sm font-semibold text-ck-neutral-700 truncate flex-1 min-w-0">
              {displayName}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ck-neutral-400 hover:bg-ck-neutral-100 hover:text-ck-neutral-600 transition-colors flex-shrink-0"
            >
              {/* Exit / logout arrow */}
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7" />
                <path d="M3 4v16a1 1 0 001 1h6" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar (< md) ─────────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b border-ck-neutral-100 h-14 flex items-center justify-between px-4">

        {/* Hamburger — Phase 2 drawer trigger */}
        <button
          type="button"
          aria-label="Open menu"
          className="w-9 h-9 rounded-lg bg-ck-neutral-100 flex items-center justify-center text-ck-neutral-600"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6"  x2="21" y2="6"  />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Current page title */}
        <span className="font-semibold text-ck-neutral-900 text-base">{pageTitle}</span>

        {/* Notification bell — Phase 2 */}
        <button
          type="button"
          aria-label="Notifications"
          className="w-9 h-9 rounded-lg bg-ck-neutral-100 flex items-center justify-center text-ck-neutral-600 relative"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          {/* Static unread indicator */}
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="md:ml-64 pt-14 md:pt-0 pb-16 md:pb-0 min-h-screen">
        <Outlet />
      </div>

      {/* ── Mobile bottom tab bar (< md) ──────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-ck-neutral-100 h-16"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Mobile navigation"
      >
        <div className="grid grid-cols-4 h-full">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(item)
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center gap-0.5"
                aria-label={item.label}
              >
                <span className={active ? 'text-ck-primary-500' : 'text-ck-neutral-400'}>
                  {item.icon}
                </span>
                <span
                  className={[
                    'text-xs',
                    active ? 'font-semibold text-ck-primary-600' : 'font-medium text-ck-neutral-400',
                  ].join(' ')}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
