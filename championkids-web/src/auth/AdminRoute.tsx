/** Route guard for admin-only pages.
 *
 * Builds on ProtectedRoute — checks the role claim in the Supabase user metadata.
 * Redirects non-admins to /app/today.
 */

import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const isAdmin = user.app_metadata?.role === 'admin'
  if (!isAdmin) {
    return <Navigate to="/app/today" replace />
  }

  return <>{children}</>
}
