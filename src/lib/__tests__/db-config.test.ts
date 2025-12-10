/**
 * Unit Tests for Database Configuration Module
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import {
  getDatabaseMode,
  isSupabaseAvailable,
  validateEnvironmentVariables,
  getDatabaseConfig,
  MissingEnvVarError,
  getSetupInstructions
} from '../db-config';

describe('Database Configuration - Unit Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getDatabaseMode', () => {
    test('returns "local" when DATABASE_MODE is not set', () => {
      delete process.env.DATABASE_MODE;
      expect(getDatabaseMode()).toBe('local');
    });

    test('returns "local" when DATABASE_MODE is "local"', () => {
      process.env.DATABASE_MODE = 'local';
      expect(getDatabaseMode()).toBe('local');
    });

    test('returns "supabase" when DATABASE_MODE is "supabase"', () => {
      process.env.DATABASE_MODE = 'supabase';
      expect(getDatabaseMode()).toBe('supabase');
    });

    test('handles case-insensitive mode values', () => {
      process.env.DATABASE_MODE = 'SUPABASE';
      expect(getDatabaseMode()).toBe('supabase');
    });
  });

  describe('isSupabaseAvailable', () => {
    test('returns false when Supabase URL is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
      expect(isSupabaseAvailable()).toBe(false);
    });

    test('returns false when Supabase anon key is missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      expect(isSupabaseAvailable()).toBe(false);
    });

    test('returns true when both Supabase URL and key are present', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
      expect(isSupabaseAvailable()).toBe(true);
    });
  });

  describe('validateEnvironmentVariables', () => {
    test('throws MissingEnvVarError for local mode without DATABASE_URL', () => {
      delete process.env.DATABASE_URL;
      process.env.NEXTAUTH_SECRET = 'secret';
      process.env.AUTH_SECRET = 'secret';

      expect(() => validateEnvironmentVariables('local')).toThrow(MissingEnvVarError);
    });

    test('throws MissingEnvVarError for local mode without NEXTAUTH_SECRET', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      delete process.env.NEXTAUTH_SECRET;
      process.env.AUTH_SECRET = 'secret';

      expect(() => validateEnvironmentVariables('local')).toThrow(MissingEnvVarError);
    });

    test('returns valid result for properly configured local mode', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.NEXTAUTH_SECRET = 'secret';
      process.env.AUTH_SECRET = 'secret';

      const result = validateEnvironmentVariables('local');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.mode).toBe('local');
    });

    test('throws MissingEnvVarError for Supabase mode without required vars', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

      expect(() => validateEnvironmentVariables('supabase')).toThrow(MissingEnvVarError);
    });
  });

  describe('MissingEnvVarError', () => {
    test('contains missing variable names', () => {
      const error = new MissingEnvVarError(['VAR1', 'VAR2'], 'local');
      expect(error.missingVars).toEqual(['VAR1', 'VAR2']);
      expect(error.mode).toBe('local');
      expect(error.message).toContain('VAR1');
      expect(error.message).toContain('VAR2');
    });
  });

  describe('getDatabaseConfig', () => {
    test('returns valid config for local mode', () => {
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.NEXTAUTH_SECRET = 'secret';
      process.env.AUTH_SECRET = 'secret';

      const config = getDatabaseConfig();
      expect(config.mode).toBe('local');
      expect(config.connectionString).toBe('postgresql://localhost:5432/test');
    });

    test('includes directUrl when DIRECT_URL is set', () => {
      process.env.DATABASE_MODE = 'local';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.DIRECT_URL = 'postgresql://localhost:5432/test-direct';
      process.env.NEXTAUTH_SECRET = 'secret';
      process.env.AUTH_SECRET = 'secret';

      const config = getDatabaseConfig();
      expect(config.directUrl).toBe('postgresql://localhost:5432/test-direct');
    });
  });

  describe('getSetupInstructions', () => {
    test('returns local setup instructions for local mode', () => {
      const instructions = getSetupInstructions('local');
      expect(instructions).toContain('Local Database');
      expect(instructions).toContain('docker-compose');
      expect(instructions).toContain('DATABASE_URL');
    });

    test('returns Supabase setup instructions for Supabase mode', () => {
      const instructions = getSetupInstructions('supabase');
      expect(instructions).toContain('Supabase');
      expect(instructions).toContain('NEXT_PUBLIC_SUPABASE_URL');
      expect(instructions).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    });
  });
});
