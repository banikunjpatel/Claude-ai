/** Edit child profile page. */

import { useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorState from '@/components/ui/ErrorState'
import { useChild, useUpdateChild, useDeleteChild } from '@/hooks/useChildren'
import type { AppError } from '@/types/api'

const schema = z.object({
  name:        z.string().min(1, 'Name is required').max(50),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date'),
})

type FormValues = z.infer<typeof schema>

export default function EditChildPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: child, isLoading, isError } = useChild(id ?? null)
  const updateChild = useUpdateChild(id ?? '')
  const deleteChild = useDeleteChild()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  // Populate form when child data loads
  useEffect(() => {
    if (child) {
      reset({ name: child.name, dateOfBirth: child.dateOfBirth })
    }
  }, [child, reset])

  async function onSubmit(values: FormValues) {
    try {
      await updateChild.mutateAsync(values)
      navigate('/app/profile', { replace: true })
    } catch (err) {
      setError('root', { message: (err as AppError).message ?? 'Failed to update.' })
    }
  }

  async function handleDelete() {
    if (!id || !confirm(`Remove ${child?.name}? This cannot be undone.`)) return
    await deleteChild.mutateAsync(id)
    navigate('/app/profile', { replace: true })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isError || !child) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <ErrorState message="Could not load this child's profile." />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Edit {child.name}</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input
            label="Name"
            type="text"
            required
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Date of birth"
            type="date"
            required
            error={errors.dateOfBirth?.message}
            {...register('dateOfBirth')}
          />

          {errors.root && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-error" role="alert">
              {errors.root.message}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" fullWidth isLoading={isSubmitting}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-6">
        <Button
          variant="danger"
          fullWidth
          onClick={handleDelete}
          isLoading={deleteChild.isPending}
        >
          Remove {child.name}
        </Button>
      </div>
    </div>
  )
}
