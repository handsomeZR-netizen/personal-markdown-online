import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    // 在 Serverless 环境中优化连接
    datasourceUrl: process.env.DATABASE_URL,
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

// 在所有环境中缓存 Prisma 客户端，避免 Serverless 环境中的连接问题
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}

// 优雅关闭连接
if (process.env.NODE_ENV !== "production") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect()
  })
}
