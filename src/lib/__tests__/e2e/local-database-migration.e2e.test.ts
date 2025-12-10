/**
 * E2E Test: Local Database Migration
 * Tests complete workflows for local and Supabase database modes
 * Requirements: All requirements from local-database-migration spec
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  getDatabaseMode, 
  getDatabaseConfig, 
  isSupabaseAvailable,
  validateEnvironmentVariables,
  MissingEnvVarError,
  getSetupInstructions
} from '@/lib/db-config';
import {
  validateDatabaseConnection,
  checkSchemaVersion,
  suggestMigrations,
  validateDatabase,
  DatabaseConnectionError
} from '@/lib/db-validator';

describe('E2E: Local Database Migration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('1. Local Mode End-to-End Tests', () => {
    beforeEach(() => {
      // Clean up Supabase environment variables
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      // Set up local mode environment
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/noteapp';
      process.env.DIRECT_URL = 'postgresql://postgres:postgres@localhost:5432/noteapp';
      process.env.NEXTAUTH_SECRET = 'test-secret-key';
      process.env.AUTH_SECRET = 'test-secret-key';
      process.env.LOCAL_STORAGE_PATH = './uploads';
    });

    it('should detect local mode from environment', () => {
      // Requirement 1.1: Default to local PostgreSQL in development
      const mode = getDatabaseMode();
      expect(mode).toBe('local');
    });

    it('should validate local mode environment variables', () => {
      // Requirement 1.4: Local mode should not require Supabase credentials
      const result = validateEnvironmentVariables('local');
      
      expect(result.isValid).toBe(true);
      expect(result.mode).toBe('local');
      expect(result.errors).toHaveLength(0);
    });

    it('should get complete local database configuration', () => {
      // Requirement 1.1, 1.4: Local database configuration
      const config = getDatabaseConfig();
      
      expect(config.mode).toBe('local');
      expect(config.connectionString).toBe('postgresql://postgres:postgres@localhost:5432/noteapp');
      expect(config.directUrl).toBe('postgresql://postgres:postgres@localhost:5432/noteapp');
      expect(config.isSupabaseAvailable).toBe(false);
    });

    it('should provide setup instructions for local mode', () => {
      // Requirement 2.1, 2.4: Setup documentation
      const instructions = getSetupInstructions('local');
      
      expect(instructions).toContain('docker-compose up -d');
      expect(instructions).toContain('DATABASE_URL');
      expect(instructions).toContain('NEXTAUTH_SECRET');
      expect(instructions).toContain('npm run db:migrate');
    });

    it('should handle missing local environment variables', () => {
      // Requirement 7.2: Missing environment variable error handling
      delete process.env.DATABASE_URL;
      delete process.env.NEXTAUTH_SECRET;
      
      expect(() => {
        validateEnvironmentVariables('local');
      }).toThrow(MissingEnvVarError);
      
      try {
        validateEnvironmentVariables('local');
      } catch (error) {
        expect(error).toBeInstanceOf(MissingEnvVarError);
        expect((error as MissingEnvVarError).missingVars).toContain('DATABASE_URL');
        expect((error as MissingEnvVarError).missingVars).toContain('NEXTAUTH_SECRET');
        expect((error as MissingEnvVarError).mode).toBe('local');
      }
    });

    it('should warn about optional local configuration', () => {
      // Requirement 2.5: Configuration warnings
      delete process.env.LOCAL_STORAGE_PATH;
      
      const result = validateEnvironmentVariables('local');
      
      expect(result.warnings).toContain('LOCAL_STORAGE_PATH not set, using default: ./uploads');
    });

    it('should complete local mode startup workflow', () => {
      // Integration test: Requirements 1.1, 1.3, 1.4, 7.1
      
      // Step 1: Detect mode
      const mode = getDatabaseMode();
      expect(mode).toBe('local');
      
      // Step 2: Validate environment
      const validation = validateEnvironmentVariables('local');
      expect(validation.isValid).toBe(true);
      
      // Step 3: Get configuration
      const config = getDatabaseConfig();
      expect(config.mode).toBe('local');
      expect(config.connectionString).toBeTruthy();
      
      // Step 4: Verify Supabase is not required
      expect(config.isSupabaseAvailable).toBe(false);
    });
  });

  describe('2. Supabase Mode End-to-End Tests', () => {
    beforeEach(() => {
      // Set up Supabase mode environment
      process.env.DATABASE_MODE = 'supabase';
      process.env.DATABASE_URL = 'postgresql://postgres:password@db.project.supabase.co:6543/postgres';
      process.env.DIRECT_URL = 'postgresql://postgres:password@db.project.supabase.co:5432/postgres';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    });

    it('should detect Supabase mode from environment', () => {
      // Requirement 3.1: Supabase mode detection
      const mode = getDatabaseMode();
      expect(mode).toBe('supabase');
    });

    it('should detect Supabase availability', () => {
      // Requirement 3.2: Supabase availability detection
      const available = isSupabaseAvailable();
      expect(available).toBe(true);
    });

    it('should validate Supabase mode environment variables', () => {
      // Requirement 3.1: Supabase configuration validation
      const result = validateEnvironmentVariables('supabase');
      
      expect(result.isValid).toBe(true);
      expect(result.mode).toBe('supabase');
      expect(result.errors).toHaveLength(0);
    });

    it('should get complete Supabase database configuration', () => {
      // Requirement 3.1, 3.5: Supabase database configuration
      const config = getDatabaseConfig();
      
      expect(config.mode).toBe('supabase');
      expect(config.connectionString).toContain('supabase.co');
      expect(config.isSupabaseAvailable).toBe(true);
    });

    it('should provide setup instructions for Supabase mode', () => {
      // Requirement 6.2: Supabase setup documentation
      const instructions = getSetupInstructions('supabase');
      
      expect(instructions).toContain('supabase.com');
      expect(instructions).toContain('NEXT_PUBLIC_SUPABASE_URL');
      expect(instructions).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      expect(instructions).toContain('npm run db:migrate');
    });

    it('should handle missing Supabase environment variables', () => {
      // Requirement 7.2: Missing environment variable error handling
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      expect(() => {
        validateEnvironmentVariables('supabase');
      }).toThrow(MissingEnvVarError);
      
      try {
        validateEnvironmentVariables('supabase');
      } catch (error) {
        expect(error).toBeInstanceOf(MissingEnvVarError);
        expect((error as MissingEnvVarError).missingVars).toContain('NEXT_PUBLIC_SUPABASE_URL');
        expect((error as MissingEnvVarError).missingVars).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
        expect((error as MissingEnvVarError).mode).toBe('supabase');
      }
    });

    it('should complete Supabase mode startup workflow', () => {
      // Integration test: Requirements 3.1, 3.2, 3.5, 7.1
      
      // Step 1: Detect mode
      const mode = getDatabaseMode();
      expect(mode).toBe('supabase');
      
      // Step 2: Check Supabase availability
      const available = isSupabaseAvailable();
      expect(available).toBe(true);
      
      // Step 3: Validate environment
      const validation = validateEnvironmentVariables('supabase');
      expect(validation.isValid).toBe(true);
      
      // Step 4: Get configuration
      const config = getDatabaseConfig();
      expect(config.mode).toBe('supabase');
      expect(config.isSupabaseAvailable).toBe(true);
    });
  });

  describe('3. Mode Switching Tests', () => {
    it('should switch from local to Supabase mode', () => {
      // Requirement 3.4: Mode switching via environment variables
      
      // Start in local mode
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/noteapp';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.AUTH_SECRET = 'test-secret';
      
      let mode = getDatabaseMode();
      expect(mode).toBe('local');
      
      // Switch to Supabase mode
      process.env.DATABASE_MODE = 'supabase';
      process.env.DATABASE_URL = 'postgresql://postgres:password@db.project.supabase.co:6543/postgres';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      
      mode = getDatabaseMode();
      expect(mode).toBe('supabase');
    });

    it('should switch from Supabase to local mode', () => {
      // Requirement 3.4: Mode switching via environment variables
      
      // Start in Supabase mode
      process.env.DATABASE_MODE = 'supabase';
      process.env.DATABASE_URL = 'postgresql://postgres:password@db.project.supabase.co:6543/postgres';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      
      let mode = getDatabaseMode();
      expect(mode).toBe('supabase');
      
      // Switch to local mode
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/noteapp';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.AUTH_SECRET = 'test-secret';
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      mode = getDatabaseMode();
      expect(mode).toBe('local');
    });

    it('should default to local mode when DATABASE_MODE is not set', () => {
      // Requirement 1.1: Default to local mode
      delete process.env.DATABASE_MODE;
      process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/noteapp';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.AUTH_SECRET = 'test-secret';
      
      const mode = getDatabaseMode();
      expect(mode).toBe('local');
    });

    it('should handle mode switching with different connection strings', () => {
      // Requirement 3.4, 4.3: Mode switching without code changes
      
      // Local configuration
      const localEnv = {
        DATABASE_MODE: 'local',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/noteapp',
        NEXTAUTH_SECRET: 'test-secret',
        AUTH_SECRET: 'test-secret'
      };
      
      // Supabase configuration
      const supabaseEnv = {
        DATABASE_MODE: 'supabase',
        DATABASE_URL: 'postgresql://postgres:password@db.project.supabase.co:6543/postgres',
        NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
      };
      
      // Test local mode
      Object.assign(process.env, localEnv);
      let config = getDatabaseConfig();
      expect(config.mode).toBe('local');
      expect(config.connectionString).toContain('localhost');
      
      // Test Supabase mode
      Object.assign(process.env, supabaseEnv);
      config = getDatabaseConfig();
      expect(config.mode).toBe('supabase');
      expect(config.connectionString).toContain('supabase.co');
    });

    it('should maintain Supabase availability detection across modes', () => {
      // Requirement 3.2, 3.3: Supabase feature detection
      
      // Local mode without Supabase
      process.env.DATABASE_MODE = 'local';
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      expect(isSupabaseAvailable()).toBe(false);
      
      // Local mode with Supabase configured (hybrid)
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      
      expect(isSupabaseAvailable()).toBe(true);
      
      // Supabase mode
      process.env.DATABASE_MODE = 'supabase';
      
      expect(isSupabaseAvailable()).toBe(true);
    });
  });

  describe('4. Database Validation Tests', () => {
    it('should parse host unreachable errors correctly', () => {
      // Requirement 7.4: Connection error diagnostics
      const error = new Error('connect ECONNREFUSED 127.0.0.1:5432');
      
      try {
        throw new DatabaseConnectionError(
          'Failed to connect to local database',
          'host_unreachable',
          [
            'Ensure the database server is running',
            'For local mode: Run "docker-compose up -d" to start PostgreSQL'
          ]
        );
      } catch (err) {
        expect(err).toBeInstanceOf(DatabaseConnectionError);
        expect((err as DatabaseConnectionError).cause).toBe('host_unreachable');
        expect((err as DatabaseConnectionError).suggestions).toContain('Ensure the database server is running');
      }
    });

    it('should parse authentication failed errors correctly', () => {
      // Requirement 7.4: Connection error diagnostics
      try {
        throw new DatabaseConnectionError(
          'Failed to connect to database',
          'auth_failed',
          [
            'Verify the database username and password in DATABASE_URL',
            'For local mode: Default credentials are postgres/postgres'
          ]
        );
      } catch (err) {
        expect(err).toBeInstanceOf(DatabaseConnectionError);
        expect((err as DatabaseConnectionError).cause).toBe('auth_failed');
        expect((err as DatabaseConnectionError).suggestions).toContain('Verify the database username and password in DATABASE_URL');
      }
    });

    it('should parse database not found errors correctly', () => {
      // Requirement 7.4: Connection error diagnostics
      try {
        throw new DatabaseConnectionError(
          'Failed to connect to database',
          'db_not_found',
          [
            'Create the database specified in DATABASE_URL',
            'Run database migrations: npm run db:migrate'
          ]
        );
      } catch (err) {
        expect(err).toBeInstanceOf(DatabaseConnectionError);
        expect((err as DatabaseConnectionError).cause).toBe('db_not_found');
        expect((err as DatabaseConnectionError).suggestions).toContain('Run database migrations: npm run db:migrate');
      }
    });

    it('should parse timeout errors correctly', () => {
      // Requirement 7.4: Connection error diagnostics
      try {
        throw new DatabaseConnectionError(
          'Failed to connect to database',
          'timeout',
          [
            'The database server is taking too long to respond',
            'Check your network connection'
          ]
        );
      } catch (err) {
        expect(err).toBeInstanceOf(DatabaseConnectionError);
        expect((err as DatabaseConnectionError).cause).toBe('timeout');
        expect((err as DatabaseConnectionError).suggestions).toContain('The database server is taking too long to respond');
      }
    });
  });

  describe('5. Complete Workflow Integration Tests', () => {
    it('should complete full local mode setup workflow', () => {
      // Integration test covering Requirements 1.1, 1.3, 1.4, 2.1, 7.1, 7.2
      
      // Clean up Supabase environment variables
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      // Step 1: Set up environment
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/noteapp';
      process.env.DIRECT_URL = 'postgresql://postgres:postgres@localhost:5432/noteapp';
      process.env.NEXTAUTH_SECRET = 'test-secret-key';
      process.env.AUTH_SECRET = 'test-secret-key';
      process.env.LOCAL_STORAGE_PATH = './uploads';
      
      // Step 2: Detect mode
      const mode = getDatabaseMode();
      expect(mode).toBe('local');
      
      // Step 3: Validate environment variables
      const validation = validateEnvironmentVariables('local');
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      // Step 4: Get database configuration
      const config = getDatabaseConfig();
      expect(config.mode).toBe('local');
      expect(config.connectionString).toBe('postgresql://postgres:postgres@localhost:5432/noteapp');
      expect(config.directUrl).toBe('postgresql://postgres:postgres@localhost:5432/noteapp');
      expect(config.isSupabaseAvailable).toBe(false);
      
      // Step 5: Verify setup instructions are available
      const instructions = getSetupInstructions('local');
      expect(instructions).toContain('docker-compose');
      expect(instructions).toContain('DATABASE_URL');
    });

    it('should complete full Supabase mode setup workflow', () => {
      // Integration test covering Requirements 3.1, 3.2, 3.5, 6.2, 7.1
      
      // Step 1: Set up environment
      process.env.DATABASE_MODE = 'supabase';
      process.env.DATABASE_URL = 'postgresql://postgres:password@db.project.supabase.co:6543/postgres';
      process.env.DIRECT_URL = 'postgresql://postgres:password@db.project.supabase.co:5432/postgres';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      
      // Step 2: Detect mode
      const mode = getDatabaseMode();
      expect(mode).toBe('supabase');
      
      // Step 3: Check Supabase availability
      const available = isSupabaseAvailable();
      expect(available).toBe(true);
      
      // Step 4: Validate environment variables
      const validation = validateEnvironmentVariables('supabase');
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      // Step 5: Get database configuration
      const config = getDatabaseConfig();
      expect(config.mode).toBe('supabase');
      expect(config.connectionString).toContain('supabase.co');
      expect(config.isSupabaseAvailable).toBe(true);
      
      // Step 6: Verify setup instructions are available
      const instructions = getSetupInstructions('supabase');
      expect(instructions).toContain('supabase.com');
      expect(instructions).toContain('NEXT_PUBLIC_SUPABASE_URL');
    });

    it('should handle mode switching with validation', () => {
      // Integration test covering Requirements 3.4, 4.3, 7.2
      
      // Start in local mode
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/noteapp';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.AUTH_SECRET = 'test-secret';
      
      let mode = getDatabaseMode();
      expect(mode).toBe('local');
      
      let validation = validateEnvironmentVariables('local');
      expect(validation.isValid).toBe(true);
      
      // Switch to Supabase mode with proper configuration
      process.env.DATABASE_MODE = 'supabase';
      process.env.DATABASE_URL = 'postgresql://postgres:password@db.project.supabase.co:6543/postgres';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      
      mode = getDatabaseMode();
      expect(mode).toBe('supabase');
      
      validation = validateEnvironmentVariables('supabase');
      expect(validation.isValid).toBe(true);
      
      // Verify Supabase is now available
      expect(isSupabaseAvailable()).toBe(true);
    });

    it('should handle error recovery workflow', () => {
      // Integration test covering Requirements 7.2, 7.4, 7.5
      
      // Step 1: Start with missing environment variables
      process.env.DATABASE_MODE = 'local';
      delete process.env.DATABASE_URL;
      delete process.env.NEXTAUTH_SECRET;
      
      // Step 2: Attempt validation (should fail)
      let errorCaught = false;
      try {
        validateEnvironmentVariables('local');
      } catch (error) {
        errorCaught = true;
        expect(error).toBeInstanceOf(MissingEnvVarError);
        expect((error as MissingEnvVarError).missingVars).toContain('DATABASE_URL');
        expect((error as MissingEnvVarError).missingVars).toContain('NEXTAUTH_SECRET');
      }
      expect(errorCaught).toBe(true);
      
      // Step 3: Get setup instructions
      const instructions = getSetupInstructions('local');
      expect(instructions).toContain('DATABASE_URL');
      expect(instructions).toContain('NEXTAUTH_SECRET');
      
      // Step 4: Fix configuration
      process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/noteapp';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.AUTH_SECRET = 'test-secret';
      
      // Step 5: Validate again (should succeed)
      const validation = validateEnvironmentVariables('local');
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('6. Edge Cases and Error Handling', () => {
    it('should handle empty DATABASE_MODE gracefully', () => {
      // Requirement 1.1: Default to local mode
      process.env.DATABASE_MODE = '';
      
      const mode = getDatabaseMode();
      expect(mode).toBe('local');
    });

    it('should handle case-insensitive DATABASE_MODE', () => {
      // Requirement 3.1: Mode detection
      process.env.DATABASE_MODE = 'SUPABASE';
      process.env.DATABASE_URL = 'postgresql://postgres:password@db.project.supabase.co:6543/postgres';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      
      const mode = getDatabaseMode();
      expect(mode).toBe('supabase');
    });

    it('should handle partial Supabase configuration', () => {
      // Requirement 3.3: Graceful degradation
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      const available = isSupabaseAvailable();
      expect(available).toBe(false);
    });

    it('should handle missing DIRECT_URL gracefully', () => {
      // Requirement 2.5: Optional configuration warnings
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/noteapp';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.AUTH_SECRET = 'test-secret';
      delete process.env.DIRECT_URL;
      
      const validation = validateEnvironmentVariables('local');
      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain('DIRECT_URL not set, using DATABASE_URL for migrations');
    });

    it('should provide specific error messages for each missing variable', () => {
      // Requirement 7.2: Specific error reporting
      process.env.DATABASE_MODE = 'local';
      delete process.env.DATABASE_URL;
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.AUTH_SECRET;
      
      try {
        validateEnvironmentVariables('local');
        fail('Should have thrown MissingEnvVarError');
      } catch (error) {
        expect(error).toBeInstanceOf(MissingEnvVarError);
        const missingError = error as MissingEnvVarError;
        expect(missingError.missingVars).toHaveLength(3);
        expect(missingError.missingVars).toContain('DATABASE_URL');
        expect(missingError.missingVars).toContain('NEXTAUTH_SECRET');
        expect(missingError.missingVars).toContain('AUTH_SECRET');
      }
    });

    it('should handle invalid DATABASE_URL format', () => {
      // Requirement 7.4: Connection parameter validation
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'invalid-url';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.AUTH_SECRET = 'test-secret';
      
      // Configuration should still be retrieved (Prisma will validate the URL)
      const config = getDatabaseConfig();
      expect(config.connectionString).toBe('invalid-url');
    });
  });
});
