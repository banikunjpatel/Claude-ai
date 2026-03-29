import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { customRender } from '../utils'
import AddChildPage from '@/pages/app/AddChildPage'

const mockNavigate = vi.fn()
const mockMutateAsync = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/hooks/useChildren', () => ({
  useCreateChild: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}))

describe('AddChildPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockMutateAsync.mockReset()
  })

  it('renders step 1 with avatar grid', () => {
    customRender(<AddChildPage />)
    expect(screen.getByText(/choose an avatar/i)).toBeInTheDocument()
    // Should have multiple avatar buttons
    const avatarButtons = screen.getAllByRole('button').filter(
      (b) => b.getAttribute('aria-label') !== null
    )
    expect(avatarButtons.length).toBeGreaterThanOrEqual(8)
  })

  it('Continue button is disabled before avatar is selected', () => {
    customRender(<AddChildPage />)
    const continueBtn = screen.getByRole('button', { name: /continue/i })
    expect(continueBtn).toBeDisabled()
  })

  it('Continue button enables after selecting an avatar', async () => {
    customRender(<AddChildPage />)
    const avatarButtons = screen.getAllByRole('button').filter(
      (b) => b.getAttribute('aria-label') !== null
    )
    await userEvent.click(avatarButtons[0])
    const continueBtn = screen.getByRole('button', { name: /continue/i })
    expect(continueBtn).not.toBeDisabled()
  })

  it('advances to step 2 after selecting an avatar and clicking Continue', async () => {
    customRender(<AddChildPage />)
    const avatarButtons = screen.getAllByRole('button').filter(
      (b) => b.getAttribute('aria-label') !== null
    )
    await userEvent.click(avatarButtons[0])
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    await waitFor(() => {
      expect(screen.getByText(/tell us about your child/i)).toBeInTheDocument()
    })
  })

  it('advances to step 3 (skills) after filling name and DOB', async () => {
    customRender(<AddChildPage />)
    // Step 1: select avatar and continue
    const avatarButtons = screen.getAllByRole('button').filter(
      (b) => b.getAttribute('aria-label') !== null
    )
    await userEvent.click(avatarButtons[0])
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 2: fill in name and DOB
    await waitFor(() => screen.getByText(/tell us about your child/i))
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Mia/i), 'Emma')

    // Select DOB using selects
    fireEvent.change(screen.getByDisplayValue('Day'), { target: { value: '15' } })
    fireEvent.change(screen.getByDisplayValue('Month'), { target: { value: '6' } })
    fireEvent.change(screen.getByDisplayValue('Year'), { target: { value: '2019' } })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
    })
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(screen.getByText(/what should they focus on/i)).toBeInTheDocument()
    })
  })

  it('shows "up to 3" message when selecting more than 3 skills', async () => {
    customRender(<AddChildPage />)
    // Navigate to step 3 quickly by going through steps 1 and 2
    const avatarButtons = screen.getAllByRole('button').filter(
      (b) => b.getAttribute('aria-label') !== null
    )
    await userEvent.click(avatarButtons[0])
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => screen.getByText(/tell us about your child/i))
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Mia/i), 'Emma')
    fireEvent.change(screen.getByDisplayValue('Day'), { target: { value: '15' } })
    fireEvent.change(screen.getByDisplayValue('Month'), { target: { value: '6' } })
    fireEvent.change(screen.getByDisplayValue('Year'), { target: { value: '2019' } })

    await waitFor(() => expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled())
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => screen.getByText(/what should they focus on/i))

    // Click 4 skill buttons
    const skillButtons = screen.getAllByRole('button').filter(
      (b) => b.getAttribute('type') === 'button' && !b.textContent?.includes('Continue') && !b.textContent?.includes('Back')
    )
    // Select first 3 — should work fine
    await userEvent.click(skillButtons[0])
    await userEvent.click(skillButtons[1])
    await userEvent.click(skillButtons[2])
    // Select 4th — should trigger "up to 3" warning
    await userEvent.click(skillButtons[3])

    await waitFor(() => {
      expect(screen.getByText(/up to 3/i)).toBeInTheDocument()
    })
  })

  it('shows error message when createChild fails', async () => {
    mockMutateAsync.mockRejectedValueOnce({ message: 'Server error' })
    customRender(<AddChildPage />)

    // Navigate through all steps
    const avatarButtons = screen.getAllByRole('button').filter(
      (b) => b.getAttribute('aria-label') !== null
    )
    await userEvent.click(avatarButtons[0])
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => screen.getByText(/tell us about your child/i))
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Mia/i), 'Emma')
    fireEvent.change(screen.getByDisplayValue('Day'), { target: { value: '15' } })
    fireEvent.change(screen.getByDisplayValue('Month'), { target: { value: '6' } })
    fireEvent.change(screen.getByDisplayValue('Year'), { target: { value: '2019' } })

    await waitFor(() => expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled())
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => screen.getByText(/what should they focus on/i))
    const skillButtons = screen.getAllByRole('button').filter(
      (b) => b.getAttribute('type') === 'button' && !b.textContent?.includes('Create') && !b.textContent?.includes('Back')
    )
    await userEvent.click(skillButtons[0])
    await userEvent.click(screen.getByRole('button', { name: /create profile/i }))

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument()
    })
  })

  it('calls createChild.mutateAsync and navigates on successful submit', async () => {
    mockMutateAsync.mockResolvedValueOnce({ id: 'child-new' })
    customRender(<AddChildPage />)

    // Step 1
    const avatarButtons = screen.getAllByRole('button').filter(
      (b) => b.getAttribute('aria-label') !== null
    )
    await userEvent.click(avatarButtons[0])
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 2
    await waitFor(() => screen.getByText(/tell us about your child/i))
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Mia/i), 'Emma')
    fireEvent.change(screen.getByDisplayValue('Day'), { target: { value: '15' } })
    fireEvent.change(screen.getByDisplayValue('Month'), { target: { value: '6' } })
    fireEvent.change(screen.getByDisplayValue('Year'), { target: { value: '2019' } })

    await waitFor(() => expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled())
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 3: select one skill and submit
    await waitFor(() => screen.getByText(/what should they focus on/i))
    const skillButtons = screen.getAllByRole('button').filter(
      (b) => b.getAttribute('type') === 'button' && !b.textContent?.includes('Create') && !b.textContent?.includes('Back')
    )
    await userEvent.click(skillButtons[0])

    await userEvent.click(screen.getByRole('button', { name: /create profile/i }))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1)
      expect(mockNavigate).toHaveBeenCalledWith('/app/children/success/child-new')
    })
  })
})
