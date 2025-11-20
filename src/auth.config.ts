import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: '/login',
        error: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            
            // 定义受保护的路由
            const protectedPaths = ['/dashboard', '/notes', '/ai']
            const isProtectedPath = protectedPaths.some(path => 
                nextUrl.pathname.startsWith(path)
            )
            
            // 定义公开路由
            const publicPaths = ['/login', '/register']
            const isPublicPath = publicPaths.some(path => 
                nextUrl.pathname.startsWith(path)
            )
            
            // 受保护路由需要登录
            if (isProtectedPath) {
                return isLoggedIn
            }
            
            // 已登录用户访问公开路由时重定向
            if (isPublicPath && isLoggedIn) {
                return Response.redirect(new URL('/dashboard', nextUrl))
            }
            
            return true
        },
        async jwt({ token, user }) {
            // 在 JWT 中添加用户 ID
            if (user) {
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            // 将用户 ID 添加到 session
            if (token && session.user) {
                session.user.id = token.id as string
            }
            return session
        },
    },
    providers: [], // Add providers with an empty array for now
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    trustHost: true,
} satisfies NextAuthConfig
