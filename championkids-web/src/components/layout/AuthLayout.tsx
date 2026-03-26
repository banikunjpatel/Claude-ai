/** Centered card layout used by all auth pages (login, signup, forgot password). */

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ck-neutral-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <Link to="/" className="mb-8 flex flex-col items-center gap-2 no-underline">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ck-primary-500 text-white shadow-ck-md">
          <span className="text-2xl font-bold">CK</span>
        </div>
        <span className="text-xl font-bold text-ck-primary-700">ChampionKids</span>
        <span className="text-sm text-ck-neutral-500">Raising tomorrow's champions</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md rounded-xl border border-ck-neutral-200 bg-white p-8 shadow-ck-md">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-ck-neutral-400">
        © {new Date().getFullYear()} ChampionKids. All rights reserved.
      </p>
    </div>
  )
}
