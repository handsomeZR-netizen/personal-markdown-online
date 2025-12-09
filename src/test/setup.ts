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

// Mock Next.js cache module
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// Mock lucide-react icons - must be hoisted
vi.mock('lucide-react', async () => {
  return {
    ChevronRight: () => null,
    ChevronDown: () => null,
    Folder: () => null,
    FolderOpen: () => null,
    FileText: () => null,
    GripVertical: () => null,
    Home: () => null,
  };
});

// Mock Supabase browser client
vi.mock('@/lib/supabase-browser', () => ({
  supabaseBrowser: {
    storage: {
      from: vi.fn(),
    },
  },
}));

// Cleanup after each test
afterEach(() => {
  cleanup()
})
