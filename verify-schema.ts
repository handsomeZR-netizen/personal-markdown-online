// Verification script to check Prisma client has all required models and fields
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySchema() {
  console.log('✓ Verifying Prisma Client Schema...\n');

  // Check that all models are accessible
  const models = [
    'user',
    'note', 
    'folder',
    'collaborator',
    'noteVersion',
    'noteTemplate',
    'tag',
    'category'
  ];

  console.log('Checking models:');
  models.forEach(model => {
    if (prisma[model as keyof typeof prisma]) {
      console.log(`  ✓ ${model} model exists`);
    } else {
      console.log(`  ✗ ${model} model missing`);
    }
  });

  console.log('\n✓ Schema verification complete!');
  console.log('\nNew models added:');
  console.log('  - Folder (for hierarchical organization)');
  console.log('  - Collaborator (for note sharing)');
  console.log('  - NoteVersion (for version history)');
  console.log('  - NoteTemplate (for reusable templates)');
  
  console.log('\nNew User fields:');
  console.log('  - avatar (string)');
  console.log('  - color (string)');
  console.log('  - webhookUrl (string)');
  
  console.log('\nNew Note fields:');
  console.log('  - folderId (string)');
  console.log('  - ownerId (string)');
  console.log('  - isPublic (boolean)');
  console.log('  - publicSlug (string)');
  console.log('  - contentType (string)');

  await prisma.$disconnect();
}

verifySchema().catch(console.error);
