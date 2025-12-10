#!/usr/bin/env tsx
/**
 * Database Migration Script
 * 
 * This script handles database migrations for both local and Supabase modes.
 * It validates the environment configuration before running migrations.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { execSync } from 'child_process';
import { getDatabaseConfig, validateDatabaseConfig, getSetupInstructions } from '../src/lib/db-config';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

interface MigrationOptions {
  name?: string;
  createOnly?: boolean;
  skipGenerate?: boolean;
}

/**
 * Run database migration
 */
async function runMigration(options: MigrationOptions = {}) {
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
    
    // Build migration command
    let command = 'npx prisma migrate dev';
    
    if (options.name) {
      command += ` --name ${options.name}`;
    }
    
    if (options.createOnly) {
      command += ' --create-only';
    }
    
    if (options.skipGenerate) {
      command += ' --skip-generate';
    }
    
    console.log(`🚀 Running migration command: ${command}\n`);
    console.log('─'.repeat(60));
    
    // Run migration
    execSync(command, {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: config.connectionString,
        DIRECT_URL: config.directUrl || config.connectionString
      }
    });
    
    console.log('─'.repeat(60));
    console.log('\n✅ Migration completed successfully!\n');
    
    // Show mode-specific information
    if (config.mode === 'local') {
      console.log('📝 Local database migration applied');
      console.log('   Database: Local PostgreSQL');
      console.log('   Connection: localhost:5432');
    } else {
      console.log('📝 Supabase database migration applied');
      console.log('   Database: Supabase PostgreSQL');
      console.log('   Note: Changes may take a moment to propagate');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:\n');
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
function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  const options: MigrationOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--name' && i + 1 < args.length) {
      options.name = args[i + 1];
      i++;
    } else if (arg === '--create-only') {
      options.createOnly = true;
    } else if (arg === '--skip-generate') {
      options.skipGenerate = true;
    }
  }
  
  return options;
}

// Run migration
const options = parseArgs();
runMigration(options).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
