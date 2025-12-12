'use client';

import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * 预处理 LaTeX 公式格式
 * 将 AI 常用的 \[...\] 和 \(...\) 格式转换为标准的 $$...$$ 和 $...$ 格式
 */
function preprocessLatex(content: string): string {
  if (!content) return content;
  
  // 将 \[...\] 转换为 $$...$$（块级公式）
  let processed = content.replace(/\\\[([\s\S]*?)\\\]/g, (_, formula) => {
    return `$$${formula.trim()}$$`;
  });
  
  // 将 \(...\) 转换为 $...$（行内公式）
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_, formula) => {
    return `$${formula.trim()}$`;
  });
  
  // 处理 [ ... ] 格式（某些 AI 模型使用的格式，但要避免误匹配普通方括号）
  // 只匹配包含 LaTeX 命令的方括号内容
  processed = processed.replace(/\[\s*(\\[a-zA-Z]+[\s\S]*?)\s*\]/g, (match, formula) => {
    // 检查是否包含 LaTeX 命令
    if (/\\[a-zA-Z]+/.test(formula)) {
      return `$$${formula.trim()}$$`;
    }
    return match;
  });
  
  return processed;
}

/**
 * Markdown 渲染组件
 * 支持 GFM、数学公式（KaTeX）、代码高亮
 */
export const MarkdownRenderer = memo(function MarkdownRenderer({ 
  content, 
  className 
}: MarkdownRendererProps) {
  // 预处理 LaTeX 公式格式
  const processedContent = useMemo(() => preprocessLatex(content), [content]);
  const components = useMemo(() => ({
    // 自定义代码块渲染
    code: ({ className: codeClassName, children, ...props }: React.ComponentProps<'code'> & { inline?: boolean }) => {
      const match = /language-(\w+)/.exec(codeClassName || '');
      const isInline = !match;
      
      if (isInline) {
        return (
          <code 
            className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono" 
            {...props}
          >
            {children}
          </code>
        );
      }
      
      return (
        <code className={codeClassName} {...props}>
          {children}
        </code>
      );
    },
    // 自定义预格式化块
    pre: ({ children, ...props }: React.ComponentProps<'pre'>) => (
      <pre 
        className="overflow-x-auto rounded-lg bg-muted p-4 text-sm" 
        {...props}
      >
        {children}
      </pre>
    ),
    // 自定义链接
    a: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-primary hover:underline"
        {...props}
      >
        {children}
      </a>
    ),
    // 自定义表格
    table: ({ children, ...props }: React.ComponentProps<'table'>) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border-collapse border border-border" {...props}>
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }: React.ComponentProps<'th'>) => (
      <th className="border border-border bg-muted px-4 py-2 text-left font-semibold" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: React.ComponentProps<'td'>) => (
      <td className="border border-border px-4 py-2" {...props}>
        {children}
      </td>
    ),
    // 自定义列表
    ul: ({ children, ...props }: React.ComponentProps<'ul'>) => (
      <ul className="list-disc pl-6 my-2 space-y-1" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: React.ComponentProps<'ol'>) => (
      <ol className="list-decimal pl-6 my-2 space-y-1" {...props}>
        {children}
      </ol>
    ),
    // 自定义引用块
    blockquote: ({ children, ...props }: React.ComponentProps<'blockquote'>) => (
      <blockquote 
        className="border-l-4 border-primary/50 pl-4 my-4 italic text-muted-foreground" 
        {...props}
      >
        {children}
      </blockquote>
    ),
    // 自定义标题
    h1: ({ children, ...props }: React.ComponentProps<'h1'>) => (
      <h1 className="text-2xl font-bold mt-6 mb-4" {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }: React.ComponentProps<'h2'>) => (
      <h2 className="text-xl font-bold mt-5 mb-3" {...props}>{children}</h2>
    ),
    h3: ({ children, ...props }: React.ComponentProps<'h3'>) => (
      <h3 className="text-lg font-semibold mt-4 mb-2" {...props}>{children}</h3>
    ),
    // 自定义段落
    p: ({ children, ...props }: React.ComponentProps<'p'>) => (
      <p className="my-2 leading-7" {...props}>{children}</p>
    ),
    // 自定义水平线
    hr: (props: React.ComponentProps<'hr'>) => (
      <hr className="my-6 border-border" {...props} />
    ),
  }), []);

  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
});

export default MarkdownRenderer;
