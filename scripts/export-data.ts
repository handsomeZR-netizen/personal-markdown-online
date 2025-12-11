#!/usr/bin/env tsx
/**
 * Data Export Script
 * 
 * This script exports all data from the current database (local or Supabase)
 * to a JSON file that can be imported into another database.
 * 
 * Usage:
 *   npx tsx scripts/export-data.ts [options]
 * 
 * Options:
 *   --output <file>    Output file path (default: data-export-{timestamp}.json)
 *   --pretty           Pretty-print JSON output
 *   --validate         Validate data integrity before export
 *   --include <types>  Comma-separated list of data types to include
 *                      (users,notes,folders,tags,categories,collaborators,versions,templates,preferences)
 *   --exclude <types>  Comma-separated list of data types to exclude
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import { getDatabaseConfig, validateDatabaseConfig, getSetupInstructions } from '../src/lib/db-config';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

interface ExportOptions {
  output?: string;
  pretty?: boolean;
  validate?: boolean;
  include?: string[];
  exclude?: string[];
}

interface ExportData {
  metadata: {
    exportDate: string;
    databaseMode: 'local' | 'supabase';
    version: string;
    recordCounts: Record<string, number>;
  };
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

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const prisma = new PrismaClient();

/**
 * Validate data integrity
 */
async function validateDataIntegrity(): Promise<ValidationResult> {
  console.log('🔍 Validating data integrity...\n');
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Check for orphaned notes (notes without valid users)
    const notesWithInvalidUsers = await prisma.note.findMany({
      where: {
        OR: [
          { userId: { equals: undefined } },
          { ownerId: { equals: undefined } }
        ]
      },
      select: { id: true, title: true }
    });
    
    if (notesWithInvalidUsers.length > 0) {
      errors.push(`Found ${notesWithInvalidUsers.length} notes with invalid user references`);
    }
    
    // Check for orphaned folders (folders without valid users)
    const foldersWithInvalidUsers = await prisma.folder.findMany({
      where: { userId: { equals: undefined } },
      select: { id: true, name: true }
    });
    
    if (foldersWithInvalidUsers.length > 0) {
      errors.push(`Found ${foldersWithInvalidUsers.length} folders with invalid user references`);
    }
    
    // Check for circular folder references
    const folders = await prisma.folder.findMany({
      select: { id: true, parentId: true }
    });
    
    const folderMap = new Map(folders.map(f => [f.id, f.parentId]));
    
    for (const folder of folders) {
      const visited = new Set<string>();
      let currentId: string | null = folder.id;
      
      while (currentId) {
        if (visited.has(currentId)) {
          errors.push(`Circular folder reference detected starting from folder ${folder.id}`);
          break;
        }
        visited.add(currentId);
        currentId = folderMap.get(currentId) || null;
      }
    }
    
    // Check for collaborators on non-existent notes
    const collaboratorsWithInvalidNotes = await prisma.collaborator.findMany({
      where: { noteId: { equals: undefined } },
      select: { id: true }
    });
    
    if (collaboratorsWithInvalidNotes.length > 0) {
      errors.push(`Found ${collaboratorsWithInvalidNotes.length} collaborators with invalid note references`);
    }
    
    // Check for duplicate public slugs
    const publicNotes = await prisma.note.findMany({
      where: {
        isPublic: true,
        publicSlug: { not: null }
      },
      select: { publicSlug: true }
    });
    
    const slugCounts = new Map<string, number>();
    publicNotes.forEach(note => {
      if (note.publicSlug) {
        slugCounts.set(note.publicSlug, (slugCounts.get(note.publicSlug) || 0) + 1);
      }
    });
    
    const duplicateSlugs = Array.from(slugCounts.entries()).filter(([_, count]) => count > 1);
    if (duplicateSlugs.length > 0) {
      warnings.push(`Found ${duplicateSlugs.length} duplicate public slugs`);
    }
    
    // Summary
    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ Data integrity validation passed\n');
    } else {
      if (errors.length > 0) {
        console.error('❌ Data integrity errors found:\n');
        errors.forEach(error => console.error(`  - ${error}`));
        console.error('');
      }
      if (warnings.length > 0) {
        console.warn('⚠️  Data integrity warnings:\n');
        warnings.forEach(warning => console.warn(`  - ${warning}`));
        console.warn('');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings
    };
  }
}

