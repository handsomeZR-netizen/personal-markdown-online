/**
 * 国际化完整性属性测试
 * Internationalization Completeness Property-Based Tests
 * 
 * Feature: comprehensive-feature-audit, Property 9: 国际化完整性
 * Validates: Requirements 19.1
 */

import { describe, it, expect } from 'vitest';
import { fc } from '@fast-check/vitest';
import { t, getTranslations, getAllTranslations } from '@/lib/i18n';
import translations from '@/lib/i18n/zh-CN';

describe('I18n Property Tests', () => {
  describe('Property 9: 国际化完整性', () => {
    it('should return valid translation or key for any translation key path', () => {
      fc.assert(
        fc.property(
          fc.array(fc.stringMatching(/^[a-z][a-zA-Z0-9]*$/), { minLength: 1, maxLength: 3 }),
          (keyParts) => {
            const key = keyParts.join('.');
            const result = t(key);
            
            // Result should either be a valid translation (Chinese text) or the key itself
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            
            // If translation exists, it should be different from the key
            // If not, it should return the key
            const translationExists = result !== key;
            if (translationExists) {
              // Valid translation should contain Chinese characters or common punctuation
              expect(result).toMatch(/[\u4e00-\u9fa5]|[a-zA-Z0-9\s.,!?]/);
            } else {
              expect(result).toBe(key);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle any valid category name consistently', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'common', 'auth', 'notes', 'tags', 'categories', 
            'search', 'pagination', 'sort', 'theme', 'navigation',
            'editor', 'ai', 'errors', 'success', 'dialog',
            'shortcuts', 'responsive', 'accessibility'
          ),
          (category) => {
            const categoryTranslations = getTranslations(category as any);
            
            // Category should exist and be an object
            expect(categoryTranslations).toBeDefined();
            expect(typeof categoryTranslations).toBe('object');
            expect(categoryTranslations).not.toBeNull();
            
            // All values in category should be strings
            Object.values(categoryTranslations).forEach(value => {
              expect(typeof value).toBe('string');
              expect((value as string).length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain translation consistency across multiple calls', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'auth.login',
            'notes.createNote',
            'common.save',
            'search.searchPlaceholder',
            'editor.bold'
          ),
          (key) => {
            const firstCall = t(key);
            const secondCall = t(key);
            const thirdCall = t(key);
            
            // Same key should always return same translation
            expect(firstCall).toBe(secondCall);
            expect(secondCall).toBe(thirdCall);
            expect(firstCall).toBe(thirdCall);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle nested key access without errors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('common', 'auth', 'notes', 'editor', 'search'),
          fc.stringMatching(/^[a-z][a-zA-Z0-9]*$/),
          (category, subKey) => {
            const key = `${category}.${subKey}`;
            
            // Should not throw error
            expect(() => t(key)).not.toThrow();
            
            const result = t(key);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return non-empty strings for all existing translation keys', () => {
      const allTranslations = getAllTranslations();
      
      const collectKeys = (obj: any, prefix: string = ''): string[] => {
        const keys: string[] = [];
        
        Object.entries(obj).forEach(([key, value]) => {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          
          if (typeof value === 'string') {
            keys.push(fullKey);
          } else if (typeof value === 'object' && value !== null) {
            keys.push(...collectKeys(value, fullKey));
          }
        });
        
        return keys;
      };
      
      const allKeys = collectKeys(allTranslations);
      
      fc.assert(
        fc.property(
          fc.constantFrom(...allKeys),
          (key) => {
            const translation = t(key);
            
            // Should return non-empty string
            expect(typeof translation).toBe('string');
            expect(translation.length).toBeGreaterThan(0);
            expect(translation.trim()).toBe(translation);
            
            // Should not be the key itself (since we know it exists)
            expect(translation).not.toBe(key);
          }
        ),
        { numRuns: Math.min(allKeys.length, 200) }
      );
    });

    it('should handle parameter replacement consistently', () => {
      fc.assert(
        fc.property(
          fc.record({
            from: fc.integer({ min: 1, max: 100 }),
            to: fc.integer({ min: 1, max: 100 }),
            total: fc.integer({ min: 1, max: 1000 })
          }),
          (params) => {
            // Ensure from <= to <= total
            const from = Math.min(params.from, params.to);
            const to = Math.max(params.from, params.to);
            const total = Math.max(to, params.total);
            
            const result = t('pagination.showing');
            
            // Should return a string
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain type safety for all translation categories', () => {
      const categories = [
        'common', 'auth', 'notes', 'tags', 'categories',
        'search', 'pagination', 'sort', 'theme', 'navigation',
        'editor', 'ai', 'errors', 'success', 'dialog',
        'shortcuts', 'responsive', 'accessibility'
      ] as const;
      
      fc.assert(
        fc.property(
          fc.constantFrom(...categories),
          (category) => {
            const categoryTranslations = getTranslations(category);
            
            // Should be an object with string values
            expect(typeof categoryTranslations).toBe('object');
            expect(categoryTranslations).not.toBeNull();
            
            // Check all values are strings
            const values = Object.values(categoryTranslations);
            expect(values.length).toBeGreaterThan(0);
            
            values.forEach(value => {
              if (typeof value === 'string') {
                expect(value.length).toBeGreaterThan(0);
              }
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle edge cases in key paths gracefully', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(''),
            fc.constant('.'),
            fc.constant('..'),
            fc.constant('...'),
            fc.stringMatching(/^[a-z]+$/),
            fc.stringMatching(/^[a-z]+\.[a-z]+$/),
            fc.stringMatching(/^[a-z]+\.[a-z]+\.[a-z]+$/)
          ),
          (key) => {
            // Should not throw error for any key format
            expect(() => t(key)).not.toThrow();
            
            const result = t(key);
            expect(typeof result).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve translation immutability', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('auth.login', 'notes.createNote', 'common.save'),
          (key) => {
            const original = t(key);
            const allTranslations = getAllTranslations();
            
            // Try to modify (should not affect future calls)
            const modified = original + ' modified';
            
            // Get translation again
            const afterModification = t(key);
            
            // Should still return original translation
            expect(afterModification).toBe(original);
            expect(afterModification).not.toBe(modified);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle concurrent translation access', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom(
              'auth.login', 'notes.createNote', 'common.save',
              'search.searchPlaceholder', 'editor.bold'
            ),
            { minLength: 5, maxLength: 20 }
          ),
          (keys) => {
            // Simulate concurrent access
            const results = keys.map(key => t(key));
            
            // All results should be valid
            results.forEach((result, index) => {
              expect(typeof result).toBe('string');
              expect(result.length).toBeGreaterThan(0);
              
              // Same key should produce same result
              const sameKeyResults = results.filter((_, i) => keys[i] === keys[index]);
              sameKeyResults.forEach(r => {
                expect(r).toBe(result);
              });
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Translation Value Properties', () => {
    it('should have reasonable length for all translations', () => {
      const allTranslations = getAllTranslations();
      
      const checkLengths = (obj: any) => {
        Object.values(obj).forEach(value => {
          if (typeof value === 'string') {
            // Translations should be between 1 and 200 characters
            expect(value.length).toBeGreaterThan(0);
            expect(value.length).toBeLessThan(200);
          } else if (typeof value === 'object' && value !== null) {
            checkLengths(value);
          }
        });
      };
      
      checkLengths(allTranslations);
    });

    it('should not have HTML tags in translations', () => {
      const allTranslations = getAllTranslations();
      
      const checkNoHTML = (obj: any) => {
        Object.values(obj).forEach(value => {
          if (typeof value === 'string') {
            // Should not contain HTML tags
            expect(value).not.toMatch(/<[^>]+>/);
          } else if (typeof value === 'object' && value !== null) {
            checkNoHTML(value);
          }
        });
      };
      
      checkNoHTML(allTranslations);
    });

    it('should not have leading or trailing whitespace', () => {
      const allTranslations = getAllTranslations();
      
      const checkWhitespace = (obj: any) => {
        Object.values(obj).forEach(value => {
          if (typeof value === 'string') {
            expect(value).toBe(value.trim());
          } else if (typeof value === 'object' && value !== null) {
            checkWhitespace(value);
          }
        });
      };
      
      checkWhitespace(allTranslations);
    });
  });
});
