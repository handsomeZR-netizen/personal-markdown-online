const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:xzr1234567.@localhost:5432/postgres'
  });

  try {
    console.log('🔍 正在测试数据库连接...');
    console.log('连接字符串:', process.env.DATABASE_URL || 'postgresql://postgres:xzr1234567.@localhost:5432/postgres');
    
    await client.connect();
    console.log('✅ 数据库连接成功！');
    
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL 版本:', result.rows[0].version);
    
    // 检查 noteapp 数据库是否存在
    const dbCheck = await client.query(
      "SELECT datname FROM pg_database WHERE datname = 'noteapp'"
    );
    
    if (dbCheck.rows.length > 0) {
      console.log('✅ noteapp 数据库已存在');
    } else {
      console.log('⚠️  noteapp 数据库不存在，需要创建');
      console.log('运行命令: CREATE DATABASE noteapp;');
    }
    
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    console.error('\n可能的原因:');
    console.error('1. PostgreSQL 服务未启动');
    console.error('2. 密码不正确');
    console.error('3. 端口 5432 被占用或配置不同');
    console.error('4. pg_hba.conf 配置问题');
  } finally {
    await client.end();
  }
}

testConnection();
