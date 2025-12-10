# Database Configuration Module Tests

This directory contains comprehensive tests for the database configuration module (`db-config.ts`).

## Test Files

### `db-config.test.ts` - Unit Tests
Contains 16 unit tests covering:
- Database mode detection (local/supabase)
- Supabase availability checking
- Environment variable validation
- Configuration retrieval
- Setup instructions generation

### `db-config.property.test.ts` - Property-Based Tests
Contains 7 property-based tests (100 iterations each) covering:
- **Property 6: Environment Variable Error Handling** (Validates Requirements 7.2)
  - Missing environment variables are reported with specific names
  - Error messages contain actionable information
  - Setup instructions are provided for each mode
  - Valid configurations don't throw errors
  - Database mode detection is consistent
  - Supabase availability detection is accurate

## Running Tests

```bash
# Run all database config tests
npm test -- src/lib/__tests__/db-config

# Run only unit tests
npm test -- src/lib/__tests__/db-config.test.ts

# Run only property-based tests
npm test -- src/lib/__tests__/db-config.property.test.ts
```

## Test Coverage

All tests validate the implementation against:
- **Requirements 1.4**: Environment variable configuration for local mode
- **Requirements 3.1**: Database mode detection
- **Requirements 3.4**: Mode switching via environment variables
- **Requirements 7.2**: Missing environment variable error handling

## Property-Based Testing

The property-based tests use `fast-check` to generate random test cases and verify that the system behaves correctly across a wide range of inputs. Each property test runs 100 iterations to ensure robustness.
