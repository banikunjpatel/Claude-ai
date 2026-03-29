/** Edit child profile — same 3-step wizard, pre-populated. */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, useAnimation } from 'framer-motion'
import { AVATARS } from '@/constants/avatars'
import { SKILLS } from '@/constants/skills'
import { getAgeBand, getAgeInYears } from '@/constants/ageBands'
import { useChild, useUpdateChild, useDeleteChild } from '@/hooks/useChildren'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorState from '@/components/ui/ErrorState'
import type { AppError } from '@/types/api'

const MONTHS = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
]

const STEP_LABELS = ['Choose Avatar', 'About', 'Skills']

const schema = z.object({
  avatar_id:     z.number().min(1, 'Please select an avatar'),
  display_name:  z.string().min(2, 'Name must be at least 2 characters').max(30, 'Name too long'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date'),
  skill_focuses: z.array(z.string()).min(1, 'Please select at least one skill'),
})

type FormValues = z.infer<typeof schema>

export default function EditChildPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: child, isLoading, isError } = useChild(id ?? null)
  const updateChild = useUpdateChild(id ?? '')
  const deleteChild = useDeleteChild()
  const shakeControls = useAnimation()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [dobDay,   setDobDay]   = useState('')
  const [dobMonth, setDobMonth] = useState('')
  const [dobYear,  setDobYear]  = useState('')
  const [ageError, setAgeError] = useState(false)
  const [overLimit, setOverLimit] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { avatar_id: 0, display_name: '', date_of_birth: '', skill_focuses: [] },
  })

  const avatarId     = watch('avatar_id')
  const displayName  = watch('display_name')
  const dateOfBirth  = watch('date_of_birth')
  const skillFocuses = watch('skill_focuses')

  // Pre-populate form when child data loads
  useEffect(() => {
    if (!child) return
    const name = child.display_name ?? child.name
    const dob  = child.date_of_birth ?? child.dateOfBirth
    reset({
      display_name:  name,
      avatar_id:     child.avatar_id ?? 1,
      skill_focuses: child.skill_focuses ?? [],
      date_of_birth: dob,
    })
    if (dob) {
      const [y, m, d] = dob.split('-')
      setDobYear(y)
      setDobMonth(String(parseInt(m)))
      setDobDay(String(parseInt(d)))
    }
  }, [child, reset])

  // Combine day/month/year into ISO date
  useEffect(() => {
    if (dobDay && dobMonth && dobYear) {
      const iso = `${dobYear}-${String(parseInt(dobMonth)).padStart(2, '0')}-${String(parseInt(dobDay)).padStart(2, '0')}`
      setValue('date_of_birth', iso, { shouldValidate: false })
      setAgeError(false)
    }
  }, [dobDay, dobMonth, dobYear, setValue])

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 12 }, (_, i) => currentYear - i)
  const days  = Array.from({ length: 31 }, (_, i) => i + 1)

  const ageBand  = dateOfBirth ? getAgeBand(dateOfBirth) : null
  const ageYears = dateOfBirth ? getAgeInYears(dateOfBirth) : null
  const validAge   = ageYears !== null && ageYears >= 1 && ageYears <= 12
  const invalidAge = ageYears !== null && (ageYears < 1 || ageYears > 12)
  const selectedAvatar = AVATARS.find(a => a.id === avatarId)

  const childDisplayName = child ? (child.display_name ?? child.name) : ''

  async function handleNext() {
    if (step === 1) {
      const ok = await trigger('avatar_id')
      if (ok) setStep(2)
    } else if (step === 2) {
      const ok = await trigger(['display_name', 'date_of_birth'])
      if (!ok) return
      if (invalidAge || !dobDay || !dobMonth || !dobYear) {
        setAgeError(true)
        return
      }
      if (!validAge) { setAgeError(true); return }
      setStep(3)
    }
  }

  function toggleSkill(slug: string) {
    const isSelected = skillFocuses.includes(slug)
    if (!isSelected && skillFocuses.length >= 3) {
      void shakeControls.start({ x: [0, -6, 6, -6, 6, 0], transition: { duration: 0.4 } })
      setOverLimit(true)
      setTimeout(() => setOverLimit(false), 2000)
      return
    }
    setValue('skill_focuses',
      isSelected ? skillFocuses.filter(s => s !== slug) : [...skillFocuses, slug]
    )
  }

  async function onSubmit(values: FormValues) {
    try {
      await updateChild.mutateAsync(values)
      navigate('/app/profile', { replace: true })
    } catch (err) {
      setSubmitError((err as AppError).message ?? 'Failed to save changes.')
    }
  }

  async function handleDelete() {
    if (!id) return
    try {
      await deleteChild.mutateAsync(id)
      navigate('/app/profile', { replace: true })
    } catch (err) {
      setShowDeleteModal(false)
    }
  }

  const canStep2Continue =
    displayName.length >= 2 &&
    dobDay && dobMonth && dobYear &&
    validAge && !invalidAge

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isError || !child) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <ErrorState message="Could not load this child's profile." />
      </div>
    )
  }

  return (
    <>
      <div className="bg-ck-neutral-50 min-h-screen pb-28">
        <div className="max-w-lg mx-auto px-4 py-6">

          {/* Back */}
          <button
            type="button"
            onClick={() => step > 1 ? setStep(s => (s - 1) as 1 | 2 | 3) : navigate('/app/profile')}
            className="text-sm font-semibold text-ck-primary-600 mb-6 flex items-center gap-1 hover:text-ck-primary-700 transition-colors"
          >
            ← Back
          </button>

          {/* Heading */}
          <h1 className="text-2xl font-extrabold text-ck-neutral-900">
            Edit {childDisplayName}'s profile
          </h1>
          <p className="text-sm text-ck-neutral-500 mt-1 mb-6">
            {step === 1 && 'Choose an avatar for your child'}
            {step === 2 && 'Tell us about your child'}
            {step === 3 && 'What should they focus on?'}
          </p>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex gap-2">
              {[1, 2, 3].map(n => (
                <div
                  key={n}
                  className={[
                    'flex-1 h-1.5 rounded-full transition-all duration-500',
                    step > n  ? 'bg-ck-primary-500' :
                    step === n ? 'bg-ck-primary-300' : 'bg-ck-neutral-200',
                  ].join(' ')}
                />
              ))}
            </div>
            <p className="text-xs font-semibold text-ck-primary-600 mt-2">
              Step {step} of 3 — {STEP_LABELS[step - 1]}
            </p>
          </div>

          {/* ── STEP 1: Avatar ─────────────────────────────── */}
          {step === 1 && (
            <div>
              {displayName && (
                <div className="bg-ck-primary-50 border border-ck-primary-100 rounded-2xl p-4 flex items-center gap-4 mb-6">
                  <div
                    className="w-16 h-16 rounded-2xl text-4xl flex items-center justify-center flex-shrink-0"
                    style={{ background: selectedAvatar?.bg ?? '#FAF5FC' }}
                  >
                    {selectedAvatar?.emoji ?? '🌟'}
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-ck-primary-800">{displayName}</p>
                    {ageYears !== null && validAge && ageBand && (
                      <p className="text-sm text-ck-primary-600 font-medium flex items-center gap-2 flex-wrap mt-0.5">
                        {ageYears} years old
                        <span
                          className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                          style={{ background: ageBand.bg, color: ageBand.text }}
                        >
                          {ageBand.name}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 gap-3">
                {AVATARS.map((avatar) => {
                  const selected = avatarId === avatar.id
                  return (
                    <div key={avatar.id} className="flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => setValue('avatar_id', avatar.id)}
                        className={[
                          'relative w-full aspect-square rounded-2xl flex items-center justify-center text-4xl cursor-pointer transition-all duration-200 border-2',
                          selected
                            ? 'border-ck-primary-500 ring-4 ring-ck-primary-100 scale-110'
                            : 'border-transparent hover:border-ck-primary-300 hover:scale-105',
                        ].join(' ')}
                        style={{ background: avatar.bg }}
                        aria-label={avatar.label}
                      >
                        {avatar.emoji}
                        {selected && (
                          <span className="absolute bottom-1 right-1 w-5 h-5 bg-ck-primary-500 rounded-full text-white text-xs flex items-center justify-center">
                            ✓
                          </span>
                        )}
                      </button>
                      <p className="text-center text-xs text-ck-neutral-400 mt-1">{avatar.label}</p>
                    </div>
                  )
                })}
              </div>
              {errors.avatar_id && (
                <p className="text-xs text-ck-error mt-3">{errors.avatar_id.message}</p>
              )}

              {/* Delete link */}
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="block w-full text-xs text-ck-error font-semibold text-center mt-6 cursor-pointer hover:underline"
              >
                Delete {childDisplayName}'s profile
              </button>
            </div>
          )}

          {/* ── STEP 2: Name + DOB ────────────────────────── */}
          {step === 2 && (
            <div className="bg-white rounded-2xl p-6 shadow-ck-sm space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-ck-neutral-500 mb-2">
                  Child's first name
                </label>
                <input
                  {...register('display_name')}
                  type="text"
                  placeholder="e.g. Mia, Oliver, Priya"
                  className={[
                    'w-full px-4 py-3 bg-ck-neutral-100 border rounded-xl text-sm font-medium text-ck-neutral-900',
                    'focus:outline-none focus:ring-2 focus:ring-ck-primary-100 transition-all',
                    errors.display_name
                      ? 'border-ck-error'
                      : 'border-ck-neutral-200 focus:border-ck-primary-500',
                  ].join(' ')}
                />
                {errors.display_name && (
                  <p className="text-xs text-ck-error mt-1.5">{errors.display_name.message}</p>
                )}
                <p className="text-xs text-ck-neutral-400 mt-1.5">
                  This is how we'll refer to them in the app
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-ck-neutral-500 mb-2">
                  Date of birth
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={dobDay}
                    onChange={e => setDobDay(e.target.value)}
                    className="w-full px-3 py-3 bg-ck-neutral-100 border border-ck-neutral-200 rounded-xl text-sm font-medium text-ck-neutral-900 focus:border-ck-primary-500 focus:ring-2 focus:ring-ck-primary-100 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Day</option>
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select
                    value={dobMonth}
                    onChange={e => setDobMonth(e.target.value)}
                    className="w-full px-3 py-3 bg-ck-neutral-100 border border-ck-neutral-200 rounded-xl text-sm font-medium text-ck-neutral-900 focus:border-ck-primary-500 focus:ring-2 focus:ring-ck-primary-100 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Month</option>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                  <select
                    value={dobYear}
                    onChange={e => setDobYear(e.target.value)}
                    className="w-full px-3 py-3 bg-ck-neutral-100 border border-ck-neutral-200 rounded-xl text-sm font-medium text-ck-neutral-900 focus:border-ck-primary-500 focus:ring-2 focus:ring-ck-primary-100 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Year</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                {ageBand && validAge && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-ck-primary-50 border border-ck-primary-100 rounded-xl p-3 mt-3 flex items-center gap-3"
                  >
                    <span className="text-xl flex-shrink-0">🎯</span>
                    <div>
                      <p className="text-sm font-bold text-ck-primary-700">
                        {ageBand.label} band · {ageBand.name} stage
                      </p>
                      <p className="text-xs text-ck-primary-500 mt-0.5">
                        {displayName || 'Your child'} is {ageYears} years old — activities will match this stage
                      </p>
                    </div>
                  </motion.div>
                )}

                {(ageError || invalidAge) && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-3 flex items-center gap-2">
                    <span className="text-sm flex-shrink-0">⚠️</span>
                    <p className="text-sm text-red-700 font-medium">
                      ChampionKids is designed for children aged 1 to 12
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 3: Skills ─────────────────────────────── */}
          {step === 3 && (
            <div>
              <div className="mb-4">
                <motion.div
                  animate={shakeControls}
                  className="inline-flex items-center gap-2 bg-ck-primary-50 border border-ck-primary-200 rounded-full px-4 py-2 text-sm font-bold text-ck-primary-700"
                >
                  🎯{' '}
                  <motion.span
                    key={skillFocuses.length}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    {skillFocuses.length}
                  </motion.span>
                  {' '}of 3 selected
                </motion.div>
                {overLimit && (
                  <div className="bg-red-50 text-ck-error text-xs font-medium rounded-full px-4 py-2 text-center mt-2">
                    You can choose up to 3 focus skills
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SKILLS.map((skill) => {
                  const isSelected = skillFocuses.includes(skill.slug)
                  return (
                    <button
                      key={skill.slug}
                      type="button"
                      onClick={() => toggleSkill(skill.slug)}
                      className={[
                        'cursor-pointer transition-all duration-200 rounded-2xl p-4 flex items-center gap-3 border-2 text-left w-full',
                        isSelected
                          ? 'scale-[1.01]'
                          : 'bg-white border-ck-neutral-200 hover:border-ck-neutral-300 hover:bg-ck-neutral-50',
                      ].join(' ')}
                      style={isSelected ? { background: skill.bg, borderColor: skill.color } : undefined}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl"
                        style={{ background: skill.bg }}
                      >
                        {skill.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: isSelected ? skill.text : '#404040' }}>
                          {skill.name}
                        </p>
                        <p
                          className="text-xs mt-0.5 leading-relaxed"
                          style={{ color: isSelected ? skill.text : '#A3A3A3', opacity: isSelected ? 0.8 : 1 }}
                        >
                          {skill.desc}
                        </p>
                      </div>
                      <div
                        className="w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center"
                        style={
                          isSelected
                            ? { background: skill.color, borderColor: skill.color }
                            : { borderColor: '#D4D4D4', background: 'white' }
                        }
                      >
                        {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                    </button>
                  )
                })}
              </div>

              {errors.skill_focuses && (
                <p className="text-xs text-ck-error mt-3">{errors.skill_focuses.message}</p>
              )}
              {submitError && (
                <p className="text-xs text-ck-error mt-3">{submitError}</p>
              )}
            </div>
          )}
        </div>

        {/* ── Sticky footer ─────────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 bg-ck-neutral-50/80 backdrop-blur-sm border-t border-ck-neutral-100 px-6 py-4">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}
                className="bg-white border border-ck-neutral-200 text-ck-neutral-600 rounded-full px-6 py-3 text-sm font-semibold hover:bg-ck-neutral-50 transition-colors"
              >
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={step === 1 ? avatarId === 0 : !canStep2Continue}
                className={[
                  'flex-1 bg-ck-primary-500 text-white rounded-full py-3 text-sm font-bold transition-all',
                  (step === 1 ? avatarId === 0 : !canStep2Continue)
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-ck-primary-600',
                ].join(' ')}
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={skillFocuses.length === 0 || updateChild.isPending}
                className={[
                  'flex-1 bg-ck-primary-500 text-white rounded-full py-3 text-sm font-bold transition-all',
                  skillFocuses.length === 0 || updateChild.isPending
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-ck-primary-600',
                ].join(' ')}
              >
                {updateChild.isPending ? 'Saving…' : 'Save changes →'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Delete confirmation modal ──────────────────────── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-ck-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="font-bold text-ck-neutral-900 text-lg mb-2">
              Delete {childDisplayName}'s profile?
            </h2>
            <p className="text-sm text-ck-neutral-500 mb-6">
              This will permanently delete all their activity history and progress.
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-white border border-ck-neutral-200 text-ck-neutral-600 rounded-full py-3 text-sm font-semibold hover:bg-ck-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteChild.isPending}
                className={[
                  'flex-1 bg-ck-error text-white rounded-full py-3 text-sm font-bold transition-all',
                  deleteChild.isPending ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90',
                ].join(' ')}
              >
                {deleteChild.isPending ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
