import { z } from 'zod';

/**
 * AI 功能相关的验证 schema
 */

export const suggestTagsSchema = z.object({
  content: z.string().min(1, '内容不能为空'),
  title: z.string().optional(),
  maxTags: z.number().min(1).max(10).optional().default(5),
});

export const summarizeNoteSchema = z.object({
  content: z.string().min(10, '内容太短，无法生成摘要'),
  maxLength: z.number().min(20).max(200).optional().default(100),
});

export const semanticSearchSchema = z.object({
  query: z.string().min(1, '搜索查询不能为空'),
  limit: z.number().min(1).max(50).optional().default(10),
});

export const answerQuerySchema = z.object({
  query: z.string().min(1, '问题不能为空'),
  maxNotes: z.number().min(1).max(20).optional().default(5),
});

export type SuggestTagsInput = z.infer<typeof suggestTagsSchema>;
export type SummarizeNoteInput = z.infer<typeof summarizeNoteSchema>;
export type SemanticSearchInput = z.infer<typeof semanticSearchSchema>;
export type AnswerQueryInput = z.infer<typeof answerQuerySchema>;
