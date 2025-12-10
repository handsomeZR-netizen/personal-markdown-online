#!/usr/bin/env tsx
/**
 * Data Import Script
 * 
 * This script imports data from a JSON export file into the current database.
 * Supports importing between local and Supabase databases.
 * 
 * Usage:
 *   npx tsx scripts/import-data.ts --input <file> [options]
 * 
 * Options:
 *   --input <file>     Input JSON file (required)
 *   --mode <mode>      Import mode: merge, replace, or skip (default: merge)
 *                      - merge: Add new records, skip existing ones
 *                      - replace: Delete existing data and import
 *                      - skip: Skip records that already exist
 *   --validate         Validate data before import
 *   --dry-run          Show what would be imported without making changes
 *   --include <types>  Comma-separated list of data types to import
 *   --exclude <types>  Comma-separated list of data types to exclude
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import { getDatabaseConfig, validateDatabaseConfig, getSetupInstructions } from '../src/lib/db-config';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

interface ImportOptions {
  input: string;
  mode?: 'merge' | 'replace' | 'skip';
  validate?: boolean;
  dryRun?: boolean;
  include?: string[];
  exclude?: string[];
}

interface ImportData {
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

interface ImportResult {
  imported: Record<string, number>;
  skipped: Record<string, number>;
  errors: string[];
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const prisma = new PrismaClient();

/**
 * Load and parse import file
 */
