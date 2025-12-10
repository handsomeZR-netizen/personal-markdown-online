# Database Validation Module

## Overview

The database validation module provides comprehensive validation of database connections, schema versions, and configuration. It helps identify and diagnose database-related issues during application startup and development.

## Features

- **Connection Validation**: Tests database connectivity and provides detailed error diagnostics
- **Schema Version Checking**: Verifies that database migrations are up to date
- **Error Classification**: Categorizes errors into specific types with actionable suggestions
- **Diagnostic Information**: Provides detailed information about database status and configuration

## Usage

### Command Line

Run the validation script from the command line:

```bash
npm run db:validate
```

This will:
1. Check database connection
2. Verify schema version
3. Provide detailed diagnostics
4. Exit with appropriate status code

### Programmatic Usage

Import and use the validation functions in your code:

```typescript
import { 
  validateDatabase, 
  validateDatabaseConnection,
  checkSchemaVersion,
  logValidationResults 
} from '@/lib/db-validator';

// Comprehensive validation
const result = await validateDatabase();
logValidationResults(result);

// Just check connection
try {
  await validateDatabaseConnection();
  console.log('Database connected successfully');
} catch (error) {
  if (error instanceof DatabaseConnectionError) {
    console.error('Connection failed:', error.cause);
    console.log('Suggestions:', error.suggestions);
  }
}

// Check schema version
const isUpToDate = await checkSchemaVersion();
if (!isUpToDate) {
  const suggestions = await suggestMigrations();
  console.log('Migration suggestions:', suggestions);
}
```

## Error Types

The validator categorizes database errors into specific types:

### 1. Host Unreachable (`host_unreachable`)

**Symptoms:**
- `ECONNREFUSED` errors
- "Connection refused" messages
- Network timeout errors

**Common Causes:**
- Database server is not running
- Incorrect host or port in connection string
- Firewall blocking connection
- Network connectivity issues

**Suggestions:**
- For local mode: Run `docker-compose up -d`
- Check DATABASE_URL host and port
- Verify firewall settings
- Test network connectivity

### 2. Authentication Failed (`auth_failed`)

**Symptoms:**
- "Password authentication failed"
- "Invalid credentials"
- "Access denied"

**Common Causes:**
- Incorrect username or password
- User doesn't have database access
- Password has been changed

**Suggestions:**
- Verify DATABASE_URL credentials
- For local: Default is `postgres/postgres`
- For Supabase: Check connection string in dashboard
- Reset database password if needed

### 3. Database Not Found (`db_not_found`)

**Symptoms:**
- "Database does not exist"
- "Unknown database"

**Common Causes:**
- Database hasn't been created
- Wrong database name in connection string
- Database was deleted

**Suggestions:**
- Create the database
- Run migrations: `npm run db:migrate`
- Verify database name in DATABASE_URL
- For local: Database should be auto-created by Docker

### 4. Timeout (`timeout`)

**Symptoms:**
- "Connection timeout"
- "Timed out"
- Slow response times

**Common Causes:**
- Database server is overloaded
- Network latency
- Rate limiting (Supabase)
- Connection pool exhausted

**Suggestions:**
- Check network connection
- Verify database server load
- Increase timeout in connection string
- Check for rate limits

### 5. Unknown (`unknown`)

**Symptoms:**
- Errors that don't match known patterns

**Suggestions:**
- Check full error message
- Review application logs
- Verify environment variables
- Consult troubleshooting guide

## Validation Result Structure

```typescript
interface ValidationResult {
  isValid: boolean;           // Overall validation status
  errors: string[];           // List of errors found
  warnings: string[];         // List of warnings
  mode: 'local' | 'supabase'; // Database mode
  diagnostics?: {
    connectionStatus: 'connected' | 'failed';
    errorType?: 'host_unreachable' | 'auth_failed' | 'db_not_found' | 'timeout' | 'unknown';
    errorMessage?: string;
    suggestions: string[];    // Actionable suggestions
    databaseVersion?: string; // PostgreSQL version
    schemaVersion?: string;   // Latest migration name
    migrationStatus?: 'up_to_date' | 'pending' | 'unknown';
  };
}
```

## Integration with Application Startup

You can integrate validation into your application startup:

