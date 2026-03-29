import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StreakCounter from '@/components/StreakCounter'

describe('StreakCounter', () => {
  it('renders the current streak count', () => {
    render(<StreakCounter currentStreak={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows grayscale flame when streak is 0', () => {
    const { container } = render(<StreakCounter currentStreak={0} />)
    const flame = container.querySelector('.grayscale')
    expect(flame).toBeInTheDocument()
  })

  it('does not apply grayscale when streak is active', () => {
    const { container } = render(<StreakCounter currentStreak={3} />)
    const flame = container.querySelector('.grayscale')
    expect(flame).not.toBeInTheDocument()
  })

  it('shows longest streak when provided and > 0', () => {
    render(<StreakCounter currentStreak={3} longestStreak={7} />)
    expect(screen.getByText(/Best: 7/)).toBeInTheDocument()
  })
})
