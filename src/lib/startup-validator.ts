/**
 * Startup Validator Module
 * 
 * This module handles application startup validation, including database
 * connection checks, configuration validation, and detailed logging.
 */

import { validateDatabase, logValidationResults, type ValidationResult } from './db-validator';
import { getDatabaseMode, getDatabaseConfig, getSetupInstructions, MissingEnvVarError } from './db-config';

/**
 * Startup validation result interface
 */
export interface StartupValidationResult {
  isValid: boolean;
  canProceed: boolean;
  errors: string[];
  warnings: string[];
  mode: 'local' | 'supabase';
  setupInstructions?: string;
  databaseValidation?: ValidationResult;
}

/**
 * Log startup information
 */
function logStartupInfo(): void {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          Note App - Starting Application                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('📋 Environment Information:');
  console.log(`   Node Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Database Mode: ${getDatabaseMode()}`);
  console.log(`   Next.js Version: ${process.env.npm_package_version || 'unknown'}`);
  console.log('');
}

/**
 * Perform comprehensive startup validation
 * This function validates the database configuration and connection
 */
export async function performStartupValidation(): Promise<StartupValidationResult> {
  logStartupInfo();
  
  const mode = getDatabaseMode();
  const errors: string[] = [];
  const warnings: string[] = [];
  let canProceed = false;
  let databaseValidation: ValidationResult | undefined;
  
  console.log('🔍 Step 1: Validating Configuration...');
  
  try {
    // Step 1: Validate configuration
    const config = getDatabaseConfig();
    console.log('   ✓ Configuration is valid');
    console.log(`   ✓ Database Mode: ${config.mode}`);
    console.log(`   ✓ Supabase Available: ${config.isSupabaseAvailable ? 'Yes' : 'No'}`);
    console.log('');
    
    // Step 2: Validate database connection
    console.log('🔍 Step 2: Validating Database Connection...');
    
    try {
      databaseValidation = await validateDatabase();
      
      if (databaseValidation.isValid) {
        console.log('   ✓ Database connection successful');
        canProceed = true;
      } else {
        console.log('   ✗ Database validation failed');
        errors.push(...databaseValidation.errors);
      }
      
      // Log warnings if any
      if (databaseValidation.warnings.length > 0) {
        warnings.push(...databaseValidation.warnings);
      }
      
      // Log detailed validation results
      logValidationResults(databaseValidation);
      
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      errors.push(errorMessage);
      console.log(`   ✗ Database connection failed: ${errorMessage}`);
      console.log('');
    }
    
  } catch (configError) {
    if (configError instanceof MissingEnvVarError) {
      errors.push(`Missing environment variables: ${configError.missingVars.join(', ')}`);
      console.log('   ✗ Configuration validation failed');
      console.log(`   ✗ Missing variables: ${configError.missingVars.join(', ')}`);
      console.log('');
    } else {
      const errorMessage = configError instanceof Error ? configError.message : 'Unknown configuration error';
      errors.push(errorMessage);
      console.log(`   ✗ Configuration error: ${errorMessage}`);
      console.log('');
    }
  }
  
  // Step 3: Log final status
  console.log('📊 Startup Validation Summary:');
  console.log(`   Status: ${canProceed ? '✓ READY' : '✗ FAILED'}`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Warnings: ${warnings.length}`);
  console.log('');
  
  if (!canProceed) {
    console.log('❌ Application cannot start due to configuration errors.');
    console.log('');
    
    const setupInstructions = getSetupInstructions(mode);
    console.log(setupInstructions);
    
    return {
      isValid: false,
      canProceed: false,
      errors,
      warnings,
      mode,
      setupInstructions,
      databaseValidation
    };
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  Application started with warnings:');
    warnings.forEach(warning => console.log(`   - ${warning}`));
    console.log('');
  }
  
  console.log('✅ Application startup validation completed successfully!');
  console.log('');
  
  return {
    isValid: true,
    canProceed: true,
    errors,
    warnings,
    mode,
    databaseValidation
  };
}

/**
 * Quick database health check (for middleware)
 * This is a lightweight check that doesn't perform full validation
 */
export async function quickDatabaseHealthCheck(): Promise<boolean> {
  try {
    const config = getDatabaseConfig();
    // If we can get the config, basic validation passed
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get cached startup validation result
 * This allows us to avoid re-running validation on every request
 */
let cachedValidationResult: StartupValidationResult | null = null;
let validationPromise: Promise<StartupValidationResult> | null = null;

export async function getCachedStartupValidation(): Promise<StartupValidationResult> {
  // If we have a cached result, return it
  if (cachedValidationResult) {
    return cachedValidationResult;
  }
  
  // If validation is in progress, wait for it
  if (validationPromise) {
    return validationPromise;
  }
  
  // Start new validation
  validationPromise = performStartupValidation();
  
  try {
    cachedValidationResult = await validationPromise;
    return cachedValidationResult;
  } finally {
    validationPromise = null;
  }
}

/**
 * Clear cached validation result
 * Useful for testing or when configuration changes
 */
export function clearValidationCache(): void {
  cachedValidationResult = null;
  validationPromise = null;
}
