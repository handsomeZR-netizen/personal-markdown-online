# Integration Tests

This directory contains comprehensive integration tests for the local database migration feature.

## Test Files

### `database-performance.integration.test.ts` - Performance Benchmarks
Contains 14 performance tests covering:
- **Configuration Performance** (4 tests)
  - Database mode retrieval speed
  - Environment variable validation speed
  - Configuration retrieval performance
  - Multiple configuration retrievals efficiency
  
- **Mode Switching Performance** (2 tests)
  - Mode switching speed
  - Rapid mode switching efficiency
  
- **Validation Performance** (3 tests)
  - Local mode validation speed
  - Supabase mode validation speed
  - Validation error handling efficiency
  
- **Startup Performance Simulation** (2 tests)
  - Complete startup validation workflow
  - Concurrent configuration requests
  
- **Memory and Resource Usage** (2 tests)
  - Memory footprint for configuration operations
  - Memory leak detection during mode switching
  
- **Performance Regression Detection** (1 test)
  - Performance metrics tracking

### `mode-switching.integration.test.ts` - Mode Switching Tests
Contains 13 integration tests covering:
- **Basic Mode Switching** (3 tests)
  - Local to Supabase mode switching
  - Supabase to local mode switching
  - Multiple mode switches
  
- **Configuration Consistency** (3 tests)
  - Configuration integrity during switching
  - Validation after mode switch
  - Mode-specific setup instructions
  
- **Hybrid Mode Support** (2 tests)
  - Local database with Supabase features
  - Supabase mode without optional features
  
- **Error Handling** (3 tests)
  - Missing variables when switching to local mode
  - Missing variables when switching to Supabase mode
  - Helpful error messages during failed switches
  
- **Complete Workflows** (2 tests)
  - Development to production workflow
  - Testing environment mode switching

### `complete-workflow.integration.test.ts` - Offline Features
Contains integration tests for offline features (existing file).

## Running Tests

```bash
# Run all integration tests
npm test -- src/lib/__tests__/integration

# Run specific integration test file
npm test -- src/lib/__tests__/integration/database-performance.integration.test.ts
npm test -- src/lib/__tests__/integration/mode-switching.integration.test.ts

# Run with coverage
npm test -- --coverage src/lib/__tests__/integration
```

## Performance Targets

The performance tests validate the following targets:

- **Mode Detection**: < 10ms
- **Environment Validation**: < 25ms
- **Configuration Retrieval**: < 30ms
- **Full Startup Workflow**: < 50ms
- **Memory Growth**: < 10MB for 1000 operations
- **Mode Switching**: < 15ms average

## Test Coverage

All tests validate the implementation against:
- **Requirements 1.1-1.5**: Local database setup and configuration
- **Requirements 3.1-3.5**: Supabase mode support
- **Requirements 4.3**: Database abstraction
- **Requirements 5.1-5.4**: Performance optimization
- **Requirements 7.1-7.5**: Startup validation and error handling

## Integration Test Strategy

Integration tests focus on:
1. **End-to-end workflows** - Complete user scenarios from start to finish
2. **Mode switching** - Seamless transitions between database modes
3. **Performance** - Meeting performance targets under various conditions
4. **Error handling** - Graceful degradation and helpful error messages
5. **Resource usage** - Memory efficiency and no leaks

## Notes

- All tests use environment variable manipulation to simulate different configurations
- Tests clean up environment variables in `beforeEach` and `afterEach` hooks
- Performance tests measure actual execution time using `performance.now()`
- Memory tests use `process.memoryUsage()` to track heap growth