```typescript
// In your main application file or middleware
import { validateDatabase, logValidationResults } from '@/lib/db-validator';

async function initializeApp() {
  console.log('Validating database...');
  
  try {
    const result = await validateDatabase();
    
    if (!result.isValid) {
      logValidationResults(result);
      throw new Error('Database validation failed');
    }
    
    if (result.warnings.length > 0) {
      console.warn('Database warnings:', result.warnings);
    }
    
    console.log('Database validation passed');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
}
```

## Testing

The module includes comprehensive tests:

### Unit Tests
- Connection validation
- Schema version checking
- Error parsing
- Diagnostic generation

### Property-Based Tests
- Error classification across all error types
- Suggestion generation for different scenarios
- Validation result consistency
- Comprehensive validation behavior

Run tests:
```bash
npm test -- src/lib/__tests__/db-validator
```

## Best Practices

1. **Run validation on startup**: Catch configuration issues early
2. **Log validation results**: Keep detailed logs for debugging
3. **Handle errors gracefully**: Provide clear error messages to users
4. **Check schema version**: Ensure migrations are up to date
5. **Monitor validation failures**: Track patterns in production

## Troubleshooting

### Validation Script Fails

1. Check environment variables:
   ```bash
   npm run check:env
   ```

2. Verify database is running:
   ```bash
   # For local mode
   docker-compose ps
   
   # For Supabase
   # Check Supabase dashboard
   ```

3. Test connection manually:
   ```bash
   npm run db:test
   ```

4. Check migration status:
   ```bash
   npx prisma migrate status
   ```

### Common Issues

**Issue**: "Missing required environment variables"
- **Solution**: Copy `.env.local.example` to `.env.local` and fill in values

**Issue**: "Database schema is not up to date"
- **Solution**: Run `npm run db:migrate`

**Issue**: "Connection timeout"
- **Solution**: Check network connection and database server status

## Related Documentation

- [Local Database Setup](./LOCAL_DATABASE_SETUP.md)
- [Database Modes](./DATABASE_MODES.md)
- [Prisma Configuration](./PRISMA_CONFIGURATION.md)
- [Troubleshooting Guide](../doc/TROUBLESHOOTING.md)

## API Reference

### `validateDatabaseConnection()`

Validates database connection and returns detailed diagnostics.

**Returns**: `Promise<ValidationResult>`

**Throws**: `DatabaseConnectionError` on connection failure

### `checkSchemaVersion()`

Checks if database schema is up to date with migrations.

**Returns**: `Promise<boolean>` - `true` if up to date, `false` otherwise

### `suggestMigrations()`

Provides suggestions for bringing schema up to date.

**Returns**: `Promise<string[]>` - Array of suggestions

### `validateDatabase()`

Performs comprehensive validation including connection and schema checks.

**Returns**: `Promise<ValidationResult>`

### `logValidationResults(result: ValidationResult)`

Logs validation results in a user-friendly format.

**Parameters**:
- `result`: ValidationResult object to log

**Returns**: `void`

### `DatabaseConnectionError`

Custom error class for database connection issues.

**Properties**:
- `message`: Error message
- `cause`: Error type ('host_unreachable' | 'auth_failed' | 'db_not_found' | 'timeout' | 'unknown')
- `suggestions`: Array of actionable suggestions

## Examples

### Example 1: Startup Validation

```typescript
import { validateDatabase } from '@/lib/db-validator';

async function startServer() {
  const validation = await validateDatabase();
  
  if (!validation.isValid) {
    console.error('Cannot start server: database validation failed');
    process.exit(1);
  }
  
  // Start server...
}
```

### Example 2: Health Check Endpoint

```typescript
import { validateDatabaseConnection } from '@/lib/db-validator';

export async function GET() {
  try {
    await validateDatabaseConnection();
    return Response.json({ status: 'healthy' });
  } catch (error) {
    return Response.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    );
  }
}
```

### Example 3: Migration Check

```typescript
import { checkSchemaVersion, suggestMigrations } from '@/lib/db-validator';

async function checkMigrations() {
  const isUpToDate = await checkSchemaVersion();
  
  if (!isUpToDate) {
    const suggestions = await suggestMigrations();
    console.warn('Database schema is outdated:');
    suggestions.forEach(s => console.log(`  - ${s}`));
  }
}
```
