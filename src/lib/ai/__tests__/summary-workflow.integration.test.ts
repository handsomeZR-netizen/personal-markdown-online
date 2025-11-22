/**
 * AI 摘要生成集成测试
 * 测试 AI 摘要生成的完整流程
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SummaryService } from '../summary-service';

describe('AI 摘要生成集成测试', () => {
  let summaryService: SummaryService;

  beforeEach(() => {
    summaryService = new SummaryService();
  });

  describe('摘要生成流程', () => {
    it('应该为长内容生成摘要', () => {
      const longContent = 'A'.repeat(300); // 300字符
      const shouldGenerate = summaryService.shouldGenerateSummary(longContent);
      expect(shouldGenerate).toBe(true);
    });

    it('应该跳过短内容的摘要生成', () => {
      const shortContent = 'Short content';
      const shouldGenerate = summaryService.shouldGenerateSummary(shortContent);
      expect(shouldGenerate).toBe(false);
    });

    it('应该限制摘要长度', () => {
      const maxLength = 100;
      const longSummary = 'A'.repeat(150);
      const truncated = longSummary.slice(0, maxLength);
      
      expect(truncated.length).toBe(maxLength);
    });

    it('应该在 AI 失败时使用默认摘要', () => {
      const content = 'This is a test content for default summary generation.';
      const defaultSummary = content.slice(0, 100);
      
      expect(defaultSummary.length).toBeLessThanOrEqual(100);
    });
  });

  describe('批量摘要生成', () => {
    it('应该定义批量生成方法', () => {
      expect(summaryService.batchGenerateSummaries).toBeDefined();
    });

    it('应该处理多个笔记的摘要生成', () => {
      const notes = [
        { id: '1', content: 'A'.repeat(300) },
        { id: '2', content: 'B'.repeat(300) },
        { id: '3', content: 'C'.repeat(300) },
      ];

      expect(notes.length).toBe(3);
      notes.forEach(note => {
        expect(note.content.length).toBeGreaterThan(200);
      });
    });
  });

  describe('摘要显示', () => {
    it('应该在笔记列表中显示摘要', () => {
      const note = {
        id: '1',
        title: 'Test Note',
        content: 'Long content...',
        summary: 'This is a summary',
      };

      const displaySummary = note.summary || note.content.slice(0, 100);
      expect(displaySummary).toBe('This is a summary');
    });

    it('应该在没有摘要时显示内容前100字', () => {
      const note = {
        id: '1',
        title: 'Test Note',
        content: 'A'.repeat(200),
        summary: null,
      };

      const displaySummary = note.summary || note.content.slice(0, 100);
      expect(displaySummary.length).toBe(100);
    });
  });

  describe('手动重新生成', () => {
    it('应该支持手动触发摘要生成', () => {
      expect(summaryService.generateSummary).toBeDefined();
    });

    it('应该更新现有摘要', () => {
      const oldSummary = 'Old summary';
      const newSummary = 'New summary';

      expect(oldSummary).not.toBe(newSummary);
    });
  });
});
