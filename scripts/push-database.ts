#!/usr/bin/env tsx
/**
 * Database Push Script
 * 
 * This script pushes the Prisma schema to the database without creating migrations.
 * Useful for prototyping or when you want to sync the schema directly.
 * 
 * WARNING: This can be destructive. Use with caution in production.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { execSync } from 'child_process';
import { getDatabaseConfig, validateDatabaseConfig, getSetupInstructions } from '../src/lib/db-config';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

interface PushOptions {
  acceptDataLoss?: boolean;
  skipGenerate?: boolean;
  forceReset?: boolean;
}

/**
 * Push database schema
 */
async function pushDatabase(options: PushOptions = {}) {
  console.log('🔍 Validating database configuration...\n');
  
  try {
    // Validate configuration
    const validation = validateDatabaseConfig();
    
    if (!validation.isValid) {
      console.error('❌ Database configuration is invalid:\n');
      validation.errors.forEach(error => console.error(`  - ${error}`));
      console.error('\n' + getSetupInstructions(validation.mode));
      process.exit(1);
    }
    
    // Show warnings if any
    if (validation.warnings.length > 0) {
      console.warn('⚠️  Warnings:\n');
      validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
      console.warn('');
    }
    
    // Get database config
    const config = getDatabaseConfig();
    console.log(`✅ Database configuration valid (mode: ${config.mode})\n`);
    
    // Build push command
    let command = 'npx prisma db push';
    
    if (options.acceptDataLoss) {
      command += ' --accept-data-loss';
    }
    
    if (options.skipGenerate) {
      command += ' --skip-generate';
    }
    
    if (options.forceReset) {
      command += ' --force-reset';
    }
    
    console.log(`🚀 Running push command: ${command}\n`);
    
    if (!options.acceptDataLoss) {
      console.warn('⚠️  WARNING: This operation may result in data loss.');
      console.warn('   Use --accept-data-loss flag to proceed without confirmation.\n');
    }
    
    console.log('─'.repeat(60));
    
    // Run push
    execSync(command, {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: config.connectionString,
        DIRECT_URL: config.directUrl || config.connectionString
      }
    });
    
    console.log('─'.repeat(60));
    console.log('\n✅ Schema pushed successfully!\n');
    
    // Show mode-specific information
    if (config.mode === 'local') {
      console.log('📝 Local database schema updated');
      console.log('   Database: Local PostgreSQL');
    } else {
      console.log('📝 Supabase database schema updated');
      console.log('   Database: Supabase PostgreSQL');
    }
    
  } catch (error) {
    console.error('\n❌ Push failed:\n');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): PushOptions {
  const args = process.argv.slice(2);
  const options: PushOptions = {};
  
  for (const arg of args) {
    if (arg === '--accept-data-loss') {
      options.acceptDataLoss = true;
    } else if (arg === '--skip-generate') {
      options.skipGenerate = true;
    } else if (arg === '--force-reset') {
      options.forceReset = true;
    }
  }
  
  return options;
}

// Run push
const options = parseArgs();
pushDatabase(options).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
