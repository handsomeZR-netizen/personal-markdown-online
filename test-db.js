const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testDatabase() {
  try {
    console.log('测试数据库连接...')
    
    // 测试连接
    await prisma.$connect()
    console.log('✓ 数据库连接成功')
    
    // 测试查询
    const userCount = await prisma.user.count()
    console.log(`✓ 当前用户数: ${userCount}`)
    
    // 测试创建用户
    const testEmail = `test${Date.now()}@example.com`
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const user = await prisma.user.create({
      data: {
        name: '测试用户',
        email: testEmail,
        password: hashedPassword,
      },
    })
    
    console.log('✓ 创建用户成功:', user.email)
    
    // 清理测试数据
    await prisma.user.delete({
      where: { id: user.id },
    })
    
    console.log('✓ 清理测试数据成功')
    console.log('\n所有测试通过！数据库工作正常。')
    
  } catch (error) {
    console.error('✗ 测试失败:', error.message)
    console.error('详细错误:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
