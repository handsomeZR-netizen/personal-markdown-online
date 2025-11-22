/**
 * SummaryService 单元测试
 * 测试 AI 摘要生成功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SummaryService } from '../summary-service';
import * as deepseek from '../deepseek';

// Mock deepseek module
vi.mock('../deepseek', () => ({
  simpleChat: vi.fn(),
  DeepSeekError: class DeepSeekError extends Error {},
}));

describe('SummaryService', () => {
  let service: SummaryService;

  beforeEach(() => {
    service = new SummaryService();
    vi.clearAllMocks();
  });

  describe('初始化', () => {
    it('应该创建 SummaryService 实例', () => {
      expect(service).toBeInstanceOf(SummaryService);
    });
  });

  describe('shouldGenerateSummary', () => {
    it('应该对短内容返回 false', () => {
      const shortContent = 'Short content';
      expect(service.shouldGenerateSummary(shortContent)).toBe(false);
    });

    it('应该对长内容返回 true', () => {
      const longContent = 'a'.repeat(200);
      expect(service.shouldGenerateSummary(longContent)).toBe(true);
    });

    it('应该对恰好 200 字的内容返回 true', () => {
      const content = 'a'.repeat(200);
      expect(service.shouldGenerateSummary(content)).toBe(true);
    });
  });

  describe('generateSummary', () => {
    it('应该对短内容返回默认摘要', async () => {
      const shortContent = 'This is a short note.';
      const summary = await service.generateSummary(shortContent);
      
      expect(summary).toBe(shortContent);
      expect(vi.mocked(deepseek.simpleChat)).not.toHaveBeenCalled();
    });

    it('应该对长内容调用 AI 生成摘要', async () => {
      const longContent = 'a'.repeat(300);
      const mockSummary = 'AI generated summary';
      
      vi.mocked(deepseek.simpleChat).mockResolvedValue(mockSummary);
      
      const summary = await service.generateSummary(longContent);
      
      expect(summary).toBe(mockSummary);
      expect(vi.mocked(deepseek.simpleChat)).toHaveBeenCalledWith(
        expect.stringContaining('请为以下笔记内容生成一个简洁的摘要'),
        expect.stringContaining('你是一个专业的文本摘要助手'),
        expect.objectContaining({
          temperature: 0.3,
          max_tokens: 200,
        })
      );
    });

    it('应该限制摘要长度为 100 字', async () => {
      const longContent = 'a'.repeat(300);
      const longSummary = 'b'.repeat(150);
      
      vi.mocked(deepseek.simpleChat).mockResolvedValue(longSummary);
      
      const summary = await service.generateSummary(longContent);
      
      expect(summary.length).toBeLessThanOrEqual(100);
    });

    it('应该在 AI 失败时返回默认摘要', async () => {
      const longContent = 'a'.repeat(300);
      
      vi.mocked(deepseek.simpleChat).mockRejectedValue(new Error('API Error'));
      
      const summary = await service.generateSummary(longContent);
      
      // 默认摘要会添加省略号
      expect(summary).toBe('a'.repeat(100) + '...');
    });

    it('应该处理空摘要响应', async () => {
      const longContent = 'Test content ' + 'a'.repeat(200);
      
      vi.mocked(deepseek.simpleChat).mockResolvedValue('   ');
      
      const summary = await service.generateSummary(longContent);
      
      // 应该返回默认摘要（包含省略号）
      expect(summary).toContain('Test content');
      expect(summary.length).toBeLessThanOrEqual(103); // 100 + '...'
    });

    it('应该为超过 100 字的内容添加省略号', async () => {
      const longContent = 'a'.repeat(150);
      const summary = await service.generateSummary(longContent);
      
      expect(summary).toMatch(/\.\.\.$/);
      expect(summary.length).toBeLessThanOrEqual(103); // 100 + '...'
    });
  });

  describe('batchGenerateSummaries', () => {
    it('应该批量生成摘要', async () => {
      const notes = [
        { id: 'note-1', content: 'a'.repeat(300) },
        { id: 'note-2', content: 'b'.repeat(300) },
        { id: 'note-3', content: 'c'.repeat(300) },
      ];

      vi.mocked(deepseek.simpleChat)
        .mockResolvedValueOnce('Summary 1')
        .mockResolvedValueOnce('Summary 2')
        .mockResolvedValueOnce('Summary 3');

      const summaries = await service.batchGenerateSummaries(notes);

      expect(summaries.size).toBe(3);
      expect(summaries.get('note-1')).toBe('Summary 1');
      expect(summaries.get('note-2')).toBe('Summary 2');
      expect(summaries.get('note-3')).toBe('Summary 3');
    });

    it('应该处理部分失败的情况', async () => {
      const notes = [
        { id: 'note-1', content: 'a'.repeat(300) },
        { id: 'note-2', content: 'b'.repeat(300) },
      ];

      vi.mocked(deepseek.simpleChat)
        .mockResolvedValueOnce('Summary 1')
        .mockRejectedValueOnce(new Error('API Error'));

      const summaries = await service.batchGenerateSummaries(notes);

      expect(summaries.size).toBe(2);
      expect(summaries.get('note-1')).toBe('Summary 1');
      // note-2 应该有默认摘要
      expect(summaries.get('note-2')).toBeDefined();
    });

    it('应该处理空数组', async () => {
      const summaries = await service.batchGenerateSummaries([]);
      expect(summaries.size).toBe(0);
    });

    it('应该分批处理大量笔记', async () => {
      const notes = Array.from({ length: 12 }, (_, i) => ({
        id: `note-${i}`,
        content: 'a'.repeat(300),
      }));

      vi.mocked(deepseek.simpleChat).mockResolvedValue('Summary');

      const summaries = await service.batchGenerateSummaries(notes);

      expect(summaries.size).toBe(12);
      // 验证调用次数（12个笔记，每批5个，应该调用12次）
      expect(vi.mocked(deepseek.simpleChat)).toHaveBeenCalledTimes(12);
    });
  });
});
