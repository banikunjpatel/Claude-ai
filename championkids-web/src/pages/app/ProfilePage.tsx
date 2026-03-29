/** Parent profile and account settings page. */

import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { useChildren } from '@/hooks/useChildren'
import { useEntitlement } from '@/hooks/useSubscription'
import { useChildrenProgress } from '@/hooks/useProgress'
import { AVATARS } from '@/constants/avatars'
import { SKILLS } from '@/constants/skills'
import { getAgeBand, getAgeInYears } from '@/constants/ageBands'
import type { Child } from '@/types/child'

function childName(child: Child): string {
  return child.display_name ?? child.name
}

function childDOB(child: Child): string {
  return child.date_of_birth ?? child.dateOfBirth
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { data: children = [] } = useChildren()
  const { data: entitlement } = useEntitlement()

  const maxChildren = entitlement?.maxChildren ?? 1
  const atLimit = children.length >= maxChildren
  const status = entitlement?.status
  const trialDaysRemaining = entitlement?.trialDaysRemaining ?? 0
  const daysUsed = Math.max(0, 7 - trialDaysRemaining)

  // Fetch real streak + completion counts for all children in parallel
  const childIds = children.map((c) => c.id)
  const progressResults = useChildrenProgress(childIds)
  const progressByChildId = Object.fromEntries(
    childIds.map((id, i) => [id, progressResults[i]?.data])
  )

  const fullName: string = user?.user_metadata?.full_name ?? ''
  const email: string = user?.email ?? ''

  function subscriptionSub(): string {
    if (!entitlement) return ''
    const { status: s, planType, trialDaysRemaining: tdr, currentPeriodEnd, maxChildren: mc } = entitlement
    if (s === 'trial') return `Free trial · ${tdr ?? 0} days remaining`
    if (s === 'active') {
      if (planType === 'family') return `Family plan · ${mc} children`
      const renews = currentPeriodEnd
        ? new Date(currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : ''
      return `Pro plan · renews ${renews}`
    }
    if (s === 'expired' || s === 'cancelled' || s === 'grace') return 'Subscription expired'
    return ''
  }

  const subSubColor = (status === 'expired' || status === 'cancelled' || status === 'grace')
    ? 'text-ck-error'
    : 'text-ck-neutral-400'

  return (
    <div className="bg-ck-neutral-50 min-h-screen pb-16">
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* ── Page header ───────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-ck-neutral-900">My Profile</h1>
            <p className="text-sm text-ck-neutral-500 mt-1">Manage your account and children</p>
          </div>
          <div className="relative group/addBtn">
            <button
              onClick={() => { if (!atLimit) navigate('/app/children/add') }}
              disabled={atLimit}
              className={[
                'bg-ck-primary-500 text-white rounded-full px-5 py-2.5 text-sm font-bold transition-all',
                atLimit ? 'opacity-50 cursor-not-allowed' : 'hover:bg-ck-primary-600',
              ].join(' ')}
            >
              + Add child
            </button>
            {atLimit && (
              <div className="absolute right-0 top-full mt-2 z-10 bg-ck-neutral-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap opacity-0 group-hover/addBtn:opacity-100 transition-opacity pointer-events-none">
                Upgrade for more children
              </div>
            )}
          </div>
        </div>

        {/* ── Trial banner ──────────────────────────────────── */}
        {status === 'trial' && (
          <div className="bg-gradient-to-r from-ck-primary-600 to-ck-primary-500 rounded-2xl p-5 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 text-white text-2xl flex items-center justify-center flex-shrink-0">
              ⚡
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base">
                {trialDaysRemaining} days left on your free trial
              </p>
              <div className="mt-2 bg-white/20 rounded-full h-1.5">
                <div
                  className="bg-white h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (daysUsed / 7) * 100)}%` }}
                />
              </div>
              <p className="text-white/70 text-sm mt-1">Upgrade to keep building champions</p>
            </div>
            <button
              onClick={() => navigate('/app/subscribe')}
              className="bg-white text-ck-primary-600 font-bold text-sm px-5 py-2.5 rounded-full flex-shrink-0 hover:bg-ck-neutral-100 transition-colors"
            >
              Upgrade →
            </button>
          </div>
        )}

        {status === 'active' && (
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 rounded-full px-4 py-2 text-sm font-semibold mb-6">
            Pro plan active ✓
          </div>
        )}

        {(status === 'expired' || status === 'cancelled') && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <p className="text-red-700 font-semibold text-sm">Your subscription has expired</p>
            <button
              onClick={() => navigate('/app/subscribe')}
              className="text-red-600 font-semibold text-sm hover:underline"
            >
              Renew now →
            </button>
          </div>
        )}

        {/* ── Children section ──────────────────────────────── */}
        <p className="text-xs font-bold uppercase tracking-widest text-ck-neutral-400 mb-4">
          Your children
        </p>

        {children.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-ck-sm mb-4">
            <div className="text-5xl mb-4">🌟</div>
            <h2 className="text-xl font-bold text-ck-neutral-900">Add your first child</h2>
            <p className="text-ck-neutral-500 text-sm mt-2 mb-6">
              Set up a profile to get personalised coaching activities
            </p>
            <button
              onClick={() => navigate('/app/children/add')}
              className="bg-ck-primary-500 text-white rounded-full px-6 py-3 font-bold text-sm hover:bg-ck-primary-600 transition-all"
            >
              Add child →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {children.map((child) => {
              const dob = childDOB(child)
              const name = childName(child)
              const avatar = AVATARS.find(a => a.id === (child.avatar_id ?? 0))
              const ageBand = dob ? getAgeBand(dob) : null
              const age = dob ? getAgeInYears(dob) : null
              const progress = progressByChildId[child.id]
              const streak = progress?.current_streak_days ?? child.streak ?? 0
              const completions = progress?.total_completions ?? child.total_completions ?? 0
              const focuses = child.skill_focuses ?? []

              return (
                <div
                  key={child.id}
                  onClick={() => navigate(`/app/progress?child=${child.id}`)}
                  className="bg-white rounded-2xl p-5 shadow-ck-sm hover:shadow-ck-md transition-all duration-200 cursor-pointer relative group"
                >
                  {/* Edit button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/app/children/${child.id}/edit`) }}
                    className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-ck-neutral-100 text-ck-neutral-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    aria-label="Edit child"
                  >
                    ✎
                  </button>

                  {/* Avatar + info */}
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl"
                      style={{ background: avatar?.bg ?? '#FAF5FC' }}
                    >
                      {avatar?.emoji ?? '🌟'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-extrabold text-ck-neutral-900 truncate">{name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {age !== null && (
                          <span className="text-sm text-ck-neutral-500 font-medium">
                            {age} years old
                          </span>
                        )}
                        {ageBand && (
                          <span
                            className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                            style={{ background: ageBand.bg, color: ageBand.text }}
                          >
                            {ageBand.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Skill focuses */}
                  {focuses.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-4">
                      {focuses.slice(0, 3).map((slug) => {
                        const skill = SKILLS.find(s => s.slug === slug)
                        if (!skill) return null
                        return (
                          <div
                            key={slug}
                            title={skill.name}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                            style={{ background: skill.bg }}
                          >
                            {skill.icon}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 pt-4 border-t border-ck-neutral-100">
                    {streak > 0 ? (
                      <span className="bg-ck-primary-50 text-ck-primary-700 text-xs font-semibold rounded-full px-3 py-1">
                        🔥 {streak} day streak
                      </span>
                    ) : (
                      <span className="bg-ck-neutral-100 text-ck-neutral-400 text-xs font-medium rounded-full px-3 py-1">
                        Start your streak!
                      </span>
                    )}
                    <span className="text-ck-neutral-300 text-sm">·</span>
                    <span className="text-xs text-ck-neutral-400 font-medium">
                      {completions} activities
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Add child card */}
            {!atLimit && (
              <div
                onClick={() => navigate('/app/children/add')}
                className="bg-ck-primary-50 border-2 border-dashed border-ck-primary-200 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[160px] cursor-pointer hover:border-ck-primary-400 hover:bg-ck-primary-100 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-ck-primary-500 rounded-2xl text-white text-2xl font-black mb-3 flex items-center justify-center">
                  +
                </div>
                <p className="text-sm font-bold text-ck-primary-600">Add another child</p>
                <p className="text-xs text-ck-primary-400 mt-1">
                  Up to {maxChildren} on your plan
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Account section ──────────────────────────────── */}
        <p className="text-xs font-bold uppercase tracking-widest text-ck-neutral-400 mt-8 mb-4">
          Account
        </p>

        <div className="bg-white rounded-2xl shadow-ck-sm overflow-hidden">
          {/* Account details */}
          <div
            onClick={() => navigate('/app/profile/edit')}
            className="flex items-center gap-4 px-5 py-4 border-b border-ck-neutral-50 hover:bg-ck-neutral-50 cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-ck-primary-50 flex items-center justify-center text-xl flex-shrink-0">👤</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ck-neutral-900">{fullName}</p>
              <p className="text-xs text-ck-neutral-400 mt-0.5">{email}</p>
            </div>
            <span className="text-ck-neutral-300 text-lg">›</span>
          </div>

          {/* Subscription */}
          <div
            onClick={() => navigate('/app/subscribe')}
            className="flex items-center gap-4 px-5 py-4 border-b border-ck-neutral-50 hover:bg-ck-neutral-50 cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl flex-shrink-0">💳</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ck-neutral-900">Subscription</p>
              <p className={`text-xs mt-0.5 ${subSubColor}`}>{subscriptionSub()}</p>
            </div>
            <span className="text-ck-neutral-300 text-lg">›</span>
          </div>

          {/* Notifications */}
          <div
            onClick={() => navigate('/app/settings/notifications')}
            className="flex items-center gap-4 px-5 py-4 border-b border-ck-neutral-50 hover:bg-ck-neutral-50 cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">🔔</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ck-neutral-900">Notifications</p>
              <p className="text-xs text-ck-neutral-400 mt-0.5">Daily reminder at 6:00 PM</p>
            </div>
            <span className="text-ck-neutral-300 text-lg">›</span>
          </div>

          {/* Help & Support */}
          <div
            onClick={() => navigate('/app/help')}
            className="flex items-center gap-4 px-5 py-4 border-b border-ck-neutral-50 hover:bg-ck-neutral-50 cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl flex-shrink-0">💬</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ck-neutral-900">Help &amp; Support</p>
              <p className="text-xs text-ck-neutral-400 mt-0.5">FAQs, contact us</p>
            </div>
            <span className="text-ck-neutral-300 text-lg">›</span>
          </div>

          {/* Sign out */}
          <div
            onClick={async () => { await signOut(); navigate('/') }}
            className="flex items-center gap-4 px-5 py-4 hover:bg-ck-neutral-50 cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-xl flex-shrink-0">🚪</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ck-error">Sign out</p>
              <p className="text-xs text-ck-neutral-400 mt-0.5">See you tomorrow!</p>
            </div>
          </div>
        </div>

        {/* ── App info footer ───────────────────────────────── */}
        <div className="mt-8 text-center">
          <p className="text-xs text-ck-neutral-300">ChampionKids v1.0.0</p>
          <p className="text-xs text-ck-neutral-300 mt-1">© 2026 ChampionKids Ltd</p>
        </div>
      </div>
    </div>
  )
}
