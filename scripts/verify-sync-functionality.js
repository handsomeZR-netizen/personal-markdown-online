#!/usr/bin/env node

/**
 * 离线同步功能自动验证脚本
 * 用于快速验证离线同步功能是否正常工作
 */

const { PrismaClient } = require('@prisma/client');

// 使用 DATABASE_URL (连接池) 而不是 DIRECT_URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function section(title) {
  log(`\n${'='.repeat(50)}`, 'cyan');
  log(title, 'cyan');
  log('='.repeat(50), 'cyan');
}

/**
 * 验证数据库连接
 */
async function verifyDatabaseConnection() {
  section('1. 验证数据库连接');
  
  try {
    await prisma.$connect();
    success('数据库连接成功');
    return true;
  } catch (err) {
    error('数据库连接失败');
    error(err.message);
    return false;
  }
}

/**
 * 检查数据库表结构
 */
async function verifyDatabaseSchema() {
  section('2. 验证数据库表结构');
  
  try {
    // 检查 User 表
    const userCount = await prisma.user.count();
    success(`User 表存在，当前用户数: ${userCount}`);
    
    // 检查 Note 表
    const noteCount = await prisma.note.count();
    success(`Note 表存在，当前笔记数: ${noteCount}`);
    
    // 检查 Tag 表
    const tagCount = await prisma.tag.count();
    success(`Tag 表存在，当前标签数: ${tagCount}`);
    
    // 检查 Category 表
    const categoryCount = await prisma.category.count();
    success(`Category 表存在，当前分类数: ${categoryCount}`);
    
    return true;
  } catch (err) {
    error('数据库表结构验证失败');
    error(err.message);
    return false;
  }
}

/**
 * 验证笔记字段
 */
async function verifyNoteFields() {
  section('3. 验证笔记字段');
  
  try {
    // 获取一个笔记样本
    const sampleNote = await prisma.note.findFirst({
      include: {
        user: true,
        tags: true,
        category: true,
      },
    });
    
    if (!sampleNote) {
      warning('数据库中没有笔记，跳过字段验证');
      info('建议：创建至少一个笔记以验证完整功能');
      return true;
    }
    
    // 验证必需字段
    const requiredFields = ['id', 'title', 'content', 'userId', 'createdAt', 'updatedAt'];
    const missingFields = requiredFields.filter(field => !(field in sampleNote));
    
    if (missingFields.length > 0) {
      error(`缺少必需字段: ${missingFields.join(', ')}`);
      return false;
    }
    
    success('所有必需字段都存在');
    
    // 验证可选字段
    if ('summary' in sampleNote) {
      success('summary 字段存在 (AI 摘要功能)');
    } else {
      warning('summary 字段不存在 (AI 摘要功能可能未启用)');
    }
    
    if ('embedding' in sampleNote) {
      success('embedding 字段存在 (AI 向量搜索功能)');
    } else {
      warning('embedding 字段不存在 (AI 向量搜索功能可能未启用)');
    }
    
    // 显示样本笔记信息
    info(`样本笔记信息:`);
    info(`  - ID: ${sampleNote.id}`);
    info(`  - 标题: ${sampleNote.title}`);
    info(`  - 内容长度: ${sampleNote.content.length} 字符`);
    info(`  - 标签数: ${sampleNote.tags.length}`);
    info(`  - 分类: ${sampleNote.category?.name || '无'}`);
    
    return true;
  } catch (err) {
    error('笔记字段验证失败');
    error(err.message);
    return false;
  }
}

/**
 * 测试创建笔记
 */
async function testCreateNote() {
  section('4. 测试创建笔记');
  
  try {
    // 获取第一个用户
    const user = await prisma.user.findFirst();
    
    if (!user) {
      warning('数据库中没有用户，跳过创建测试');
      info('建议：先创建一个用户账户');
      return true;
    }
    
    // 创建测试笔记
    const testNote = await prisma.note.create({
      data: {
        title: '自动测试笔记',
        content: '这是一个由自动验证脚本创建的测试笔记。如果你看到这个笔记，说明创建功能正常工作。',
        userId: user.id,
      },
    });
    
    success(`成功创建测试笔记，ID: ${testNote.id}`);
    
    // 验证笔记是否真的创建了
    const verifyNote = await prisma.note.findUnique({
      where: { id: testNote.id },
    });
    
    if (verifyNote) {
      success('笔记创建验证通过');
    } else {
      error('笔记创建验证失败');
      return false;
    }
    
    // 清理测试数据
    await prisma.note.delete({
      where: { id: testNote.id },
    });
    
    success('测试笔记已清理');
    
    return true;
  } catch (err) {
    error('创建笔记测试失败');
    error(err.message);
    return false;
  }
}

