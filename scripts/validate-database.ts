#!/usr/bin/env tsx
/**
 * Database Validation Script
 * 
 * This script validates the database connection and schema.
 * Run with: npx tsx scripts/validate-database.ts
 */

import { validateDatabase, logValidationResults } from '../src/lib/db-validator';
import { getDatabaseMode } from '../src/lib/db-config';

async function main() {
  console.log('🔍 Starting database validation...\n');
  
  const mode = getDatabaseMode();
  console.log(`Database mode: ${mode}\n`);
  
  try {
    const result = await validateDatabase();
    logValidationResults(result);
    
    if (result.isValid) {
      console.log('✅ Database validation passed!');
      process.exit(0);
    } else {
      console.log('❌ Database validation failed!');
      console.log('\nPlease fix the issues above and try again.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Validation error:', error);
    process.exit(1);
  }
}

main();
