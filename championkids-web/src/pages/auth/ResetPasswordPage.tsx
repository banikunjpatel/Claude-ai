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
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path:    ['confirmPassword'],
})

type FormValues = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    const { error } = await supabase.auth.updateUser({ password: values.password })

    if (error) {
      setError('root', { message: error.message })
      return
    }

    setDone(true)
    setTimeout(() => navigate('/login', { replace: true }), 2500)
  }

  return (
    <AuthLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Set a new password</h1>
          <p className="mt-1 text-sm text-neutral-500">Choose a strong password for your account.</p>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-4 rounded-xl bg-green-50 p-6 text-center">
            <span className="text-3xl">✅</span>
            <div>
              <p className="font-semibold text-green-800">Password updated!</p>
              <p className="mt-1 text-sm text-green-600">Redirecting you to login…</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              required
              helperText="At least 8 characters"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              required
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {errors.root && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-error" role="alert">
                {errors.root.message}
              </p>
            )}

            <Button type="submit" fullWidth isLoading={isSubmitting}>
              Update password
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-neutral-500">
          <Link to="/login" className="font-medium text-ck-primary-600 hover:text-ck-primary-700">
            ← Back to login
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
