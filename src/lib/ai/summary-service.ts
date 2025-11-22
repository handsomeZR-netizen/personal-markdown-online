/**
 * AI 摘要生成服务
 * 使用 DeepSeek API 为笔记内容生成简洁摘要
 */

import { simpleChat, DeepSeekError } from './deepseek';

export class SummaryService {
  private readonly MIN_CONTENT_LENGTH = 200;
  private readonly MAX_SUMMARY_LENGTH = 100;

  /**
   * 生成笔记摘要
   * @param content - 笔记内容
   * @returns 生成的摘要文本
   */
  async generateSummary(content: string): Promise<string> {
    // 检查内容长度
    if (!this.shouldGenerateSummary(content)) {
      return this.extractDefaultSummary(content);
    }

    try {
      // 调用 DeepSeek API 生成摘要
      const systemPrompt = '你是一个专业的文本摘要助手。请为用户提供的笔记内容生成简洁、准确的摘要。';
      const userPrompt = `请为以下笔记内容生成一个简洁的摘要（不超过${this.MAX_SUMMARY_LENGTH}字）：\n\n${content}`;

      const summary = await simpleChat(userPrompt, systemPrompt, {
        temperature: 0.3, // 较低的温度以获得更稳定的输出
        max_tokens: 200,  // 限制输出长度
      });

      // 限制摘要长度
      const trimmedSummary = summary.trim().slice(0, this.MAX_SUMMARY_LENGTH);
      
      // 如果生成的摘要为空，使用默认摘要
      if (!trimmedSummary) {
        return this.extractDefaultSummary(content);
      }

      return trimmedSummary;
    } catch (error) {
      // 错误时使用默认摘要
      console.error('生成摘要失败:', error);
      return this.extractDefaultSummary(content);
    }
  }

  /**
   * 批量生成摘要
   * @param notes - 笔记数组，包含 id 和 content
   * @returns Map<noteId, summary>
   */
  async batchGenerateSummaries(
    notes: Array<{ id: string; content: string }>
  ): Promise<Map<string, string>> {
    const summaries = new Map<string, string>();

    // 并发生成摘要，但限制并发数量
    const batchSize = 5;
    for (let i = 0; i < notes.length; i += batchSize) {
      const batch = notes.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (note) => ({
          id: note.id,
          summary: await this.generateSummary(note.content),
        }))
      );

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          summaries.set(result.value.id, result.value.summary);
        }
      });
    }

    return summaries;
  }

  /**
   * 检查是否应该生成摘要
   * @param content - 笔记内容
   * @returns 是否应该生成摘要
   */
  shouldGenerateSummary(content: string): boolean {
    return content.length >= this.MIN_CONTENT_LENGTH;
  }

  /**
   * 提取默认摘要（内容前 100 字）
   * @param content - 笔记内容
   * @returns 默认摘要
   */
  private extractDefaultSummary(content: string): string {
    // 移除多余的空白字符
    const cleanContent = content.trim().replace(/\s+/g, ' ');
    
    // 截取前 100 字
    const summary = cleanContent.slice(0, this.MAX_SUMMARY_LENGTH);
    
    // 如果截断了，添加省略号
    if (cleanContent.length > this.MAX_SUMMARY_LENGTH) {
      return summary + '...';
    }
    
    return summary;
  }
}

// 导出单例实例
export const summaryService = new SummaryService();
