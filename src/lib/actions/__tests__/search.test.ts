/**
 * Unit tests for search functionality
 * Tests folder search, note search, and result rendering
 * Validates: Requirements 21.1, 21.2, 21.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchAll } from '../notes'

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  default: {
    from: vi.fn(),
  },
}))

// Mock Supabase notes
vi.mock('@/lib/supabase-notes', () => ({
  getUserNotes: vi.fn(),
  getNoteById: vi.fn(),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  searchNotes: vi.fn(),
}))

// Mock auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    folder: {
      findMany: vi.fn(),
    },
    note: {
      findMany: vi.fn(),
    },
  },
}))

const mockAuth = vi.mocked((await import('@/auth')).auth)
const mockPrisma = vi.mocked((await import('@/lib/prisma')).prisma)

describe('searchAll', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return empty results when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const result = await searchAll({ query: 'test' })

    expect(result).toEqual({
      folders: [],
      notes: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
    })
  })

  it('should return empty results when query is empty', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any)

    const result = await searchAll({ query: '' })

    expect(result).toEqual({
      folders: [],
      notes: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
    })
  })

  it('should search folders by name', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any)

    const mockFolders = [
      {
        id: 'folder-1',
        name: 'Test Folder',
        userId: 'user-1',
        parentId: null,
        parent: null,
        _count: { children: 2, notes: 5 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'folder-2',
        name: 'Testing Documents',
        userId: 'user-1',
        parentId: null,
        parent: null,
        _count: { children: 0, notes: 3 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockPrisma.folder.findMany.mockResolvedValue(mockFolders as any)
    mockPrisma.note.findMany.mockResolvedValue([])

    const result = await searchAll({ query: 'test' })

    expect(result.folders).toHaveLength(2)
    expect(result.folders[0].name).toBe('Test Folder')
    expect(result.folders[1].name).toBe('Testing Documents')
    expect(result.totalCount).toBe(2)
  })

  it('should search notes by title and content', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any)

    const mockNotes = [
      {
        id: 'note-1',
        title: 'Test Note',
        content: 'This is a test note',
        userId: 'user-1',
        ownerId: 'user-1',
        folder: null,
        tags: [],
        category: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'note-2',
        title: 'Another Note',
        content: 'This note contains test content',
        userId: 'user-1',
        ownerId: 'user-1',
        folder: null,
        tags: [],
        category: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockPrisma.folder.findMany.mockResolvedValue([])
    mockPrisma.note.findMany.mockResolvedValue(mockNotes as any)

    const result = await searchAll({ query: 'test' })

    expect(result.notes).toHaveLength(2)
    expect(result.notes[0].title).toBe('Test Note')
    expect(result.notes[1].content).toContain('test')
    expect(result.totalCount).toBe(2)
  })

  it('should search both folders and notes', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any)

    const mockFolders = [
      {
        id: 'folder-1',
        name: 'Project Folder',
        userId: 'user-1',
        parentId: null,
        parent: null,
        _count: { children: 1, notes: 3 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const mockNotes = [
      {
        id: 'note-1',
        title: 'Project Plan',
        content: 'Project details',
        userId: 'user-1',
        ownerId: 'user-1',
        folder: null,
        tags: [],
        category: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockPrisma.folder.findMany.mockResolvedValue(mockFolders as any)
    mockPrisma.note.findMany.mockResolvedValue(mockNotes as any)

    const result = await searchAll({ query: 'project' })

    expect(result.folders).toHaveLength(1)
    expect(result.notes).toHaveLength(1)
    expect(result.totalCount).toBe(2)
  })

  it('should paginate results correctly', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any)

    const mockFolders = Array.from({ length: 15 }, (_, i) => ({
      id: `folder-${i}`,
      name: `Test Folder ${i}`,
      userId: 'user-1',
      parentId: null,
      parent: null,
      _count: { children: 0, notes: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    }))

    mockPrisma.folder.findMany.mockResolvedValue(mockFolders as any)
    mockPrisma.note.findMany.mockResolvedValue([])

    const result = await searchAll({ query: 'test', page: 1, pageSize: 10 })

    expect(result.folders.length).toBeLessThanOrEqual(10)
    expect(result.totalCount).toBe(15)
    expect(result.totalPages).toBe(2)
    expect(result.currentPage).toBe(1)
  })

  it('should handle search errors gracefully', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any)

    mockPrisma.folder.findMany.mockRejectedValue(new Error('Database error'))

    const result = await searchAll({ query: 'test' })

    expect(result).toEqual({
      folders: [],
      notes: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
    })
  })

  it('should search case-insensitively', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any)

    const mockFolders = [
      {
        id: 'folder-1',
        name: 'UPPERCASE FOLDER',
        userId: 'user-1',
        parentId: null,
        parent: null,
        _count: { children: 0, notes: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockPrisma.folder.findMany.mockResolvedValue(mockFolders as any)
    mockPrisma.note.findMany.mockResolvedValue([])

    const result = await searchAll({ query: 'uppercase' })

    expect(result.folders).toHaveLength(1)
    expect(result.folders[0].name).toBe('UPPERCASE FOLDER')
  })

  it('should include folder hierarchy in results', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any)

    const mockFolders = [
      {
        id: 'folder-1',
        name: 'Child Folder',
        userId: 'user-1',
        parentId: 'parent-1',
        parent: {
          id: 'parent-1',
          name: 'Parent Folder',
        },
        _count: { children: 0, notes: 2 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockPrisma.folder.findMany.mockResolvedValue(mockFolders as any)
    mockPrisma.note.findMany.mockResolvedValue([])

    const result = await searchAll({ query: 'child' })

    expect(result.folders).toHaveLength(1)
    expect(result.folders[0].parent).toBeDefined()
    expect(result.folders[0].parent?.name).toBe('Parent Folder')
  })

  it('should include note folder information in results', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any)

    const mockNotes = [
      {
        id: 'note-1',
        title: 'Test Note',
        content: 'Content',
        userId: 'user-1',
        ownerId: 'user-1',
        folder: {
          id: 'folder-1',
          name: 'My Folder',
        },
        tags: [],
        category: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockPrisma.folder.findMany.mockResolvedValue([])
    mockPrisma.note.findMany.mockResolvedValue(mockNotes as any)

    const result = await searchAll({ query: 'test' })

    expect(result.notes).toHaveLength(1)
    expect(result.notes[0].folder).toBeDefined()
    expect(result.notes[0].folder?.name).toBe('My Folder')
  })
})
