import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    
    // 获取数据库中的 user1
    const dbUser1 = await prisma.user.findUnique({
      where: { email: 'user1@example.com' },
      select: { id: true, email: true }
    });
    
    // 如果有 session，检查用户是否存在
    let dbUser = null;
    if (session?.user?.id) {
      dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true }
      });
    }
    
    return NextResponse.json({
      session: {
        userId: session?.user?.id,
        email: session?.user?.email,
        name: session?.user?.name
      },
      dbUser1: dbUser1,
      currentUserInDb: dbUser,
      match: session?.user?.id === dbUser1?.id
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
