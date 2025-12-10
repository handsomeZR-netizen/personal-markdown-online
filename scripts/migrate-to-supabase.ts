/**
 * SQLite to Supabase 数据迁移脚本
 * 
 * 使用方法:
 * 1. 确保 .env.local 中配置了 DATABASE_URL (Supabase)
 * 2. 运行: npx tsx scripts/migrate-to-supabase.ts
 */

import { PrismaClient } from '@prisma/client'

// SQLite 客户端
const sqlite = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
})

// PostgreSQL (Supabase) 客户端
const postgres = new PrismaClient()

async function migrate() {
  console.log('🚀 开始迁移数据到Supabase...\n')
  
  try {
    // 1. 迁移用户
    console.log('📦 迁移用户数据...')
    const users = await sqlite.user.findMany()
    
    for (const user of users) {
      try {
        await postgres.user.create({
          data: {
            id: user.id,
            email: user.email,
            password: user.password,
            name: user.name,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }
        })
      } catch (error) {
        console.log(`  ⚠️  用户 ${user.email} 已存在，跳过`)
      }
    }
    console.log(`✅ 成功迁移 ${users.length} 个用户\n`)
    
    // 2. 迁移分类
    console.log('📦 迁移分类数据...')
    const categories = await sqlite.category.findMany()
    
    for (const category of categories) {
      try {
        await postgres.category.create({
          data: {
            id: category.id,
            name: category.name,
          }
        })
      } catch (error) {
        console.log(`  ⚠️  分类 ${category.name} 已存在，跳过`)
      }
    }
    console.log(`✅ 成功迁移 ${categories.length} 个分类\n`)
    
    // 3. 迁移标签
    console.log('📦 迁移标签数据...')
    const tags = await sqlite.tag.findMany()
    
    for (const tag of tags) {
      try {
        await postgres.tag.create({
          data: {
            id: tag.id,
            name: tag.name,
          }
        })
      } catch (error) {
        console.log(`  ⚠️  标签 ${tag.name} 已存在，跳过`)
      }
    }
    console.log(`✅ 成功迁移 ${tags.length} 个标签\n`)
    
    // 4. 迁移笔记
    console.log('📦 迁移笔记数据...')
    const notes = await sqlite.note.findMany({
      include: {
        tags: true
      }
    })
    
    for (const note of notes) {
      try {
        const { tags, ...noteData } = note
        
        await postgres.note.create({
          data: {
            id: noteData.id,
            title: noteData.title,
            content: noteData.content,
            summary: noteData.summary,
            embedding: noteData.embedding,
            userId: noteData.userId,
            ownerId: noteData.userId, // ownerId is required
            categoryId: noteData.categoryId,
            createdAt: noteData.createdAt,
            updatedAt: noteData.updatedAt,
            tags: {
              connect: tags.map(tag => ({ id: tag.id }))
            }
          }
        })
      } catch (error) {
        console.log(`  ⚠️  笔记 ${note.title} 已存在，跳过`)
      }
    }
    console.log(`✅ 成功迁移 ${notes.length} 条笔记\n`)
    
    // 5. 验证数据
    console.log('🔍 验证迁移结果...')
    const postgresUsers = await postgres.user.count()
    const postgresNotes = await postgres.note.count()
    const postgresTags = await postgres.tag.count()
    const postgresCategories = await postgres.category.count()
    
    console.log(`
📊 迁移统计:
  用户: ${postgresUsers}
  笔记: ${postgresNotes}
  标签: ${postgresTags}
  分类: ${postgresCategories}
`)
    
    console.log('✨ 迁移完成！')
    
  } catch (error) {
    console.error('❌ 迁移失败:', error)
    throw error
  } finally {
    await sqlite.$disconnect()
    await postgres.$disconnect()
  }
}

// 执行迁移
migrate()
  .catch((error) => {
    console.error('迁移过程中发生错误:', error)
    process.exit(1)
  })
