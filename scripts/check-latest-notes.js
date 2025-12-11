const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    const notes = await prisma.note.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      }
    });
    
    console.log('=== 最新 5 篇笔记 ===');
    notes.forEach(note => {
      console.log(`- ${note.title}`);
      console.log(`  ID: ${note.id}`);
      console.log(`  创建时间: ${note.createdAt}`);
      console.log(`  更新时间: ${note.updatedAt}`);
      console.log(`  用户ID: ${note.userId}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
