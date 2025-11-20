"use client"

import ReactMarkdown from 'react-markdown'
import { sanitizeMarkdown } from '@/lib/security-utils'

interface MarkdownPreviewProps {
  content: string
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  if (!content) {
    return (
      <div className="text-muted-foreground text-sm italic">
        开始输入以查看预览...
      </div>
    )
  }

  // 清理 Markdown 内容，防止 XSS 攻击
  const safeContent = sanitizeMarkdown(content)

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        // 禁用 HTML 渲染，只允许 Markdown
        disallowedElements={['script', 'iframe', 'object', 'embed']}
        unwrapDisallowed={true}
        // 安全地处理链接
        components={{
          a: ({ node, href, children, ...props }) => {
            // 只允许 http 和 https 链接
            const isSafe = href && (href.startsWith('http://') || href.startsWith('https://'))
            if (!isSafe) {
              return <span>{children}</span>
            }
            return (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            )
          },
        }}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  )
}
