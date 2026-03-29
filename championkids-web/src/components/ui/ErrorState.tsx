import Button from './Button'

interface ErrorStateProps {
  title?:     string
  message?:   string
  onRetry?:   () => void
  className?: string
}

export default function ErrorState({
  title   = 'Something went wrong',
  message = 'We couldn\'t load this content. Please try again.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center gap-4 rounded-2xl',
        'border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center',
        className,
      ].join(' ')}
      role="alert"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-error">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-neutral-800">{title}</p>
        <p className="mt-1 text-sm text-neutral-500">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
