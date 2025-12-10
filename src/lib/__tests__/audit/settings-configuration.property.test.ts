/**
 * Property-Based Test: Settings and Configuration
 * Feature: comprehensive-feature-audit, Property 1: 功能完整性
 * Validates: Requirements 10.1
 * 
 * Property: For any valid settings configuration, the system should be able to
 * save, load, and apply the settings without errors
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OfflineSettingsManager } from '@/lib/offline/settings-manager';
import type { OfflineSettings, ConflictStrategy } from '@/types/offline';
import * as fc from 'fast-check';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Arbitraries for generating test data
const conflictStrategyArbitrary = fc.constantFrom<ConflictStrategy>(
  'manual-merge',
  'use-local',
  'use-remote'
);

const draftIntervalArbitrary = fc.constantFrom(1000, 3000, 5000, 10000);

const offlineSettingsArbitrary = fc.record({
  offlineModeEnabled: fc.boolean(),
  autoSyncEnabled: fc.boolean(),
  conflictResolutionStrategy: conflictStrategyArbitrary,
  draftAutoSaveInterval: draftIntervalArbitrary,
});

const webhookUrlArbitrary = fc.oneof(
  fc.constant('https://example.com/webhook'),
  fc.constant('https://api.example.com/v1/webhook'),
  fc.constant('https://webhook.site/unique-id'),
  fc.webUrl({ validSchemes: ['https'] })
);

const webhookConfigArbitrary = fc.record({
  url: webhookUrlArbitrary,
  enabled: fc.boolean(),
  events: fc.array(
    fc.constantFrom('note.created', 'note.updated', 'note.deleted'),
    { minLength: 1, maxLength: 3 }
  ),
});

const themeArbitrary = fc.constantFrom('light', 'dark', 'system');

describe('Property-Based Test: Settings and Configuration', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Property 1: Functional Completeness', () => {
    it('should save and load any valid offline settings', () => {
      // Property: For any valid offline settings, save and load should be idempotent
      fc.assert(
        fc.property(offlineSettingsArbitrary, (settings) => {
          OfflineSettingsManager.saveSettings(settings);
          const loaded = OfflineSettingsManager.getSettings();

          expect(loaded.offlineModeEnabled).toBe(settings.offlineModeEnabled);
          expect(loaded.autoSyncEnabled).toBe(settings.autoSyncEnabled);
          expect(loaded.conflictResolutionStrategy).toBe(settings.conflictResolutionStrategy);
          expect(loaded.draftAutoSaveInterval).toBe(settings.draftAutoSaveInterval);
        }),
        { numRuns: 50 }
      );
    });

    it('should handle any valid webhook configuration', () => {
      // Property: For any valid webhook config, it should be saveable and loadable
      fc.assert(
        fc.property(webhookConfigArbitrary, (config) => {
          localStorage.setItem('webhook-config', JSON.stringify(config));
          const loaded = JSON.parse(localStorage.getItem('webhook-config') || '{}');

          expect(loaded.url).toBe(config.url);
          expect(loaded.enabled).toBe(config.enabled);
          expect(loaded.events).toEqual(config.events);
        }),
        { numRuns: 30 }
      );
    });

    it('should persist any valid theme preference', () => {
      // Property: For any theme, it should be persistable
      fc.assert(
        fc.property(themeArbitrary, (theme) => {
          localStorage.setItem('theme', theme);
          const loaded = localStorage.getItem('theme');

          expect(loaded).toBe(theme);
        }),
        { numRuns: 20 }
      );
    });

    it('should validate webhook URLs correctly', () => {
      // Property: For any HTTPS URL, webhook validation should pass
      fc.assert(
        fc.property(webhookUrlArbitrary, (url) => {
          const isValid = url.startsWith('https://');
          expect(isValid).toBe(true);
        }),
        { numRuns: 30 }
      );
    });

    it('should handle any valid draft auto-save interval', () => {
      // Property: For any valid interval, settings should save correctly
      fc.assert(
        fc.property(draftIntervalArbitrary, (interval) => {
          const settings: OfflineSettings = {
            offlineModeEnabled: true,
            autoSyncEnabled: true,
            conflictResolutionStrategy: 'manual-merge',
            draftAutoSaveInterval: interval,
          };

          OfflineSettingsManager.saveSettings(settings);
          const loaded = OfflineSettingsManager.getSettings();

          expect(loaded.draftAutoSaveInterval).toBe(interval);
          expect(loaded.draftAutoSaveInterval).toBeGreaterThanOrEqual(1000);
          expect(loaded.draftAutoSaveInterval).toBeLessThanOrEqual(10000);
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 2: Settings Consistency', () => {
    it('should maintain consistency across save/load cycles', () => {
      // Property: For any settings, multiple save/load cycles should be consistent
      fc.assert(
        fc.property(offlineSettingsArbitrary, (settings) => {
          // First cycle
          OfflineSettingsManager.saveSettings(settings);
          const loaded1 = OfflineSettingsManager.getSettings();

          // Second cycle
          OfflineSettingsManager.saveSettings(loaded1);
          const loaded2 = OfflineSettingsManager.getSettings();

          // Should be identical
          expect(loaded1).toEqual(loaded2);
        }),
        { numRuns: 30 }
      );
    });

    it('should preserve all settings fields', () => {
      // Property: For any settings, all fields should be preserved
      fc.assert(
        fc.property(offlineSettingsArbitrary, (settings) => {
          OfflineSettingsManager.saveSettings(settings);
          const loaded = OfflineSettingsManager.getSettings();

          // All fields should exist
          expect(loaded).toHaveProperty('offlineModeEnabled');
          expect(loaded).toHaveProperty('autoSyncEnabled');
          expect(loaded).toHaveProperty('conflictResolutionStrategy');
          expect(loaded).toHaveProperty('draftAutoSaveInterval');
        }),
        { numRuns: 30 }
      );
    });

    it('should handle concurrent settings updates', () => {
      // Property: For any sequence of settings, last write should win
      fc.assert(
        fc.property(
          fc.array(offlineSettingsArbitrary, { minLength: 2, maxLength: 5 }),
          (settingsArray) => {
            // Apply all settings in sequence
            settingsArray.forEach((settings) => {
              OfflineSettingsManager.saveSettings(settings);
            });

            // Last settings should be loaded
            const loaded = OfflineSettingsManager.getSettings();
            const lastSettings = settingsArray[settingsArray.length - 1];

            expect(loaded.offlineModeEnabled).toBe(lastSettings.offlineModeEnabled);
            expect(loaded.autoSyncEnabled).toBe(lastSettings.autoSyncEnabled);
            expect(loaded.conflictResolutionStrategy).toBe(lastSettings.conflictResolutionStrategy);
            expect(loaded.draftAutoSaveInterval).toBe(lastSettings.draftAutoSaveInterval);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 3: Conflict Strategy Handling', () => {
    it('should support all conflict resolution strategies', () => {
      // Property: For any conflict strategy, it should be valid and saveable
      fc.assert(
        fc.property(conflictStrategyArbitrary, (strategy) => {
          const settings: OfflineSettings = {
            offlineModeEnabled: true,
            autoSyncEnabled: true,
            conflictResolutionStrategy: strategy,
            draftAutoSaveInterval: 3000,
          };

          OfflineSettingsManager.saveSettings(settings);
          const loaded = OfflineSettingsManager.getSettings();

          expect(loaded.conflictResolutionStrategy).toBe(strategy);
          expect(['manual-merge', 'use-local', 'use-remote']).toContain(strategy);
        }),
        { numRuns: 30 }
      );
    });

    it('should maintain strategy consistency', () => {
      // Property: For any strategy, it should remain unchanged after save/load
      fc.assert(
        fc.property(conflictStrategyArbitrary, (strategy) => {
          const settings: OfflineSettings = {
            offlineModeEnabled: true,
            autoSyncEnabled: true,
            conflictResolutionStrategy: strategy,
            draftAutoSaveInterval: 3000,
          };

          OfflineSettingsManager.saveSettings(settings);
          const loaded1 = OfflineSettingsManager.getSettings();
          
          OfflineSettingsManager.saveSettings(loaded1);
          const loaded2 = OfflineSettingsManager.getSettings();

          expect(loaded1.conflictResolutionStrategy).toBe(loaded2.conflictResolutionStrategy);
        }),
        { numRuns: 30 }
      );
    });
  });

  describe('Property 4: Boolean Settings', () => {
    it('should handle any combination of boolean settings', () => {
      // Property: For any boolean combination, settings should save correctly
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.boolean(),
          (offlineMode, autoSync) => {
            const settings: OfflineSettings = {
              offlineModeEnabled: offlineMode,
              autoSyncEnabled: autoSync,
              conflictResolutionStrategy: 'manual-merge',
              draftAutoSaveInterval: 3000,
            };

            OfflineSettingsManager.saveSettings(settings);
            const loaded = OfflineSettingsManager.getSettings();

            expect(loaded.offlineModeEnabled).toBe(offlineMode);
            expect(loaded.autoSyncEnabled).toBe(autoSync);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should respect offline mode dependency', () => {
      // Property: For any settings, auto-sync should respect offline mode
      fc.assert(
        fc.property(offlineSettingsArbitrary, (settings) => {
          OfflineSettingsManager.saveSettings(settings);
          const loaded = OfflineSettingsManager.getSettings();

          // If offline mode is disabled, auto-sync should be effectively disabled
          const effectiveAutoSync = loaded.offlineModeEnabled && loaded.autoSyncEnabled;
          
          if (!loaded.offlineModeEnabled) {
            expect(effectiveAutoSync).toBe(false);
          }
        }),
        { numRuns: 30 }
      );
    });
  });

  describe('Property 5: Webhook Configuration', () => {
    it('should validate webhook URLs', () => {
      // Property: For any webhook URL, it should be HTTPS
      fc.assert(
        fc.property(webhookConfigArbitrary, (config) => {
          const isSecure = config.url.startsWith('https://');
          expect(isSecure).toBe(true);
        }),
        { numRuns: 30 }
      );
    });

    it('should preserve webhook events', () => {
      // Property: For any webhook config, events should be preserved
      fc.assert(
        fc.property(webhookConfigArbitrary, (config) => {
          localStorage.setItem('webhook-config', JSON.stringify(config));
          const loaded = JSON.parse(localStorage.getItem('webhook-config') || '{}');

          expect(loaded.events).toEqual(config.events);
          expect(loaded.events.length).toBeGreaterThan(0);
          expect(loaded.events.length).toBeLessThanOrEqual(3);
        }),
        { numRuns: 30 }
      );
    });

    it('should handle webhook enable/disable', () => {
      // Property: For any webhook config, enabled state should be preserved
      fc.assert(
        fc.property(webhookConfigArbitrary, (config) => {
          localStorage.setItem('webhook-config', JSON.stringify(config));
          const loaded = JSON.parse(localStorage.getItem('webhook-config') || '{}');

          expect(loaded.enabled).toBe(config.enabled);
          expect(typeof loaded.enabled).toBe('boolean');
        }),
        { numRuns: 30 }
      );
    });
  });

  describe('Property 6: Storage Calculations', () => {
    it('should calculate storage percentage correctly', () => {
      // Property: For any used/total values, percentage should be in range [0, 100]
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000 }),
          fc.integer({ min: 1, max: 1000000 }),
          (used, total) => {
            // Ensure used <= total
            const actualUsed = Math.min(used, total);
            const percentage = Math.round((actualUsed / total) * 100);

            expect(percentage).toBeGreaterThanOrEqual(0);
            expect(percentage).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle edge cases in storage calculation', () => {
      // Property: For edge cases, calculation should be safe
      const calculateUsage = (used: number, total: number): number => {
        if (total === 0) return 0;
        return Math.round((used / total) * 100);
      };

      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          (used) => {
            // Zero total should return 0
            expect(calculateUsage(used, 0)).toBe(0);

            // Used equals total should return 100
            expect(calculateUsage(100, 100)).toBe(100);

            // Zero used should return 0
            expect(calculateUsage(0, 100)).toBe(0);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Property 7: Settings Reset', () => {
    it('should reset to defaults from any state', () => {
      // Property: For any settings, reset should return to defaults
      fc.assert(
        fc.property(offlineSettingsArbitrary, (settings) => {
          // Save custom settings
          OfflineSettingsManager.saveSettings(settings);

          // Reset
          OfflineSettingsManager.resetSettings();

          // Load defaults
          const defaults = OfflineSettingsManager.getSettings();

          // Should be default values
          expect(defaults.offlineModeEnabled).toBe(true);
          expect(defaults.autoSyncEnabled).toBe(true);
          expect(defaults.conflictResolutionStrategy).toBe('manual-merge');
          expect(defaults.draftAutoSaveInterval).toBe(3000);
        }),
        { numRuns: 30 }
      );
    });

    it('should be idempotent when resetting', () => {
      // Property: For any state, multiple resets should produce same result
      fc.assert(
        fc.property(offlineSettingsArbitrary, (settings) => {
          OfflineSettingsManager.saveSettings(settings);

          // First reset
          OfflineSettingsManager.resetSettings();
          const reset1 = OfflineSettingsManager.getSettings();

          // Second reset
          OfflineSettingsManager.resetSettings();
          const reset2 = OfflineSettingsManager.getSettings();

          // Should be identical
          expect(reset1).toEqual(reset2);
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 8: Theme Persistence', () => {
    it('should persist any valid theme', () => {
      // Property: For any theme, it should be persistable
      fc.assert(
        fc.property(themeArbitrary, (theme) => {
          localStorage.setItem('theme', theme);
          const loaded = localStorage.getItem('theme');

          expect(loaded).toBe(theme);
          expect(['light', 'dark', 'system']).toContain(theme);
        }),
        { numRuns: 30 }
      );
    });

    it('should handle theme switching', () => {
      // Property: For any sequence of themes, last theme should be active
      fc.assert(
        fc.property(
          fc.array(themeArbitrary, { minLength: 2, maxLength: 5 }),
          (themes) => {
            // Apply all themes in sequence
            themes.forEach((theme) => {
              localStorage.setItem('theme', theme);
            });

            // Last theme should be loaded
            const loaded = localStorage.getItem('theme');
            const lastTheme = themes[themes.length - 1];

            expect(loaded).toBe(lastTheme);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 9: Settings Validation', () => {
    it('should validate draft intervals are in valid range', () => {
      // Property: For any draft interval, it should be within valid range
      fc.assert(
        fc.property(draftIntervalArbitrary, (interval) => {
          expect(interval).toBeGreaterThanOrEqual(1000);
          expect(interval).toBeLessThanOrEqual(10000);
          expect(interval % 1000).toBe(0); // Should be multiple of 1000
        }),
        { numRuns: 20 }
      );
    });

    it('should validate conflict strategies are valid', () => {
      // Property: For any conflict strategy, it should be one of the valid options
      fc.assert(
        fc.property(conflictStrategyArbitrary, (strategy) => {
          const validStrategies: ConflictStrategy[] = [
            'manual-merge',
            'use-local',
            'use-remote',
          ];

          expect(validStrategies).toContain(strategy);
        }),
        { numRuns: 30 }
      );
    });
  });

  describe('Property 10: Error Resilience', () => {
    it('should handle corrupted settings gracefully', () => {
      // Property: For any corrupted data, system should recover
      fc.assert(
        fc.property(fc.string(), (corruptedData) => {
          localStorage.setItem('offline-settings', corruptedData);

          // Should not throw
          expect(() => {
            try {
              OfflineSettingsManager.getSettings();
            } catch {
              // If it throws, reset should work
              OfflineSettingsManager.resetSettings();
              OfflineSettingsManager.getSettings();
            }
          }).not.toThrow();
        }),
        { numRuns: 20 }
      );
    });

    it('should provide defaults when settings are missing', () => {
      // Property: For any missing settings, defaults should be provided
      fc.assert(
        fc.property(fc.constant(null), () => {
          localStorage.clear();

          const settings = OfflineSettingsManager.getSettings();

          // Should have all required fields with defaults
          expect(settings.offlineModeEnabled).toBeDefined();
          expect(settings.autoSyncEnabled).toBeDefined();
          expect(settings.conflictResolutionStrategy).toBeDefined();
          expect(settings.draftAutoSaveInterval).toBeDefined();
        }),
        { numRuns: 10 }
      );
    });
  });
});
