/**
 * Property-Based Tests for Database Validator Module
 * 
 * Feature: local-database-migration
 * Property 7: 连接错误诊断
 * Validates: Requirements 7.4
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  DatabaseConnectionError,
  validateDatabaseConnection,
  checkSchemaVersion,
  suggestMigrations,
  validateDatabase,
  logValidationResults
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

describe('Database Validator - Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 7: 连接错误诊断
   * For any invalid database connection parameters, the system should provide
   * actionable error messages indicating the specific problem
   * 
   * Validates: Requirements 7.4
   */
  test('Property 7: connection errors provide actionable diagnostics', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'host_unreachable',
          'auth_failed',
          'db_not_found',
          'timeout'
        ),
        async (errorType) => {
          // Setup: Create error messages that match each error type
          const errorMessages: Record<string, string> = {
            host_unreachable: 'connect ECONNREFUSED 127.0.0.1:5432',
            auth_failed: 'password authentication failed for user "postgres"',
            db_not_found: 'database "noteapp" does not exist',
            timeout: 'connection timeout exceeded'
          };

          const errorMessage = errorMessages[errorType];
          const mockError = new Error(errorMessage);

          // Mock prisma to throw the specific error
          vi.mocked(prisma.$connect).mockRejectedValueOnce(mockError);

          // Execute: Try to validate database connection
          try {
            await validateDatabaseConnection();
            throw new Error('Expected DatabaseConnectionError to be thrown');
          } catch (error) {
            // Verify: Check that the error is of the correct type
            expect(error).toBeInstanceOf(DatabaseConnectionError);

            if (error instanceof DatabaseConnectionError) {
              // Verify: The error cause matches the error type
              expect(error.cause).toBe(errorType);

              // Verify: Suggestions array is not empty
              expect(error.suggestions).toBeInstanceOf(Array);
              expect(error.suggestions.length).toBeGreaterThan(0);

              // Verify: Each suggestion is a non-empty string
              error.suggestions.forEach(suggestion => {
                expect(typeof suggestion).toBe('string');
                expect(suggestion.length).toBeGreaterThan(0);
              });

              // Verify: Error message is descriptive
              expect(error.message).toBeTruthy();
              expect(error.message.length).toBeGreaterThan(0);
            }
          }

          // Verify: Prisma disconnect was called
          expect(prisma.$disconnect).toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7: host unreachable errors provide network-related suggestions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'ECONNREFUSED',
          'connection refused',
          'could not connect',
          'host unreachable',
          'network error'
        ),
        async (errorKeyword) => {
          // Setup: Create error with network-related keyword
          const mockError = new Error(`Database error: ${errorKeyword}`);
          vi.mocked(prisma.$connect).mockRejectedValueOnce(mockError);

          // Execute & Verify
          try {
            await validateDatabaseConnection();
            throw new Error('Expected DatabaseConnectionError');
          } catch (error) {
            expect(error).toBeInstanceOf(DatabaseConnectionError);

            if (error instanceof DatabaseConnectionError) {
              expect(error.cause).toBe('host_unreachable');

              // Verify: Suggestions mention checking database server
              const suggestionsText = error.suggestions.join(' ').toLowerCase();
              expect(
                suggestionsText.includes('database') ||
                suggestionsText.includes('server') ||
                suggestionsText.includes('running') ||
                suggestionsText.includes('docker')
              ).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7: authentication errors provide credential-related suggestions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'authentication failed',
          'password authentication failed',
          'invalid password',
          'access denied',
          'invalid credentials'
        ),
        async (errorKeyword) => {
          // Setup: Create error with auth-related keyword
          const mockError = new Error(`Database error: ${errorKeyword}`);
          vi.mocked(prisma.$connect).mockRejectedValueOnce(mockError);

          // Execute & Verify
          try {
            await validateDatabaseConnection();
            throw new Error('Expected DatabaseConnectionError');
          } catch (error) {
            expect(error).toBeInstanceOf(DatabaseConnectionError);

            if (error instanceof DatabaseConnectionError) {
              expect(error.cause).toBe('auth_failed');

              // Verify: Suggestions mention credentials or password
              const suggestionsText = error.suggestions.join(' ').toLowerCase();
              expect(
                suggestionsText.includes('password') ||
                suggestionsText.includes('username') ||
                suggestionsText.includes('credentials') ||
                suggestionsText.includes('authentication')
              ).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7: database not found errors provide creation suggestions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'database "test" does not exist',
          'unknown database',
          'database not found'
        ),
        async (errorMessage) => {
          // Setup: Create database not found error
          const mockError = new Error(errorMessage);
          vi.mocked(prisma.$connect).mockRejectedValueOnce(mockError);

          // Execute & Verify
          try {
            await validateDatabaseConnection();
            throw new Error('Expected DatabaseConnectionError');
          } catch (error) {
            expect(error).toBeInstanceOf(DatabaseConnectionError);

            if (error instanceof DatabaseConnectionError) {
              expect(error.cause).toBe('db_not_found');

              // Verify: Suggestions mention creating database or migrations
              const suggestionsText = error.suggestions.join(' ').toLowerCase();
              expect(
                suggestionsText.includes('create') ||
                suggestionsText.includes('migrate') ||
                suggestionsText.includes('database')
              ).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7: timeout errors provide performance-related suggestions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'timeout',
          'timed out',
          'connection timeout'
        ),
        async (errorKeyword) => {
          // Setup: Create timeout error
          const mockError = new Error(`Database error: ${errorKeyword}`);
          vi.mocked(prisma.$connect).mockRejectedValueOnce(mockError);

          // Execute & Verify
          try {
            await validateDatabaseConnection();
            throw new Error('Expected DatabaseConnectionError');
          } catch (error) {
            expect(error).toBeInstanceOf(DatabaseConnectionError);

            if (error instanceof DatabaseConnectionError) {
              expect(error.cause).toBe('timeout');

              // Verify: Suggestions mention timeout or network
              const suggestionsText = error.suggestions.join(' ').toLowerCase();
              expect(
                suggestionsText.includes('timeout') ||
                suggestionsText.includes('network') ||
                suggestionsText.includes('connection')
              ).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7: successful connection returns valid result', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          // Setup: Mock successful connection
          vi.mocked(prisma.$connect).mockResolvedValueOnce(undefined);
          vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ test: 1 }]);
          vi.mocked(prisma.$disconnect).mockResolvedValueOnce(undefined);

          // Mock version query
          vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([
            { version: 'PostgreSQL 16.0' }
          ]);

          // Execute
          const result = await validateDatabaseConnection();

          // Verify: Result indicates success
          expect(result.isValid).toBe(true);
          expect(result.errors.length).toBe(0);
          expect(result.diagnostics?.connectionStatus).toBe('connected');

          // Verify: Disconnect was called
          expect(prisma.$disconnect).toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7: schema version check handles missing migrations table', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        async (tableExists) => {
          // Setup: Mock migrations table existence check
          vi.mocked(prisma.$connect).mockResolvedValueOnce(undefined);
          vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([
            { exists: tableExists }
          ]);
          vi.mocked(prisma.$disconnect).mockResolvedValueOnce(undefined);

          // Execute
          const isUpToDate = await checkSchemaVersion();

          // Verify: Returns false if table doesn't exist
          if (!tableExists) {
            expect(isUpToDate).toBe(false);
          }

          // Verify: Disconnect was called
          expect(prisma.$disconnect).toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7: migration suggestions are provided when schema is outdated', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        async (isUpToDate) => {
          // Setup: Mock schema version check
          vi.mocked(prisma.$connect).mockResolvedValue(undefined);
          vi.mocked(prisma.$disconnect).mockResolvedValue(undefined);

          if (isUpToDate) {
            // Mock up-to-date schema
            vi.mocked(prisma.$queryRaw)
              .mockResolvedValueOnce([{ exists: true }])
              .mockResolvedValueOnce([{ count: BigInt(0) }]);
          } else {
            // Mock outdated schema
            vi.mocked(prisma.$queryRaw)
              .mockResolvedValueOnce([{ exists: true }])
              .mockResolvedValueOnce([{ count: BigInt(1) }]);
          }

          // Execute
          const suggestions = await suggestMigrations();

          // Verify: Suggestions array is not empty
          expect(suggestions).toBeInstanceOf(Array);
          expect(suggestions.length).toBeGreaterThan(0);

          // Verify: Suggestions are strings
          suggestions.forEach(suggestion => {
            expect(typeof suggestion).toBe('string');
            expect(suggestion.length).toBeGreaterThan(0);
          });

          // Verify: If not up to date, suggestions mention migrations
          if (!isUpToDate) {
            const suggestionsText = suggestions.join(' ').toLowerCase();
            expect(suggestionsText.includes('migrate')).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7: comprehensive validation combines all checks', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        async (shouldSucceed) => {
          // Setup: Mock based on success/failure scenario
          if (shouldSucceed) {
            vi.mocked(prisma.$connect).mockResolvedValue(undefined);
            vi.mocked(prisma.$queryRaw)
              .mockResolvedValueOnce([{ test: 1 }]) // Connection test
              .mockResolvedValueOnce([{ version: 'PostgreSQL 16.0' }]) // Version query
              .mockResolvedValueOnce([{ exists: true }]) // Migrations table check
              .mockResolvedValueOnce([{ count: BigInt(0) }]) // Pending migrations
              .mockResolvedValueOnce([{ migration_name: '20240101_init', finished_at: new Date() }]); // Latest migration
            vi.mocked(prisma.$disconnect).mockResolvedValue(undefined);
          } else {
            vi.mocked(prisma.$connect).mockRejectedValueOnce(
              new Error('connection refused')
            );
            vi.mocked(prisma.$disconnect).mockResolvedValue(undefined);
          }

          // Execute
          const result = await validateDatabase();

          // Verify: Result has required properties
          expect(result).toHaveProperty('isValid');
          expect(result).toHaveProperty('errors');
          expect(result).toHaveProperty('warnings');
          expect(result).toHaveProperty('mode');
          expect(result).toHaveProperty('diagnostics');

          // Verify: isValid matches the scenario
          expect(result.isValid).toBe(shouldSucceed);

          // Verify: Diagnostics are provided
          expect(result.diagnostics).toBeDefined();
          expect(result.diagnostics?.connectionStatus).toBeDefined();

          // Verify: If failed, suggestions are provided
          if (!shouldSucceed) {
            expect(result.diagnostics?.suggestions).toBeDefined();
            expect(result.diagnostics!.suggestions.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7: log validation results handles all result types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 3 }),
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 3 }),
        async (isValid, errors, warnings) => {
          // Setup: Create a validation result
          const result = {
            isValid,
            errors,
            warnings,
            mode: 'local' as const,
            diagnostics: {
              connectionStatus: isValid ? 'connected' as const : 'failed' as const,
              suggestions: isValid ? [] : ['Test suggestion']
            }
          };

          // Mock console.log to capture output
          const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

          // Execute
          logValidationResults(result);

          // Verify: Console.log was called
          expect(consoleSpy).toHaveBeenCalled();

          // Verify: Output includes mode and status
          const output = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
          expect(output.toLowerCase()).toContain('mode');
          expect(output.toLowerCase()).toContain('status');

          // Cleanup
          consoleSpy.mockRestore();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7: unknown errors provide generic troubleshooting suggestions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }),
        async (randomErrorMessage) => {
          // Setup: Create an error that doesn't match known patterns
          const mockError = new Error(`Random error: ${randomErrorMessage}`);
          vi.mocked(prisma.$connect).mockRejectedValueOnce(mockError);

          // Execute & Verify
          try {
            await validateDatabaseConnection();
            throw new Error('Expected DatabaseConnectionError');
          } catch (error) {
            expect(error).toBeInstanceOf(DatabaseConnectionError);

            if (error instanceof DatabaseConnectionError) {
              // Verify: Unknown errors are categorized as 'unknown'
              expect(error.cause).toBe('unknown');

              // Verify: Generic suggestions are provided
              expect(error.suggestions.length).toBeGreaterThan(0);

              // Verify: Suggestions mention checking logs or documentation
              const suggestionsText = error.suggestions.join(' ').toLowerCase();
              expect(
                suggestionsText.includes('check') ||
                suggestionsText.includes('verify') ||
                suggestionsText.includes('review') ||
                suggestionsText.includes('consult')
              ).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
