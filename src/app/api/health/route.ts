import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: "unknown",
  };

  try {
    // 测试数据库连接
    await prisma.$queryRaw`SELECT 1`;
    health.database = "connected";
  } catch (error) {
    health.database = "disconnected";
    health.status = "degraded";
  }

  const statusCode = health.status === "ok" ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
