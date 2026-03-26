/** Route guard for authenticated pages.
 *
 * Shows a full-page spinner while auth is loading.
 * Redirects unauthenticated users to /login, preserving the intended URL.
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
