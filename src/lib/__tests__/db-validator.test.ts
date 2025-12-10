/**
 * Unit Tests for Database Validator Module
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DatabaseConnectionError,
  validateDatabaseConnection,
  checkSchemaVersion,
  suggestMigrations,
  validateDatabase,
  logValidationResults,
  type ValidationResult
} from '../db-validator';
import { prisma } from '../prisma';

// Mock the prisma client
vi.mock('../prisma', () => ({
  prisma: {
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $queryRaw: vi.fn()
  }
}));

// Mock the db-config module
vi.mock('../db-config', () => ({
  getDatabaseMode: vi.fn(() => 'local'),
  getDatabaseConfig: vi.fn(() => ({
    mode: 'local',
    connectionString: 'postgresql://postgres:postgres@localhost:5432/noteapp',
    isSupabaseAvailable: false
  }))
}));

describe('Database Validator - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('DatabaseConnectionError', () => {
    test('should create error with correct properties', () => {
      const error = new DatabaseConnectionError(
        'Test error',
        'host_unreachable',
        ['Suggestion 1', 'Suggestion 2']
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('DatabaseConnectionError');
      expect(error.message).toBe('Test error');
      expect(error.cause).toBe('host_unreachable');
      expect(error.suggestions).toEqual(['Suggestion 1', 'Suggestion 2']);
    });
  });

  describe('validateDatabaseConnection', () => {
    test('should return valid result on successful connection', async () => {
      // Mock successful connection
      vi.mocked(prisma.$connect).mockResolvedValueOnce(undefined);
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([{ test: 1 }])
        .mockResolvedValueOnce([{ version: 'PostgreSQL 16.0' }]);
      vi.mocked(prisma.$disconnect).mockResolvedValueOnce(undefined);

      const result = await validateDatabaseConnection();

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.diagnostics?.connectionStatus).toBe('connected');
      expect(result.diagnostics?.databaseVersion).toBe('PostgreSQL 16.0');
      expect(prisma.$disconnect).toHaveBeenCalled();
    });

    test('should throw DatabaseConnectionError on connection failure', async () => {
      // Mock connection failure
      vi.mocked(prisma.$connect).mockRejectedValueOnce(
        new Error('connect ECONNREFUSED 127.0.0.1:5432')
      );
      vi.mocked(prisma.$disconnect).mockResolvedValueOnce(undefined);

      await expect(validateDatabaseConnection()).rejects.toThrow(DatabaseConnectionError);
      expect(prisma.$disconnect).toHaveBeenCalled();
    });

    test('should handle version query failure gracefully', async () => {
      // Mock successful connection but failed version query
      vi.mocked(prisma.$connect).mockResolvedValueOnce(undefined);
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([{ test: 1 }])
        .mockRejectedValueOnce(new Error('Version query failed'));
      vi.mocked(prisma.$disconnect).mockResolvedValueOnce(undefined);

      const result = await validateDatabaseConnection();

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Could not retrieve database version');
    });
  });

  describe('checkSchemaVersion', () => {
    test('should return false when migrations table does not exist', async () => {
      vi.mocked(prisma.$connect).mockResolvedValueOnce(undefined);
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ exists: false }]);
      vi.mocked(prisma.$disconnect).mockResolvedValueOnce(undefined);

      const result = await checkSchemaVersion();

      expect(result).toBe(false);
      expect(prisma.$disconnect).toHaveBeenCalled();
    });

    test('should return true when no pending migrations', async () => {
      vi.mocked(prisma.$connect).mockResolvedValueOnce(undefined);
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([{ exists: true }])
        .mockResolvedValueOnce([{ count: BigInt(0) }]);
      vi.mocked(prisma.$disconnect).mockResolvedValueOnce(undefined);

      const result = await checkSchemaVersion();

      expect(result).toBe(true);
    });

    test('should return false when there are pending migrations', async () => {
      vi.mocked(prisma.$connect).mockResolvedValueOnce(undefined);
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([{ exists: true }])
        .mockResolvedValueOnce([{ count: BigInt(2) }]);
      vi.mocked(prisma.$disconnect).mockResolvedValueOnce(undefined);

      const result = await checkSchemaVersion();

      expect(result).toBe(false);
    });

    test('should handle errors gracefully', async () => {
      vi.mocked(prisma.$connect).mockRejectedValueOnce(new Error('Connection failed'));
      vi.mocked(prisma.$disconnect).mockResolvedValueOnce(undefined);

      const result = await checkSchemaVersion();

      expect(result).toBe(false);
    });
  });

  describe('suggestMigrations', () => {
    test('should suggest running migrations when schema is outdated', async () => {
      vi.mocked(prisma.$connect).mockResolvedValue(undefined);
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([{ exists: true }])
        .mockResolvedValueOnce([{ count: BigInt(1) }]);
      vi.mocked(prisma.$disconnect).mockResolvedValue(undefined);

      const suggestions = await suggestMigrations();

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.toLowerCase().includes('migrate'))).toBe(true);
    });

    test('should indicate schema is up to date when no migrations needed', async () => {
      vi.mocked(prisma.$connect).mockResolvedValue(undefined);
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([{ exists: true }])
        .mockResolvedValueOnce([{ count: BigInt(0) }]);
      vi.mocked(prisma.$disconnect).mockResolvedValue(undefined);

      const suggestions = await suggestMigrations();

      expect(suggestions).toContain('Database schema is up to date');
    });
  });

  describe('validateDatabase', () => {
    test('should perform comprehensive validation successfully', async () => {
      // Mock all successful operations
      vi.mocked(prisma.$connect).mockResolvedValue(undefined);
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([{ test: 1 }]) // Connection test
        .mockResolvedValueOnce([{ version: 'PostgreSQL 16.0' }]) // Version
        .mockResolvedValueOnce([{ exists: true }]) // Migrations table
        .mockResolvedValueOnce([{ count: BigInt(0) }]) // Pending migrations
        .mockResolvedValueOnce([{ 
          migration_name: '20240101_init', 
          finished_at: new Date() 
        }]); // Latest migration
      vi.mocked(prisma.$disconnect).mockResolvedValue(undefined);

      const result = await validateDatabase();

      expect(result.isValid).toBe(true);
      expect(result.diagnostics?.connectionStatus).toBe('connected');
      expect(result.diagnostics?.migrationStatus).toBe('up_to_date');
    });

    test('should handle connection failure in comprehensive validation', async () => {
      vi.mocked(prisma.$connect).mockRejectedValueOnce(
        new Error('connection refused')
      );
      vi.mocked(prisma.$disconnect).mockResolvedValue(undefined);

      const result = await validateDatabase();

      expect(result.isValid).toBe(false);
      expect(result.diagnostics?.connectionStatus).toBe('failed');
      expect(result.diagnostics?.errorType).toBe('host_unreachable');
    });

    test('should warn when schema is not up to date', async () => {
      vi.mocked(prisma.$connect).mockResolvedValue(undefined);
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([{ test: 1 }])
        .mockResolvedValueOnce([{ version: 'PostgreSQL 16.0' }])
        .mockResolvedValueOnce([{ exists: true }])
        .mockResolvedValueOnce([{ count: BigInt(1) }]); // Pending migrations
      vi.mocked(prisma.$disconnect).mockResolvedValue(undefined);

      const result = await validateDatabase();

      expect(result.warnings).toContain('Database schema is not up to date');
      expect(result.diagnostics?.migrationStatus).toBe('pending');
    });
  });

  describe('logValidationResults', () => {
    test('should log validation results without errors', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        mode: 'local',
        diagnostics: {
          connectionStatus: 'connected',
          suggestions: []
        }
      };

      logValidationResults(result);

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Valid');
      expect(output).toContain('local');

      consoleSpy.mockRestore();
    });

    test('should log errors and suggestions', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result: ValidationResult = {
        isValid: false,
        errors: ['Connection failed'],
        warnings: ['Schema outdated'],
        mode: 'supabase',
        diagnostics: {
          connectionStatus: 'failed',
          errorType: 'host_unreachable',
          suggestions: ['Check database server', 'Verify connection string']
        }
      };

      logValidationResults(result);

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Invalid');
      expect(output).toContain('Connection failed');
      expect(output).toContain('Schema outdated');
      expect(output).toContain('Check database server');

      consoleSpy.mockRestore();
    });
  });

  describe('Error parsing', () => {
    test('should identify host unreachable errors', async () => {
      const errors = [
        'connect ECONNREFUSED',
        'connection refused',
        'could not connect to server'
      ];

      for (const errorMsg of errors) {
        vi.mocked(prisma.$connect).mockRejectedValueOnce(new Error(errorMsg));
        vi.mocked(prisma.$disconnect).mockResolvedValueOnce(undefined);

        try {
          await validateDatabaseConnection();
        } catch (error) {
          expect(error).toBeInstanceOf(DatabaseConnectionError);
          if (error instanceof DatabaseConnectionError) {
            expect(error.cause).toBe('host_unreachable');
          }
        }
      }
    });

    test('should identify authentication errors', async () => {
      const errors = [
        'password authentication failed',
        'invalid password',
        'access denied'
      ];

      for (const errorMsg of errors) {
        vi.mocked(prisma.$connect).mockRejectedValueOnce(new Error(errorMsg));
        vi.mocked(prisma.$disconnect).mockResolvedValueOnce(undefined);

        try {
          await validateDatabaseConnection();
        } catch (error) {
          expect(error).toBeInstanceOf(DatabaseConnectionError);
          if (error instanceof DatabaseConnectionError) {
            expect(error.cause).toBe('auth_failed');
          }
        }
      }
    });

    test('should identify database not found errors', async () => {
      const errors = [
        'database "test" does not exist',
        'unknown database',
        'database not found'
      ];

      for (const errorMsg of errors) {
        vi.mocked(prisma.$connect).mockRejectedValueOnce(new Error(errorMsg));
        vi.mocked(prisma.$disconnect).mockResolvedValueOnce(undefined);

        try {
          await validateDatabaseConnection();
        } catch (error) {
          expect(error).toBeInstanceOf(DatabaseConnectionError);
          if (error instanceof DatabaseConnectionError) {
            expect(error.cause).toBe('db_not_found');
          }
        }
      }
    });

    test('should identify timeout errors', async () => {
      const errors = [
        'connection timeout',
        'timed out',
        'timeout exceeded'
      ];

      for (const errorMsg of errors) {
        vi.mocked(prisma.$connect).mockRejectedValueOnce(new Error(errorMsg));
        vi.mocked(prisma.$disconnect).mockResolvedValueOnce(undefined);

        try {
          await validateDatabaseConnection();
        } catch (error) {
          expect(error).toBeInstanceOf(DatabaseConnectionError);
          if (error instanceof DatabaseConnectionError) {
            expect(error.cause).toBe('timeout');
          }
        }
      }
    });
  });
});
