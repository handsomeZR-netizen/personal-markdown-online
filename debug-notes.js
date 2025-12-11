const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // 查看笔记的 userId 和 ownerId
    const notes = await prisma.note.findMany({
      take: 5,
      select: { 
        id: true, 
        title: true, 
        userId: true, 
        ownerId: true 
      }
    });
    
    console.log('Notes in database:');
    notes.forEach(n => {
      console.log(`  - ${n.title}`);
      console.log(`    userId: ${n.userId}`);
      console.log(`    ownerId: ${n.ownerId}`);
    });
    
    // 查看当前用户
    const users = await prisma.user.findMany({
      select: { id: true, email: true }
    });
    console.log('\nUsers:');
    users.forEach(u => {
      console.log(`  - ${u.email}: ${u.id}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
