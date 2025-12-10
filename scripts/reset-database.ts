#!/usr/bin/env tsx
/**
 * Database Reset Script
 * 
 * This script resets the database by dropping all tables and re-running migrations.
 * Useful for development when you want a clean slate.
 * 
 * WARNING: This is destructive and will delete all data!
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { execSync } from 'child_process';
import { getDatabaseConfig, validateDatabaseConfig, getSetupInstructions } from '../src/lib/db-config';
import * as readline from 'readline';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

interface ResetOptions {
  skipSeed?: boolean;
  force?: boolean;
}

/**
 * Prompt user for confirmation
 */
function promptConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Reset database
 */
async function resetDatabase(options: ResetOptions = {}) {
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
    
    // Get database config
    const config = getDatabaseConfig();
    console.log(`✅ Database configuration valid (mode: ${config.mode})\n`);
    
    // Confirm reset
    if (!options.force) {
      console.warn('⚠️  WARNING: This will DELETE ALL DATA in the database!');
      console.warn(`   Database mode: ${config.mode}`);
      console.warn(`   Connection: ${config.connectionString.replace(/:[^:@]+@/, ':****@')}\n`);
      
      const confirmed = await promptConfirmation('Are you sure you want to continue? (yes/no): ');
      
      if (!confirmed) {
        console.log('\n❌ Reset cancelled by user');
        process.exit(0);
      }
    }
    
    console.log('\n🗑️  Resetting database...\n');
    console.log('─'.repeat(60));
    
    // Run reset command
    execSync('npx prisma migrate reset --force', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: config.connectionString,
        DIRECT_URL: config.directUrl || config.connectionString
      }
    });
    
    console.log('─'.repeat(60));
    console.log('\n✅ Database reset successfully!\n');
    
    // Run seed if not skipped
    if (!options.skipSeed) {
      console.log('🌱 Seeding database...\n');
      console.log('─'.repeat(60));
      
      try {
        execSync('npm run db:seed', {
          stdio: 'inherit',
          env: {
            ...process.env,
            DATABASE_URL: config.connectionString,
            DIRECT_URL: config.directUrl || config.connectionString
          }
        });
        
        console.log('─'.repeat(60));
        console.log('\n✅ Database seeded successfully!\n');
      } catch (seedError) {
        console.warn('\n⚠️  Seeding failed, but database was reset successfully');
        console.warn('   You can run "npm run db:seed" manually later\n');
      }
    }
    
    // Show mode-specific information
    if (config.mode === 'local') {
      console.log('📝 Local database reset complete');
      console.log('   Database: Local PostgreSQL');
    } else {
      console.log('📝 Supabase database reset complete');
      console.log('   Database: Supabase PostgreSQL');
    }
    
  } catch (error) {
    console.error('\n❌ Reset failed:\n');
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
function parseArgs(): ResetOptions {
  const args = process.argv.slice(2);
  const options: ResetOptions = {};
  
  for (const arg of args) {
    if (arg === '--skip-seed') {
      options.skipSeed = true;
    } else if (arg === '--force') {
      options.force = true;
    }
  }
  
  return options;
}

// Run reset
const options = parseArgs();
resetDatabase(options).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
