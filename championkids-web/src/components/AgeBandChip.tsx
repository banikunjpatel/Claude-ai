/** Filter chip that shows an age band label. */

interface AgeBandChipProps {
  label:      string   // e.g. "7–8"
  selected?:  boolean
  onClick?:   () => void
  className?: string
}

export default function AgeBandChip({
  label,
  selected = false,
  onClick,
  className = '',
}: AgeBandChipProps) {
  const Tag = onClick ? 'button' : 'span'

  return (
    <Tag
      onClick={onClick}
      className={[
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        'transition-colors duration-150',
        selected
          ? 'bg-ck-primary-500 text-white'
          : 'bg-ck-neutral-100 text-ck-neutral-500 hover:bg-ck-neutral-200',
        onClick ? 'cursor-pointer' : '',
        className,
      ].join(' ')}
      {...(Tag === 'button' ? { type: 'button' as const } : {})}
    >
      Ages {label}
    </Tag>
  )
}
