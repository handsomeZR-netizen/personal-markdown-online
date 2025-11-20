import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Mock Next.js server module for next-auth
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn(),
    redirect: vi.fn(),
  },
  NextRequest: vi.fn(),
}))

// Cleanup after each test
afterEach(() => {
  cleanup()
})
