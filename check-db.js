const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // 查找 user1@example.com 的完整信息
    const user1 = await prisma.user.findUnique({
      where: { email: 'user1@example.com' },
      select: { id: true, email: true, name: true }
    });
    
    console.log('User1 in database:');
    console.log('  ID:', user1?.id);
    console.log('  Email:', user1?.email);
    
    if (user1) {
      // 查找该用户的笔记
      const notes = await prisma.note.findMany({
        where: {
          OR: [
            { userId: user1.id },
            { ownerId: user1.id }
          ]
        },
        select: { id: true, title: true, userId: true, ownerId: true },
        take: 5
      });
      
      console.log('\nNotes for user1:');
      notes.forEach(n => {
        console.log(`  - ${n.title} (ID: ${n.id})`);
      });
      
      // 检查第一个笔记的详细信息
      if (notes.length > 0) {
        console.log('\nFirst note ID to test:', notes[0].id);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