function loadImportFile(filepath: string): ImportData {
  console.log(`📂 Loading import file: ${filepath}...\n`);
  
  const fullPath = resolve(process.cwd(), filepath);
  
  if (!existsSync(fullPath)) {
    throw new Error(`Import file not found: ${filepath}`);
  }
  
  try {
    const fileContent = readFileSync(fullPath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Validate file structure
    if (!data.metadata || !data.metadata.version) {
      throw new Error('Invalid import file: missing metadata');
    }
    
    console.log('✅ Import file loaded successfully');
    console.log(`   Export Date: ${data.metadata.exportDate}`);
    console.log(`   Source Mode: ${data.metadata.databaseMode}`);
    console.log(`   Version: ${data.metadata.version}\n`);
    
    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in import file: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validate import data
 */
async function validateImportData(data: ImportData): Promise<ValidationResult> {
  console.log('🔍 Validating import data...\n');
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Check for required user references
    const userIds = new Set(data.users.map(u => u.id));
    
    // Validate notes have valid user references
    data.notes.forEach(note => {
      if (!userIds.has(note.userId)) {
        errors.push(`Note "${note.title}" references non-existent user: ${note.userId}`);
      }
      if (!userIds.has(note.ownerId)) {
        errors.push(`Note "${note.title}" references non-existent owner: ${note.ownerId}`);
      }
    });
    
    // Validate folders have valid user references
    data.folders.forEach(folder => {
      if (!userIds.has(folder.userId)) {
        errors.push(`Folder "${folder.name}" references non-existent user: ${folder.userId}`);
      }
    });
    
    // Check for circular folder references
    const folderMap = new Map(data.folders.map(f => [f.id, f.parentId]));
    
    data.folders.forEach(folder => {
      const visited = new Set<string>();
      let currentId: string | null = folder.id;
      
      while (currentId) {
        if (visited.has(currentId)) {
          errors.push(`Circular folder reference detected in folder: ${folder.name}`);
          break;
        }
        visited.add(currentId);
        currentId = folderMap.get(currentId) || null;
      }
    });
    
    // Validate collaborators
    const noteIds = new Set(data.notes.map(n => n.id));
    data.collaborators.forEach(collab => {
      if (!noteIds.has(collab.noteId)) {
        errors.push(`Collaborator references non-existent note: ${collab.noteId}`);
      }
      if (!userIds.has(collab.userId)) {
        errors.push(`Collaborator references non-existent user: ${collab.userId}`);
      }
    });
    
    // Check for duplicate emails
    const emails = data.users.map(u => u.email);
    const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
    if (duplicateEmails.length > 0) {
      warnings.push(`Found duplicate emails in import data: ${duplicateEmails.join(', ')}`);
    }
    
    // Summary
    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ Import data validation passed\n');
    } else {
      if (errors.length > 0) {
        console.error('❌ Import data validation errors:\n');
        errors.forEach(error => console.error(`  - ${error}`));
        console.error('');
      }
      if (warnings.length > 0) {
        console.warn('⚠️  Import data validation warnings:\n');
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
function shouldInclude(type: string, options: ImportOptions): boolean {
  if (options.include && options.include.length > 0) {
    return options.include.includes(type);
  }
  if (options.exclude && options.exclude.length > 0) {
    return !options.exclude.includes(type);
  }
  return true;
}

/**
 * Clear existing data (for replace mode)
 */
async function clearExistingData(options: ImportOptions): Promise<void> {
  console.log('🗑️  Clearing existing data...\n');
  
  // Delete in correct order to respect foreign key constraints
  if (shouldInclude('versions', options)) {
    const count = await prisma.noteVersion.deleteMany();
    console.log(`   ✓ Deleted ${count.count} note versions`);
  }
  
  if (shouldInclude('collaborators', options)) {
    const count = await prisma.collaborator.deleteMany();
    console.log(`   ✓ Deleted ${count.count} collaborators`);
  }
  
  if (shouldInclude('notes', options)) {
    const count = await prisma.note.deleteMany();
    console.log(`   ✓ Deleted ${count.count} notes`);
  }
  
  if (shouldInclude('folders', options)) {
    const count = await prisma.folder.deleteMany();
    console.log(`   ✓ Deleted ${count.count} folders`);
  }
  
  if (shouldInclude('templates', options)) {
    const count = await prisma.noteTemplate.deleteMany();
    console.log(`   ✓ Deleted ${count.count} note templates`);
  }
  
  if (shouldInclude('preferences', options)) {
    const count = await prisma.userPreference.deleteMany();
    console.log(`   ✓ Deleted ${count.count} user preferences`);
  }
  
  if (shouldInclude('tags', options)) {
    const count = await prisma.tag.deleteMany();
    console.log(`   ✓ Deleted ${count.count} tags`);
  }
  
  if (shouldInclude('categories', options)) {
    const count = await prisma.category.deleteMany();
    console.log(`   ✓ Deleted ${count.count} categories`);
  }
  
  if (shouldInclude('users', options)) {
    const count = await prisma.user.deleteMany();
    console.log(`   ✓ Deleted ${count.count} users`);
  }
  
  console.log('\n✅ Existing data cleared\n');
}

/**
 * Import data into database
 */
async function importData(data: ImportData, options: ImportOptions): Promise<ImportResult> {
  console.log('📥 Importing data into database...\n');
  
  const result: ImportResult = {
    imported: {},
    skipped: {},
    errors: []
  };
  
  const mode = options.mode || 'merge';
  
  try {
    // Import users
    if (shouldInclude('users', options) && data.users.length > 0) {
      console.log('👥 Importing users...');
      let imported = 0;
      let skipped = 0;
      
      for (const user of data.users) {
        try {
          if (mode === 'skip') {
            const existing = await prisma.user.findUnique({ where: { id: user.id } });
            if (existing) {
              skipped++;
              continue;
            }
          }
          
          await prisma.user.upsert({
            where: { id: user.id },
            update: {},
            create: user
          });
          imported++;
        } catch (error) {
          result.errors.push(`Failed to import user ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      result.imported.users = imported;
      result.skipped.users = skipped;
      console.log(`   ✓ Imported ${imported} users${skipped > 0 ? `, skipped ${skipped}` : ''}`);
    }
    
    // Import user preferences
    if (shouldInclude('preferences', options) && data.userPreferences.length > 0) {
      console.log('⚙️  Importing user preferences...');
      let imported = 0;
      let skipped = 0;
      
      for (const pref of data.userPreferences) {
        try {
          if (mode === 'skip') {
            const existing = await prisma.userPreference.findUnique({ where: { id: pref.id } });
            if (existing) {
              skipped++;
              continue;
            }
          }
          
          await prisma.userPreference.upsert({
            where: { id: pref.id },
            update: {},
            create: pref
          });
          imported++;
        } catch (error) {
          result.errors.push(`Failed to import user preference: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      result.imported.userPreferences = imported;
      result.skipped.userPreferences = skipped;
      console.log(`   ✓ Imported ${imported} user preferences${skipped > 0 ? `, skipped ${skipped}` : ''}`);
    }
    
    // Import tags
    if (shouldInclude('tags', options) && data.tags.length > 0) {
      console.log('🏷️  Importing tags...');
      let imported = 0;
      let skipped = 0;
      
      for (const tag of data.tags) {
        try {
          if (mode === 'skip') {
            const existing = await prisma.tag.findUnique({ where: { id: tag.id } });
            if (existing) {
              skipped++;
              continue;
            }
          }
          
          await prisma.tag.upsert({
            where: { id: tag.id },
            update: {},
            create: tag
          });
          imported++;
        } catch (error) {
          result.errors.push(`Failed to import tag ${tag.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      result.imported.tags = imported;
      result.skipped.tags = skipped;
      console.log(`   ✓ Imported ${imported} tags${skipped > 0 ? `, skipped ${skipped}` : ''}`);
    }

    // Import categories
    if (shouldInclude('categories', options) && data.categories.length > 0) {
      console.log('📁 Importing categories...');
      let imported = 0;
      let skipped = 0;
      
      for (const category of data.categories) {
        try {
          if (mode === 'skip') {
            const existing = await prisma.category.findUnique({ where: { id: category.id } });
            if (existing) {
              skipped++;
              continue;
            }
          }
          
          await prisma.category.upsert({
            where: { id: category.id },
            update: {},
            create: category
          });
          imported++;
        } catch (error) {
          result.errors.push(`Failed to import category ${category.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      result.imported.categories = imported;
      result.skipped.categories = skipped;
      console.log(`   ✓ Imported ${imported} categories${skipped > 0 ? `, skipped ${skipped}` : ''}`);
    }
    
    // Import folders (in order to handle hierarchy)
    if (shouldInclude('folders', options) && data.folders.length > 0) {
      console.log('📂 Importing folders...');
      let imported = 0;
      let skipped = 0;
      
      // Sort folders to import parents before children
      const sortedFolders = [...data.folders].sort((a, b) => {
        if (!a.parentId) return -1;
        if (!b.parentId) return 1;
        return 0;
      });
      
      for (const folder of sortedFolders) {
        try {
          if (mode === 'skip') {
            const existing = await prisma.folder.findUnique({ where: { id: folder.id } });
            if (existing) {
              skipped++;
              continue;
            }
          }
          
          await prisma.folder.upsert({
            where: { id: folder.id },
            update: {},
            create: folder
          });
          imported++;
        } catch (error) {
          result.errors.push(`Failed to import folder ${folder.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      result.imported.folders = imported;
      result.skipped.folders = skipped;
      console.log(`   ✓ Imported ${imported} folders${skipped > 0 ? `, skipped ${skipped}` : ''}`);
    }

    // Import notes with tags
    if (shouldInclude('notes', options) && data.notes.length > 0) {
      console.log('📝 Importing notes...');
      let imported = 0;
      let skipped = 0;
      
      for (const note of data.notes) {
        try {
          if (mode === 'skip') {
            const existing = await prisma.note.findUnique({ where: { id: note.id } });
            if (existing) {
              skipped++;
              continue;
            }
          }
          
          const { tagIds, ...noteData } = note;
          
          await prisma.note.upsert({
            where: { id: note.id },
            update: {},
            create: {
              ...noteData,
              tags: tagIds && tagIds.length > 0 ? {
                connect: tagIds.map((id: string) => ({ id }))
              } : undefined
            }
          });
          imported++;
        } catch (error) {
          result.errors.push(`Failed to import note ${note.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      result.imported.notes = imported;
      result.skipped.notes = skipped;
      console.log(`   ✓ Imported ${imported} notes${skipped > 0 ? `, skipped ${skipped}` : ''}`);
    }
    
    // Import collaborators
    if (shouldInclude('collaborators', options) && data.collaborators.length > 0) {
      console.log('🤝 Importing collaborators...');
      let imported = 0;
      let skipped = 0;
      
      for (const collab of data.collaborators) {
        try {
          if (mode === 'skip') {
            const existing = await prisma.collaborator.findUnique({ where: { id: collab.id } });
            if (existing) {
              skipped++;
              continue;
            }
          }
          
          await prisma.collaborator.upsert({
            where: { id: collab.id },
            update: {},
            create: collab
          });
          imported++;
        } catch (error) {
          result.errors.push(`Failed to import collaborator: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      result.imported.collaborators = imported;
      result.skipped.collaborators = skipped;
      console.log(`   ✓ Imported ${imported} collaborators${skipped > 0 ? `, skipped ${skipped}` : ''}`);
    }

    // Import note versions
    if (shouldInclude('versions', options) && data.noteVersions.length > 0) {
      console.log('📜 Importing note versions...');
      let imported = 0;
      let skipped = 0;
      
      for (const version of data.noteVersions) {
        try {
          if (mode === 'skip') {
            const existing = await prisma.noteVersion.findUnique({ where: { id: version.id } });
            if (existing) {
              skipped++;
              continue;
            }
          }
          
          await prisma.noteVersion.upsert({
            where: { id: version.id },
            update: {},
            create: version
          });
          imported++;
        } catch (error) {
          result.errors.push(`Failed to import note version: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      result.imported.noteVersions = imported;
      result.skipped.noteVersions = skipped;
      console.log(`   ✓ Imported ${imported} note versions${skipped > 0 ? `, skipped ${skipped}` : ''}`);
    }
    
    // Import note templates
    if (shouldInclude('templates', options) && data.noteTemplates.length > 0) {
      console.log('📋 Importing note templates...');
      let imported = 0;
      let skipped = 0;
      
      for (const template of data.noteTemplates) {
        try {
          if (mode === 'skip') {
            const existing = await prisma.noteTemplate.findUnique({ where: { id: template.id } });
            if (existing) {
              skipped++;
              continue;
            }
          }
          
          await prisma.noteTemplate.upsert({
            where: { id: template.id },
            update: {},
            create: template
          });
          imported++;
        } catch (error) {
          result.errors.push(`Failed to import note template ${template.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      result.imported.noteTemplates = imported;
      result.skipped.noteTemplates = skipped;
      console.log(`   ✓ Imported ${imported} note templates${skipped > 0 ? `, skipped ${skipped}` : ''}`);
    }
    
    console.log('\n✅ Data import completed!');
    
    return result;
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    throw error;
  }
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Database Import Tool\n');
  console.log('─'.repeat(60));
  
  try {
    // Parse command line options
    const options = parseArgs();
    
    if (!options.input) {
      console.error('❌ Error: --input parameter is required\n');
      console.log('Usage: npx tsx scripts/import-data.ts --input <file> [options]\n');
      console.log('Options:');
      console.log('  --input <file>     Input JSON file (required)');
      console.log('  --mode <mode>      Import mode: merge, replace, or skip (default: merge)');
      console.log('  --validate         Validate data before import');
      console.log('  --dry-run          Show what would be imported without making changes');
      console.log('  --include <types>  Comma-separated list of data types to import');
      console.log('  --exclude <types>  Comma-separated list of data types to exclude\n');
      process.exit(1);
    }
    
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
    
    // Load import file
    const dataToImport = loadImportFile(options.input);
    console.log('─'.repeat(60));
    
    // Validate import data if requested
    if (options.validate) {
      const validationResult = await validateImportData(dataToImport);
      if (!validationResult.isValid) {
        console.error('❌ Import data validation failed. Import aborted.');
        console.error('   Fix the errors and try again, or run without --validate flag.\n');
        process.exit(1);
      }
      console.log('─'.repeat(60));
    }
    
    // Show what will be imported
    console.log('\n📋 Import Plan:');
    console.log(`   Mode: ${options.mode || 'merge'}`);
    console.log(`   Source: ${dataToImport.metadata.databaseMode}`);
    console.log(`   Target: ${config.mode}`);
    console.log(`   Dry Run: ${options.dryRun ? 'Yes' : 'No'}`);
    console.log('\n   Records to import:');
    Object.entries(dataToImport.metadata.recordCounts).forEach(([type, count]) => {
      if (shouldInclude(type, options)) {
        console.log(`     ${type}: ${count}`);
      }
    });
    console.log('');
    console.log('─'.repeat(60));
    
    if (options.dryRun) {
      console.log('\n✅ Dry run completed. No changes were made.\n');
      return;
    }
    
    // Clear existing data if replace mode
    if (options.mode === 'replace') {
      await clearExistingData(options);
      console.log('─'.repeat(60));
    }
    
    // Import data
    const result = await importData(dataToImport, options);
    
    console.log('─'.repeat(60));
    
    // Show results
    console.log('\n📊 Import Summary:');
    console.log('\n   Imported:');
    Object.entries(result.imported).forEach(([type, count]) => {
      console.log(`     ${type}: ${count}`);
    });
    
    if (Object.keys(result.skipped).length > 0) {
      console.log('\n   Skipped:');
      Object.entries(result.skipped).forEach(([type, count]) => {
        if (count > 0) {
          console.log(`     ${type}: ${count}`);
        }
      });
    }
    
    if (result.errors.length > 0) {
      console.log('\n   Errors:');
      result.errors.forEach(error => console.log(`     - ${error}`));
    }
    
    console.log('\n✨ Import completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Import failed:\n');
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
function parseArgs(): ImportOptions {
  const args = process.argv.slice(2);
  const options: ImportOptions = {
    input: ''
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--input' && i + 1 < args.length) {
      options.input = args[i + 1];
      i++;
    } else if (arg === '--mode' && i + 1 < args.length) {
      const mode = args[i + 1];
      if (mode === 'merge' || mode === 'replace' || mode === 'skip') {
        options.mode = mode;
      } else {
        console.error(`Invalid mode: ${mode}. Must be merge, replace, or skip.`);
        process.exit(1);
      }
      i++;
    } else if (arg === '--validate') {
      options.validate = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
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
