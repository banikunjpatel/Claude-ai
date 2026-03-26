import { forwardRef, type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   Variant
  size?:      Size
  isLoading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-ck-primary-500 text-white hover:bg-ck-primary-600 active:bg-ck-primary-700 rounded-full font-semibold shadow-ck-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'bg-white border-[1.5px] border-ck-primary-500 text-ck-primary-600 hover:bg-ck-primary-50 rounded-full font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
  outline:
    'bg-white border border-ck-neutral-200 text-ck-neutral-700 hover:bg-ck-neutral-100 rounded-full font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'bg-transparent text-ck-primary-600 hover:bg-ck-primary-100 rounded-full font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
  danger:
    'bg-ck-error text-white hover:opacity-90 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8  px-3 text-sm  rounded-lg  gap-1.5',
  md: 'h-10 px-4 text-sm  rounded-xl  gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center font-medium',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? 'w-full' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
