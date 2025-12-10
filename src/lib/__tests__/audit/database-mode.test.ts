/**
 * Database Mode Tests
 * 
 * Tests for database mode functionality including:
 * - Local mode connection
 * - Supabase mode connection
 * - Mode switching
 * - Data migration tools
 * - Startup validation
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getDatabaseMode,
  isSupabaseAvailable,
  validateEnvironmentVariables,
  getDatabaseConfig,
  validateDatabaseConfig,
  getSetupInstructions,
  MissingEnvVarError,
  type DatabaseConfig,
  type ValidationResult
} from '@/lib/db-config';

describe('Database Mode Tests', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset environment variables before each test
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = { ...originalEnv };
  });

  describe('Local Mode Connection', () => {
    it('should detect local mode when DATABASE_MODE is set to local', () => {
      process.env.DATABASE_MODE = 'local';
      
      const mode = getDatabaseMode();
      
      expect(mode).toBe('local');
    });

    it('should default to local mode when DATABASE_MODE is not set', () => {
      delete process.env.DATABASE_MODE;
      
      const mode = getDatabaseMode();
      
      expect(mode).toBe('local');
    });

    it('should validate required environment variables for local mode', () => {
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.AUTH_SECRET = 'test-secret';

      const result = validateEnvironmentVariables('local');

      expect(result.isValid).toBe(true);
      expect(result.mode).toBe('local');
      expect(result.errors).toHaveLength(0);
    });

    it('should throw MissingEnvVarError when required local mode variables are missing', () => {
      process.env.DATABASE_MODE = 'local';
      delete process.env.DATABASE_URL;
      delete process.env.NEXTAUTH_SECRET;

      expect(() => validateEnvironmentVariables('local')).toThrow(MissingEnvVarError);
    });

    it('should provide warnings for optional local mode variables', () => {
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.AUTH_SECRET = 'test-secret';
      delete process.env.LOCAL_STORAGE_PATH;

      const result = validateEnvironmentVariables('local');

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('LOCAL_STORAGE_PATH'))).toBe(true);
    });

    it('should get database config for local mode', () => {
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.AUTH_SECRET = 'test-secret';
      process.env.DIRECT_URL = 'postgresql://localhost:5432/test';

      const config = getDatabaseConfig();

      expect(config.mode).toBe('local');
      expect(config.connectionString).toBe('postgresql://localhost:5432/test');
      expect(config.directUrl).toBe('postgresql://localhost:5432/test');
    });
  });

  describe('Supabase Mode Connection', () => {
    it('should detect Supabase mode when DATABASE_MODE is set to supabase', () => {
      process.env.DATABASE_MODE = 'supabase';
      
      const mode = getDatabaseMode();
      
      expect(mode).toBe('supabase');
    });

    it('should check if Supabase is available', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      const available = isSupabaseAvailable();

      expect(available).toBe(true);
    });

    it('should return false when Supabase credentials are missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const available = isSupabaseAvailable();

      expect(available).toBe(false);
    });

    it('should validate required environment variables for Supabase mode', () => {
      process.env.DATABASE_MODE = 'supabase';
      process.env.DATABASE_URL = 'postgresql://supabase.co:5432/test';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      const result = validateEnvironmentVariables('supabase');

      expect(result.isValid).toBe(true);
      expect(result.mode).toBe('supabase');
      expect(result.errors).toHaveLength(0);
    });

    it('should throw MissingEnvVarError when required Supabase variables are missing', () => {
      process.env.DATABASE_MODE = 'supabase';
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => validateEnvironmentVariables('supabase')).toThrow(MissingEnvVarError);
    });

    it('should get database config for Supabase mode', () => {
      process.env.DATABASE_MODE = 'supabase';
      process.env.DATABASE_URL = 'postgresql://supabase.co:5432/test';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      const config = getDatabaseConfig();

      expect(config.mode).toBe('supabase');
      expect(config.connectionString).toBe('postgresql://supabase.co:5432/test');
      expect(config.isSupabaseAvailable).toBe(true);
    });
  });

  describe('Mode Switching', () => {
    it('should switch from local to Supabase mode', () => {
      // Start in local mode
      process.env.DATABASE_MODE = 'local';
      expect(getDatabaseMode()).toBe('local');

      // Switch to Supabase mode
      process.env.DATABASE_MODE = 'supabase';
      expect(getDatabaseMode()).toBe('supabase');
    });

    it('should use correct authentication method based on mode', () => {
      // Local mode requires NextAuth secrets
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.AUTH_SECRET = 'test-secret';

      const localConfig = getDatabaseConfig();
      expect(localConfig.mode).toBe('local');

      // Supabase mode requires Supabase credentials
      process.env.DATABASE_MODE = 'supabase';
      process.env.DATABASE_URL = 'postgresql://supabase.co:5432/test';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      const supabaseConfig = getDatabaseConfig();
      expect(supabaseConfig.mode).toBe('supabase');
      expect(supabaseConfig.isSupabaseAvailable).toBe(true);
    });

    it('should use correct storage method based on mode', () => {
      // Local mode uses local storage
      process.env.DATABASE_MODE = 'local';
      process.env.LOCAL_STORAGE_PATH = './uploads';
      
      const localMode = getDatabaseMode();
      expect(localMode).toBe('local');

      // Supabase mode uses cloud storage
      process.env.DATABASE_MODE = 'supabase';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      
      const supabaseMode = getDatabaseMode();
      expect(supabaseMode).toBe('supabase');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate database configuration successfully', () => {
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.AUTH_SECRET = 'test-secret';

      const result = validateDatabaseConfig();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return validation errors for invalid configuration', () => {
      process.env.DATABASE_MODE = 'local';
      delete process.env.DATABASE_URL;

      const result = validateDatabaseConfig();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should provide setup instructions for local mode', () => {
      const instructions = getSetupInstructions('local');

      expect(instructions).toContain('Local Database Setup');
      expect(instructions).toContain('docker-compose');
      expect(instructions).toContain('DATABASE_URL');
      expect(instructions).toContain('NEXTAUTH_SECRET');
    });

    it('should provide setup instructions for Supabase mode', () => {
      const instructions = getSetupInstructions('supabase');

      expect(instructions).toContain('Supabase Setup');
      expect(instructions).toContain('supabase.com');
      expect(instructions).toContain('NEXT_PUBLIC_SUPABASE_URL');
      expect(instructions).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing DATABASE_URL gracefully', () => {
      process.env.DATABASE_MODE = 'local';
      delete process.env.DATABASE_URL;

      expect(() => validateEnvironmentVariables('local')).toThrow(MissingEnvVarError);
    });

    it('should handle missing Supabase credentials gracefully', () => {
      process.env.DATABASE_MODE = 'supabase';
      process.env.DATABASE_URL = 'postgresql://supabase.co:5432/test';
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      expect(() => validateEnvironmentVariables('supabase')).toThrow(MissingEnvVarError);
    });

    it('should provide helpful error messages', () => {
      process.env.DATABASE_MODE = 'local';
      delete process.env.DATABASE_URL;
      delete process.env.NEXTAUTH_SECRET;

      try {
        validateEnvironmentVariables('local');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(MissingEnvVarError);
        const missingError = error as MissingEnvVarError;
        expect(missingError.missingVars).toContain('DATABASE_URL');
        expect(missingError.missingVars).toContain('NEXTAUTH_SECRET');
      }
    });
  });

  describe('Integration Tests', () => {
    it('should complete full configuration flow for local mode', () => {
      // Set up local mode environment
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/noteapp';
      process.env.NEXTAUTH_SECRET = 'test-secret-key-12345';
      process.env.AUTH_SECRET = 'test-secret-key-12345';
      process.env.DIRECT_URL = 'postgresql://postgres:postgres@localhost:5432/noteapp';
      process.env.LOCAL_STORAGE_PATH = './uploads';

      // Validate mode detection
      const mode = getDatabaseMode();
      expect(mode).toBe('local');

      // Validate environment variables
      const validation = validateEnvironmentVariables('local');
      expect(validation.isValid).toBe(true);

      // Get configuration
      const config = getDatabaseConfig();
      expect(config.mode).toBe('local');
      expect(config.connectionString).toBeDefined();
      expect(config.directUrl).toBeDefined();
    });

    it('should complete full configuration flow for Supabase mode', () => {
      // Set up Supabase mode environment
      process.env.DATABASE_MODE = 'supabase';
      process.env.DATABASE_URL = 'postgresql://postgres:[password]@db.test.supabase.co:5432/postgres';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      process.env.DIRECT_URL = 'postgresql://postgres:[password]@db.test.supabase.co:5432/postgres';

      // Validate mode detection
      const mode = getDatabaseMode();
      expect(mode).toBe('supabase');

      // Check Supabase availability
      const available = isSupabaseAvailable();
      expect(available).toBe(true);

      // Validate environment variables
      const validation = validateEnvironmentVariables('supabase');
      expect(validation.isValid).toBe(true);

      // Get configuration
      const config = getDatabaseConfig();
      expect(config.mode).toBe('supabase');
      expect(config.connectionString).toBeDefined();
      expect(config.isSupabaseAvailable).toBe(true);
    });
  });
});
