/** Add child profile page. */

import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useCreateChild } from '@/hooks/useChildren'
import type { AppError } from '@/types/api'

const schema = z.object({
  name:        z.string().min(1, 'Name is required').max(50),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date (YYYY-MM-DD)'),
})

type FormValues = z.infer<typeof schema>

export default function AddChildPage() {
  const navigate = useNavigate()
  const createChild = useCreateChild()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    try {
      await createChild.mutateAsync(values)
      navigate('/app/profile', { replace: true })
    } catch (err) {
      const appErr = err as AppError
      setError('root', { message: appErr.message ?? 'Failed to add child.' })
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Add a child</h1>
        <p className="mt-1 text-sm text-neutral-500">
          We use their date of birth to tailor activities to their age band.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input
            label="Child's name"
            type="text"
            required
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Date of birth"
            type="date"
            required
            helperText="We use this to choose age-appropriate activities."
            error={errors.dateOfBirth?.message}
            {...register('dateOfBirth')}
          />

          {errors.root && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-error" role="alert">
              {errors.root.message}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button type="submit" fullWidth isLoading={isSubmitting}>
              Add child
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