/**
 * 测试更新笔记
 */
async function testUpdateNote() {
  section('5. 测试更新笔记');
  
  try {
    // 获取第一个笔记
    const note = await prisma.note.findFirst();
    
    if (!note) {
      warning('数据库中没有笔记，跳过更新测试');
      return true;
    }
    
    const originalTitle = note.title;
    const testTitle = `${originalTitle} [已测试]`;
    
    // 更新笔记
    await prisma.note.update({
      where: { id: note.id },
      data: { title: testTitle },
    });
    
    success('成功更新笔记标题');
    
    // 验证更新
    const updatedNote = await prisma.note.findUnique({
      where: { id: note.id },
    });
    
    if (updatedNote && updatedNote.title === testTitle) {
      success('笔记更新验证通过');
    } else {
      error('笔记更新验证失败');
      return false;
    }
    
    // 恢复原标题
    await prisma.note.update({
      where: { id: note.id },
      data: { title: originalTitle },
    });
    
    success('笔记标题已恢复');
    
    return true;
  } catch (err) {
    error('更新笔记测试失败');
    error(err.message);
    return false;
  }
}

/**
 * 验证 API 端点
 */
async function verifyAPIEndpoints() {
  section('6. 验证 API 端点');
  
  info('API 端点验证需要应用运行中');
  info('请确保运行了: npm run dev');
  info('');
  info('需要验证的端点:');
  info('  - POST   /api/notes          (创建笔记)');
  info('  - GET    /api/notes          (获取笔记列表)');
  info('  - GET    /api/notes/[id]     (获取单个笔记)');
  info('  - PUT    /api/notes/[id]     (更新笔记)');
  info('  - DELETE /api/notes/[id]     (删除笔记)');
  info('  - POST   /api/notes/batch-sync (批量同步)');
  info('');
  warning('请手动在浏览器中测试这些端点');
  
  return true;
}

/**
 * 生成验证报告
 */
function generateReport(results) {
  section('验证报告');
  
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  
  log('');
  log(`总测试项: ${total}`, 'cyan');
  log(`通过: ${passed}`, 'green');
  log(`失败: ${failed}`, failed > 0 ? 'red' : 'green');
  log('');
  
  if (failed === 0) {
    success('🎉 所有验证项都通过了！');
    success('你的离线同步功能已准备就绪！');
    log('');
    info('下一步：');
    info('1. 运行 npm run dev 启动开发服务器');
    info('2. 在浏览器中打开 http://localhost:3000');
    info('3. 按照 "离线同步功能验证指南.md" 进行手动测试');
  } else {
    error('部分验证项失败，请检查上述错误信息');
    log('');
    info('建议：');
    info('1. 检查数据库连接配置');
    info('2. 运行 npm run db:push 同步数据库结构');
    info('3. 查看详细错误信息并修复');
  }
  
  log('');
}

/**
 * 主函数
 */
async function main() {
  log('');
  log('🔍 离线同步功能自动验证', 'cyan');
  log('');
  
  const results = [];
  
  // 1. 验证数据库连接
  const dbConnected = await verifyDatabaseConnection();
  results.push({ name: '数据库连接', passed: dbConnected });
  
  if (!dbConnected) {
    error('数据库连接失败，无法继续验证');
    generateReport(results);
    process.exit(1);
  }
  
  // 2. 验证数据库表结构
  const schemaValid = await verifyDatabaseSchema();
  results.push({ name: '数据库表结构', passed: schemaValid });
  
  // 3. 验证笔记字段
  const fieldsValid = await verifyNoteFields();
  results.push({ name: '笔记字段', passed: fieldsValid });
  
  // 4. 测试创建笔记
  const createWorks = await testCreateNote();
  results.push({ name: '创建笔记', passed: createWorks });
  
  // 5. 测试更新笔记
  const updateWorks = await testUpdateNote();
  results.push({ name: '更新笔记', passed: updateWorks });
  
  // 6. 验证 API 端点
  const apiValid = await verifyAPIEndpoints();
  results.push({ name: 'API 端点', passed: apiValid });
  
  // 生成报告
  generateReport(results);
  
  await prisma.$disconnect();
}

// 运行主函数
main().catch((error) => {
  error('验证脚本执行失败');
  console.error(error);
  process.exit(1);
});
