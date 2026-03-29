/** Redirects authenticated users away from public-only pages.
 *
 * If the user was bounced here from a protected route (state.from),
 * they are sent back to their original destination instead of /app/today.
 */
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null

  if (user) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
    return <Navigate to={from ?? '/app/today'} replace />
  }

  return <>{children}</>
}
