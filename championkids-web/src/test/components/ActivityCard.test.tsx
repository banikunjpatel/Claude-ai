import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ActivityCard from '@/components/ActivityCard'
import type { Activity } from '@/types/activity'

const mockActivity: Activity = {
  id: 'act-001',
  title: 'Story Time',
  slug: 'story-time',
  status: 'published',
  skillCategoryId: 'cat-001',
  ageBandId: 'band-001',
  coachingPrompt: 'Ask your child to make up a story.',
  followUpQuestions: ['What happened next?'],
  parentTip: 'Use expressive voices.',
  variation: null,
  timeEstimateMinutes: 5,
  publishedAt: null,
  audioUrl: null,
  createdAt: '',
  updatedAt: '',
  skillCategory: {
    id: 'cat-001',
    slug: 'communication',
    displayName: 'Communication',
    description: '',
    iconName: 'chat',
    colourHex: '#9C51B6',
    sortOrder: 1,
    isActive: true,
  },
  ageBand: {
    id: 'band-001',
    label: '5–6',
    minAgeYears: 5,
    maxAgeYears: 6,
    sortOrder: 3,
  },
}

describe('ActivityCard', () => {
  it('renders skeleton when isLoading is true', () => {
    const { container } = render(<ActivityCard isLoading />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders skeleton when no activity is provided', () => {
    const { container } = render(<ActivityCard />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders activity title in preview variant', () => {
    render(<ActivityCard activity={mockActivity} variant="preview" />)
    expect(screen.getByText('Story Time')).toBeInTheDocument()
  })

  it('shows "Let\'s go" button in preview when onComplete provided', async () => {
    const onComplete = vi.fn()
    render(<ActivityCard activity={mockActivity} variant="preview" onComplete={onComplete} />)
    const btn = screen.getByRole('button', { name: /let's go/i })
    await userEvent.click(btn)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('shows "Mark as Complete" button in detail variant', () => {
    const onComplete = vi.fn()
    render(<ActivityCard activity={mockActivity} variant="detail" onComplete={onComplete} />)
    expect(screen.getByRole('button', { name: /mark as complete/i })).toBeInTheDocument()
  })

  it('renders coaching prompt label in detail variant', () => {
    render(<ActivityCard activity={mockActivity} variant="detail" />)
    expect(screen.getByText('Coaching Prompt')).toBeInTheDocument()
    expect(screen.getByText('Ask your child to make up a story.')).toBeInTheDocument()
  })
})
