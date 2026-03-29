import type { ReactNode } from 'react'
import Button from './Button'

interface EmptyStateProps {
  title:       string
  description: string
  icon?:       ReactNode
  action?:     { label: string; onClick: () => void }
  className?:  string
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center gap-4 rounded-2xl',
        'border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center',
        className,
      ].join(' ')}
    >
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
          {icon}
        </div>
      )}
      <div>
        <p className="font-semibold text-neutral-800">{title}</p>
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      </div>
      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
