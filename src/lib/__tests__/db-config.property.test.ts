/**
 * Property-Based Tests for Database Configuration Module
 * 
 * Feature: local-database-migration
 * Property 6: 环境变量错误处理
 * Validates: Requirements 7.2
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  getDatabaseMode,
  isSupabaseAvailable,
  validateEnvironmentVariables,
  validateDatabaseConfig,
  getDatabaseConfig,
  MissingEnvVarError,
  getSetupInstructions
} from '../db-config';

describe('Database Configuration - Property Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  /**
   * Property 6: 环境变量错误处理
   * For any missing required environment variables, the system should log
   * the specific missing variable names at startup and provide setup guidance
   * 
   * Validates: Requirements 7.2
   */
  test('Property 6: missing env vars are reported with specific names', () => {
    fc.assert(
      fc.property(
        // Generate combinations of missing variables for local mode
        fc.array(
          fc.constantFrom('DATABASE_URL', 'NEXTAUTH_SECRET', 'AUTH_SECRET'),
          { minLength: 1, maxLength: 3 }
        ).chain(missingVars => 
          // Ensure unique variables
          fc.constant([...new Set(missingVars)])
        ),
        (missingVars) => {
          // Setup: Remove the specified environment variables
          const testEnv = { ...originalEnv };
          missingVars.forEach(varName => {
            delete testEnv[varName];
          });
          process.env = testEnv;
          process.env.DATABASE_MODE = 'local';

          // Execute: Try to validate environment variables
          try {
            validateEnvironmentVariables('local');
            // If no error is thrown, the test should fail
            throw new Error('Expected MissingEnvVarError to be thrown');
          } catch (error) {
            // Verify: Check that the error is of the correct type
            expect(error).toBeInstanceOf(MissingEnvVarError);
            
            if (error instanceof MissingEnvVarError) {
              // Verify: All missing variables are reported
              expect(error.missingVars).toEqual(
                expect.arrayContaining([...missingVars])
              );
              
              // Verify: The error message contains the variable names
              missingVars.forEach(varName => {
                expect(error.message).toContain(varName);
              });
              
              // Verify: The mode is correctly identified
              expect(error.mode).toBe('local');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6: missing Supabase env vars are reported with specific names', () => {
    fc.assert(
      fc.property(
        // Generate combinations of missing variables for Supabase mode
        fc.array(
          fc.constantFrom(
            'DATABASE_URL',
            'NEXT_PUBLIC_SUPABASE_URL',
            'NEXT_PUBLIC_SUPABASE_ANON_KEY'
          ),
          { minLength: 1, maxLength: 3 }
        ).chain(missingVars => 
          // Ensure unique variables
          fc.constant([...new Set(missingVars)])
        ),
        (missingVars) => {
          // Setup: Remove the specified environment variables
          const testEnv = { ...originalEnv };
          missingVars.forEach(varName => {
            delete testEnv[varName];
          });
          process.env = testEnv;
          process.env.DATABASE_MODE = 'supabase';

          // Execute: Try to validate environment variables
          try {
            validateEnvironmentVariables('supabase');
            // If no error is thrown, the test should fail
            throw new Error('Expected MissingEnvVarError to be thrown');
          } catch (error) {
            // Verify: Check that the error is of the correct type
            expect(error).toBeInstanceOf(MissingEnvVarError);
            
            if (error instanceof MissingEnvVarError) {
              // Verify: All missing variables are reported
              expect(error.missingVars).toEqual(
                expect.arrayContaining([...missingVars])
              );
              
              // Verify: The error message contains the variable names
              missingVars.forEach(varName => {
                expect(error.message).toContain(varName);
              });
              
              // Verify: The mode is correctly identified
              expect(error.mode).toBe('supabase');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6: validateDatabaseConfig returns detailed error information', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('local', 'supabase'),
        fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 3 }),
        (mode, missingVars) => {
          // Setup: Create environment with missing variables
          const testEnv = { ...originalEnv };
          
          // Get the actual required variables for the mode
          const requiredVars = mode === 'local' 
            ? ['DATABASE_URL', 'NEXTAUTH_SECRET', 'AUTH_SECRET']
            : ['DATABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
          
          // Remove at least one required variable
          const varToRemove = requiredVars[0];
          delete testEnv[varToRemove];
          
          process.env = testEnv;
          process.env.DATABASE_MODE = mode;

          // Execute: Validate database config
          const result = validateDatabaseConfig();

          // Verify: Result indicates invalid configuration
          expect(result.isValid).toBe(false);
          
          // Verify: Errors array is not empty
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Verify: Error message mentions missing variables
          expect(result.errors[0]).toContain('Missing required environment variables');
          
          // Verify: Mode is correctly identified
          expect(result.mode).toBe(mode);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6: setup instructions are provided for each mode', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('local', 'supabase'),
        (mode) => {
          // Execute: Get setup instructions
          const instructions = getSetupInstructions(mode);

          // Verify: Instructions are not empty
          expect(instructions).toBeTruthy();
          expect(instructions.length).toBeGreaterThan(0);
          
          // Verify: Instructions mention the mode
          expect(instructions.toLowerCase()).toContain(mode);
          
          // Verify: Instructions contain actionable steps
          expect(instructions).toMatch(/\d+\./); // Contains numbered steps
          
          // Verify: Instructions mention environment variables
          expect(instructions.toLowerCase()).toContain('env');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6: valid configuration does not throw errors', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('local', 'supabase'),
        (mode) => {
          // Setup: Create valid environment
          const testEnv = { ...originalEnv };
          
          if (mode === 'local') {
            testEnv.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/noteapp';
            testEnv.NEXTAUTH_SECRET = 'test-secret-key';
            testEnv.AUTH_SECRET = 'test-secret-key';
          } else {
            testEnv.DATABASE_URL = 'postgresql://postgres:password@db.project.supabase.co:5432/postgres';
            testEnv.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
            testEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
          }
          
          testEnv.DATABASE_MODE = mode;
          process.env = testEnv;

          // Execute & Verify: Should not throw
          expect(() => validateEnvironmentVariables(mode)).not.toThrow();
          
          const result = validateDatabaseConfig();
          expect(result.isValid).toBe(true);
          expect(result.errors.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6: database mode detection is consistent', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('local', 'supabase', 'LOCAL', 'SUPABASE', 'Local', 'Supabase'),
        (modeValue) => {
          // Setup: Set database mode
          process.env = { ...originalEnv };
          process.env.DATABASE_MODE = modeValue;

          // Execute: Get database mode
          const detectedMode = getDatabaseMode();

          // Verify: Mode is normalized to lowercase
          expect(detectedMode).toMatch(/^(local|supabase)$/);
          
          // Verify: Mode matches the input (case-insensitive)
          expect(detectedMode).toBe(modeValue.toLowerCase());
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6: Supabase availability detection is accurate', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        (hasUrl, hasKey) => {
          // Setup: Configure Supabase environment variables
          process.env = { ...originalEnv };
          
          if (hasUrl) {
            process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
          } else {
            delete process.env.NEXT_PUBLIC_SUPABASE_URL;
          }
          
          if (hasKey) {
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
          } else {
            delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          }

          // Execute: Check Supabase availability
          const isAvailable = isSupabaseAvailable();

          // Verify: Supabase is available only if both URL and key are present
          expect(isAvailable).toBe(hasUrl && hasKey);
        }
      ),
      { numRuns: 100 }
    );
  });
});
