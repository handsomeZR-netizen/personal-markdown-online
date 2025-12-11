const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    const tags = await prisma.tag.findMany();
    console.log('Tags count:', tags.length);
    console.log('Tags:', tags);
    
    const categories = await prisma.category.findMany();
    console.log('Categories count:', categories.length);
    console.log('Categories:', categories);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
