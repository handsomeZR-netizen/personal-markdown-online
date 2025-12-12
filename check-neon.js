// 检查 Neon 数据库数据
require('dotenv').config({ path: '.env.neon', override: true });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function check() {
  try {
    const users = await prisma.user.count();
    const notes = await prisma.note.count();
    const folders = await prisma.folder.count();
    const tags = await prisma.tag.count();
    
    console.log('=== Neon Database Status ===');
    console.log('Users:', users);
    console.log('Notes:', notes);
    console.log('Folders:', folders);
    console.log('Tags:', tags);
    
    if (users > 0) {
      const userList = await prisma.user.findMany({ select: { email: true, name: true } });
      console.log('\nUser emails:');
      userList.forEach(u => console.log(' -', u.email, u.name ? `(${u.name})` : ''));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
