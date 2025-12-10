# End-to-End Tests

This directory contains comprehensive end-to-end tests for the application features.

## Test Files

### `local-database-migration.e2e.test.ts` - Database Migration E2E Tests
Contains 33 end-to-end tests covering:

#### 1. Local Mode End-to-End Tests (7 tests)
- Local mode detection from environment
- Local mode environment variable validation
- Complete local database configuration
- Setup instructions for local mode
- Missing local environment variables handling
- Optional local configuration warnings
- Complete local mode startup workflow

#### 2. Supabase Mode End-to-End Tests (7 tests)
- Supabase mode detection from environment
- Supabase availability detection
- Supabase mode environment variable validation
- Complete Supabase database configuration
- Setup instructions for Supabase mode
- Missing Supabase environment variables handling
- Complete Supabase mode startup workflow

#### 3. Mode Switching Tests (5 tests)
- Local to Supabase mode switching
- Supabase to local mode switching
- Default to local mode behavior
- Mode switching with different connection strings
- Supabase availability detection across modes

#### 4. Database Validation Tests (4 tests)
- Host unreachable error parsing
- Authentication failed error parsing
- Database not found error parsing
- Timeout error parsing

#### 5. Complete Workflow Integration Tests (4 tests)
- Full local mode setup workflow
- Full Supabase mode setup workflow
- Mode switching with validation
- Error recovery workflow

#### 6. Edge Cases and Error Handling (6 tests)
- Empty DATABASE_MODE handling
- Case-insensitive DATABASE_MODE
- Partial Supabase configuration
- Missing DIRECT_URL handling
- Specific error messages for missing variables
- Invalid DATABASE_URL format handling

### Other E2E Test Files

- `collaboration-workflow.e2e.test.ts` - Collaboration features
- `export-workflow.e2e.test.ts` - Export functionality
- `folder-management.e2e.test.ts` - Folder management
- `image-workflow.e2e.test.ts` - Image handling
- `mobile-experience.e2e.test.ts` - Mobile features

## Running Tests

```bash
# Run all e2e tests
npm test -- src/lib/__tests__/e2e

# Run specific e2e test file
npm test -- src/lib/__tests__/e2e/local-database-migration.e2e.test.ts

# Run with coverage
npm test -- --coverage src/lib/__tests__/e2e
```

## Test Coverage

The local database migration e2e tests validate:

- **Requirements 1.1-1.5**: Local database setup
- **Requirements 2.1-2.5**: Setup documentation
- **Requirements 3.1-3.5**: Supabase mode support
- **Requirements 4.3**: Database abstraction
- **Requirements 6.1-6.4**: Documentation
- **Requirements 7.1-7.5**: Startup validation

## E2E Test Strategy

End-to-end tests focus on:
1. **Complete user workflows** - From configuration to execution
2. **Real-world scenarios** - Actual usage patterns
3. **Error scenarios** - How the system handles failures
4. **Mode transitions** - Switching between database modes
5. **Documentation** - Setup instructions and error messages

## Test Structure

Each test suite follows this pattern:
1. **Setup** - Configure environment variables
2. **Execute** - Run the workflow
3. **Verify** - Check expected outcomes
4. **Cleanup** - Restore original environment

## Notes

- Tests use `beforeEach` and `afterEach` hooks for environment cleanup
- All tests are isolated and can run independently
- Tests validate both success and failure scenarios
- Error messages are checked for actionable information
