const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // 模拟 getNotes 的查询
    const userId = 'cmiydoyg90000unh0js5b7egz'; // user1
    
    const baseWhere = {
      OR: [
        { userId },
        { ownerId: userId },
        { Collaborator: { some: { userId } } }
      ]
    };
    
    console.log('Query where:', JSON.stringify(baseWhere, null, 2));
    
    const [totalCount, notes] = await Promise.all([
      prisma.note.count({ where: baseWhere }),
      prisma.note.findMany({
        where: baseWhere,
        orderBy: { updatedAt: 'desc' },
        take: 20,
        select: {
          id: true,
          title: true,
          userId: true,
          ownerId: true,
        }
      })
    ]);
    
    console.log('\nTotal count:', totalCount);
    console.log('Notes found:', notes.length);
    notes.forEach(n => {
      console.log(`  - ${n.title} (userId: ${n.userId}, ownerId: ${n.ownerId})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
