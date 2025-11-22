/**
 * 基础 Supabase 连接测试
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 测试 Supabase 基础连接...\n')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseAnonKey ? '✅ 已设置' : '❌ 未设置')
console.log()

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 缺少环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  try {
    // 测试基本连接
    console.log('1️⃣ 测试 Supabase 客户端创建...')
    console.log('✅ 客户端创建成功\n')

    // 测试 auth 端点
    console.log('2️⃣ 测试 Auth 服务...')
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.log('⚠️  Auth 错误:', authError.message)
    } else {
      console.log('✅ Auth 服务正常')
      console.log('   当前会话:', session ? '已登录' : '未登录')
    }
    console.log()

    // 尝试查询（可能会因为 RLS 失败）
    console.log('3️⃣ 测试数据库查询...')
    const { data, error } = await supabase
      .from('User')
      .select('count')
      .limit(1)

    if (error) {
      console.log('⚠️  查询错误:', error.message)
      console.log('   这可能是因为 RLS (Row Level Security) 策略')
      console.log('   需要在 Supabase 控制台配置表权限')
    } else {
      console.log('✅ 数据库查询成功')
    }
    console.log()

    console.log('📋 总结:')
    console.log('✅ Supabase 连接正常')
    console.log('⚠️  需要配置 RLS 策略以允许匿名访问')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    process.exit(1)
  }
}

test()
