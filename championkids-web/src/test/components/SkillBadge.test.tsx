import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SkillBadge from '@/components/SkillBadge'

const skill = { displayName: 'Communication', slug: 'communication' }

describe('SkillBadge', () => {
  it('renders the skill display name', () => {
    render(<SkillBadge skill={skill} />)
    expect(screen.getByText('Communication')).toBeInTheDocument()
  })

  it('applies sm size classes by default', () => {
    render(<SkillBadge skill={skill} />)
    const badge = screen.getByText('Communication')
    expect(badge.className).toContain('text-xs')
  })

  it('applies md size classes when size="md"', () => {
    render(<SkillBadge skill={skill} size="md" />)
    const badge = screen.getByText('Communication')
    expect(badge.className).toContain('text-sm')
  })

  it('renders fallback colours for unknown slug', () => {
    render(<SkillBadge skill={{ displayName: 'Unknown Skill', slug: 'unknown-slug' }} />)
    const badge = screen.getByText('Unknown Skill')
    // fallback bg is #F2E5F7
    expect(badge).toHaveStyle({ backgroundColor: '#F2E5F7' })
  })

  it('uses displayName to derive slug when slug is missing', () => {
    render(<SkillBadge skill={{ displayName: 'Communication' }} />)
    const badge = screen.getByText('Communication')
    // communication slug → specific colour
    expect(badge).toHaveStyle({ backgroundColor: '#FAF5FC' })
  })
})
