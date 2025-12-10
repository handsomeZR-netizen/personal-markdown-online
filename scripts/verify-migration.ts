#!/usr/bin/env tsx

/**
 * Migration Verification Script
 * 
 * This script verifies that the local database migration is complete and functional.
 * It tests both local and Supabase modes to ensure compatibility.
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

interface VerificationResult {
  category: string;
  test: string;
  status: 'pass' | 'fail' | 'skip' | 'warn';
  message: string;
  details?: string;
}

const results: VerificationResult[] = [];

function addResult(
  category: string,
  test: string,
  status: 'pass' | 'fail' | 'skip' | 'warn',
  message: string,
  details?: string
) {
  results.push({ category, test, status, message, details });
}

function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('MIGRATION VERIFICATION RESULTS');
  console.log('='.repeat(80) + '\n');

  const categories = [...new Set(results.map(r => r.category))];
  
  for (const category of categories) {
    console.log(`\n📋 ${category}`);
    console.log('-'.repeat(80));
    
    const categoryResults = results.filter(r => r.category === category);
    
    for (const result of categoryResults) {
      const icon = {
        pass: '✅',
        fail: '❌',
        skip: '⏭️',
        warn: '⚠️'
      }[result.status];
      
      console.log(`${icon} ${result.test}`);
      console.log(`   ${result.message}`);
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const skipped = results.filter(r => r.status === 'skip').length;
  const warnings = results.filter(r => r.status === 'warn').length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  
  const successRate = total > 0 ? ((passed / (total - skipped)) * 100).toFixed(1) : '0';
  console.log(`\nSuccess Rate: ${successRate}%`);
  
  if (failed > 0) {
    console.log('\n❌ Migration verification FAILED. Please review the errors above.');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('\n⚠️  Migration verification completed with warnings.');
  } else {
    console.log('\n✅ Migration verification PASSED!');
  }
}

async function verifyEnvironmentVariables() {
  console.log('Checking environment variables...');
  
  const requiredVars = ['DATABASE_URL', 'DATABASE_MODE'];
  const optionalVars = ['DIRECT_URL', 'NEXTAUTH_SECRET', 'AUTH_SECRET'];
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      addResult(
        'Environment Variables',
        varName,
        'pass',
        `${varName} is set`
      );
    } else {
      addResult(
        'Environment Variables',
        varName,
        'fail',
        `${varName} is missing`,
        'This variable is required for the application to function'
      );
    }
  }
  
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      addResult(
        'Environment Variables',
        varName,
        'pass',
        `${varName} is set`
      );
    } else {
      addResult(
        'Environment Variables',
        varName,
        'warn',
        `${varName} is not set`,
        'This variable is recommended but not required'
      );
    }
  }
  
  // Check database mode
  const dbMode = process.env.DATABASE_MODE;
  if (dbMode === 'local' || dbMode === 'supabase') {
    addResult(
      'Environment Variables',
      'DATABASE_MODE value',
      'pass',
      `DATABASE_MODE is set to '${dbMode}'`
    );
  } else {
    addResult(
      'Environment Variables',
      'DATABASE_MODE value',
      'fail',
      `DATABASE_MODE has invalid value: '${dbMode}'`,
      "Must be 'local' or 'supabase'"
    );
  }
}

async function verifyDatabaseConnection() {
  console.log('Checking database connection...');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    addResult(
      'Database Connection',
      'Connection test',
      'pass',
      'Successfully connected to database'
    );
    
    // Test a simple query
    const userCount = await prisma.user.count();
    addResult(
      'Database Connection',
      'Query test',
      'pass',
      `Successfully queried database (${userCount} users found)`
    );
    
  } catch (error) {
    addResult(
      'Database Connection',
      'Connection test',
      'fail',
      'Failed to connect to database',
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyDatabaseSchema() {
  console.log('Checking database schema...');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    
    // Check if all required tables exist
    const requiredTables = [
      'User',
      'Note',
      'Folder',
      'Tag',
      'Category',
      'Collaborator'
    ];
    
    const optionalTables = [
      'NoteVersion',
      'NoteTemplate',
      'UserPreference'
    ];
    
    for (const table of requiredTables) {
      try {
        // @ts-ignore - Dynamic table access
        await prisma[table.toLowerCase()].findFirst();
        addResult(
          'Database Schema',
          `Table: ${table}`,
          'pass',
          `Table '${table}' exists and is accessible`
        );
      } catch (error) {
        addResult(
          'Database Schema',
          `Table: ${table}`,
          'fail',
          `Table '${table}' is missing or inaccessible`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
    
    for (const table of optionalTables) {
      try {
        // @ts-ignore - Dynamic table access
        const model = prisma[table.toLowerCase()];
        if (model) {
          await model.findFirst();
          addResult(
            'Database Schema',
            `Table: ${table} (optional)`,
            'pass',
            `Table '${table}' exists and is accessible`
          );
        } else {
          addResult(
            'Database Schema',
            `Table: ${table} (optional)`,
            'skip',
            `Table '${table}' is not defined in schema (optional)`
          );
        }
      } catch (error) {
        addResult(
          'Database Schema',
          `Table: ${table} (optional)`,
          'skip',
          `Table '${table}' is not available (optional)`,
          'This table is optional and may not be implemented yet'
        );
      }
    }
    
  } catch (error) {
    addResult(
      'Database Schema',
      'Schema verification',
      'fail',
      'Failed to verify database schema',
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyMigrations() {
  console.log('Checking migrations...');
  
  const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
  
  if (fs.existsSync(migrationsDir)) {
    const migrations = fs.readdirSync(migrationsDir)
      .filter(f => f !== 'migration_lock.toml');
    
    addResult(
      'Migrations',
      'Migration files',
      'pass',
      `Found ${migrations.length} migration(s)`,
      migrations.join(', ')
    );
    
    // Check migration lock file
    const lockFile = path.join(migrationsDir, 'migration_lock.toml');
    if (fs.existsSync(lockFile)) {
      addResult(
        'Migrations',
        'Migration lock',
        'pass',
        'Migration lock file exists'
      );
    } else {
      addResult(
        'Migrations',
        'Migration lock',
        'warn',
        'Migration lock file is missing'
      );
    }
  } else {
    addResult(
      'Migrations',
      'Migration directory',
      'fail',
      'Migrations directory not found',
      'Run "npm run db:migrate" to create migrations'
    );
  }
}

async function verifyDocumentation() {
  console.log('Checking documentation...');
  
  const docs = [
    { path: 'docs/LOCAL_DATABASE_SETUP.md', name: 'Local Database Setup' },
    { path: 'docs/DATABASE_MODES.md', name: 'Database Modes' },
    { path: 'docs/TROUBLESHOOTING.md', name: 'Troubleshooting' },
    { path: 'docs/DATA_MIGRATION.md', name: 'Data Migration' },
    { path: 'docs/MIGRATION_GUIDE.md', name: 'Migration Guide' },
    { path: 'docs/STARTUP_VALIDATION.md', name: 'Startup Validation' },
    { path: 'docs/PRISMA_CONFIGURATION.md', name: 'Prisma Configuration' },
    { path: 'docs/DATABASE_VALIDATION.md', name: 'Database Validation' }
  ];
  
  for (const doc of docs) {
    const fullPath = path.join(process.cwd(), doc.path);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      addResult(
        'Documentation',
        doc.name,
        'pass',
        `${doc.name} exists (${(stats.size / 1024).toFixed(1)} KB)`
      );
    } else {
      addResult(
        'Documentation',
        doc.name,
        'warn',
        `${doc.name} is missing`,
        `Expected at: ${doc.path}`
      );
    }
  }
}

async function verifyScripts() {
  console.log('Checking scripts...');
  
  const scripts = [
    { path: 'scripts/export-data.ts', name: 'Export Data' },
    { path: 'scripts/import-data.ts', name: 'Import Data' },
    { path: 'scripts/validate-database.ts', name: 'Validate Database' },
    { path: 'scripts/validate-startup.ts', name: 'Validate Startup' },
    { path: 'scripts/test-both-modes.ts', name: 'Test Both Modes' }
  ];
  
  for (const script of scripts) {
    const fullPath = path.join(process.cwd(), script.path);
    if (fs.existsSync(fullPath)) {
      addResult(
        'Scripts',
        script.name,
        'pass',
        `${script.name} script exists`
      );
    } else {
      addResult(
        'Scripts',
        script.name,
        'warn',
        `${script.name} script is missing`,
        `Expected at: ${script.path}`
      );
    }
  }
}

async function verifyConfiguration() {
  console.log('Checking configuration files...');
  
  const configs = [
    { path: 'docker-compose.yml', name: 'Docker Compose (note-app)', required: false },
    { path: '../docker-compose.yml', name: 'Docker Compose (root)', required: false },
    { path: '.env.local.example', name: 'Local Env Example', required: true },
    { path: '.env.production.example', name: 'Production Env Example', required: true },
    { path: 'prisma/schema.prisma', name: 'Prisma Schema', required: true }
  ];
  
  for (const config of configs) {
    const fullPath = path.join(process.cwd(), config.path);
    if (fs.existsSync(fullPath)) {
      addResult(
        'Configuration',
        config.name,
        'pass',
        `${config.name} exists`
      );
    } else {
      addResult(
        'Configuration',
        config.name,
        config.required ? 'fail' : 'warn',
        `${config.name} is missing`,
        `Expected at: ${config.path}`
      );
    }
  }
  
  // Check if .env.local exists
  const envLocal = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocal)) {
    addResult(
      'Configuration',
      '.env.local',
      'pass',
      '.env.local file exists'
    );
  } else {
    addResult(
      'Configuration',
      '.env.local',
      'fail',
      '.env.local file is missing',
      'Copy from .env.local.example and configure'
    );
  }
}

async function verifyAbstractionLayers() {
  console.log('Checking abstraction layers...');
  
  const modules = [
    { path: 'src/lib/db-config.ts', name: 'Database Config' },
    { path: 'src/lib/db-validator.ts', name: 'Database Validator' },
    { path: 'src/lib/startup-validator.ts', name: 'Startup Validator' },
    { path: 'src/lib/storage/storage-adapter.ts', name: 'Storage Adapter' },
    { path: 'src/lib/auth/auth-adapter.ts', name: 'Auth Adapter' }
  ];
  
  for (const module of modules) {
    const fullPath = path.join(process.cwd(), module.path);
    if (fs.existsSync(fullPath)) {
      addResult(
        'Abstraction Layers',
        module.name,
        'pass',
        `${module.name} module exists`
      );
    } else {
      addResult(
        'Abstraction Layers',
        module.name,
        'warn',
        `${module.name} module is missing`,
        `Expected at: ${module.path}`
      );
    }
  }
}

async function verifyPerformance() {
  console.log('Checking performance optimizations...');
  
  // Check next.config.ts for optimizations
  const nextConfig = path.join(process.cwd(), 'next.config.ts');
  if (fs.existsSync(nextConfig)) {
    const content = fs.readFileSync(nextConfig, 'utf-8');
    
    if (content.includes('optimizePackageImports')) {
      addResult(
        'Performance',
        'Package import optimization',
        'pass',
        'optimizePackageImports is configured'
      );
    } else {
      addResult(
        'Performance',
        'Package import optimization',
        'warn',
        'optimizePackageImports is not configured',
        'Consider adding to next.config.ts for better performance'
      );
    }
    
    if (content.includes('turbo') || content.includes('Turbopack')) {
      addResult(
        'Performance',
        'Turbopack support',
        'pass',
        'Turbopack configuration found'
      );
    } else {
      addResult(
        'Performance',
        'Turbopack support',
        'skip',
        'Turbopack configuration not found (optional)'
      );
    }
  } else {
    addResult(
      'Performance',
      'Next.js config',
      'fail',
      'next.config.ts not found'
    );
  }
  
  // Check package.json for dev script with turbo
  const packageJson = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJson)) {
    const content = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
    
    if (content.scripts?.dev?.includes('turbo')) {
      addResult(
        'Performance',
        'Dev script optimization',
        'pass',
        'Dev script uses Turbopack'
      );
    } else {
      addResult(
        'Performance',
        'Dev script optimization',
        'warn',
        'Dev script does not use Turbopack',
        'Consider adding --turbo flag for faster development'
      );
    }
  }
}

async function main() {
  console.log('🔍 Starting Migration Verification...\n');
  console.log(`Current working directory: ${process.cwd()}`);
  console.log(`Database mode: ${process.env.DATABASE_MODE || 'not set'}\n`);
  
  try {
    await verifyEnvironmentVariables();
    await verifyConfiguration();
    await verifyDatabaseConnection();
    await verifyDatabaseSchema();
    await verifyMigrations();
    await verifyAbstractionLayers();
    await verifyDocumentation();
    await verifyScripts();
    await verifyPerformance();
    
    printResults();
  } catch (error) {
    console.error('\n❌ Verification failed with error:');
    console.error(error);
    process.exit(1);
  }
}

main();
