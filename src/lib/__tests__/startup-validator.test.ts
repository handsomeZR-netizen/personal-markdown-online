/**
 * Unit Tests for Startup Validator Module
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  performStartupValidation,
  quickDatabaseHealthCheck,
  getCachedStartupValidation,
  clearValidationCache,
  type StartupValidationResult
} from '../startup-validator';

// Mock the db-validator module
vi.mock('../db-validator', () => ({
  validateDatabase: vi.fn(),
  logValidationResults: vi.fn()
}));

// Mock the db-config module
vi.mock('../db-config', () => ({
  getDatabaseMode: vi.fn(() => 'local'),
  getDatabaseConfig: vi.fn(() => ({
    mode: 'local',
    connectionString: 'postgresql://postgres:postgres@localhost:5432/noteapp',
    isSupabaseAvailable: false
  })),
  getSetupInstructions: vi.fn((mode: string) => `Setup instructions for ${mode} mode`),
  MissingEnvVarError: class MissingEnvVarError extends Error {
    constructor(public missingVars: string[], public mode: 'local' | 'supabase') {
      super(`Missing: ${missingVars.join(', ')}`);
    }
  }
}));

describe('Startup Validator - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearValidationCache();
    // Suppress console output during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('performStartupValidation', () => {
    test('should return valid result when all checks pass', async () => {
      const { validateDatabase } = await import('../db-validator');
      const { getDatabaseConfig } = await import('../db-config');

      vi.mocked(getDatabaseConfig).mockReturnValue({
        mode: 'local',
        connectionString: 'postgresql://postgres:postgres@localhost:5432/noteapp',
        isSupabaseAvailable: false
      });

      vi.mocked(validateDatabase).mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        mode: 'local',
        diagnostics: {
          connectionStatus: 'connected',
          suggestions: []
        }
      });

      const result = await performStartupValidation();

      expect(result.isValid).toBe(true);
      expect(result.canProceed).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.mode).toBe('local');
    });

    test('should return invalid result when database validation fails', async () => {
      const { validateDatabase } = await import('../db-validator');
      const { getDatabaseConfig } = await import('../db-config');

      vi.mocked(getDatabaseConfig).mockReturnValue({
        mode: 'local',
        connectionString: 'postgresql://postgres:postgres@localhost:5432/noteapp',
        isSupabaseAvailable: false
      });

      vi.mocked(validateDatabase).mockResolvedValue({
        isValid: false,
        errors: ['Connection failed'],
        warnings: [],
        mode: 'local',
        diagnostics: {
          connectionStatus: 'failed',
          errorType: 'host_unreachable',
          suggestions: ['Start the database server']
        }
      });

      const result = await performStartupValidation();

      expect(result.isValid).toBe(false);
      expect(result.canProceed).toBe(false);
      expect(result.errors).toContain('Connection failed');
    });

    test('should handle missing environment variables', async () => {
      const { getDatabaseConfig, MissingEnvVarError } = await import('../db-config');

      vi.mocked(getDatabaseConfig).mockImplementation(() => {
        throw new MissingEnvVarError(['DATABASE_URL', 'AUTH_SECRET'], 'local');
      });

      const result = await performStartupValidation();

      expect(result.isValid).toBe(false);
      expect(result.canProceed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.setupInstructions).toBeDefined();
    });

    test('should include warnings in result', async () => {
      const { validateDatabase } = await import('../db-validator');
      const { getDatabaseConfig } = await import('../db-config');

      vi.mocked(getDatabaseConfig).mockReturnValue({
        mode: 'local',
        connectionString: 'postgresql://postgres:postgres@localhost:5432/noteapp',
        isSupabaseAvailable: false
      });

      vi.mocked(validateDatabase).mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: ['Schema is outdated'],
        mode: 'local',
        diagnostics: {
          connectionStatus: 'connected',
          migrationStatus: 'pending',
          suggestions: ['Run migrations']
        }
      });

      const result = await performStartupValidation();

      expect(result.isValid).toBe(true);
      expect(result.canProceed).toBe(true);
      expect(result.warnings).toContain('Schema is outdated');
    });

    test('should handle database connection errors', async () => {
      const { validateDatabase } = await import('../db-validator');
      const { getDatabaseConfig } = await import('../db-config');

      vi.mocked(getDatabaseConfig).mockReturnValue({
        mode: 'local',
        connectionString: 'postgresql://postgres:postgres@localhost:5432/noteapp',
        isSupabaseAvailable: false
      });

      vi.mocked(validateDatabase).mockRejectedValue(new Error('Connection timeout'));

      const result = await performStartupValidation();

      expect(result.isValid).toBe(false);
      expect(result.canProceed).toBe(false);
      expect(result.errors.some(e => e.includes('Connection timeout'))).toBe(true);
    });
  });

  describe('quickDatabaseHealthCheck', () => {
    test('should return true when configuration is valid', async () => {
      const { getDatabaseConfig } = await import('../db-config');

      vi.mocked(getDatabaseConfig).mockReturnValue({
        mode: 'local',
        connectionString: 'postgresql://postgres:postgres@localhost:5432/noteapp',
        isSupabaseAvailable: false
      });

      const result = await quickDatabaseHealthCheck();

      expect(result).toBe(true);
    });

    test('should return false when configuration is invalid', async () => {
      const { getDatabaseConfig } = await import('../db-config');

      vi.mocked(getDatabaseConfig).mockImplementation(() => {
        throw new Error('Invalid configuration');
      });

      const result = await quickDatabaseHealthCheck();

      expect(result).toBe(false);
    });
  });

  describe('getCachedStartupValidation', () => {
    test('should cache validation results', async () => {
      const { validateDatabase } = await import('../db-validator');
      const { getDatabaseConfig } = await import('../db-config');

      vi.mocked(getDatabaseConfig).mockReturnValue({
        mode: 'local',
        connectionString: 'postgresql://postgres:postgres@localhost:5432/noteapp',
        isSupabaseAvailable: false
      });

      vi.mocked(validateDatabase).mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        mode: 'local',
        diagnostics: {
          connectionStatus: 'connected',
          suggestions: []
        }
      });

      // First call should perform validation
      const result1 = await getCachedStartupValidation();
      expect(result1.isValid).toBe(true);

      // Second call should use cached result
      const result2 = await getCachedStartupValidation();
      expect(result2).toBe(result1);

      // Validation should only be called once
      expect(validateDatabase).toHaveBeenCalledTimes(1);
    });

    test('should not cache failed validations', async () => {
      const { validateDatabase } = await import('../db-validator');
      const { getDatabaseConfig } = await import('../db-config');

      vi.mocked(getDatabaseConfig).mockReturnValue({
        mode: 'local',
        connectionString: 'postgresql://postgres:postgres@localhost:5432/noteapp',
        isSupabaseAvailable: false
      });

      vi.mocked(validateDatabase).mockResolvedValue({
        isValid: false,
        errors: ['Connection failed'],
        warnings: [],
        mode: 'local',
        diagnostics: {
          connectionStatus: 'failed',
          suggestions: []
        }
      });

      const result = await getCachedStartupValidation();
      expect(result.isValid).toBe(false);
    });

    test('should handle concurrent validation requests', async () => {
      const { validateDatabase } = await import('../db-validator');
      const { getDatabaseConfig } = await import('../db-config');

      vi.mocked(getDatabaseConfig).mockReturnValue({
        mode: 'local',
        connectionString: 'postgresql://postgres:postgres@localhost:5432/noteapp',
        isSupabaseAvailable: false
      });

      // Add delay to validation
      vi.mocked(validateDatabase).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          isValid: true,
          errors: [],
          warnings: [],
          mode: 'local',
          diagnostics: {
            connectionStatus: 'connected',
            suggestions: []
          }
        }), 100))
      );

      // Make multiple concurrent requests
      const [result1, result2, result3] = await Promise.all([
        getCachedStartupValidation(),
        getCachedStartupValidation(),
        getCachedStartupValidation()
      ]);

      // All should return the same result
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);

      // Validation should only be called once
      expect(validateDatabase).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearValidationCache', () => {
    test('should clear cached validation result', async () => {
      const { validateDatabase } = await import('../db-validator');
      const { getDatabaseConfig } = await import('../db-config');

      vi.mocked(getDatabaseConfig).mockReturnValue({
        mode: 'local',
        connectionString: 'postgresql://postgres:postgres@localhost:5432/noteapp',
        isSupabaseAvailable: false
      });

      vi.mocked(validateDatabase).mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        mode: 'local',
        diagnostics: {
          connectionStatus: 'connected',
          suggestions: []
        }
      });

      // First call
      await getCachedStartupValidation();
      expect(validateDatabase).toHaveBeenCalledTimes(1);

      // Clear cache
      clearValidationCache();

      // Second call should perform validation again
      await getCachedStartupValidation();
      expect(validateDatabase).toHaveBeenCalledTimes(2);
    });
  });

  describe('Logging', () => {
    test('should log startup information', async () => {
      const { validateDatabase } = await import('../db-validator');
      const { getDatabaseConfig } = await import('../db-config');

      const consoleSpy = vi.spyOn(console, 'log');

      vi.mocked(getDatabaseConfig).mockReturnValue({
        mode: 'local',
        connectionString: 'postgresql://postgres:postgres@localhost:5432/noteapp',
        isSupabaseAvailable: false
      });

      vi.mocked(validateDatabase).mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        mode: 'local',
        diagnostics: {
          connectionStatus: 'connected',
          suggestions: []
        }
      });

      await performStartupValidation();

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Note App');
      expect(output).toContain('Database Mode');
    });

    test('should log setup instructions on failure', async () => {
      const { getDatabaseConfig, MissingEnvVarError } = await import('../db-config');

      const consoleSpy = vi.spyOn(console, 'log');

      vi.mocked(getDatabaseConfig).mockImplementation(() => {
        throw new MissingEnvVarError(['DATABASE_URL'], 'local');
      });

      await performStartupValidation();

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Setup instructions');
    });
  });
});
