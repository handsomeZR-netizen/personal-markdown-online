import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { getAuthAdapter } from "@/lib/auth/auth-adapter"
import { z } from "zod"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    secret: process.env.AUTH_SECRET,
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials)

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data
                    const authAdapter = getAuthAdapter()
                    const { data: user, error } = await authAdapter.signIn({ email, password })
                    if (error || !user) return null
                    return user
                }
                return null
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        ...authConfig.callbacks,
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub
            }
            return session
        },
    },
})
