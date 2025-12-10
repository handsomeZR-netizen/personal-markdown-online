/**
 * Database Validator Module
 * 
 * This module handles database connection validation, schema version checking,
 * and diagnostic information generation.
 */

import { prisma } from './prisma';
import { getDatabaseMode, getDatabaseConfig } from './db-config';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  mode: 'local' | 'supabase';
  diagnostics?: DiagnosticInfo;
}

/**
 * Diagnostic information interface
 */
export interface DiagnosticInfo {
  connectionStatus: 'connected' | 'failed';
  errorType?: 'host_unreachable' | 'auth_failed' | 'db_not_found' | 'timeout' | 'unknown';
  errorMessage?: string;
  suggestions: string[];
  databaseVersion?: string;
  schemaVersion?: string;
  migrationStatus?: 'up_to_date' | 'pending' | 'unknown';
}

/**
 * Custom error for database connection issues
 */
export class DatabaseConnectionError extends Error {
  constructor(
    message: string,
    public readonly cause: 'host_unreachable' | 'auth_failed' | 'db_not_found' | 'timeout' | 'unknown',
    public readonly suggestions: string[]
  ) {
    super(message);
    this.name = 'DatabaseConnectionError';
  }
}

/**
 * Parse Prisma error to determine the specific cause
 */
function parsePrismaError(error: Error): {
  cause: 'host_unreachable' | 'auth_failed' | 'db_not_found' | 'timeout' | 'unknown';
  suggestions: string[];
} {
  const errorMessage = error.message.toLowerCase();
  
  // Check for host unreachable errors
  if (
    errorMessage.includes('econnrefused') ||
    errorMessage.includes('connection refused') ||
    errorMessage.includes('could not connect') ||
    errorMessage.includes('host unreachable') ||
    errorMessage.includes('network error')
  ) {
    return {
      cause: 'host_unreachable',
      suggestions: [
        'Ensure the database server is running',
        'For local mode: Run "docker-compose up -d" to start PostgreSQL',
        'Check if the database host and port are correct in DATABASE_URL',
        'Verify firewall settings are not blocking the connection',
        'Check if the database is accessible from your network'
      ]
    };
  }
  
  // Check for authentication errors
  if (
    errorMessage.includes('authentication failed') ||
    errorMessage.includes('password authentication failed') ||
    errorMessage.includes('invalid password') ||
    errorMessage.includes('access denied') ||
    errorMessage.includes('invalid credentials')
  ) {
    return {
      cause: 'auth_failed',
      suggestions: [
        'Verify the database username and password in DATABASE_URL',
        'For local mode: Default credentials are postgres/postgres',
        'For Supabase: Check your connection string in the Supabase dashboard',
        'Ensure the user has proper permissions to access the database',
        'Try resetting the database password'
      ]
    };
  }
  
  // Check for database not found errors
  if (
    errorMessage.includes('database') && errorMessage.includes('does not exist') ||
    errorMessage.includes('unknown database') ||
    errorMessage.includes('database not found')
  ) {
    return {
      cause: 'db_not_found',
      suggestions: [
        'Create the database specified in DATABASE_URL',
        'For local mode: The database should be created automatically by Docker',
        'Run database migrations: npm run db:migrate',
        'Check if the database name in DATABASE_URL is correct',
        'Verify the database was not accidentally deleted'
      ]
    };
  }
  
  // Check for timeout errors
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('timed out') ||
    errorMessage.includes('connection timeout')
  ) {
    return {
      cause: 'timeout',
      suggestions: [
        'The database server is taking too long to respond',
        'Check your network connection',
        'For Supabase: Verify you are not hitting rate limits',
        'Try increasing the connection timeout in DATABASE_URL',
        'Check if the database server is under heavy load'
      ]
    };
  }
  
  // Unknown error
  return {
    cause: 'unknown',
    suggestions: [
      'Check the full error message for more details',
      'Verify all environment variables are correctly set',
      'Review the database connection string format',
      'Check the application logs for more information',
      'Consult the troubleshooting guide: docs/TROUBLESHOOTING.md'
    ]
  };
}

/**
 * Validate database connection
 * Tests if the application can connect to the database
 */
export async function validateDatabaseConnection(): Promise<ValidationResult> {
  const mode = getDatabaseMode();
  const errors: string[] = [];
  const warnings: string[] = [];
  let diagnostics: DiagnosticInfo = {
    connectionStatus: 'failed',
    suggestions: []
  };
  
  try {
    // Get database configuration
    const config = getDatabaseConfig();
    
    // Attempt to connect to the database
    await prisma.$connect();
    
    // Test the connection with a simple query
    await prisma.$queryRaw`SELECT 1 as test`;
    
    // Connection successful
    diagnostics = {
      connectionStatus: 'connected',
      suggestions: []
    };
    
    // Get database version
    try {
      const versionResult = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
      if (versionResult && versionResult.length > 0) {
        diagnostics.databaseVersion = versionResult[0].version;
      }
    } catch (versionError) {
      warnings.push('Could not retrieve database version');
    }
    
    return {
      isValid: true,
      errors,
      warnings,
      mode,
      diagnostics
    };
    
  } catch (error) {
    // Parse the error to determine the cause
    const { cause, suggestions } = parsePrismaError(error as Error);
    
    diagnostics = {
      connectionStatus: 'failed',
      errorType: cause,
      errorMessage: (error as Error).message,
      suggestions
    };
    
    errors.push(`Database connection failed: ${(error as Error).message}`);
    
    // Throw a more specific error
    throw new DatabaseConnectionError(
      `Failed to connect to ${mode} database`,
      cause,
      suggestions
    );
  } finally {
    // Always disconnect to avoid connection leaks
    await prisma.$disconnect();
  }
}

