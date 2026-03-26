/** Main application shell with sidebar nav (desktop) and bottom nav (mobile). */

import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { useChildren } from '@/hooks/useChildren'
import { useAppStore } from '@/store/useAppStore'

const navItems = [
  {
    to:    '/app/today',
    label: 'Today',
    icon:  (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to:    '/app/library',
    label: 'Library',
    icon:  (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    to:    '/app/progress',
    label: 'Progress',
    icon:  (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    to:    '/app/profile',
    label: 'Profile',
    icon:  (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

function NavItem({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-ck-primary-100 text-ck-primary-700 font-semibold'
            : 'text-ck-neutral-500 hover:bg-ck-primary-50 hover:text-ck-primary-600',
        ].join(' ')
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  )
}

function MobileNavItem({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors',
          isActive ? 'text-ck-primary-500' : 'text-ck-neutral-400',
        ].join(' ')
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  )
}

export default function AppLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { data: children } = useChildren()
  const { selectedChildId, setSelectedChildId } = useAppStore()
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there'

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-ck-neutral-50">
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden w-64 flex-col border-r border-ck-neutral-200 bg-white lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-ck-neutral-200 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ck-primary-500 text-white">
            <span className="text-sm font-bold">CK</span>
          </div>
          <span className="font-bold text-ck-primary-700">ChampionKids</span>
        </div>

        {/* Child selector */}
        {children && children.length > 0 && (
          <div className="border-b border-ck-neutral-200 px-4 py-3">
            <label htmlFor="child-select" className="mb-1 block text-xs font-medium text-ck-neutral-500">
              Viewing
            </label>
            <select
              id="child-select"
              value={selectedChildId ?? ''}
              onChange={(e) => setSelectedChildId(e.target.value || null)}
              className="w-full rounded-lg border border-ck-neutral-200 bg-white px-2 py-1.5 text-sm text-ck-neutral-700 focus:outline-none focus:ring-2 focus:ring-ck-primary-500"
            >
              <option value="">All children</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-ck-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ck-primary-100 text-sm font-semibold text-ck-primary-700">
              {firstName[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ck-neutral-700">Hi, {firstName}</p>
              <p className="truncate text-xs text-ck-neutral-400">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center justify-between border-b border-ck-neutral-200 bg-white px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ck-primary-500 text-white">
              <span className="text-xs font-bold">CK</span>
            </div>
            <span className="font-bold text-ck-primary-700">ChampionKids</span>
          </div>

          {/* Mobile child selector */}
          {children && children.length > 0 && (
            <select
              value={selectedChildId ?? ''}
              onChange={(e) => setSelectedChildId(e.target.value || null)}
              className="max-w-[140px] rounded-lg border border-ck-neutral-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ck-primary-500"
            >
              <option value="">All</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile bottom nav ────────────────────────────────────────────── */}
      <nav
        className="fixed inset-x-0 bottom-0 flex border-t border-ck-neutral-200 bg-white lg:hidden"
        aria-label="Mobile navigation"
      >
        {navItems.map((item) => (
          <MobileNavItem key={item.to} {...item} />
        ))}
      </nav>
    </div>
  )
}
