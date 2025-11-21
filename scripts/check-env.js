#!/usr/bin/env node

/**
 * 环境变量检查脚本
 * 用于验证所有必需的环境变量是否已配置
 */

// 加载环境变量
const fs = require('fs');
const path = require('path');

function loadEnvFile(filename) {
  const envPath = path.join(__dirname, '..', filename);
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    return true;
  }
  return false;
}

// 按优先级加载环境变量文件
const envFiles = ['.env.local', '.env.development.local', '.env'];
let loadedFiles = [];
envFiles.forEach(file => {
  if (loadEnvFile(file)) {
    loadedFiles.push(file);
  }
});

if (loadedFiles.length > 0) {
  console.log(`📁 已加载环境变量文件: ${loadedFiles.join(', ')}\n`);
}

const requiredEnvVars = {
  // 认证
  'AUTH_SECRET': '认证密钥',
  
  // Supabase 公共配置
  'NEXT_PUBLIC_SUPABASE_URL': 'Supabase URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Supabase 匿名密钥',
  
  // Supabase 私密配置
  'SUPABASE_SERVICE_ROLE_KEY': 'Supabase 服务角色密钥',
  
  // 数据库
  'DATABASE_URL': '数据库连接 URL',
  'DIRECT_URL': '数据库直连 URL',
};

const optionalEnvVars = {
  'DEEPSEEK_API_KEY': 'DeepSeek API 密钥（AI 功能）',
  'DEEPSEEK_API_URL': 'DeepSeek API URL',
  'SUPABASE_JWT_SECRET': 'Supabase JWT 密钥',
  'POSTGRES_USER': '数据库用户名',
  'POSTGRES_PASSWORD': '数据库密码',
};

console.log('🔍 检查环境变量配置...\n');

let hasErrors = false;
let hasWarnings = false;

// 检查必需的环境变量
console.log('📋 必需的环境变量:');
for (const [key, description] of Object.entries(requiredEnvVars)) {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    console.log(`  ❌ ${key} - ${description} (缺失)`);
    hasErrors = true;
  } else {
    // 显示部分值（隐藏敏感信息）
    const displayValue = value.length > 20 
      ? `${value.substring(0, 10)}...${value.substring(value.length - 5)}`
      : value;
    console.log(`  ✅ ${key} - ${description} (${displayValue})`);
  }
}

// 检查可选的环境变量
console.log('\n📋 可选的环境变量:');
for (const [key, description] of Object.entries(optionalEnvVars)) {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    console.log(`  ⚠️  ${key} - ${description} (未配置)`);
    hasWarnings = true;
  } else {
    const displayValue = value.length > 20 
      ? `${value.substring(0, 10)}...${value.substring(value.length - 5)}`
      : value;
    console.log(`  ✅ ${key} - ${description} (${displayValue})`);
  }
}

// 总结
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ 发现缺失的必需环境变量！');
  console.log('请在 .env.local 文件中配置这些变量。');
  console.log('参考 .env.example 文件了解如何配置。');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  部分可选功能未配置。');
  console.log('应用可以运行，但某些功能可能不可用。');
  console.log('✅ 所有必需的环境变量已配置！');
} else {
  console.log('✅ 所有环境变量配置完整！');
}

// 额外检查
console.log('\n🔍 额外检查:');

// 检查 URL 格式
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('  ✅ Supabase URL 格式正确');
  } catch {
    console.log('  ❌ Supabase URL 格式错误');
    hasErrors = true;
  }
}

// 检查数据库 URL 格式
if (process.env.DATABASE_URL) {
  if (process.env.DATABASE_URL.startsWith('postgresql://')) {
    console.log('  ✅ 数据库 URL 格式正确');
  } else {
    console.log('  ❌ 数据库 URL 格式错误（应以 postgresql:// 开头）');
    hasErrors = true;
  }
}

// 检查 AUTH_SECRET 长度
if (process.env.AUTH_SECRET) {
  if (process.env.AUTH_SECRET.length >= 32) {
    console.log('  ✅ AUTH_SECRET 长度足够');
  } else {
    console.log('  ⚠️  AUTH_SECRET 长度较短，建议至少 32 字符');
    hasWarnings = true;
  }
}

console.log('='.repeat(50) + '\n');

if (hasErrors) {
  process.exit(1);
}
