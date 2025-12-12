import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * 安全中间件 - 添加安全响应头
 */
export function securityMiddleware(request: NextRequest) {
  const response = NextResponse.next()

  // Content Security Policy
  // 允许 Vercel Analytics、Cloudflare、Neon 和必要的外部连接
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://vercel.live https://*.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https:",
      "connect-src 'self' https://*.vercel-insights.com https://*.vercel.app https://vercel.live wss://*.vercel.live https://static.cloudflareinsights.com https://*.supabase.co wss://*.supabase.co https://*.neon.tech wss://*.neon.tech",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "worker-src 'self' blob:",
    ].join('; ')
  )

  // X-Frame-Options - 防止点击劫持
  response.headers.set('X-Frame-Options', 'DENY')

  // X-Content-Type-Options - 防止 MIME 类型嗅探
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // X-XSS-Protection - 启用浏览器 XSS 过滤
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer-Policy - 控制 Referrer 信息
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions-Policy - 控制浏览器功能
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  // Strict-Transport-Security - 强制 HTTPS（仅在生产环境）
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }

  return response
}
