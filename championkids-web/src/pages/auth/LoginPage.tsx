import { useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import AuthLayout from '@/components/layout/AuthLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { supabase } from '@/auth/supabaseClient'
import { useAuth } from '@/auth/AuthProvider'
import type { AppError } from '@/types/api'

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/app/today'

  // Already logged in → redirect
  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user, navigate, from])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    const { error } = await supabase.auth.signInWithPassword({
      email:    values.email,
      password: values.password,
    })

    if (error) {
      setError('root', { message: error.message })
      return
    }

    navigate(from, { replace: true })
  }

  return (
    <AuthLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-ck-neutral-900">Welcome back</h1>
          <p className="mt-1 text-sm text-ck-neutral-500">Sign in to your ChampionKids account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
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
            autoComplete="current-password"
            required
            error={errors.password?.message}
            {...register('password')}
          />

          {errors.root && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-error" role="alert">
              {errors.root.message}
            </p>
          )}

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-ck-primary-600 text-sm hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" fullWidth isLoading={isSubmitting}>
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-ck-neutral-500">
          Don't have an account?{' '}
          <Link to="/signup" className="text-ck-primary-600 font-semibold">
            Sign up free
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
