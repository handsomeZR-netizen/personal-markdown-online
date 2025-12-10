/**
 * Integration Tests for Permission Management
 * Tests note permissions, collaborator roles, and public sharing
 * Validates: Requirements 4.4, 4.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkNotePermissions, requirePermission, isNoteOwner, getNoteRole } from '@/lib/permissions';
import type { NoteRole, NotePermission } from '@/lib/permissions';

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    note: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('Permission Management Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Owner Permissions (Requirement 4.4)', () => {
    it('should grant full permissions to note owner', async () => {
      const noteId = 'note-123';
      const ownerId = 'owner-1';

      vi.mocked(prisma.note.findUnique).mockResolvedValue({
        id: noteId,
        ownerId,
        userId: ownerId,
        isPublic: false,
        collaborators: [],
      } as any);

      const permissions = await checkNotePermissions(noteId, ownerId);

      expect(permissions.hasAccess).toBe(true);
      expect(permissions.canEdit).toBe(true);
      expect(permissions.canDelete).toBe(true);
      expect(permissions.canShare).toBe(true);
      expect(permissions.role).toBe('owner');
    });

    it('should allow owner to perform all operations', async () => {
      const noteId = 'note-123';
      const ownerId = 'owner-1';

      vi.mocked(prisma.note.findUnique).mockResolvedValue({
        id: noteId,
        ownerId,
        userId: ownerId,
        isPublic: false,
        collaborators: [],
      } as any);

      // Should not throw for any permission
      await expect(requirePermission(noteId, ownerId, 'view')).resolves.not.toThrow();
      await expect(requirePermission(noteId, ownerId, 'edit')).resolves.not.toThrow();
      await expect(requirePermission(noteId, ownerId, 'delete')).resolves.not.toThrow();
      await expect(requirePermission(noteId, ownerId, 'share')).resolves.not.toThrow();
    });

    it('should identify note owner correctly', async () => {
      const noteId = 'note-123';
      const ownerId = 'owner-1';

      vi.mocked(prisma.note.findUnique).mockResolvedValue({
        id: noteId,
        ownerId,
        userId: ownerId,
      } as any);

      const isOwner = await isNoteOwner(noteId, ownerId);
      expect(isOwner).toBe(true);

      const isNotOwner = await isNoteOwner(noteId, 'other-user');
      expect(isNotOwner).toBe(false);
    });
  });

  describe('Editor Permissions (Requirement 4.4)', () => {
    it('should grant edit permissions to editor role', async () => {
      const noteId = 'note-123';
      const ownerId = 'owner-1';
      const editorId = 'editor-1';

      vi.mocked(prisma.note.findUnique).mockResolvedValue({
        id: noteId,
        ownerId,
        userId: ownerId,
        isPublic: false,
        collaborators: [
          {
            userId: editorId,
            role: 'editor',
          },
        ],
      } as any);

      const permissions = await checkNotePermissions(noteId, editorId);

      expect(permissions.hasAccess).toBe(true);
      expect(permissions.canEdit).toBe(true);
      expect(permissions.canDelete).toBe(false);
      expect(permissions.canShare).toBe(false);
      expect(permissions.role).toBe('editor');
    });

    it('should allow editor to view and edit but not delete or share', async () => {
      const noteId = 'note-123';
      const ownerId = 'owner-1';
      const editorId = 'editor-1';

      vi.mocked(prisma.note.findUnique).mockResolvedValue({
        id: noteId,
        ownerId,
        userId: ownerId,
        isPublic: false,
        collaborators: [
          {
            userId: editorId,
            role: 'editor',
          },
        ],
      } as any);

      // Should allow view and edit
      await expect(requirePermission(noteId, editorId, 'view')).resolves.not.toThrow();
      await expect(requirePermission(noteId, editorId, 'edit')).resolves.not.toThrow();

      // Should deny delete and share
      await expect(requirePermission(noteId, editorId, 'delete')).rejects.toThrow();
      await expect(requirePermission(noteId, editorId, 'share')).rejects.toThrow();
    });

    it('should return editor role for editor collaborator', async () => {
      const noteId = 'note-123';
      const ownerId = 'owner-1';
      const editorId = 'editor-1';

      vi.mocked(prisma.note.findUnique).mockResolvedValue({
        id: noteId,
        ownerId,
        userId: ownerId,
        isPublic: false,
        collaborators: [
          {
            userId: editorId,
            role: 'editor',
          },
        ],
      } as any);

      const role = await getNoteRole(noteId, editorId);
      expect(role).toBe('editor');
    });
  });

  describe('Viewer Permissions (Requirement 4.4)', () => {
    it('should grant view-only permissions to viewer role', async () => {
      const noteId = 'note-123';
      const ownerId = 'owner-1';
      const viewerId = 'viewer-1';

      vi.mocked(prisma.note.findUnique).mockResolvedValue({
        id: noteId,
        ownerId,
        userId: ownerId,
        isPublic: false,
        collaborators: [
          {
            userId: viewerId,
            role: 'viewer',
          },
        ],
      } as any);

      const permissions = await checkNotePermissions(noteId, viewerId);

      expect(permissions.hasAccess).toBe(true);
      expect(permissions.canEdit).toBe(false);
      expect(permissions.canDelete).toBe(false);
      expect(permissions.canShare).toBe(false);
      expect(permissions.role).toBe('viewer');
    });

    it('should allow viewer to only view', async () => {
      const noteId = 'note-123';
      const ownerId = 'owner-1';
      const viewerId = 'viewer-1';

      vi.mocked(prisma.note.findUnique).mockResolvedValue({
        id: noteId,
        ownerId,
        userId: ownerId,
        isPublic: false,
        collaborators: [
          {
            userId: viewerId,
            role: 'viewer',
          },
        ],
      } as any);

      // Should allow view
      await expect(requirePermission(noteId, viewerId, 'view')).resolves.not.toThrow();

      // Should deny edit, delete, and share
      await expect(requirePermission(noteId, viewerId, 'edit')).rejects.toThrow();
      await expect(requirePermission(noteId, viewerId, 'delete')).rejects.toThrow();
      await expect(requirePermission(noteId, viewerId, 'share')).rejects.toThrow();
    });

    it('should return viewer role for viewer collaborator', async () => {
      const noteId = 'note-123';
      const ownerId = 'owner-1';
      const viewerId = 'viewer-1';

      vi.mocked(prisma.note.findUnique).mockResolvedValue({
        id: noteId,
        ownerId,
        userId: ownerId,
        isPublic: false,
        collaborators: [
          {
            userId: viewerId,
            role: 'viewer',
          },
        ],
      } as any);

      const role = await getNoteRole(noteId, viewerId);
      expect(role).toBe('viewer');
    });
  });

  describe('Public Note Permissions (Requirement 4.5)', () => {
    it('should grant view-only access to public notes', async () => {
      const noteId = 'note-123';
      const ownerId = 'owner-1';
      const anonymousUserId = 'anonymous-1';

      vi.mocked(prisma.note.findUnique).mockResolvedValue({
        id: noteId,
        ownerId,
        userId: ownerId,
        isPublic: true,
        collaborators: [],
      } as any);

      const permissions = await checkNotePermissions(noteId, anonymousUserId);

      expect(permissions.hasAccess).toBe(true);
      expect(permissions.canEdit).toBe(false);
      expect(permissions.canDelete).toBe(false);
      expect(permissions.canShare).toBe(false);
      expect(permissions.role).toBe('viewer');
    });

    it('should allow anyone to view public notes', async () => {
      const noteId = 'note-123';
      const ownerId = 'owner-1';
      const randomUserId = 'random-user';

      vi.mocked(prisma.note.findUnique).mockResolvedValue({
        id: noteId,
        ownerId,
        userId: ownerId,
        isPublic: true,
        collaborators: [],
      } as any);

      await expect(requirePermission(noteId, randomUserId, 'view')).resolves.not.toThrow();
    });

    it('should deny edit access to public notes for non-collaborators', async () => {
      const noteId = 'note-123';
      const ownerId = 'owner-1';
      const randomUserId = 'random-user';

      vi.mocked(prisma.note.findUnique).mockResolvedValue({
        id: noteId,
        ownerId,
        userId: ownerId,
        isPublic: true,
        collaborators: [],
      } as any);

      await expect(requirePermission(noteId, randomUserId, 'edit')).rejects.toThrow();
    });
  });

  describe('No Access Permissions', () => {
    it('should deny all access to private notes for non-collaborators', async () => {
      const noteId = 'note-123';
      const ownerId = 'owner-1';
      const unauthorizedUserId = 'unauthorized-1';

      vi.mocked(prisma.note.findUnique).mockResolvedValue({
        id: noteId,
        ownerId,
        userId: ownerId,
        isPublic: false,
        collaborators: [],
      } as any);

      const permissions = await checkNotePermissions(noteId, unauthorizedUserId);

      expect(permissions.hasAccess).toBe(false);
      expect(permissions.canEdit).toBe(false);
      expect(permissions.canDelete).toBe(false);
      expect(permissions.canShare).toBe(false);
      expect(permissions.role).toBeNull();
    });

    it('should throw error when unauthorized user tries to access', async () => {
      const noteId = 'note-123';
      const ownerId = 'owner-1';
      const unauthorizedUserId = 'unauthorized-1';

      vi.mocked(prisma.note.findUnique).mockResolvedValue({
        id: noteId,
        ownerId,
        userId: ownerId,
        isPublic: false,
        collaborators: [],
      } as any);

      await expect(requirePermission(noteId, unauthorizedUserId, 'view')).rejects.toThrow(
        'You do not have permission to view this note'
      );
    });

    it('should return null role for unauthorized users', async () => {
      const noteId = 'note-123';
      const ownerId = 'owner-1';
      const unauthorizedUserId = 'unauthorized-1';

      vi.mocked(prisma.note.findUnique).mockResolvedValue({
        id: noteId,
        ownerId,
        userId: ownerId,
        isPublic: false,
        collaborators: [],
      } as any);

      const role = await getNoteRole(noteId, unauthorizedUserId);
      expect(role).toBeNull();
    });
  });

  describe('Non-existent Note', () => {
    it('should deny access to non-existent notes', async () => {
      const noteId = 'non-existent';
      const userId = 'user-1';

      vi.mocked(prisma.note.findUnique).mockResolvedValue(null);

      const permissions = await checkNotePermissions(noteId, userId);

      expect(permissions.hasAccess).toBe(false);
      expect(permissions.canEdit).toBe(false);
      expect(permissions.canDelete).toBe(false);
      expect(permissions.canShare).toBe(false);
      expect(permissions.role).toBeNull();
    });

    it('should return false for isNoteOwner on non-existent note', async () => {
      const noteId = 'non-existent';
      const userId = 'user-1';

      vi.mocked(prisma.note.findUnique).mockResolvedValue(null);

      const isOwner = await isNoteOwner(noteId, userId);
      expect(isOwner).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const noteId = 'note-123';
      const userId = 'user-1';

      vi.mocked(prisma.note.findUnique).mockRejectedValue(new Error('Database error'));

      const permissions = await checkNotePermissions(noteId, userId);

      // Should return no access on error
      expect(permissions.hasAccess).toBe(false);
      expect(permissions.role).toBeNull();
    });

    it('should provide clear error messages for permission denials', async () => {
      const noteId = 'note-123';
      const ownerId = 'owner-1';
      const viewerId = 'viewer-1';

      vi.mocked(prisma.note.findUnique).mockResolvedValue({
        id: noteId,
        ownerId,
        userId: ownerId,
        isPublic: false,
        collaborators: [
          {
            userId: viewerId,
            role: 'viewer',
          },
        ],
      } as any);

      await expect(requirePermission(noteId, viewerId, 'edit')).rejects.toThrow(
        'You do not have permission to edit this note'
      );

      await expect(requirePermission(noteId, viewerId, 'delete')).rejects.toThrow(
        'You do not have permission to delete this note'
      );

      await expect(requirePermission(noteId, viewerId, 'share')).rejects.toThrow(
        'You do not have permission to share this note'
      );
    });
  });

  describe('Permission Hierarchy', () => {
    it('should respect permission hierarchy: owner > editor > viewer', async () => {
      const noteId = 'note-123';
      const ownerId = 'owner-1';
      const editorId = 'editor-1';
      const viewerId = 'viewer-1';

      // Owner permissions
      vi.mocked(prisma.note.findUnique).mockResolvedValue({
        id: noteId,
        ownerId,
        userId: ownerId,
        isPublic: false,
        collaborators: [],
      } as any);

      const ownerPerms = await checkNotePermissions(noteId, ownerId);
      const ownerScore = 
        (ownerPerms.hasAccess ? 1 : 0) +
        (ownerPerms.canEdit ? 1 : 0) +
        (ownerPerms.canDelete ? 1 : 0) +
        (ownerPerms.canShare ? 1 : 0);

      // Editor permissions
      vi.mocked(prisma.note.findUnique).mockResolvedValue({
        id: noteId,
        ownerId,
        userId: ownerId,
        isPublic: false,
        collaborators: [{ userId: editorId, role: 'editor' }],
      } as any);

      const editorPerms = await checkNotePermissions(noteId, editorId);
      const editorScore = 
        (editorPerms.hasAccess ? 1 : 0) +
        (editorPerms.canEdit ? 1 : 0) +
        (editorPerms.canDelete ? 1 : 0) +
        (editorPerms.canShare ? 1 : 0);

      // Viewer permissions
      vi.mocked(prisma.note.findUnique).mockResolvedValue({
        id: noteId,
        ownerId,
        userId: ownerId,
        isPublic: false,
        collaborators: [{ userId: viewerId, role: 'viewer' }],
      } as any);

      const viewerPerms = await checkNotePermissions(noteId, viewerId);
      const viewerScore = 
        (viewerPerms.hasAccess ? 1 : 0) +
        (viewerPerms.canEdit ? 1 : 0) +
        (viewerPerms.canDelete ? 1 : 0) +
        (viewerPerms.canShare ? 1 : 0);

      // Verify hierarchy
      expect(ownerScore).toBeGreaterThan(editorScore);
      expect(editorScore).toBeGreaterThan(viewerScore);
    });
  });

  describe('Role Types', () => {
    it('should support all defined role types', () => {
      const roles: NoteRole[] = ['owner', 'editor', 'viewer', null];
      
      expect(roles).toContain('owner');
      expect(roles).toContain('editor');
      expect(roles).toContain('viewer');
      expect(roles).toContain(null);
    });

    it('should have correct permission structure', () => {
      const permission: NotePermission = {
        hasAccess: true,
        canEdit: true,
        canDelete: false,
        canShare: false,
        role: 'editor',
      };

      expect(permission).toHaveProperty('hasAccess');
      expect(permission).toHaveProperty('canEdit');
      expect(permission).toHaveProperty('canDelete');
      expect(permission).toHaveProperty('canShare');
      expect(permission).toHaveProperty('role');
    });
  });
});
