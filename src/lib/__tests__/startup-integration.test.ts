/**
 * Integration Tests for Startup Validation
 * 
 * These tests verify the startup validation system works end-to-end
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { performStartupValidation, clearValidationCache } from '../startup-validator';

describe('Startup Validation - Integration Tests', () => {
  beforeAll(() => {
    // Clear cache before integration tests
    clearValidationCache();
  });

  test('should perform real startup validation', async () => {
    // This test runs against the actual database configuration
    const result = await performStartupValidation();

    // Basic assertions
    expect(result).toBeDefined();
    expect(result.mode).toMatch(/^(local|supabase)$/);
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);

    // Log result for debugging
    console.log('Startup Validation Result:', {
      isValid: result.isValid,
      canProceed: result.canProceed,
      mode: result.mode,
      errorCount: result.errors.length,
      warningCount: result.warnings.length
    });

    // If validation fails, log details
    if (!result.canProceed) {
      console.log('Validation Errors:', result.errors);
      console.log('Setup Instructions:', result.setupInstructions);
    }
  }, 30000); // 30 second timeout for real database connection

  test('should validate database connection details', async () => {
    const result = await performStartupValidation();

    if (result.databaseValidation?.diagnostics) {
      const diagnostics = result.databaseValidation.diagnostics;

      // Check diagnostics structure
      expect(diagnostics.connectionStatus).toMatch(/^(connected|failed)$/);

      if (diagnostics.connectionStatus === 'connected') {
        // If connected, should have database version
        expect(diagnostics.databaseVersion).toBeDefined();
        expect(typeof diagnostics.databaseVersion).toBe('string');
      } else {
        // If failed, should have error type and suggestions
        expect(diagnostics.errorType).toBeDefined();
        expect(Array.isArray(diagnostics.suggestions)).toBe(true);
        expect(diagnostics.suggestions.length).toBeGreaterThan(0);
      }
    }
  }, 30000);

  test('should provide setup instructions on failure', async () => {
    const result = await performStartupValidation();

    if (!result.canProceed) {
      // Should have setup instructions
      expect(result.setupInstructions).toBeDefined();
      expect(typeof result.setupInstructions).toBe('string');
      expect(result.setupInstructions!.length).toBeGreaterThan(0);

      // Should mention the current mode
      expect(result.setupInstructions!.toLowerCase()).toContain(result.mode);
    }
  }, 30000);
});
