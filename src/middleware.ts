import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

// Create a minimal auth instance for middleware (Edge Runtime compatible)
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Skip API routes, static files, etc.
  if (
    nextUrl.pathname.startsWith('/api') ||
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Define protected routes
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

  // Define public routes (logged-in users shouldn't access)
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.some(route => 
    nextUrl.pathname.startsWith(route)
  )

  // Redirect to login if accessing protected route while not logged in
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to dashboard if logged in but accessing public route
  if (isPublicRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl.origin))
  }

  // Create response and add security headers
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

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // HSTS (production only)
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
