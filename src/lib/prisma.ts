import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

// 在所有环境中缓存 Prisma 客户端，避免 Serverless 环境中的连接问题
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}
