import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

const auth = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
}).auth

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // 跳过 API 路由、静态文件等
  if (
    nextUrl.pathname.startsWith('/api') ||
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // 定义受保护的路由
  const protectedRoutes = [
    '/dashboard', 
    '/notes', 
    '/ai', 
    '/features', 
    '/help', 
    '/settings',
    '/templates',
    '/search',
    '/test-navigation',
    '/test-loading'
  ]
  const isProtectedRoute = protectedRoutes.some(route => 
    nextUrl.pathname.startsWith(route)
  )

  // 定义公开路由（已登录用户不应访问）
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.some(route => 
    nextUrl.pathname.startsWith(route)
  )

  // 如果访问受保护路由但未登录，重定向到登录页
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 如果已登录但访问公开路由，重定向到仪表板
  if (isPublicRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl.origin))
  }

  // 创建响应并添加安全头部
  const response = NextResponse.next()

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  )

  // 安全响应头
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // HSTS（仅在生产环境）
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }

  return response
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico).*)',
  ],
}
