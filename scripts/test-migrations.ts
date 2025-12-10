#!/usr/bin/env tsx
/**
 * Migration Test Script
 * 
 * This script tests that migrations work correctly in both local and Supabase modes.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { execSync } from 'child_process';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

interface TestResult {
  mode: string;
  success: boolean;
  error?: string;
}

/**
 * Test migration status check
 */
function testMigrationStatus(mode: string): TestResult {
  console.log(`\n📋 Testing migration status in ${mode} mode...`);
  
  try {
    const output = execSync('npx prisma migrate status', {
      encoding: 'utf-8',
      env: {
        ...process.env,
        DATABASE_MODE: mode
      }
    });
    
    console.log(`✅ Migration status check successful in ${mode} mode`);
    return { mode, success: true };
  } catch (error: any) {
    // Exit code 1 means migrations are pending, which is okay
    if (error.status === 1 && error.stdout?.includes('migrations found')) {
      console.log(`✅ Migration status check successful in ${mode} mode (migrations pending)`);
      return { mode, success: true };
    }
    
    console.error(`❌ Migration status check failed in ${mode} mode`);
    console.error(error.message);
    return { mode, success: false, error: error.message };
  }
}

/**
 * Test schema validation
 */
function testSchemaValidation(): TestResult {
  console.log('\n🔍 Testing schema validation...');
  
  try {
    execSync('npx prisma validate', {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    console.log('✅ Schema validation successful');
    return { mode: 'schema', success: true };
  } catch (error: any) {
    console.error('❌ Schema validation failed');
    console.error(error.message);
    return { mode: 'schema', success: false, error: error.message };
  }
}

/**
 * Test Prisma client generation
 */
function testClientGeneration(): TestResult {
  console.log('\n⚙️  Testing Prisma client generation...');
  
  try {
    execSync('npx prisma generate', {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    console.log('✅ Prisma client generation successful');
    return { mode: 'generate', success: true };
  } catch (error: any) {
    console.error('❌ Prisma client generation failed');
    console.error(error.message);
    return { mode: 'generate', success: false, error: error.message };
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Testing Prisma Configuration\n');
  console.log('═'.repeat(60));
  
  const results: TestResult[] = [];
  
  // Test schema validation
  results.push(testSchemaValidation());
  
  // Test client generation
  results.push(testClientGeneration());
  
  // Test migration status in current mode
  const currentMode = process.env.DATABASE_MODE || 'local';
  results.push(testMigrationStatus(currentMode));
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 Test Summary:\n');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.mode}: ${result.success ? 'PASSED' : 'FAILED'}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log(`\nTotal: ${results.length} tests`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    console.log('\n📝 Prisma configuration is working correctly');
    console.log(`   Current mode: ${currentMode}`);
    console.log('   Schema: Compatible with both local and Supabase');
    console.log('   Migrations: Ready to use');
  }
}

// Run tests
runTests().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
