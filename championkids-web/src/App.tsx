/** React Router v6 application router.
 *
 * Route tree:
 *   /                          → redirect to /app/today (auth) or /login (anon)
 *   /login                     → LoginPage          (AuthLayout)
 *   /signup                    → SignUpPage          (AuthLayout)
 *   /forgot-password           → ForgotPasswordPage  (AuthLayout)
 *   /reset-password            → ResetPasswordPage   (AuthLayout)
 *   /app/*                     → ProtectedRoute → AppLayout
 *     today                    → TodayPage
 *     library                  → LibraryPage
 *     progress                 → ProgressPage
 *     profile                  → ProfilePage
 *     children/add             → AddChildPage
 *     children/:id/edit        → EditChildPage
 *     subscribe                → SubscriptionPage
 *     subscription/success     → SuccessPage
 *     subscription/cancel      → CancelPage
 *     subscription/manage      → ManagePage
 *   *                          → redirect to /app/today
 */

import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'

import ProtectedRoute from '@/auth/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'

import LoginPage           from '@/pages/auth/LoginPage'
import SignUpPage          from '@/pages/auth/SignUpPage'
import ForgotPasswordPage  from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage   from '@/pages/auth/ResetPasswordPage'

import TodayPage        from '@/pages/app/TodayPage'
import LibraryPage      from '@/pages/app/LibraryPage'
import ProgressPage     from '@/pages/app/ProgressPage'
import ProfilePage      from '@/pages/app/ProfilePage'
import AddChildPage     from '@/pages/app/AddChildPage'
import EditChildPage    from '@/pages/app/EditChildPage'
import SubscriptionPage from '@/pages/app/SubscriptionPage'

import SuccessPage       from '@/pages/subscription/SuccessPage'
import CancelPage        from '@/pages/subscription/CancelPage'
import ManagePage        from '@/pages/subscription/ManagePage'

const router = createBrowserRouter([
  // ── Root redirect ───────────────────────────────────────────────────────
  {
    path:    '/',
    element: <Navigate to="/app/today" replace />,
  },

  // ── Auth pages (no layout wrapper — AuthLayout used inside each page) ──
  { path: '/login',           element: <LoginPage /> },
  { path: '/signup',          element: <SignUpPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password',  element: <ResetPasswordPage /> },

  // ── Authenticated app shell ─────────────────────────────────────────────
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true,                    element: <Navigate to="today" replace /> },
      { path: 'today',                  element: <TodayPage /> },
      { path: 'library',                element: <LibraryPage /> },
      { path: 'progress',               element: <ProgressPage /> },
      { path: 'profile',                element: <ProfilePage /> },
      { path: 'children/add',           element: <AddChildPage /> },
      { path: 'children/:id/edit',      element: <EditChildPage /> },
      { path: 'subscribe',              element: <SubscriptionPage /> },
      { path: 'subscription/success',   element: <SuccessPage /> },
      { path: 'subscription/cancel',    element: <CancelPage /> },
      { path: 'subscription/manage',    element: <ManagePage /> },
    ],
  },

  // ── 404 fallback ────────────────────────────────────────────────────────
  {
    path: '*',
    element: <Navigate to="/app/today" replace />,
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
