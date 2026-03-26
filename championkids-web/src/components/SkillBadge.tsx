/** Pill badge that shows a skill category with its brand colour. */

import type { SkillCategory } from '@/types/activity'

interface SkillBadgeProps {
  skill:      SkillCategory | { displayName: string; slug?: string; colourHex?: string; iconName?: string }
  size?:      'sm' | 'md'
  className?: string
}

const SKILL_STYLES: Record<string, { bg: string; text: string }> = {
  'communication':           { bg: '#FAF5FC', text: '#612E75' },
  'leadership':              { bg: '#FFFBEB', text: '#92400E' },
  'critical-thinking':       { bg: '#EFF6FF', text: '#1E40AF' },
  'creativity':              { bg: '#FDF2F8', text: '#9D174D' },
  'resilience':              { bg: '#F0FDF4', text: '#14532D' },
  'social-skills':           { bg: '#FFF7ED', text: '#9A3412' },
  'emotional-intelligence':  { bg: '#ECFEFF', text: '#155E75' },
}
const fallback = { bg: '#F2E5F7', text: '#612E75' }

export default function SkillBadge({ skill, size = 'sm', className = '' }: SkillBadgeProps) {
  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs gap-1'
    : 'px-2.5 py-1 text-sm gap-1.5'

  const slug = (skill as { slug?: string }).slug
    ?? skill.displayName?.toLowerCase().replace(/\s+/g, '-')
  const style = SKILL_STYLES[slug] ?? fallback

  return (
    <span
      className={[
        'inline-flex items-center rounded-full font-medium',
        sizeClasses,
        className,
      ].join(' ')}
      style={{
        backgroundColor: style.bg,
        color: style.text,
      }}
    >
      {skill.displayName}
    </span>
  )
}
