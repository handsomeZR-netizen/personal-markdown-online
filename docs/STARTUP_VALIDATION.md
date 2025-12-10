# Startup Validation

This document describes the startup validation system that ensures the application is properly configured before accepting requests.

## Overview

The startup validation system performs comprehensive checks when the application starts, including:

1. **Configuration Validation**: Verifies all required environment variables are set
2. **Database Connection**: Tests connectivity to the database
3. **Schema Validation**: Checks if database migrations are up to date
4. **Detailed Logging**: Provides clear diagnostic information

## How It Works

### Automatic Validation

The application automatically performs startup validation in two ways:

1. **Instrumentation Hook** (`src/instrumentation.ts`):
   - Runs when the Next.js server starts
   - Performs full validation before accepting requests
   - Logs detailed results to the console

2. **Middleware Check** (`src/middleware.ts`):
   - Performs lightweight health checks on each request
   - Redirects to error page if database is unavailable
   - Caches validation results to avoid repeated checks

### Manual Validation

You can manually run startup validation using:

```bash
npm run startup:validate
```

This is useful for:
- Diagnosing configuration issues
- Verifying setup before deployment
- Troubleshooting database problems

## Validation Steps

### Step 1: Configuration Validation

Checks that all required environment variables are set based on the database mode:

**Local Mode** requires:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `AUTH_SECRET`

**Supabase Mode** requires:
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2: Database Connection

Tests the database connection by:
- Connecting to the database
- Running a simple query
- Retrieving database version information

### Step 3: Schema Validation

Checks if the database schema is up to date:
- Verifies migrations table exists
- Checks for pending migrations
- Retrieves latest migration version

## Error Handling

### Configuration Errors

If environment variables are missing, the system:
1. Logs specific missing variables
2. Provides setup instructions
3. Shows example configuration
4. Links to documentation

### Connection Errors

The system identifies specific connection issues:

- **Host Unreachable**: Database server is not running or not accessible
- **Authentication Failed**: Invalid credentials
- **Database Not Found**: Database doesn't exist
- **Timeout**: Connection is too slow

For each error type, the system provides:
- Clear error message
- Specific cause identification
- Actionable suggestions
- Links to troubleshooting guides

### Schema Errors

If migrations are pending:
1. Warns about outdated schema
2. Suggests running migrations
3. Provides migration commands
4. Continues with warning (doesn't block startup)

## Error Page

When validation fails, users are redirected to `/database-error` which displays:

- Current database mode
- Specific error messages
- Actionable suggestions
- Setup instructions
- Links to documentation
- Retry button

## Logging

The startup validation system provides detailed, structured logging:

```
╔════════════════════════════════════════════════════════════╗
║          Note App - Starting Application                  ║
╚════════════════════════════════════════════════════════════╝

📋 Environment Information:
   Node Environment: development
   Database Mode: local
   Next.js Version: 0.1.0

🔍 Step 1: Validating Configuration...
   ✓ Configuration is valid
   ✓ Database Mode: local
   ✓ Supabase Available: No

🔍 Step 2: Validating Database Connection...
   ✓ Database connection successful

=== Database Validation Results ===
Mode: local
Status: ✓ Valid

Connection: connected
Database Version: PostgreSQL 16.0
Schema Version: 20251208_add_collaboration_features
Migration Status: up_to_date

===================================

📊 Startup Validation Summary:
   Status: ✓ READY
   Errors: 0
   Warnings: 0

✅ Application startup validation completed successfully!
```

## Caching

To avoid performance overhead, validation results are cached:

- First request performs full validation
- Subsequent requests use cached results
- Cache is cleared on server restart
- Manual validation always runs fresh checks

## Development vs Production

### Development Mode

- Logs detailed information to console
- Allows app to start even with errors (shows error page)
- Provides helpful setup instructions
- Links to local documentation

### Production Mode

- Logs warnings for configuration errors
- Continues running but may have limited functionality
- Recommends immediate fixes
- Can be configured to exit on critical errors

## Troubleshooting

### Validation Always Fails

1. Check environment variables:
   ```bash
   npm run check:env
   ```

2. Verify database is running:
   ```bash
   # For local mode
   docker-compose ps
   
   # Test connection
   npm run db:test
   ```

3. Check database migrations:
   ```bash
   npm run db:validate
   ```

### Middleware Redirects to Error Page

The middleware performs lightweight health checks. If it redirects:

1. Check the server console for detailed logs
2. Run manual validation: `npm run startup:validate`
3. Verify database is accessible
4. Check for network issues

### Slow Startup

If validation is slow:

1. Check database connection latency
2. For Supabase: verify network connectivity
3. For local: ensure Docker is running properly
4. Consider increasing timeout values

## Configuration

### Disable Validation (Not Recommended)

To disable startup validation, remove or comment out the instrumentation hook in `next.config.ts`:

```typescript
experimental: {
  // instrumentationHook: true,  // Commented out
}
```

### Customize Validation

You can customize validation behavior in `src/lib/startup-validator.ts`:

- Adjust timeout values
- Add custom checks
- Modify logging format
- Change error handling behavior

## Related Documentation

- [Local Database Setup](./LOCAL_DATABASE_SETUP.md)
- [Database Modes](./DATABASE_MODES.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Database Validation](./DATABASE_VALIDATION.md)

## API Reference

### `performStartupValidation()`

Performs comprehensive startup validation.

**Returns**: `Promise<StartupValidationResult>`

```typescript
interface StartupValidationResult {
  isValid: boolean;
  canProceed: boolean;
  errors: string[];
  warnings: string[];
  mode: 'local' | 'supabase';
  setupInstructions?: string;
  databaseValidation?: ValidationResult;
}
```

### `quickDatabaseHealthCheck()`

Performs lightweight health check (used in middleware).

**Returns**: `Promise<boolean>`

### `getCachedStartupValidation()`

Returns cached validation result or performs new validation.

**Returns**: `Promise<StartupValidationResult>`

### `clearValidationCache()`

Clears cached validation result.

**Returns**: `void`

## Best Practices

1. **Always run validation before deployment**
   ```bash
   npm run startup:validate
   ```

2. **Monitor startup logs** in production for warnings

3. **Keep environment variables secure** - never commit `.env` files

4. **Test both database modes** if you support both local and Supabase

5. **Update documentation** when adding new validation checks

6. **Handle errors gracefully** - provide clear user feedback

## Future Enhancements

Potential improvements to the validation system:

- [ ] Health check endpoint for monitoring
- [ ] Metrics collection for validation performance
- [ ] Email alerts for production failures
- [ ] Automatic retry with exponential backoff
- [ ] Integration with error tracking services
- [ ] Validation result persistence
- [ ] Custom validation plugins
