import { vi } from 'vitest'

export const NextResponse = {
  json: vi.fn((data: any, init?: ResponseInit) => ({
    json: async () => data,
    ...init,
  })),
  redirect: vi.fn((url: string, init?: ResponseInit) => ({
    url,
    ...init,
  })),
  next: vi.fn(() => ({})),
}

export class NextRequest {
  constructor(public url: string, public init?: RequestInit) {}
}

export const userAgent = vi.fn()
