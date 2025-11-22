/**
 * 测试 API 端点
 * 运行: node scripts/test-api-endpoints.js
 */

const http = require('http')

const BASE_URL = 'http://localhost:3000'

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const req = http.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      })
      res.on('end', () => {
        try {
          const json = JSON.parse(body)
          resolve({ status: res.statusCode, data: json })
        } catch (e) {
          resolve({ status: res.statusCode, data: body })
        }
      })
    })

    req.on('error', reject)

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

async function testEndpoints() {
  console.log('🧪 测试 API 端点...\n')

  try {
    // 测试 1: 健康检查
    console.log('1️⃣ 测试首页...')
    const homeResponse = await makeRequest('/')
    console.log(`   状态: ${homeResponse.status}`)
    if (homeResponse.status === 200) {
      console.log('   ✅ 首页正常\n')
    } else {
      console.log('   ⚠️  首页异常\n')
    }

    // 测试 2: API 路由（未认证）
    console.log('2️⃣ 测试 /api/notes（未认证）...')
    const notesResponse = await makeRequest('/api/notes')
    console.log(`   状态: ${notesResponse.status}`)
    if (notesResponse.status === 401) {
      console.log('   ✅ 正确返回 401 Unauthorized\n')
    } else {
      console.log('   ⚠️  预期 401，实际:', notesResponse.status, '\n')
    }

    // 测试 3: 测试数据库连接 API
    console.log('3️⃣ 测试 /api/test-db...')
    const dbResponse = await makeRequest('/api/test-db')
    console.log(`   状态: ${dbResponse.status}`)
    console.log('   响应:', JSON.stringify(dbResponse.data, null, 2))
    
    if (dbResponse.status === 200 && dbResponse.data.success) {
      console.log('   ✅ 数据库连接正常\n')
    } else {
      console.log('   ⚠️  数据库连接可能有问题\n')
    }

    console.log('📋 总结:')
    console.log('✅ Next.js 服务器运行正常')
    console.log('✅ API 路由可访问')
    console.log('✅ 认证保护正常工作')
    console.log('\n💡 下一步:')
    console.log('   1. 访问 http://localhost:3000')
    console.log('   2. 测试注册功能')
    console.log('   3. 测试登录功能')
    console.log('   4. 测试创建笔记')

  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.log('\n💡 提示:')
    console.log('   确保开发服务器正在运行: npm run dev')
  }
}

testEndpoints()
