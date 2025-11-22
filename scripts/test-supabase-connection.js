/**
 * 测试 Supabase 连接
 * 运行: node scripts/test-supabase-connection.js
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 缺少 Supabase 环境变量')
  console.log('请确保 .env.local 包含:')
  console.log('  NEXT_PUBLIC_SUPABASE_URL')
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

console.log('🔍 测试 Supabase 连接...\n')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    // 测试 1: 连接测试
    console.log('1️⃣ 测试数据库连接...')
    const { data, error } = await supabase
      .from('User')
      .select('count')
      .limit(1)

    if (error) {
      console.error('❌ 连接失败:', error.message)
      return false
    }

    console.log('✅ 数据库连接成功\n')

    // 测试 2: 查询用户表
    console.log('2️⃣ 查询用户表...')
    const { data: users, error: userError } = await supabase
      .from('User')
      .select('id, email, name')
      .limit(5)

    if (userError) {
      console.error('❌ 查询失败:', userError.message)
      return false
    }

    console.log(`✅ 找到 ${users?.length || 0} 个用户`)
    if (users && users.length > 0) {
      console.log('   示例用户:', users[0].email)
    }
    console.log()

    // 测试 3: 查询笔记表
    console.log('3️⃣ 查询笔记表...')
    const { data: notes, error: noteError } = await supabase
      .from('Note')
      .select('id, title')
      .limit(5)

    if (noteError) {
      console.error('❌ 查询失败:', noteError.message)
      return false
    }

    console.log(`✅ 找到 ${notes?.length || 0} 条笔记`)
    if (notes && notes.length > 0) {
      console.log('   示例笔记:', notes[0].title)
    }
    console.log()

    console.log('🎉 所有测试通过！')
    console.log('✅ Supabase SDK 工作正常')
    console.log('✅ 可以开始使用应用了')
    
    return true
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    return false
  }
}

testConnection()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ 未预期的错误:', error)
    process.exit(1)
  })
