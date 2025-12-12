#!/usr/bin/env tsx
/**
 * Import data to Neon database
 * 
 * Usage:
 *   npx tsx scripts/import-to-neon.ts
 * 
 * Before running:
 * 1. Fill in your Neon connection string in .env.neon
 * 2. Run neon-setup.sql in Neon SQL Editor to create tables
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';

// Load Neon environment variables BEFORE importing Prisma
config({ path: resolve(process.cwd(), '.env.neon'), override: true });

// Now import Prisma after env is loaded
import { PrismaClient } from '@prisma/client';

// Create client with explicit datasource URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

interface ImportData {
  metadata: any;
  users: any[];
  folders: any[];
  notes: any[];
  tags: any[];
  categories: any[];
  collaborators: any[];
  noteVersions: any[];
  noteTemplates: any[];
  userPreferences: any[];
}

async function main() {
  console.log('🚀 Import to Neon Database\n');
  console.log('─'.repeat(60));
  
  // Check connection
  console.log('\n🔍 Testing Neon connection...');
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connected to Neon successfully!\n');
  } catch (error) {
    console.error('❌ Failed to connect to Neon:');
    console.error('   Please check your DATABASE_URL in .env.neon');
    console.error('   Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
  
  // Load export file
  const exportFile = resolve(process.cwd(), 'local-data-export.json');
  if (!existsSync(exportFile)) {
    console.error('❌ Export file not found: local-data-export.json');
    console.error('   Run: npx tsx scripts/export-data.ts --output local-data-export.json');
    process.exit(1);
  }
  
  console.log('📂 Loading export file...');
  const data: ImportData = JSON.parse(readFileSync(exportFile, 'utf-8'));
  console.log(`   Source: ${data.metadata.databaseMode} mode`);
  console.log(`   Export date: ${data.metadata.exportDate}\n`);
  
  console.log('─'.repeat(60));
  console.log('\n📥 Importing data...\n');
  
  try {
    // Import users
    console.log('👥 Importing users...');
    for (const user of data.users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: user
      });
    }
    console.log(`   ✓ Imported ${data.users.length} users`);
    
    // Import user preferences
    console.log('⚙️  Importing user preferences...');
    for (const pref of data.userPreferences) {
      await prisma.userPreference.upsert({
        where: { id: pref.id },
        update: {},
        create: pref
      });
    }
    console.log(`   ✓ Imported ${data.userPreferences.length} user preferences`);
    
    // Import tags
    console.log('🏷️  Importing tags...');
    for (const tag of data.tags) {
      await prisma.tag.upsert({
        where: { id: tag.id },
        update: {},
        create: tag
      });
    }
    console.log(`   ✓ Imported ${data.tags.length} tags`);
    
    // Import categories
    console.log('📁 Importing categories...');
    for (const category of data.categories) {
      await prisma.category.upsert({
        where: { id: category.id },
        update: {},
        create: category
      });
    }
    console.log(`   ✓ Imported ${data.categories.length} categories`);
    
    // Import folders (parents first)
    console.log('📂 Importing folders...');
    const sortedFolders = [...data.folders].sort((a, b) => {
      if (!a.parentId) return -1;
      if (!b.parentId) return 1;
      return 0;
    });
    for (const folder of sortedFolders) {
      await prisma.folder.upsert({
        where: { id: folder.id },
        update: {},
        create: folder
      });
    }
    console.log(`   ✓ Imported ${data.folders.length} folders`);
    
    // Import notes with tags
    console.log('📝 Importing notes...');
    for (const note of data.notes) {
      const { tagIds, Tag, ...noteData } = note;
      await prisma.note.upsert({
        where: { id: note.id },
        update: {},
        create: {
          ...noteData,
          Tag: tagIds && tagIds.length > 0 ? {
            connect: tagIds.map((id: string) => ({ id }))
          } : undefined
        }
      });
    }
    console.log(`   ✓ Imported ${data.notes.length} notes`);
    
    // Import collaborators
    console.log('🤝 Importing collaborators...');
    for (const collab of data.collaborators) {
      await prisma.collaborator.upsert({
        where: { id: collab.id },
        update: {},
        create: collab
      });
    }
    console.log(`   ✓ Imported ${data.collaborators.length} collaborators`);
    
    // Import note versions
    console.log('📜 Importing note versions...');
    for (const version of data.noteVersions) {
      await prisma.noteVersion.upsert({
        where: { id: version.id },
        update: {},
        create: version
      });
    }
    console.log(`   ✓ Imported ${data.noteVersions.length} note versions`);
    
    // Import note templates
    console.log('📋 Importing note templates...');
    for (const template of data.noteTemplates) {
      await prisma.noteTemplate.upsert({
        where: { id: template.id },
        update: {},
        create: template
      });
    }
    console.log(`   ✓ Imported ${data.noteTemplates.length} note templates`);
    
    console.log('\n─'.repeat(60));
    console.log('\n✨ Import completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Users: ${data.users.length}`);
    console.log(`   Notes: ${data.notes.length}`);
    console.log(`   Folders: ${data.folders.length}`);
    console.log(`   Tags: ${data.tags.length}`);
    console.log(`   Categories: ${data.categories.length}`);
    
    console.log('\n🔐 Test credentials:');
    console.log('   Email: user1@example.com');
    console.log('   Password: password123\n');
    
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
