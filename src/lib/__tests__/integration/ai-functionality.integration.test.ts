/**
 * AI Functionality Integration Tests
 * 
 * Tests AI features including:
 * - Tag suggestion
 * - Note summarization
 * - AI formatting
 * - AI Q&A
 * - Semantic search
 * - API configuration
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { suggestTags, summarizeNote, semanticSearch, answerQuery, generateNoteEmbedding } from '@/lib/actions/ai';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Mock auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

// Mock DeepSeek API
vi.mock('@/lib/ai/deepseek', () => ({
  simpleChat: vi.fn(),
  callDeepSeekWithRetry: vi.fn(),
  DeepSeekError: class DeepSeekError extends Error {
    constructor(message: string, public statusCode?: number, public response?: any) {
      super(message);
      this.name = 'DeepSeekError';
    }
  },
}));

const mockUserId = 'test-user-id';
const mockSession = {
  user: {
    id: mockUserId,
    email: 'test@example.com',
    name: 'Test User',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

describe('AI Functionality Integration Tests', () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Tag Suggestion (Requirement 6.2)', () => {
    it('should suggest relevant tags for note content', async () => {
      const { simpleChat } = await import('@/lib/ai/deepseek');
      vi.mocked(simpleChat).mockResolvedValue('技术,编程,JavaScript,前端,React');

      const result = await suggestTags(
        'This is a note about React hooks and state management',
        'React Hooks Guide'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(Array);
        expect(result.data.length).toBeGreaterThan(0);
        expect(result.data.length).toBeLessThanOrEqual(5);
        result.data.forEach(tag => {
          expect(typeof tag).toBe('string');
          expect(tag.length).toBeGreaterThan(0);
          expect(tag.length).toBeLessThanOrEqual(20);
        });
      }
    });

    it('should handle AI service errors gracefully', async () => {
      const { simpleChat, DeepSeekError } = await import('@/lib/ai/deepseek');
      vi.mocked(simpleChat).mockRejectedValue(
        new DeepSeekError('API rate limit exceeded', 429)
      );

      const result = await suggestTags('Test content');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('AI 服务错误');
      }
    });

    it('should handle empty or invalid responses', async () => {
      const { simpleChat } = await import('@/lib/ai/deepseek');
      vi.mocked(simpleChat).mockResolvedValue('');

      const result = await suggestTags('Test content');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('未能生成有效的标签');
      }
    });

    it('should limit tags to maximum of 5', async () => {
      const { simpleChat } = await import('@/lib/ai/deepseek');
      vi.mocked(simpleChat).mockResolvedValue('tag1,tag2,tag3,tag4,tag5,tag6,tag7,tag8');

      const result = await suggestTags('Test content');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('Note Summarization (Requirement 6.1)', () => {
    it('should generate summary for long notes', async () => {
      const { simpleChat } = await import('@/lib/ai/deepseek');
      const mockSummary = 'This is a concise summary of the note content.';
      vi.mocked(simpleChat).mockResolvedValue(mockSummary);

      const longContent = 'Lorem ipsum '.repeat(100);
      const result = await summarizeNote(longContent);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(mockSummary);
        expect(result.data.length).toBeGreaterThan(0);
      }
    });

    it('should handle summarization errors', async () => {
      const { simpleChat, DeepSeekError } = await import('@/lib/ai/deepseek');
      vi.mocked(simpleChat).mockRejectedValue(
        new DeepSeekError('Service unavailable', 503)
      );

      const result = await summarizeNote('Test content');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('AI 服务错误');
      }
    });

    it('should reject empty summaries', async () => {
      const { simpleChat } = await import('@/lib/ai/deepseek');
      vi.mocked(simpleChat).mockResolvedValue('   ');

      const result = await summarizeNote('Test content');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('未能生成有效的摘要');
      }
    });
  });

  describe('Semantic Search (Requirement 6.4)', () => {
    beforeEach(async () => {
      // Clean up test data
      await prisma.note.deleteMany({
        where: { userId: mockUserId },
      });

      // Create test notes
      await prisma.note.createMany({
        data: [
          {
            id: 'note-1',
            userId: mockUserId,
            ownerId: mockUserId,
            title: 'React Hooks',
            content: 'React hooks are functions that let you use state and other React features',
            embedding: null,
          },
          {
            id: 'note-2',
            userId: mockUserId,
            ownerId: mockUserId,
            title: 'Vue Composition API',
            content: 'Vue 3 composition API provides better code organization',
            embedding: null,
          },
          {
            id: 'note-3',
            userId: mockUserId,
            ownerId: mockUserId,
            title: 'Angular Components',
            content: 'Angular uses components as the basic building blocks',
            embedding: null,
          },
        ],
      });
    });

    afterEach(async () => {
      await prisma.note.deleteMany({
        where: { userId: mockUserId },
      });
    });

    it('should find relevant notes using semantic search', async () => {
      const result = await semanticSearch('React hooks', 5);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(Array);
        expect(result.data.length).toBeGreaterThan(0);
        
        // Check result structure
        result.data.forEach(note => {
          expect(note).toHaveProperty('id');
          expect(note).toHaveProperty('title');
          expect(note).toHaveProperty('content');
          expect(note).toHaveProperty('similarity');
          expect(typeof note.similarity).toBe('number');
          expect(note.similarity).toBeGreaterThan(0);
          expect(note.similarity).toBeLessThanOrEqual(1);
        });

        // Results should be sorted by similarity
        for (let i = 1; i < result.data.length; i++) {
          expect(result.data[i - 1].similarity).toBeGreaterThanOrEqual(
            result.data[i].similarity
          );
        }
      }
    });

    it('should respect limit parameter', async () => {
      const result = await semanticSearch('components', 2);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBeLessThanOrEqual(2);
      }
    });

    it('should require authentication', async () => {
      vi.mocked(auth).mockResolvedValue(undefined as any);

      const result = await semanticSearch('test query');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('未授权');
      }
    });

    it('should filter out low similarity results', async () => {
      const result = await semanticSearch('completely unrelated query xyz123', 10);

      expect(result.success).toBe(true);
      if (result.success) {
        // All results should have similarity > 0.1
        result.data.forEach(note => {
          expect(note.similarity).toBeGreaterThan(0.1);
        });
      }
    });
  });

  describe('AI Q&A (Requirement 6.4)', () => {
    beforeEach(async () => {
      await prisma.note.deleteMany({
        where: { userId: mockUserId },
      });

      await prisma.note.create({
        data: {
          id: 'qa-note-1',
          userId: mockUserId,
          ownerId: mockUserId,
          title: 'Project Setup Guide',
          content: 'To set up the project, run npm install and then npm run dev',
          embedding: null,
        },
      });
    });

    afterEach(async () => {
      await prisma.note.deleteMany({
        where: { userId: mockUserId },
      });
    });

    it('should answer questions based on note content', async () => {
      const { simpleChat } = await import('@/lib/ai/deepseek');
      const mockAnswer = 'To set up the project, you need to run npm install followed by npm run dev.';
      vi.mocked(simpleChat).mockResolvedValue(mockAnswer);

      const result = await answerQuery('How do I set up the project?', 5);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.answer).toBe(mockAnswer);
        expect(result.data.relatedNotes).toBeInstanceOf(Array);
        
        result.data.relatedNotes.forEach(note => {
          expect(note).toHaveProperty('id');
          expect(note).toHaveProperty('title');
          expect(note).toHaveProperty('similarity');
        });
      }
    });

    it('should handle queries with no relevant notes', async () => {
      await prisma.note.deleteMany({
        where: { userId: mockUserId },
      });

      const result = await answerQuery('What is quantum physics?', 5);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.answer).toContain('没有找到');
        expect(result.data.relatedNotes).toHaveLength(0);
      }
    });

    it('should require authentication', async () => {
      vi.mocked(auth).mockResolvedValue(undefined as any);

      const result = await answerQuery('test question');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('未授权');
      }
    });
  });

  describe('Note Embedding Generation (Requirement 6.4)', () => {
    let testNoteId: string;

    beforeEach(async () => {
      await prisma.note.deleteMany({
        where: { userId: mockUserId },
      });

      const note = await prisma.note.create({
        data: {
          userId: mockUserId,
          ownerId: mockUserId,
          title: 'Test Note',
          content: 'This is test content for embedding generation',
          embedding: null,
        },
      });
      testNoteId = note.id;
    });

    afterEach(async () => {
      await prisma.note.deleteMany({
        where: { userId: mockUserId },
      });
    });

    it('should generate and save embedding for note', async () => {
      const result = await generateNoteEmbedding(testNoteId);

      expect(result.success).toBe(true);

      // Verify embedding was saved
      const updatedNote = await prisma.note.findUnique({
        where: { id: testNoteId },
      });

      expect(updatedNote?.embedding).not.toBeNull();
      
      if (updatedNote?.embedding) {
        const embedding = JSON.parse(updatedNote.embedding);
        expect(Array.isArray(embedding)).toBe(true);
        expect(embedding.length).toBe(384); // Standard embedding dimension
      }
    });

    it('should require authentication', async () => {
      vi.mocked(auth).mockResolvedValue(undefined as any);

      const result = await generateNoteEmbedding(testNoteId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('未授权');
      }
    });

    it('should handle non-existent notes', async () => {
      const result = await generateNoteEmbedding('non-existent-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('笔记不存在');
      }
    });
  });

  describe('AI Configuration (Requirement 6.5)', () => {
    it('should handle missing API configuration', async () => {
      const { simpleChat, DeepSeekError } = await import('@/lib/ai/deepseek');
      vi.mocked(simpleChat).mockRejectedValue(
        new DeepSeekError('API key 未配置，请在设置中配置')
      );

      const result = await suggestTags('test content');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('API key');
      }
    });

    it('should use server-side API key when user key not configured', async () => {
      const { simpleChat } = await import('@/lib/ai/deepseek');
      vi.mocked(simpleChat).mockResolvedValue('tag1,tag2,tag3');

      const result = await suggestTags('test content');

      // Should succeed using server-side configuration
      expect(result.success).toBe(true);
    });
  });
});
