import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import AuthLayout from '@/components/layout/AuthLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { supabase } from '@/auth/supabaseClient'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})
type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    // We intentionally do not surface whether the email exists (anti-enumeration)
    await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSent(true)
  }

  return (
    <AuthLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Reset your password</h1>
          <p className="mt-1 text-sm text-neutral-500">
            We'll send a reset link to your email address.
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-4 rounded-xl bg-green-50 p-6 text-center">
            <span className="text-3xl">📬</span>
            <div>
              <p className="font-semibold text-green-800">Check your inbox</p>
              <p className="mt-1 text-sm text-green-600">
                If that email is registered, you'll receive a reset link shortly.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              error={errors.email?.message}
              {...register('email')}
            />
            <Button type="submit" fullWidth isLoading={isSubmitting}>
              Send reset link
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
