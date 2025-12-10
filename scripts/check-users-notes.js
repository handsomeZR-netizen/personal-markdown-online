const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('=== 用户列表 ===');
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true }
  });
  users.forEach(u => console.log(`ID: ${u.id}, Email: ${u.email}, Name: ${u.name}`));
  
  console.log('\n=== 笔记统计 ===');
  for (const user of users) {
    const noteCount = await prisma.note.count({ where: { userId: user.id } });
    console.log(`${user.email}: ${noteCount} 篇笔记`);
  }
  
  console.log('\n=== 最近笔记 ===');
  const notes = await prisma.note.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, userId: true }
  });
  notes.forEach(n => console.log(`${n.title} (userId: ${n.userId})`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
