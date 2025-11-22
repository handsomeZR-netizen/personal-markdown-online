#!/usr/bin/env node

/**
 * 快速验证脚本 - 简化版
 */

console.log('\n🔍 快速验证离线同步功能\n');

// 检查环境变量
console.log('📋 环境变量检查:');
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ 已设置' : '❌ 未设置'}`);
console.log(`DIRECT_URL: ${process.env.DIRECT_URL ? '✅ 已设置' : '❌ 未设置'}`);

if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL.replace('postgresql://', 'http://'));
  console.log(`   端口: ${url.port}`);
  console.log(`   主机: ${url.hostname}`);
}

console.log('\n✅ 环境变量验证完成！');
console.log('\n📝 下一步：');
console.log('1. 运行 npm run dev 启动开发服务器');
console.log('2. 在浏览器中访问 http://localhost:3000');
console.log('3. 按照 "快速验证指南.md" 进行测试');
console.log('\n🎯 核心测试：');
console.log('   - 开发者工具 → Network → 勾选 Offline');
console.log('   - 创建一个笔记');
console.log('   - 取消 Offline');
console.log('   - 验证笔记自动同步到 Supabase');
console.log('');
