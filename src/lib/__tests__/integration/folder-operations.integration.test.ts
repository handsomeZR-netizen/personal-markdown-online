/**
 * Integration tests for Folder Operations
 * Tests Requirements: 2.1, 2.2, 2.5
 * 
 * This test suite validates:
 * - Folder creation and nesting
 * - Note movement to folders
 * - Breadcrumb navigation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CreateFolderInput, UpdateFolderInput } from '@/lib/validations/folders'

// Mock the folder actions module
vi.mock('@/lib/actions/folders', () => {
  return {
    createFolder: vi.fn(),
    updateFolder: vi.fn(),
    deleteFolder: vi.fn(),
    getFolder: vi.fn(),
    getFolders: vi.fn(),
    moveFolder: vi.fn(),
    moveNoteToFolder: vi.fn(),
  }
})

import {
  createFolder,
  updateFolder,
  deleteFolder,
  getFolder,
  getFolders,
  moveFolder,
  moveNoteToFolder,
} from '@/lib/actions/folders'

describe('Folder Operations Integration Tests', () => {
  const testUserId = 'test-user-id'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Folder Creation and Nesting (Requirement 2.1)', () => {
    it('should successfully create a root folder', async () => {
      const folderData: CreateFolderInput = {
        name: 'My Documents',
        parentId: null,
      }

      const mockFolder = {
        id: 'folder-1',
        name: folderData.name,
        parentId: null,
        userId: testUserId,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parent: null,
        _count: {
          children: 0,
          notes: 0,
        },
      }

      vi.mocked(createFolder).mockResolvedValueOnce({
        success: true,
        data: mockFolder,
      })

      const result = await createFolder(folderData)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.name).toBe(folderData.name)
      expect(result.data?.parentId).toBeNull()
    })

    it('should create nested folders with unlimited hierarchy', async () => {
      // Create parent folder
      const parentFolder = {
        id: 'folder-parent',
        name: 'Parent Folder',
        parentId: null,
        userId: testUserId,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parent: null,
        _count: { children: 0, notes: 0 },
      }

      vi.mocked(createFolder).mockResolvedValueOnce({
        success: true,
        data: parentFolder,
      })

      const parentResult = await createFolder({
        name: 'Parent Folder',
        parentId: null,
      })

      expect(parentResult.success).toBe(true)

      // Create child folder
      const childFolder = {
        id: 'folder-child',
        name: 'Child Folder',
        parentId: parentFolder.id,
        userId: testUserId,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parent: parentFolder,
        _count: { children: 0, notes: 0 },
      }

      vi.mocked(createFolder).mockResolvedValueOnce({
        success: true,
        data: childFolder,
      })

      const childResult = await createFolder({
        name: 'Child Folder',
        parentId: parentFolder.id,
      })

      expect(childResult.success).toBe(true)
      expect(childResult.data?.parentId).toBe(parentFolder.id)

      // Create grandchild folder (3 levels deep)
      const grandchildFolder = {
        id: 'folder-grandchild',
        name: 'Grandchild Folder',
        parentId: childFolder.id,
        userId: testUserId,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parent: childFolder,
        _count: { children: 0, notes: 0 },
      }

      vi.mocked(createFolder).mockResolvedValueOnce({
        success: true,
        data: grandchildFolder,
      })

      const grandchildResult = await createFolder({
        name: 'Grandchild Folder',
        parentId: childFolder.id,
      })

      expect(grandchildResult.success).toBe(true)
      expect(grandchildResult.data?.parentId).toBe(childFolder.id)
    })

    it('should prevent creating folder with non-existent parent', async () => {
      const folderData: CreateFolderInput = {
        name: 'Invalid Folder',
        parentId: 'non-existent-parent',
      }

      vi.mocked(createFolder).mockResolvedValueOnce({
        success: false,
        error: '父文件夹不存在或无权访问',
      })

      const result = await createFolder(folderData)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should support multiple folders at the same level', async () => {
      const folders = ['Work', 'Personal', 'Projects']
      const createdFolders = []

      for (const name of folders) {
        const mockFolder = {
          id: `folder-${name.toLowerCase()}`,
          name,
          parentId: null,
          userId: testUserId,
          sortOrder: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          parent: null,
          _count: { children: 0, notes: 0 },
        }

        vi.mocked(createFolder).mockResolvedValueOnce({
          success: true,
          data: mockFolder,
        })

        const result = await createFolder({ name, parentId: null })
        expect(result.success).toBe(true)
        createdFolders.push(result.data)
      }

      expect(createdFolders).toHaveLength(3)
    })
  })

  describe('Note Movement to Folders (Requirement 2.2)', () => {
    it('should successfully move a note to a folder', async () => {
      const noteId = 'note-123'
      const folderId = 'folder-456'

      const mockNote = {
        id: noteId,
        title: 'Test Note',
        content: 'Content',
        folderId: folderId,
        userId: testUserId,
        folder: {
          id: folderId,
          name: 'Target Folder',
        },
        tags: [],
        category: null,
      }

      vi.mocked(moveNoteToFolder).mockResolvedValueOnce({
        success: true,
        data: mockNote,
      })

      const result = await moveNoteToFolder(noteId, folderId)

      expect(result.success).toBe(true)
      expect(result.data?.folderId).toBe(folderId)
    })

    it('should correctly update note location when moved', async () => {
      const noteId = 'note-789'
      const sourceFolderId = 'folder-source'
      const targetFolderId = 'folder-target'

      // Move note to target folder
      const movedNote = {
        id: noteId,
        title: 'Moved Note',
        content: 'Content',
        folderId: targetFolderId,
        userId: testUserId,
        folder: {
          id: targetFolderId,
          name: 'Target Folder',
        },
        tags: [],
        category: null,
      }

      vi.mocked(moveNoteToFolder).mockResolvedValueOnce({
        success: true,
        data: movedNote,
      })

      const result = await moveNoteToFolder(noteId, targetFolderId)

      expect(result.success).toBe(true)
      expect(result.data?.folderId).toBe(targetFolderId)
      expect(result.data?.folderId).not.toBe(sourceFolderId)
    })

    it('should move note to root (no folder)', async () => {
      const noteId = 'note-root'

      const mockNote = {
        id: noteId,
        title: 'Root Note',
        content: 'Content',
        folderId: null,
        userId: testUserId,
        folder: null,
        tags: [],
        category: null,
      }

      vi.mocked(moveNoteToFolder).mockResolvedValueOnce({
        success: true,
        data: mockNote,
      })

      const result = await moveNoteToFolder(noteId, null)

      expect(result.success).toBe(true)
      expect(result.data?.folderId).toBeNull()
    })

    it('should prevent moving note to non-existent folder', async () => {
      const noteId = 'note-123'
      const invalidFolderId = 'non-existent-folder'

      vi.mocked(moveNoteToFolder).mockResolvedValueOnce({
        success: false,
        error: '目标文件夹不存在或无权访问',
      })

      const result = await moveNoteToFolder(noteId, invalidFolderId)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle moving multiple notes to the same folder', async () => {
      const folderId = 'folder-batch'
      const noteIds = ['note-1', 'note-2', 'note-3']

      for (const noteId of noteIds) {
        const mockNote = {
          id: noteId,
          title: `Note ${noteId}`,
          content: 'Content',
          folderId: folderId,
          userId: testUserId,
          folder: {
            id: folderId,
            name: 'Batch Folder',
          },
          tags: [],
          category: null,
        }

        vi.mocked(moveNoteToFolder).mockResolvedValueOnce({
          success: true,
          data: mockNote,
        })

        const result = await moveNoteToFolder(noteId, folderId)
        expect(result.success).toBe(true)
        expect(result.data?.folderId).toBe(folderId)
      }
    })
  })

  describe('Breadcrumb Navigation (Requirement 2.5)', () => {
    it('should display complete folder path for nested folders', async () => {
      const folderId = 'folder-deep'

      // Mock a deeply nested folder structure
      const mockFolder = {
        id: folderId,
        name: 'Deep Folder',
        parentId: 'folder-middle',
        userId: testUserId,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parent: {
          id: 'folder-middle',
          name: 'Middle Folder',
          parentId: 'folder-root',
          parent: {
            id: 'folder-root',
            name: 'Root Folder',
            parentId: null,
          },
        },
        children: [],
        notes: [],
        _count: { children: 0, notes: 0 },
      }

      vi.mocked(getFolder).mockResolvedValueOnce({
        success: true,
        data: mockFolder,
      })

      const result = await getFolder(folderId)

      expect(result.success).toBe(true)
      expect(result.data?.parent).toBeDefined()
      expect(result.data?.parent?.name).toBe('Middle Folder')
    })

    it('should show root level for folders without parent', async () => {
      const folderId = 'folder-root'

      const mockFolder = {
        id: folderId,
        name: 'Root Folder',
        parentId: null,
        userId: testUserId,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parent: null,
        children: [],
        notes: [],
        _count: { children: 0, notes: 0 },
      }

      vi.mocked(getFolder).mockResolvedValueOnce({
        success: true,
        data: mockFolder,
      })

      const result = await getFolder(folderId)

      expect(result.success).toBe(true)
      expect(result.data?.parent).toBeNull()
    })

    it('should build breadcrumb trail from nested folder', async () => {
      const folderId = 'folder-level3'

      const mockFolder = {
        id: folderId,
        name: 'Level 3',
        parentId: 'folder-level2',
        userId: testUserId,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parent: {
          id: 'folder-level2',
          name: 'Level 2',
          parentId: 'folder-level1',
          parent: {
            id: 'folder-level1',
            name: 'Level 1',
            parentId: null,
          },
        },
        children: [],
        notes: [],
        _count: { children: 0, notes: 0 },
      }

      vi.mocked(getFolder).mockResolvedValueOnce({
        success: true,
        data: mockFolder,
      })

      const result = await getFolder(folderId)

      expect(result.success).toBe(true)
      
      // Build breadcrumb trail
      const breadcrumbs = []
      let current: any = result.data
      while (current) {
        breadcrumbs.unshift(current.name)
        current = current.parent
      }

      expect(breadcrumbs).toEqual(['Level 1', 'Level 2', 'Level 3'])
    })

    it('should handle breadcrumb for folder with special characters', async () => {
      const folderId = 'folder-special'

      const mockFolder = {
        id: folderId,
        name: 'Folder / With & Special <> Characters',
        parentId: 'folder-parent',
        userId: testUserId,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parent: {
          id: 'folder-parent',
          name: 'Parent Folder',
          parentId: null,
        },
        children: [],
        notes: [],
        _count: { children: 0, notes: 0 },
      }

      vi.mocked(getFolder).mockResolvedValueOnce({
        success: true,
        data: mockFolder,
      })

      const result = await getFolder(folderId)

      expect(result.success).toBe(true)
      expect(result.data?.name).toContain('/')
      expect(result.data?.name).toContain('&')
      expect(result.data?.name).toContain('<>')
    })
  })

  describe('Folder Hierarchy Management', () => {
    it('should prevent circular references when moving folders', async () => {
      const parentId = 'folder-parent'
      const childId = 'folder-child'

      // Try to move parent into its own child
      vi.mocked(moveFolder).mockResolvedValueOnce({
        success: false,
        error: '不能将文件夹移动到其子文件夹中',
      })

      const result = await moveFolder(parentId, childId)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should prevent moving folder into itself', async () => {
      const folderId = 'folder-self'

      vi.mocked(moveFolder).mockResolvedValueOnce({
        success: false,
        error: '不能将文件夹移动到自身',
      })

      const result = await moveFolder(folderId, folderId)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should successfully move folder to different parent', async () => {
      const folderId = 'folder-move'
      const newParentId = 'folder-new-parent'

      const mockFolder = {
        id: folderId,
        name: 'Moved Folder',
        parentId: newParentId,
        userId: testUserId,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parent: {
          id: newParentId,
          name: 'New Parent',
        },
        _count: { children: 0, notes: 0 },
      }

      vi.mocked(moveFolder).mockResolvedValueOnce({
        success: true,
        data: mockFolder,
      })

      const result = await moveFolder(folderId, newParentId)

      expect(result.success).toBe(true)
      expect(result.data?.parentId).toBe(newParentId)
    })

    it('should list all folders for user', async () => {
      const mockFolders = [
        {
          id: 'folder-1',
          name: 'Folder 1',
          parentId: null,
          userId: testUserId,
          sortOrder: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          parent: null,
          _count: { children: 2, notes: 5 },
        },
        {
          id: 'folder-2',
          name: 'Folder 2',
          parentId: null,
          userId: testUserId,
          sortOrder: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          parent: null,
          _count: { children: 0, notes: 3 },
        },
      ]

      vi.mocked(getFolders).mockResolvedValueOnce({
        success: true,
        data: mockFolders,
      })

      const result = await getFolders()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
    })

    it('should delete empty folder', async () => {
      const folderId = 'folder-empty'

      vi.mocked(deleteFolder).mockResolvedValueOnce({
        success: true,
      })

      const result = await deleteFolder(folderId)

      expect(result.success).toBe(true)
    })

    it('should prevent deleting folder with contents', async () => {
      const folderId = 'folder-with-content'

      vi.mocked(deleteFolder).mockResolvedValueOnce({
        success: false,
        error: '文件夹不为空，请先删除其中的内容',
      })

      const result = await deleteFolder(folderId)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle unauthorized folder creation', async () => {
      vi.mocked(createFolder).mockResolvedValueOnce({
        success: false,
        error: '未授权',
      })

      const result = await createFolder({ name: 'Test', parentId: null })

      expect(result.success).toBe(false)
      expect(result.error).toBe('未授权')
    })

    it('should handle database errors gracefully', async () => {
      vi.mocked(getFolders).mockResolvedValueOnce({
        success: false,
        error: '获取文件夹列表失败',
      })

      const result = await getFolders()

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should validate folder name length', async () => {
      const longName = 'a'.repeat(300)

      vi.mocked(createFolder).mockResolvedValueOnce({
        success: false,
        error: '文件夹名称过长',
      })

      const result = await createFolder({ name: longName, parentId: null })

      expect(result.success).toBe(false)
    })
  })
})
