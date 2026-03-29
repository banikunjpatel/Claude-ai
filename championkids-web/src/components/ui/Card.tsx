import type { HTMLAttributes } from 'react'

type CardVariant = 'default' | 'elevated' | 'flat' | 'accent'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?:   boolean
}

const variantClasses: Record<CardVariant, string> = {
  default:  'bg-white rounded-lg shadow-ck-sm border border-ck-neutral-200 p-6',
  elevated: 'bg-white rounded-lg shadow-ck-md p-6',
  flat:     'bg-ck-neutral-50 rounded-lg border border-ck-neutral-200 p-6',
  accent:   'bg-ck-primary-50 rounded-lg border border-ck-primary-200 p-6',
}

const paddingClasses = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-6',
}

export default function Card({
  variant = 'default',
  padding,
  hover = false,
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        variantClasses[variant],
        padding != null ? paddingClasses[padding] : '',
        hover ? 'cursor-pointer transition-shadow hover:shadow-ck-lg' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
