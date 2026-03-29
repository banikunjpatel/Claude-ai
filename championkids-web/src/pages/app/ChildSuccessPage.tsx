/** Celebration screen shown after a child profile is created. */

import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AVATARS } from '@/constants/avatars'
import { SKILLS } from '@/constants/skills'
import { getAgeBand, getAgeInYears } from '@/constants/ageBands'
import { useChild, useChildren } from '@/hooks/useChildren'
import { useEntitlement } from '@/hooks/useSubscription'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const CONFETTI_COLORS = ['#9C51B6', '#DB2777', '#16A34A', '#D97706', '#2563EB']

export default function ChildSuccessPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: child, isLoading } = useChild(id ?? null)
  const { data: children = [] } = useChildren()
  const { data: entitlement } = useEntitlement()

  const maxChildren = entitlement?.maxChildren ?? 1
  const canAddMore = children.length < maxChildren

  if (isLoading || !child) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ck-neutral-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const name     = child.display_name ?? child.name
  const dob      = child.date_of_birth ?? child.dateOfBirth
  const avatar   = AVATARS.find(a => a.id === (child.avatar_id ?? 0))
  const ageBand  = dob ? getAgeBand(dob) : null
  const ageYears = dob ? getAgeInYears(dob) : null
  const focuses  = child.skill_focuses ?? []
  const skillsWithData = focuses
    .map(slug => SKILLS.find(s => s.slug === slug))
    .filter((s): s is (typeof SKILLS)[number] => !!s)

  return (
    <div className="min-h-screen bg-ck-neutral-50 flex items-center justify-center px-6 py-12">
      {/* Confetti keyframes injected once */}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(60px)  rotate(360deg); opacity: 0; }
        }
      `}</style>

      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-ck-lg text-center">

        {/* Confetti */}
        <div className="relative h-8 mb-2">
          {CONFETTI_COLORS.map((color, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                width: '8px',
                height: '8px',
                borderRadius: '2px',
                background: color,
                left: `${12 + i * 18}%`,
                top: 0,
                animation: `confettiFall 1.5s ease-out ${i * 0.1}s forwards`,
              }}
            />
          ))}
        </div>

        {/* Avatar */}
        <div className="relative w-24 h-24 mx-auto mb-5">
          <div
            className="w-24 h-24 rounded-3xl text-5xl flex items-center justify-center border-4 border-ck-primary-100"
            style={{ background: avatar?.bg ?? '#FAF5FC' }}
          >
            {avatar?.emoji ?? '🌟'}
          </div>
          <span className="absolute -bottom-2 -right-2 w-8 h-8 bg-ck-success rounded-full border-2 border-white text-white text-sm flex items-center justify-center">
            ✓
          </span>
        </div>

        {/* Heading */}
        <motion.h2
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-extrabold text-ck-neutral-900 mb-2"
        >
          {name} is all set! 🎉
        </motion.h2>
        <p className="text-ck-neutral-500 text-sm mb-6">
          Your first activity is ready and waiting.
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-ck-neutral-50 rounded-xl p-3 text-center">
            <p className="text-xl font-extrabold text-ck-primary-500">
              {ageBand?.label ?? (ageYears !== null ? `${ageYears}` : '—')}
            </p>
            <p className="text-xs text-ck-neutral-400 font-medium mt-1">Age band</p>
          </div>
          <div className="bg-ck-neutral-50 rounded-xl p-3 text-center">
            <p className="text-xl font-extrabold text-ck-primary-500">{focuses.length}</p>
            <p className="text-xs text-ck-neutral-400 font-medium mt-1">Skills set</p>
          </div>
          <div className="bg-ck-neutral-50 rounded-xl p-3 text-center">
            <p className="text-xl font-extrabold text-ck-primary-500">200+</p>
            <p className="text-xs text-ck-neutral-400 font-medium mt-1">Activities</p>
          </div>
        </div>

        {/* Skill pills */}
        {skillsWithData.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {skillsWithData.map((skill) => (
              <span
                key={skill.slug}
                className="rounded-full px-3 py-1.5 text-xs font-bold"
                style={{ background: skill.bg, color: skill.text }}
              >
                {skill.icon} {skill.name}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <button
          onClick={() => navigate('/app/today')}
          className="w-full bg-ck-primary-500 rounded-full py-4 text-white font-bold hover:bg-ck-primary-600 transition-all mb-3"
        >
          Start today's activity →
        </button>

        {canAddMore && (
          <button
            onClick={() => navigate('/app/children/add')}
            className="w-full bg-ck-primary-50 text-ck-primary-600 border border-ck-primary-200 rounded-full py-3 font-semibold text-sm hover:bg-ck-primary-100 transition-all"
          >
            + Add another child
          </button>
        )}

        <button
          onClick={() => navigate('/app/profile')}
          className="block w-full text-xs text-ck-neutral-400 mt-3 hover:text-ck-neutral-600 transition-colors"
        >
          ← Back to profile
        </button>
      </div>
    </div>
  )
}
