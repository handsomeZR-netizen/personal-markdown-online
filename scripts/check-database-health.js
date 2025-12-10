#!/usr/bin/env node

/**
 * 数据库健康检查脚本
 * Database Health Check Script
 * 
 * 此脚本验证数据库连接和配置
 * This script verifies database connection and configuration
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// 颜色输出 / Color output
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

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function checkDockerInstalled() {
  logSection('检查 Docker 安装 / Checking Docker Installation');
  
  try {
    const { stdout } = await execAsync('docker --version');
    log(`✓ Docker 已安装: ${stdout.trim()}`, 'green');
    return true;
  } catch (error) {
    log('✗ Docker 未安装或不可用', 'red');
    log('  请安装 Docker Desktop: https://www.docker.com/products/docker-desktop', 'yellow');
    return false;
  }
}

async function checkDockerComposeInstalled() {
  logSection('检查 Docker Compose 安装 / Checking Docker Compose Installation');
  
  try {
    const { stdout } = await execAsync('docker-compose --version');
    log(`✓ Docker Compose 已安装: ${stdout.trim()}`, 'green');
    return true;
  } catch (error) {
    log('✗ Docker Compose 未安装或不可用', 'red');
    return false;
  }
}

async function checkContainerRunning() {
  logSection('检查容器状态 / Checking Container Status');
  
  try {
    const { stdout } = await execAsync('docker ps --filter "name=noteapp-postgres" --format "{{.Status}}"');
    
    if (stdout.trim()) {
      log(`✓ 容器正在运行: ${stdout.trim()}`, 'green');
      return true;
    } else {
      log('✗ 容器未运行', 'yellow');
      log('  运行以下命令启动: docker-compose up -d', 'yellow');
      return false;
    }
  } catch (error) {
    log('✗ 无法检查容器状态', 'red');
    return false;
  }
}

async function checkContainerHealth() {
  logSection('检查容器健康状态 / Checking Container Health');
  
  try {
    const { stdout } = await execAsync('docker inspect noteapp-postgres --format="{{.State.Health.Status}}"');
    const health = stdout.trim();
    
    if (health === 'healthy') {
      log('✓ 容器健康状态: healthy', 'green');
      return true;
    } else if (health === 'starting') {
      log('⚠ 容器健康状态: starting (正在启动)', 'yellow');
      log('  请等待几秒后重试', 'yellow');
      return false;
    } else if (health === 'unhealthy') {
      log('✗ 容器健康状态: unhealthy', 'red');
      log('  查看日志: docker-compose logs postgres', 'yellow');
      return false;
    } else {
      log(`⚠ 容器健康状态: ${health || '未知'}`, 'yellow');
      return false;
    }
  } catch (error) {
    log('✗ 无法检查健康状态', 'red');
    return false;
  }
}

async function checkDatabaseConnection() {
  logSection('检查数据库连接 / Checking Database Connection');
  
  try {
    const { stdout } = await execAsync('docker-compose exec -T postgres pg_isready -U postgres');
    
    if (stdout.includes('accepting connections')) {
      log('✓ 数据库接受连接', 'green');
      return true;
    } else {
      log('✗ 数据库未准备好', 'yellow');
      return false;
    }
  } catch (error) {
    log('✗ 无法连接到数据库', 'red');
    return false;
  }
}

async function checkDatabaseExists() {
  logSection('检查数据库是否存在 / Checking Database Exists');
  
  try {
    const { stdout } = await execAsync('docker-compose exec -T postgres psql -U postgres -lqt');
    
    if (stdout.includes('noteapp')) {
      log('✓ 数据库 "noteapp" 存在', 'green');
      return true;
    } else {
      log('✗ 数据库 "noteapp" 不存在', 'yellow');
      log('  数据库将在首次迁移时自动创建', 'yellow');
      return false;
    }
  } catch (error) {
    log('✗ 无法检查数据库', 'red');
    return false;
  }
}

async function checkPort() {
  logSection('检查端口占用 / Checking Port Usage');
  
  try {
    const { stdout } = await execAsync('docker-compose port postgres 5432');
    log(`✓ PostgreSQL 端口映射: ${stdout.trim()}`, 'green');
    return true;
  } catch (error) {
    log('✗ 无法获取端口信息', 'yellow');
    return false;
  }
}

async function showConnectionInfo() {
  logSection('连接信息 / Connection Information');
  
  log('本地连接字符串 / Local Connection String:', 'blue');
  log('  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/noteapp', 'cyan');
  log('');
  log('使用 psql 连接 / Connect with psql:', 'blue');
  log('  docker-compose exec postgres psql -U postgres -d noteapp', 'cyan');
  log('');
  log('查看日志 / View logs:', 'blue');
  log('  docker-compose logs -f postgres', 'cyan');
}

async function showNextSteps(allChecksPass) {
  logSection('下一步 / Next Steps');
  
  if (allChecksPass) {
    log('✓ 所有检查通过!数据库已准备就绪。', 'green');
    log('');
    log('运行以下命令继续:', 'blue');
    log('  1. 运行迁移: npm run prisma:migrate', 'cyan');
    log('  2. 填充数据: npm run prisma:seed', 'cyan');
    log('  3. 启动开发: npm run dev', 'cyan');
  } else {
    log('⚠ 某些检查未通过。请按照上述建议操作。', 'yellow');
    log('');
    log('常见解决方案:', 'blue');
    log('  1. 启动数据库: docker-compose up -d', 'cyan');
    log('  2. 查看日志: docker-compose logs postgres', 'cyan');
    log('  3. 重启容器: docker-compose restart postgres', 'cyan');
    log('  4. 完全重置: docker-compose down -v && docker-compose up -d', 'cyan');
  }
}

async function main() {
  log('\n数据库健康检查工具', 'cyan');
  log('Database Health Check Tool\n', 'cyan');
  
  const checks = [];
  
  // 运行所有检查 / Run all checks
  checks.push(await checkDockerInstalled());
  checks.push(await checkDockerComposeInstalled());
  checks.push(await checkContainerRunning());
  checks.push(await checkContainerHealth());
  checks.push(await checkDatabaseConnection());
  checks.push(await checkDatabaseExists());
  checks.push(await checkPort());
  
  // 显示连接信息 / Show connection info
  showConnectionInfo();
  
  // 显示下一步 / Show next steps
  const allChecksPass = checks.every(check => check === true);
  await showNextSteps(allChecksPass);
  
  // 退出码 / Exit code
  process.exit(allChecksPass ? 0 : 1);
}

// 运行主函数 / Run main function
main().catch(error => {
  log(`\n✗ 发生错误: ${error.message}`, 'red');
  process.exit(1);
});
