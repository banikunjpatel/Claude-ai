/** React Router v6 application router.
 *
 * Route tree:
 *   /                          → PublicRoute → HomePage (marketing)
 *   /login                     → PublicRoute → LoginPage          (AuthLayout)
 *   /signup                    → PublicRoute → SignUpPage          (AuthLayout)
 *   /forgot-password           → PublicRoute → ForgotPasswordPage  (AuthLayout)
 *   /reset-password            → PublicRoute → ResetPasswordPage   (AuthLayout)
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
 *   *                          → redirect to /
 */

import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'

import ProtectedRoute from '@/auth/ProtectedRoute'
import PublicRoute    from '@/auth/PublicRoute'
import AppLayout      from '@/components/layout/AppLayout'

import HomePage from '@/pages/HomePage'

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
import SubscriptionPage    from '@/pages/app/SubscriptionPage'
import ActivityDetailPage from '@/pages/app/ActivityDetailPage'

import ChildSuccessPage  from '@/pages/app/ChildSuccessPage'

import SuccessPage       from '@/pages/subscription/SuccessPage'
import CancelPage        from '@/pages/subscription/CancelPage'
import ManagePage        from '@/pages/subscription/ManagePage'

const router = createBrowserRouter([
  // ── Marketing homepage ──────────────────────────────────────────────────
  {
    path:    '/',
    element: <PublicRoute><HomePage /></PublicRoute>,
  },

  // ── Auth pages — wrapped in PublicRoute to redirect authenticated users ──
  { path: '/login',           element: <PublicRoute><LoginPage /></PublicRoute> },
  { path: '/signup',          element: <PublicRoute><SignUpPage /></PublicRoute> },
  { path: '/forgot-password', element: <PublicRoute><ForgotPasswordPage /></PublicRoute> },
  { path: '/reset-password',  element: <PublicRoute><ResetPasswordPage /></PublicRoute> },

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
      { path: 'activities/:activityId',  element: <ActivityDetailPage /> },
      { path: 'children/add',           element: <AddChildPage /> },
      { path: 'children/:id/edit',      element: <EditChildPage /> },
      { path: 'children/success/:id',   element: <ChildSuccessPage /> },
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