/**
 * Check database schema version
 * Verifies if the database schema is up to date with migrations
 */
export async function checkSchemaVersion(): Promise<boolean> {
  try {
    await prisma.$connect();
    
    // Check if the _prisma_migrations table exists
    const migrationsTable = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '_prisma_migrations'
      ) as exists
    `;
    
    if (!migrationsTable || migrationsTable.length === 0 || !migrationsTable[0].exists) {
      // Migrations table doesn't exist, schema is not initialized
      return false;
    }
    
    // Check for pending migrations by looking at finished_at
    // Note: applied_steps_count can be 0 for empty migrations or already applied migrations
    const pendingMigrations = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM _prisma_migrations
      WHERE finished_at IS NULL
    `;
    
    if (pendingMigrations && pendingMigrations.length > 0) {
      const count = Number(pendingMigrations[0].count);
      return count === 0;
    }
    
    return true;
    
  } catch (error) {
    console.error('Error checking schema version:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Suggest migrations based on schema status
 * Returns a list of suggested actions to bring the schema up to date
 */
export async function suggestMigrations(): Promise<string[]> {
  const suggestions: string[] = [];
  
  try {
    const isUpToDate = await checkSchemaVersion();
    
    if (!isUpToDate) {
      suggestions.push('Run database migrations: npm run db:migrate');
      suggestions.push('Or use: npx prisma migrate deploy');
      suggestions.push('For development: npx prisma migrate dev');
    } else {
      suggestions.push('Database schema is up to date');
    }
    
  } catch (error) {
    suggestions.push('Could not check migration status');
    suggestions.push('Try running: npx prisma migrate status');
  }
  
  return suggestions;
}

/**
 * Comprehensive database validation
 * Performs all validation checks and returns detailed results
 */
export async function validateDatabase(): Promise<ValidationResult> {
  const mode = getDatabaseMode();
  const errors: string[] = [];
  const warnings: string[] = [];
  let diagnostics: DiagnosticInfo = {
    connectionStatus: 'failed',
    suggestions: []
  };
  
  try {
    // Step 1: Validate connection
    const connectionResult = await validateDatabaseConnection();
    diagnostics = connectionResult.diagnostics!;
    
    // Step 2: Check schema version
    const isSchemaUpToDate = await checkSchemaVersion();
    diagnostics.migrationStatus = isSchemaUpToDate ? 'up_to_date' : 'pending';
    
    if (!isSchemaUpToDate) {
      warnings.push('Database schema is not up to date');
      const migrationSuggestions = await suggestMigrations();
      diagnostics.suggestions.push(...migrationSuggestions);
    }
    
    // Step 3: Get schema version info
    try {
      await prisma.$connect();
      const latestMigration = await prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date }>>`
        SELECT migration_name, finished_at
        FROM _prisma_migrations
        WHERE finished_at IS NOT NULL
        ORDER BY finished_at DESC
        LIMIT 1
      `;
      
      if (latestMigration && latestMigration.length > 0) {
        diagnostics.schemaVersion = latestMigration[0].migration_name;
      }
    } catch (error) {
      warnings.push('Could not retrieve schema version information');
    } finally {
      await prisma.$disconnect();
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      mode,
      diagnostics
    };
    
  } catch (error) {
    if (error instanceof DatabaseConnectionError) {
      return {
        isValid: false,
        errors: [error.message],
        warnings,
        mode,
        diagnostics: {
          connectionStatus: 'failed',
          errorType: error.cause,
          errorMessage: error.message,
          suggestions: error.suggestions
        }
      };
    }
    
    return {
      isValid: false,
      errors: [(error as Error).message],
      warnings,
      mode,
      diagnostics
    };
  }
}

/**
 * Log validation results in a user-friendly format
 */
export function logValidationResults(result: ValidationResult): void {
  console.log('\n=== Database Validation Results ===');
  console.log(`Mode: ${result.mode}`);
  console.log(`Status: ${result.isValid ? '✓ Valid' : '✗ Invalid'}`);
  
  if (result.diagnostics) {
    console.log(`\nConnection: ${result.diagnostics.connectionStatus}`);
    
    if (result.diagnostics.databaseVersion) {
      console.log(`Database Version: ${result.diagnostics.databaseVersion}`);
    }
    
    if (result.diagnostics.schemaVersion) {
      console.log(`Schema Version: ${result.diagnostics.schemaVersion}`);
    }
    
    if (result.diagnostics.migrationStatus) {
      console.log(`Migration Status: ${result.diagnostics.migrationStatus}`);
    }
  }
  
  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  if (result.diagnostics?.suggestions && result.diagnostics.suggestions.length > 0) {
    console.log('\n💡 Suggestions:');
    result.diagnostics.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
  }
  
  console.log('\n===================================\n');
}
