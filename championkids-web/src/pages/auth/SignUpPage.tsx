import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import AuthLayout from '@/components/layout/AuthLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { supabase } from '@/auth/supabaseClient'

const schema = z.object({
  fullName:        z.string().min(2, 'Enter your full name'),
  email:           z.string().email('Enter a valid email address'),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  referralCode:    z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path:    ['confirmPassword'],
})

type FormValues = z.infer<typeof schema>

export default function SignUpPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const strengthClass =
    password.length === 0 ? '' :
    password.length < 8   ? 'bg-ck-error' :
    password.length < 12  ? 'bg-ck-warning' :
                            'bg-ck-success'
  const strengthWidth =
    password.length === 0 ? '0%'   :
    password.length < 8   ? '25%'  :
    password.length < 12  ? '50%'  :
                            '100%'
  const strengthLabel =
    password.length === 0 ? ''       :
    password.length < 8   ? 'Weak'   :
    password.length < 12  ? 'Fair'   :
                            'Strong'

  async function onSubmit(values: FormValues) {
    const { error } = await supabase.auth.signUp({
      email:    values.email,
      password: values.password,
      options:  { data: { full_name: values.fullName } },
    })

    if (error) {
      if (error.message.toLowerCase().includes('already')) {
        setError('email', { message: 'An account with this email already exists.' })
      } else {
        setError('root', { message: error.message })
      }
      return
    }

    navigate('/app/today', { replace: true })
  }

  return (
    <AuthLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-ck-neutral-900">Create your account</h1>
          <p className="mt-1 text-sm text-ck-neutral-500">
            Start your free trial — no credit card required
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input
            label="Full name"
            type="text"
            autoComplete="name"
            required
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            helperText="At least 8 characters"
            error={errors.password?.message}
            {...register('password', {
              onChange: (e) => setPassword(e.target.value),
            })}
          />
          {password.length > 0 && (
            <div>
              <div className="mt-2 h-1 bg-ck-neutral-200 rounded-full overflow-hidden">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${strengthClass}`}
                  style={{ width: strengthWidth }}
                />
              </div>
              <p className="text-xs text-ck-neutral-400 mt-1">{strengthLabel}</p>
            </div>
          )}
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            required
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Input
            label="Referral code (optional)"
            type="text"
            placeholder="e.g. CHK7M9XR"
            error={errors.referralCode?.message}
            {...register('referralCode')}
          />

          {errors.root && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-error" role="alert">
              {errors.root.message}
            </p>
          )}

          <Button type="submit" fullWidth isLoading={isSubmitting}>
            Create account
          </Button>
        </form>

        <p className="text-center text-xs text-ck-neutral-400">
          By signing up you agree to our{' '}
          <a href="/terms" className="underline hover:text-neutral-600">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="underline hover:text-neutral-600">Privacy Policy</a>.
        </p>

        <p className="text-center text-sm text-ck-neutral-500">
          Already have an account?{' '}
          <Link to="/login" className="text-ck-primary-600 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
