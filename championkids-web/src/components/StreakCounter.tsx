/** Streak flame counter widget. */

interface StreakCounterProps {
  currentStreak:  number
  longestStreak?: number
  size?:          'sm' | 'md' | 'lg'
  className?:     string
}

const sizeMap = {
  sm: { flame: 'text-xl', count: 'text-lg font-bold', label: 'text-xs' },
  md: { flame: 'text-3xl', count: 'text-2xl font-bold', label: 'text-sm' },
  lg: { flame: 'text-5xl', count: 'text-4xl font-bold', label: 'text-base' },
}

export default function StreakCounter({
  currentStreak,
  longestStreak,
  size = 'md',
  className = '',
}: StreakCounterProps) {
  const cls = sizeMap[size]
  const isActive = currentStreak > 0

  return (
    <div className={['flex flex-col items-center', className].join(' ')}>
      <span
        className={[cls.flame, 'leading-none', isActive ? '' : 'grayscale opacity-40'].join(' ')}
        aria-hidden
      >
        🔥
      </span>
      <span className={[cls.count, isActive ? 'text-ck-primary-700' : 'text-ck-neutral-400'].join(' ')}>
        {currentStreak}
      </span>
      <span className={[cls.label, 'text-ck-neutral-500'].join(' ')}>
        {currentStreak === 1 ? 'day streak' : 'day streak'}
      </span>
      {longestStreak !== undefined && longestStreak > 0 && (
        <span className="mt-1 text-xs text-ck-neutral-400">
          Best: {longestStreak}
        </span>
      )}
    </div>
  )
}
