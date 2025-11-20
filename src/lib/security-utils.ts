/**
 * 安全工具函数 - 防止 XSS 和注入攻击
 */

/**
 * 清理 HTML 内容，防止 XSS 攻击
 * 注意：Markdown 内容应该使用专门的 Markdown 渲染库（如 react-markdown）来安全渲染
 * @param html HTML 字符串
 * @returns 清理后的字符串
 */
export function sanitizeHtml(html: string): string {
  // 移除所有 HTML 标签
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // 移除事件处理器
    .replace(/javascript:/gi, '') // 移除 javascript: 协议
}

/**
 * 转义 HTML 特殊字符
 * @param text 文本字符串
 * @returns 转义后的字符串
 */
export function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  
  return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char)
}

/**
 * 验证 URL 是否安全
 * @param url URL 字符串
 * @returns 是否安全
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    
    // 只允许 http 和 https 协议
    const allowedProtocols = ['http:', 'https:']
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      return false
    }
    
    // 检查是否包含危险字符
    const dangerousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
    ]
    
    return !dangerousPatterns.some(pattern => pattern.test(url))
  } catch {
    return false
  }
}

/**
 * 清理用户输入，防止 SQL 注入（虽然 Prisma 已经提供了保护）
 * @param input 用户输入
 * @returns 清理后的输入
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
      switch (char) {
        case '\0':
          return '\\0'
        case '\x08':
          return '\\b'
        case '\x09':
          return '\\t'
        case '\x1a':
          return '\\z'
        case '\n':
          return '\\n'
        case '\r':
          return '\\r'
        case '"':
        case "'":
        case '\\':
        case '%':
          return '\\' + char
        default:
          return char
      }
    })
}

/**
 * 验证 Markdown 内容是否安全
 * @param markdown Markdown 字符串
 * @returns 是否安全
 */
export function isSafeMarkdown(markdown: string): boolean {
  // 检查是否包含潜在的 XSS 攻击向量
  const dangerousPatterns = [
    /<script/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /javascript:/i,
    /on\w+\s*=/i, // 事件处理器
    /data:text\/html/i,
  ]
  
  return !dangerousPatterns.some(pattern => pattern.test(markdown))
}

/**
 * 清理 Markdown 内容中的危险元素
 * @param markdown Markdown 字符串
 * @returns 清理后的 Markdown
 */
export function sanitizeMarkdown(markdown: string): string {
  return markdown
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
}

/**
 * 验证文件名是否安全
 * @param filename 文件名
 * @returns 是否安全
 */
export function isSafeFilename(filename: string): boolean {
  // 检查路径遍历攻击
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false
  }
  
  // 检查是否包含危险字符
  const dangerousChars = /[<>:"|?*\x00-\x1f]/
  if (dangerousChars.test(filename)) {
    return false
  }
  
  return true
}

/**
 * 生成安全的随机字符串（用于 CSRF token 等）
 * @param length 长度
 * @returns 随机字符串
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  // 使用 crypto API 生成安全的随机数
  if (typeof window !== 'undefined' && window.crypto) {
    const randomValues = new Uint8Array(length)
    window.crypto.getRandomValues(randomValues)
    
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length]
    }
  } else {
    // 服务端使用 Node.js crypto
    const crypto = require('crypto')
    const randomBytes = crypto.randomBytes(length)
    
    for (let i = 0; i < length; i++) {
      result += chars[randomBytes[i] % chars.length]
    }
  }
  
  return result
}

/**
 * 验证内容长度，防止 DoS 攻击
 * @param content 内容
 * @param maxLength 最大长度
 * @returns 是否在限制内
 */
export function isWithinSizeLimit(content: string, maxLength: number): boolean {
  return content.length <= maxLength
}

/**
 * 限制请求频率的简单实现（应该配合 Redis 等使用）
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 分钟
  ) {}
  
  /**
   * 检查是否超过频率限制
   * @param identifier 标识符（如用户 ID 或 IP）
   * @returns 是否允许请求
   */
  check(identifier: string): boolean {
    const now = Date.now()
    const userRequests = this.requests.get(identifier) || []
    
    // 移除过期的请求记录
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    )
    
    if (validRequests.length >= this.maxRequests) {
      return false
    }
    
    validRequests.push(now)
    this.requests.set(identifier, validRequests)
    
    return true
  }
  
  /**
   * 清理过期的记录
   */
  cleanup(): void {
    const now = Date.now()
    
    for (const [identifier, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(
        timestamp => now - timestamp < this.windowMs
      )
      
      if (validTimestamps.length === 0) {
        this.requests.delete(identifier)
      } else {
        this.requests.set(identifier, validTimestamps)
      }
    }
  }
}

/**
 * Content Security Policy 配置
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
}

/**
 * 生成 CSP 头部字符串
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ')
}
