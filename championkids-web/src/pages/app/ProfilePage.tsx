/** Parent profile and account settings page — full implementation in Week 10. */

import { useAuth } from '@/auth/AuthProvider'
import { Link } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useChildren } from '@/hooks/useChildren'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const { data: children } = useChildren()
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Profile</h1>

      {/* Account info */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ck-primary-100 text-xl font-bold text-ck-primary-700">
            {firstName[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-neutral-900">{user?.user_metadata?.full_name}</p>
            <p className="text-sm text-neutral-500">{user?.email}</p>
          </div>
        </div>
      </Card>

      {/* Children */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-neutral-900">Children</h2>
          <Link to="/app/children/add">
            <Button variant="outline" size="sm">Add child</Button>
          </Link>
        </div>
        {children && children.length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {children.map((child) => (
              <li key={child.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-neutral-800">{child.name}</p>
                  <p className="text-xs text-neutral-400">Ages {child.ageBand.label}</p>
                </div>
                <Link to={`/app/children/${child.id}/edit`}>
                  <Button variant="ghost" size="sm">Edit</Button>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-400">No children added yet.</p>
        )}
      </Card>

      {/* Subscription */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-neutral-900">Subscription</h2>
            <p className="mt-1 text-sm text-neutral-500">Manage your plan and billing.</p>
          </div>
          <Link to="/app/subscribe">
            <Button variant="outline" size="sm">Manage</Button>
          </Link>
        </div>
      </Card>

      {/* Sign out */}
      <div className="pt-2">
        <Button variant="ghost" fullWidth onClick={signOut} className="text-neutral-500">
          Sign out
        </Button>
      </div>

      <p className="text-center text-xs text-neutral-400">
        Full account settings available in Week 10.
      </p>
    </div>
  )
}