/**
 * Check if a data type should be included
 */
function shouldInclude(type: string, options: ExportOptions): boolean {
  if (options.include && options.include.length > 0) {
    return options.include.includes(type);
  }
  if (options.exclude && options.exclude.length > 0) {
    return !options.exclude.includes(type);
  }
  return true;
}

/**
 * Export all data from the database
 */
async function exportData(options: ExportOptions = {}): Promise<ExportData> {
  console.log('📦 Exporting data from database...\n');
  
  const exportData: ExportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      databaseMode: getDatabaseConfig().mode,
      version: '1.0.0',
      recordCounts: {}
    },
    users: [],
    folders: [],
    notes: [],
    tags: [],
    categories: [],
    collaborators: [],
    noteVersions: [],
    noteTemplates: [],
    userPreferences: []
  };
  
  try {
    // Export users
    if (shouldInclude('users', options)) {
      console.log('👥 Exporting users...');
      exportData.users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          password: true,
          name: true,
          avatar: true,
          color: true,
          webhookUrl: true,
          createdAt: true,
          updatedAt: true
        }
      });
      exportData.metadata.recordCounts.users = exportData.users.length;
      console.log(`   ✓ Exported ${exportData.users.length} users`);
    }
    
    // Export user preferences
    if (shouldInclude('preferences', options)) {
      console.log('⚙️  Exporting user preferences...');
      exportData.userPreferences = await prisma.userPreference.findMany();
      exportData.metadata.recordCounts.userPreferences = exportData.userPreferences.length;
      console.log(`   ✓ Exported ${exportData.userPreferences.length} user preferences`);
    }
    
    // Export tags
    if (shouldInclude('tags', options)) {
      console.log('🏷️  Exporting tags...');
      exportData.tags = await prisma.tag.findMany();
      exportData.metadata.recordCounts.tags = exportData.tags.length;
      console.log(`   ✓ Exported ${exportData.tags.length} tags`);
    }
    
    // Export categories
    if (shouldInclude('categories', options)) {
      console.log('📁 Exporting categories...');
      exportData.categories = await prisma.category.findMany();
      exportData.metadata.recordCounts.categories = exportData.categories.length;
      console.log(`   ✓ Exported ${exportData.categories.length} categories`);
    }
    
    // Export folders
    if (shouldInclude('folders', options)) {
      console.log('📂 Exporting folders...');
      exportData.folders = await prisma.folder.findMany({
        orderBy: [
          { parentId: 'asc' }, // Export parent folders first
          { sortOrder: 'asc' }
        ]
      });
      exportData.metadata.recordCounts.folders = exportData.folders.length;
      console.log(`   ✓ Exported ${exportData.folders.length} folders`);
    }
    
    // Export notes with tags
    if (shouldInclude('notes', options)) {
      console.log('📝 Exporting notes...');
      const notes = await prisma.note.findMany({
        include: {
          Tag: {
            select: { id: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
      
      // Transform notes to include tag IDs
      exportData.notes = notes.map(note => ({
        ...note,
        tagIds: note.Tag.map(tag => tag.id),
        Tag: undefined // Remove the Tag object, keep only IDs
      }));
      
      exportData.metadata.recordCounts.notes = exportData.notes.length;
      console.log(`   ✓ Exported ${exportData.notes.length} notes`);
    }
    
    // Export collaborators
    if (shouldInclude('collaborators', options)) {
      console.log('🤝 Exporting collaborators...');
      exportData.collaborators = await prisma.collaborator.findMany();
      exportData.metadata.recordCounts.collaborators = exportData.collaborators.length;
      console.log(`   ✓ Exported ${exportData.collaborators.length} collaborators`);
    }
    
    // Export note versions
    if (shouldInclude('versions', options)) {
      console.log('📜 Exporting note versions...');
      exportData.noteVersions = await prisma.noteVersion.findMany({
        orderBy: { createdAt: 'asc' }
      });
      exportData.metadata.recordCounts.noteVersions = exportData.noteVersions.length;
      console.log(`   ✓ Exported ${exportData.noteVersions.length} note versions`);
    }
    
    // Export note templates
    if (shouldInclude('templates', options)) {
      console.log('📋 Exporting note templates...');
      exportData.noteTemplates = await prisma.noteTemplate.findMany();
      exportData.metadata.recordCounts.noteTemplates = exportData.noteTemplates.length;
      console.log(`   ✓ Exported ${exportData.noteTemplates.length} note templates`);
    }
    
    console.log('\n✅ Data export completed successfully!');
    
    return exportData;
  } catch (error) {
    console.error('\n❌ Export failed:', error);
    throw error;
  }
}

/**
 * Save export data to file
 */
function saveToFile(data: ExportData, options: ExportOptions): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = options.output || `data-export-${timestamp}.json`;
  const filepath = resolve(process.cwd(), filename);
  
  console.log(`\n💾 Saving export to ${filename}...`);
  
  const jsonString = options.pretty
    ? JSON.stringify(data, null, 2)
    : JSON.stringify(data);
  
  writeFileSync(filepath, jsonString, 'utf-8');
  
  const fileSizeKB = (Buffer.byteLength(jsonString, 'utf-8') / 1024).toFixed(2);
  console.log(`✅ Export saved successfully (${fileSizeKB} KB)`);
  
  return filepath;
}

/**
 * Main export function
 */
async function main() {
  console.log('🚀 Database Export Tool\n');
  console.log('─'.repeat(60));
  
  try {
    // Validate database configuration
    console.log('\n🔍 Validating database configuration...\n');
    const validation = validateDatabaseConfig();
    
    if (!validation.isValid) {
      console.error('❌ Database configuration is invalid:\n');
      validation.errors.forEach(error => console.error(`  - ${error}`));
      console.error('\n' + getSetupInstructions(validation.mode));
      process.exit(1);
    }
    
    const config = getDatabaseConfig();
    console.log(`✅ Database configuration valid (mode: ${config.mode})\n`);
    console.log('─'.repeat(60));
    
    // Parse command line options
    const options = parseArgs();
    
    // Validate data integrity if requested
    if (options.validate) {
      const integrityResult = await validateDataIntegrity();
      if (!integrityResult.isValid) {
        console.error('❌ Data integrity validation failed. Export aborted.');
        console.error('   Fix the errors and try again, or run without --validate flag.\n');
        process.exit(1);
      }
      console.log('─'.repeat(60));
    }
    
    // Export data
    const exportedData = await exportData(options);
    
    console.log('─'.repeat(60));
    
    // Save to file
    const filepath = saveToFile(exportedData, options);
    
    console.log('\n📊 Export Summary:');
    console.log(`   Database Mode: ${exportedData.metadata.databaseMode}`);
    console.log(`   Export Date: ${exportedData.metadata.exportDate}`);
    console.log(`   File: ${filepath}`);
    console.log('\n   Record Counts:');
    Object.entries(exportedData.metadata.recordCounts).forEach(([type, count]) => {
      console.log(`     ${type}: ${count}`);
    });
    
    console.log('\n✨ Export completed successfully!');
    console.log(`\n💡 To import this data, run:`);
    console.log(`   npx tsx scripts/import-data.ts --input ${filepath.split('/').pop()}\n`);
    
  } catch (error) {
    console.error('\n❌ Export failed:\n');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): ExportOptions {
  const args = process.argv.slice(2);
  const options: ExportOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--output' && i + 1 < args.length) {
      options.output = args[i + 1];
      i++;
    } else if (arg === '--pretty') {
      options.pretty = true;
    } else if (arg === '--validate') {
      options.validate = true;
    } else if (arg === '--include' && i + 1 < args.length) {
      options.include = args[i + 1].split(',').map(s => s.trim());
      i++;
    } else if (arg === '--exclude' && i + 1 < args.length) {
      options.exclude = args[i + 1].split(',').map(s => s.trim());
      i++;
    }
  }
  
  return options;
}

// Run main function
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
