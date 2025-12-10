/**
 * Database Mode Property-Based Tests
 * 
 * Property-based tests for database mode functionality
 * 
 * **Feature: comprehensive-feature-audit, Property 7: 数据一致性**
 * **Validates: Requirements 15.1**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fc } from '@fast-check/vitest';
import {
  getDatabaseMode,
  isSupabaseAvailable,
  validateEnvironmentVariables,
  getDatabaseConfig,
  MissingEnvVarError
} from '@/lib/db-config';

describe('Database Mode Property-Based Tests', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('Property 7: Data Consistency', () => {
    it('should always return either "local" or "supabase" mode', () => {
      fc.assert(
        fc.property(
          fc.option(fc.constantFrom('local', 'supabase', 'LOCAL', 'SUPABASE', 'Local', 'Supabase', 'invalid'), { nil: undefined }),
          (modeValue) => {
            if (modeValue !== undefined) {
              process.env.DATABASE_MODE = modeValue;
            } else {
              delete process.env.DATABASE_MODE;
            }

            const mode = getDatabaseMode();

            // Mode should always be either 'local' or 'supabase'
            expect(['local', 'supabase']).toContain(mode);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should consistently detect Supabase availability based on credentials', () => {
      fc.assert(
        fc.property(
          fc.option(fc.webUrl(), { nil: undefined }),
          fc.option(fc.string({ minLength: 10 }), { nil: undefined }),
          (url, key) => {
            if (url !== undefined) {
              process.env.NEXT_PUBLIC_SUPABASE_URL = url;
            } else {
              delete process.env.NEXT_PUBLIC_SUPABASE_URL;
            }

            if (key !== undefined) {
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = key;
            } else {
              delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            }

            const available = isSupabaseAvailable();

            // Supabase should be available only when both URL and key are present
            const expectedAvailable = url !== undefined && key !== undefined;
            expect(available).toBe(expectedAvailable);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate environment variables consistently for any mode', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('local', 'supabase'),
          fc.option(fc.string({ minLength: 10 }), { nil: undefined }),
          fc.option(fc.string({ minLength: 10 }), { nil: undefined }),
          fc.option(fc.string({ minLength: 10 }), { nil: undefined }),
          (mode, dbUrl, secret, supabaseUrl) => {
            // Set up environment based on mode
            if (dbUrl !== undefined) {
              process.env.DATABASE_URL = dbUrl;
            } else {
              delete process.env.DATABASE_URL;
            }

            if (mode === 'local') {
              if (secret !== undefined) {
                process.env.NEXTAUTH_SECRET = secret;
                process.env.AUTH_SECRET = secret;
              } else {
                delete process.env.NEXTAUTH_SECRET;
                delete process.env.AUTH_SECRET;
              }
            } else {
              if (supabaseUrl !== undefined) {
                process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
              } else {
                delete process.env.NEXT_PUBLIC_SUPABASE_URL;
                delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
              }
            }

            // Validation should either succeed or throw MissingEnvVarError
            try {
              const result = validateEnvironmentVariables(mode);
              
              // If validation succeeds, it should be valid
              expect(result.isValid).toBe(true);
              expect(result.mode).toBe(mode);
              expect(result.errors).toHaveLength(0);
            } catch (error) {
              // If validation fails, it should throw MissingEnvVarError
              expect(error).toBeInstanceOf(MissingEnvVarError);
              const missingError = error as MissingEnvVarError;
              expect(missingError.mode).toBe(mode);
              expect(missingError.missingVars.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain configuration consistency across multiple calls', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('local', 'supabase'),
          fc.string({ minLength: 20 }),
          fc.string({ minLength: 20 }),
          (mode, dbUrl, secret) => {
            // Set up valid environment
            process.env.DATABASE_MODE = mode;
            process.env.DATABASE_URL = dbUrl;

            if (mode === 'local') {
              process.env.NEXTAUTH_SECRET = secret;
              process.env.AUTH_SECRET = secret;
            } else {
              process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = secret;
            }

            // Get config multiple times
            const config1 = getDatabaseConfig();
            const config2 = getDatabaseConfig();
            const config3 = getDatabaseConfig();

            // All configs should be identical
            expect(config1.mode).toBe(config2.mode);
            expect(config2.mode).toBe(config3.mode);
            expect(config1.connectionString).toBe(config2.connectionString);
            expect(config2.connectionString).toBe(config3.connectionString);
            expect(config1.isSupabaseAvailable).toBe(config2.isSupabaseAvailable);
            expect(config2.isSupabaseAvailable).toBe(config3.isSupabaseAvailable);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle mode switching consistently', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom('local', 'supabase'), { minLength: 2, maxLength: 10 }),
          (modes) => {
            const results: string[] = [];

            for (const mode of modes) {
              process.env.DATABASE_MODE = mode;
              const detectedMode = getDatabaseMode();
              results.push(detectedMode);
            }

            // Each detected mode should match the set mode
            for (let i = 0; i < modes.length; i++) {
              expect(results[i]).toBe(modes[i]);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should validate that required variables are always checked', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('local', 'supabase'),
          (mode) => {
            // Clear all environment variables
            delete process.env.DATABASE_URL;
            delete process.env.NEXTAUTH_SECRET;
            delete process.env.AUTH_SECRET;
            delete process.env.NEXT_PUBLIC_SUPABASE_URL;
            delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            // Validation should always fail when required variables are missing
            try {
              validateEnvironmentVariables(mode);
              expect.fail('Should have thrown MissingEnvVarError');
            } catch (error) {
              expect(error).toBeInstanceOf(MissingEnvVarError);
              const missingError = error as MissingEnvVarError;
              
              // Should always report DATABASE_URL as missing
              expect(missingError.missingVars).toContain('DATABASE_URL');
              
              // Should report mode-specific variables as missing
              if (mode === 'local') {
                expect(
                  missingError.missingVars.includes('NEXTAUTH_SECRET') ||
                  missingError.missingVars.includes('AUTH_SECRET')
                ).toBe(true);
              } else {
                expect(missingError.missingVars).toContain('NEXT_PUBLIC_SUPABASE_URL');
                expect(missingError.missingVars).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle case-insensitive mode detection', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('local', 'LOCAL', 'Local', 'supabase', 'SUPABASE', 'Supabase'),
          (modeValue) => {
            process.env.DATABASE_MODE = modeValue;
            
            const mode = getDatabaseMode();
            const expectedMode = modeValue.toLowerCase() === 'supabase' ? 'supabase' : 'local';
            
            expect(mode).toBe(expectedMode);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain data consistency when configuration is valid', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('local', 'supabase'),
          fc.webUrl({ validSchemes: ['postgresql'] }),
          fc.string({ minLength: 32 }),
          (mode, dbUrl, secret) => {
            // Set up complete valid environment
            process.env.DATABASE_MODE = mode;
            process.env.DATABASE_URL = dbUrl;
            process.env.DIRECT_URL = dbUrl;

            if (mode === 'local') {
              process.env.NEXTAUTH_SECRET = secret;
              process.env.AUTH_SECRET = secret;
              process.env.LOCAL_STORAGE_PATH = './uploads';
            } else {
              process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = secret;
            }

            // Get configuration
            const config = getDatabaseConfig();

            // Configuration should be consistent with environment
            expect(config.mode).toBe(mode);
            expect(config.connectionString).toBe(dbUrl);
            expect(config.directUrl).toBe(dbUrl);

            if (mode === 'supabase') {
              expect(config.isSupabaseAvailable).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
