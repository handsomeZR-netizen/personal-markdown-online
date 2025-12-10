#!/usr/bin/env node
/**
 * Startup Validation Script
 * 
 * This script performs comprehensive startup validation and reports the results.
 * It can be run manually to diagnose configuration issues.
 * 
 * Usage:
 *   npm run startup:validate
 *   npx tsx scripts/validate-startup.ts
 */

import { performStartupValidation } from '../src/lib/startup-validator';

async function main() {
  console.log('Starting comprehensive startup validation...\n');
  
  try {
    const result = await performStartupValidation();
    
    if (result.canProceed) {
      console.log('✅ All checks passed! Application is ready to start.');
      process.exit(0);
    } else {
      console.log('❌ Validation failed. Please fix the errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unexpected error during validation:');
    console.error(error);
    process.exit(1);
  }
}

main();
