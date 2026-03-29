import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { server } from './mocks/server'

// Mock the config module so tests don't need VITE_ env vars
vi.mock('@/config', () => ({
  API_BASE_URL: 'http://localhost:8000',
}))

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
