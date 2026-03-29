import type { HTMLAttributes } from 'react'

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
type BadgeSize    = 'sm' | 'md'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?:    BadgeSize
}

const variantClasses: Record<BadgeVariant, string> = {
  default:   'bg-ck-neutral-100 text-ck-neutral-700',
  primary:   'bg-ck-primary-50  text-ck-primary-700',
  secondary: 'bg-ck-primary-100 text-ck-primary-700',
  success:   'bg-green-50       text-green-700',
  warning:   'bg-amber-50       text-amber-700',
  error:     'bg-red-50         text-red-700',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2   py-0.5 text-xs',
  md: 'px-2.5 py-1   text-sm',
}

export default function Badge({
  variant = 'default',
  size = 'sm',
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}
