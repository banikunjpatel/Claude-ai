import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { customRender } from '../utils'
import LoginPage from '@/pages/auth/LoginPage'

const mockSignIn = vi.fn()
const mockNavigate = vi.fn()

vi.mock('@/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    isLoading: false,
    signIn: mockSignIn,
    signOut: vi.fn(),
  }),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('LoginPage', () => {
  beforeEach(() => {
    mockSignIn.mockReset()
    mockNavigate.mockReset()
  })

  it('renders email and password fields', () => {
    customRender(<LoginPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('shows validation errors when submitted empty', async () => {
    customRender(<LoginPage />)
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument()
    })
  })

  it('calls signIn with email and password on submit', async () => {
    mockSignIn.mockResolvedValueOnce({ user: {}, session: {} })
    customRender(<LoginPage />)

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('shows error message when signIn throws', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'))
    customRender(<LoginPage />)

    await userEvent.type(screen.getByLabelText(/email/i), 'bad@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
    })
  })

  it('renders a link to the signup page', () => {
    customRender(<LoginPage />)
    expect(screen.getByRole('link', { name: /sign up free/i })).toBeInTheDocument()
  })
})
