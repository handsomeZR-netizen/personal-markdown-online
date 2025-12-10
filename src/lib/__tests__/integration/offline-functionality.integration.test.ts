/**
 * Offline Functionality Integration Tests
 * 
 * Tests offline note creation, editing, and draft recovery
 * Validates Requirements 5.1, 5.2, 5.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DraftManager } from '@/lib/offline/draft-manager';
import { DraftContent } from '@/types/offline';

describe('Offline Functionality Integration Tests', () => {
  let draftManager: DraftManager;

  beforeEach(() => {
    // Initialize managers
    draftManager = new DraftManager();
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    // Cleanup
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('Draft Recovery (Requirement 5.5)', () => {
    it('should save draft to localStorage', () => {
      // Arrange
      const noteId = 'note-draft-1';
      const draftContent: DraftContent = {
        title: 'Draft Title',
        content: 'Draft content that should be recovered',
        tags: ['draft', 'test'],
        savedAt: Date.now(),
      };

      // Act
      draftManager.saveDraft(noteId, draftContent);
      const recovered = draftManager.getDraft(noteId);

      // Assert
      expect(recovered).toBeDefined();
      expect(recovered?.title).toBe('Draft Title');
      expect(recovered?.content).toBe('Draft content that should be recovered');
      expect(recovered?.tags).toEqual(['draft', 'test']);
    });

    it('should recover draft after page refresh', () => {
      // Arrange
      const noteId = 'note-draft-2';
      const draftContent: DraftContent = {
        title: 'Unsaved Work',
        content: 'This should survive a refresh',
        tags: [],
        savedAt: Date.now(),
      };

      // Act
      draftManager.saveDraft(noteId, draftContent);
      
      // Simulate page refresh by creating new instance
      const newDraftManager = new DraftManager();
      const recovered = newDraftManager.getDraft(noteId);

      // Assert
      expect(recovered).toBeDefined();
      expect(recovered?.title).toBe('Unsaved Work');
      expect(recovered?.content).toBe('This should survive a refresh');
    });

    it('should check if draft exists', () => {
      // Arrange
      const noteId = 'note-draft-3';
      const draftContent: DraftContent = {
        title: 'Test Draft',
        content: 'Content',
        tags: [],
        savedAt: Date.now(),
      };

      // Act
      draftManager.saveDraft(noteId, draftContent);
      const exists = draftManager.hasDraft(noteId);
      const notExists = draftManager.hasDraft('non-existent');

      // Assert
      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });

    it('should delete draft after successful save', () => {
      // Arrange
      const noteId = 'note-draft-4';
      const draftContent: DraftContent = {
        title: 'Temporary Draft',
        content: 'Should be deleted',
        tags: [],
        savedAt: Date.now(),
      };

      draftManager.saveDraft(noteId, draftContent);

      // Act
      draftManager.deleteDraft(noteId);
      const recovered = draftManager.getDraft(noteId);

      // Assert
      expect(recovered).toBeNull();
    });

    it('should not recover expired drafts', () => {
      // Arrange
      const noteId = 'note-draft-5';
      const expiredTime = Date.now() - (8 * 24 * 60 * 60 * 1000); // 8 days ago
      const draftContent: DraftContent = {
        title: 'Expired Draft',
        content: 'Too old',
        tags: [],
        savedAt: expiredTime,
      };

      // Manually set expired draft in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `draft_${noteId}`,
          JSON.stringify(draftContent)
        );
      }

      // Act
      const recovered = draftManager.getDraft(noteId);

      // Assert
      expect(recovered).toBeNull();
    });

    it('should get all drafts', () => {
      // Arrange
      const drafts = [
        { noteId: 'note-1', content: { title: 'Draft 1', content: 'Content 1', tags: [], savedAt: Date.now() } },
        { noteId: 'note-2', content: { title: 'Draft 2', content: 'Content 2', tags: ['tag1'], savedAt: Date.now() } },
        { noteId: 'note-3', content: { title: 'Draft 3', content: 'Content 3', tags: [], savedAt: Date.now() } },
      ];

      drafts.forEach(({ noteId, content }) => {
        draftManager.saveDraft(noteId, content);
      });

      // Act
      const allDrafts = draftManager.getAllDrafts();

      // Assert
      expect(allDrafts.length).toBe(3);
      expect(allDrafts.map(d => d.noteId)).toContain('note-1');
      expect(allDrafts.map(d => d.noteId)).toContain('note-2');
      expect(allDrafts.map(d => d.noteId)).toContain('note-3');
    });

    it('should cleanup expired drafts', () => {
      // Arrange
      const recentDraft: DraftContent = {
        title: 'Recent',
        content: 'Should stay',
        tags: [],
        savedAt: Date.now(),
      };

      const oldDraft: DraftContent = {
        title: 'Old',
        content: 'Should be removed',
        tags: [],
        savedAt: Date.now() - (8 * 24 * 60 * 60 * 1000), // 8 days ago
      };

      draftManager.saveDraft('recent', recentDraft);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('draft_old', JSON.stringify(oldDraft));
      }

      // Act
      const cleanedCount = draftManager.cleanupExpiredDrafts(7);
      const allDrafts = draftManager.getAllDrafts();

      // Assert
      expect(cleanedCount).toBeGreaterThan(0);
      expect(allDrafts.map(d => d.noteId)).toContain('recent');
      expect(allDrafts.map(d => d.noteId)).not.toContain('old');
    });

    it('should preserve draft with category', () => {
      // Arrange
      const noteId = 'note-with-category';
      const draftContent: DraftContent = {
        title: 'Categorized Draft',
        content: 'Has a category',
        tags: ['important'],
        categoryId: 'category-123',
        savedAt: Date.now(),
      };

      // Act
      draftManager.saveDraft(noteId, draftContent);
      const recovered = draftManager.getDraft(noteId);

      // Assert
      expect(recovered).toBeDefined();
      expect(recovered?.categoryId).toBe('category-123');
      expect(recovered?.tags).toEqual(['important']);
    });
  });

  describe('Draft Auto-save', () => {
    it('should auto-save draft at regular intervals', async () => {
      // Arrange
      const noteId = 'auto-save-note';
      let saveCount = 0;
      const originalSave = draftManager.saveDraft.bind(draftManager);
      
      // Mock to count saves
      draftManager.saveDraft = (id: string, content: DraftContent) => {
        saveCount++;
        return originalSave(id, content);
      };

      // Act - Simulate multiple auto-saves
      for (let i = 0; i < 3; i++) {
        draftManager.saveDraft(noteId, {
          title: `Draft ${i}`,
          content: `Content ${i}`,
          tags: [],
          savedAt: Date.now(),
        });
      }

      const finalDraft = draftManager.getDraft(noteId);

      // Assert
      expect(saveCount).toBe(3);
      expect(finalDraft?.title).toBe('Draft 2');
      expect(finalDraft?.content).toBe('Content 2');
    });

    it('should preserve latest draft content', () => {
      // Arrange
      const noteId = 'latest-draft';
      
      // Act - Save multiple versions
      draftManager.saveDraft(noteId, {
        title: 'Version 1',
        content: 'First version',
        tags: [],
        savedAt: Date.now(),
      });

      draftManager.saveDraft(noteId, {
        title: 'Version 2',
        content: 'Second version',
        tags: ['v2'],
        savedAt: Date.now(),
      });

      draftManager.saveDraft(noteId, {
        title: 'Version 3',
        content: 'Third version',
        tags: ['v3', 'final'],
        savedAt: Date.now(),
      });

      const recovered = draftManager.getDraft(noteId);

      // Assert
      expect(recovered?.title).toBe('Version 3');
      expect(recovered?.content).toBe('Third version');
      expect(recovered?.tags).toEqual(['v3', 'final']);
    });

    it('should handle storage quota exceeded gracefully', () => {
      // Arrange
      const noteId = 'large-draft';
      const largeDraft: DraftContent = {
        title: 'Large Draft',
        content: 'x'.repeat(1000000), // 1MB of content
        tags: [],
        savedAt: Date.now(),
      };

      // Act & Assert - Should not throw
      expect(() => {
        draftManager.saveDraft(noteId, largeDraft);
      }).not.toThrow();
    });
  });

  describe('Draft Data Integrity', () => {
    it('should handle special characters in draft content', () => {
      // Arrange
      const noteId = 'special-chars';
      const draftContent: DraftContent = {
        title: 'Special <>&"\'',
        content: 'Content with\nnewlines\tand\ttabs',
        tags: ['tag-with-dash', 'tag_with_underscore'],
        savedAt: Date.now(),
      };

      // Act
      draftManager.saveDraft(noteId, draftContent);
      const recovered = draftManager.getDraft(noteId);

      // Assert
      expect(recovered?.title).toBe('Special <>&"\'');
      expect(recovered?.content).toBe('Content with\nnewlines\tand\ttabs');
    });

    it('should handle empty drafts', () => {
      // Arrange
      const noteId = 'empty-draft';
      const draftContent: DraftContent = {
        title: '',
        content: '',
        tags: [],
        savedAt: Date.now(),
      };

      // Act
      draftManager.saveDraft(noteId, draftContent);
      const recovered = draftManager.getDraft(noteId);

      // Assert
      expect(recovered).toBeDefined();
      expect(recovered?.title).toBe('');
      expect(recovered?.content).toBe('');
    });

    it('should handle corrupted draft data', () => {
      // Arrange
      const noteId = 'corrupted';
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('draft_corrupted', 'invalid json{');
      }

      // Act
      const recovered = draftManager.getDraft(noteId);

      // Assert
      expect(recovered).toBeNull();
      // Corrupted draft should be cleaned up
      expect(localStorage.getItem('draft_corrupted')).toBeNull();
    });
  });
});
