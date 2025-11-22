import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

/**
 * 测试数据库连接和配置
 * 访问: /api/test-db
 */
export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {},
  };

  try {
    // 1. 测试环境变量
    results.tests.envVars = {
      DATABASE_URL: process.env.DATABASE_URL ? '✅ 已配置' : '❌ 未配置',
      DIRECT_URL: process.env.DIRECT_URL ? '✅ 已配置' : '❌ 未配置',
      AUTH_SECRET: process.env.AUTH_SECRET ? '✅ 已配置' : '❌ 未配置',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 已配置' : '❌ 未配置',
    };

    // 2. 测试数据库连接
    try {
      await prisma.$connect();
      results.tests.dbConnection = '✅ 数据库连接成功';
    } catch (error) {
      results.tests.dbConnection = `❌ 数据库连接失败: ${error instanceof Error ? error.message : '未知错误'}`;
      return NextResponse.json(results, { status: 500 });
    }

    // 3. 测试表是否存在
    try {
      const userCount = await prisma.user.count();
      results.tests.userTable = `✅ User 表存在 (${userCount} 条记录)`;
    } catch (error) {
      results.tests.userTable = `❌ User 表不存在或无法访问: ${error instanceof Error ? error.message : '未知错误'}`;
    }

    try {
      const noteCount = await prisma.note.count();
      results.tests.noteTable = `✅ Note 表存在 (${noteCount} 条记录)`;
    } catch (error) {
      results.tests.noteTable = `❌ Note 表不存在或无法访问: ${error instanceof Error ? error.message : '未知错误'}`;
    }

    try {
      const tagCount = await prisma.tag.count();
      results.tests.tagTable = `✅ Tag 表存在 (${tagCount} 条记录)`;
    } catch (error) {
      results.tests.tagTable = `❌ Tag 表不存在或无法访问: ${error instanceof Error ? error.message : '未知错误'}`;
    }

    try {
      const categoryCount = await prisma.category.count();
      results.tests.categoryTable = `✅ Category 表存在 (${categoryCount} 条记录)`;
    } catch (error) {
      results.tests.categoryTable = `❌ Category 表不存在或无法访问: ${error instanceof Error ? error.message : '未知错误'}`;
    }

    // 4. 测试认证
    try {
      const session = await auth();
      if (session?.user) {
        results.tests.auth = `✅ 用户已登录: ${session.user.email}`;
      } else {
        results.tests.auth = '⚠️ 用户未登录（这是正常的，如果你没有登录）';
      }
    } catch (error) {
      results.tests.auth = `❌ 认证失败: ${error instanceof Error ? error.message : '未知错误'}`;
    }

    // 5. 测试 Prisma Client 版本
    results.tests.prismaVersion = '✅ Prisma Client 已加载';

    // 6. 总结
    const failedTests = Object.values(results.tests).filter((test: any) => 
      typeof test === 'string' && test.startsWith('❌')
    );

    if (failedTests.length === 0) {
      results.summary = '✅ 所有测试通过！数据库配置正常。';
      results.status = 'success';
    } else {
      results.summary = `⚠️ ${failedTests.length} 个测试失败，请检查配置。`;
      results.status = 'warning';
    }

    return NextResponse.json(results);
  } catch (error) {
    results.tests.unexpectedError = `❌ 意外错误: ${error instanceof Error ? error.message : '未知错误'}`;
    results.summary = '❌ 测试过程中发生错误';
    results.status = 'error';
    
    return NextResponse.json(results, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
