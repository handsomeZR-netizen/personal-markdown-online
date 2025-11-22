#!/usr/bin/env node

/**
 * 测试数据库连接脚本
 * 用于诊断 Supabase 数据库连接问题
 */

const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('🔍 开始测试数据库连接...\n');

  // 检查环境变量
  console.log('📋 环境变量检查:');
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ 已设置' : '❌ 未设置'}`);
  console.log(`DIRECT_URL: ${process.env.DIRECT_URL ? '✅ 已设置' : '❌ 未设置'}\n`);

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL 未设置！');
    console.log('\n💡 解决方案:');
    console.log('1. 确保 .env 文件存在');
    console.log('2. 运行: npm run db:test');
    process.exit(1);
  }

  // 显示连接信息（隐藏密码）
  const dbUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
  console.log(`🔗 连接字符串: ${dbUrl}\n`);

  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    console.log('⏳ 尝试连接数据库...');
    
    // 测试连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功！\n');

    // 测试查询
    console.log('⏳ 测试查询...');
    const userCount = await prisma.user.count();
    const noteCount = await prisma.note.count();
    
    console.log('✅ 查询成功！');
    console.log(`📊 数据统计:`);
    console.log(`   - 用户数: ${userCount}`);
    console.log(`   - 笔记数: ${noteCount}\n`);

    console.log('🎉 数据库连接测试通过！');
    
  } catch (error) {
    console.error('❌ 数据库连接失败！\n');
    console.error('错误信息:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\n💡 可能的原因:');
      console.log('1. Supabase 数据库已暂停（免费版 7 天不活动会自动暂停）');
      console.log('2. Supabase 正在维护中');
      console.log('3. 网络连接问题');
      console.log('4. 数据库凭据错误');
      
      console.log('\n🔧 解决步骤:');
      console.log('1. 访问 https://supabase.com/dashboard');
      console.log('2. 选择项目: llroqdgpohslhfejwxrn');
      console.log('3. 检查数据库状态，如果显示 "Paused"，点击 "Resume"');
      console.log('4. 等待 1-2 分钟让数据库完全启动');
      console.log('5. 重新运行此测试: npm run db:test');
    } else if (error.code === 'P1003') {
      console.log('\n💡 数据库不存在或无法访问');
      console.log('请检查 Supabase 项目设置中的数据库连接信息');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection().catch((error) => {
  console.error('❌ 测试脚本执行失败:', error);
  process.exit(1);
});
