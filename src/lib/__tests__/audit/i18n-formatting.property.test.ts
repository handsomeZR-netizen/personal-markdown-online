/**
 * 国际化格式化属性测试
 * Internationalization Formatting Property-Based Tests
 * 
 * Feature: comprehensive-feature-audit, Property 9: 国际化完整性
 * Validates: Requirements 19.3, 19.4, 19.5
 */

import { describe, it, expect } from 'vitest';
import { fc } from '@fast-check/vitest';
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatShortDate,
  formatLongDate,
  formatISODate,
  formatISODateTime,
  formatWithPreset,
  dateFormats,
} from '@/lib/i18n/date-format';

describe('I18n Formatting Property Tests', () => {
  describe('Property 9: Date Formatting Consistency', () => {
    it('should always return non-empty string for any valid date', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('1900-01-01'), max: new Date('2099-12-31') }),
          (date) => {
            const result = formatDate(date);
            
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            expect(result.trim()).toBe(result);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format same date consistently across multiple calls', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('1900-01-01'), max: new Date('2099-12-31') })
            .filter(date => !isNaN(date.getTime())), // Filter out invalid dates
          (date) => {
            const result1 = formatDate(date);
            const result2 = formatDate(date);
            const result3 = formatDate(date);
            
            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle any date input type consistently', () => {
      fc.assert(
        fc.property(
          fc.date(),
          (date) => {
            const dateObj = date;
            const dateString = date.toISOString();
            const dateTimestamp = date.getTime();
            
            const result1 = formatISODate(dateObj);
            const result2 = formatISODate(dateString);
            const result3 = formatISODate(dateTimestamp);
            
            // All three should produce the same result
            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain date ordering after formatting', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('1900-01-01'), max: new Date('2099-12-31') })
            .filter(date => !isNaN(date.getTime())),
          fc.date({ min: new Date('1900-01-01'), max: new Date('2099-12-31') })
            .filter(date => !isNaN(date.getTime())),
          (date1, date2) => {
            const iso1 = formatISODate(date1);
            const iso2 = formatISODate(date2);
            
            // ISO format should maintain chronological order for reasonable dates
            if (date1.getTime() < date2.getTime()) {
              expect(iso1 <= iso2).toBe(true);
            } else if (date1.getTime() > date2.getTime()) {
              expect(iso1 >= iso2).toBe(true);
            } else {
              expect(iso1).toBe(iso2);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce valid ISO format for any date', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('1900-01-01'), max: new Date('2099-12-31') })
            .filter(date => !isNaN(date.getTime())), // Filter out invalid dates
          (date) => {
            const isoDate = formatISODate(date);
            const isoDateTime = formatISODateTime(date);
            
            // ISO date should match YYYY-MM-DD pattern (4 digits for reasonable years)
            expect(isoDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            
            // ISO datetime should match YYYY-MM-DD HH:mm:ss pattern
            expect(isoDateTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle all preset formats without errors', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('1900-01-01'), max: new Date('2099-12-31') })
            .filter(date => !isNaN(date.getTime())), // Filter out invalid dates
          fc.constantFrom(
            'full', 'dateTime', 'date', 'shortDate', 'longDate',
            'time', 'shortTime', 'iso', 'isoDateTime', 'monthDay', 'yearMonth'
          ),
          (date, preset) => {
            expect(() => formatWithPreset(date, preset as any)).not.toThrow();
            
            const result = formatWithPreset(date, preset as any);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format relative time consistently', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
            .filter(date => !isNaN(date.getTime())), // Filter out invalid dates
          (date) => {
            const result = formatRelativeTime(date);
            
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            
            // Should contain Chinese time units or "前" or future indicator
            const hasTimeUnit = /秒|分钟|小时|天|月|年/.test(result);
            const hasDirection = /前|后|内/.test(result);
            
            expect(hasTimeUnit || hasDirection).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve year information in all formats', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1900, max: 2099 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 28 }), // Safe day range
          (year, month, day) => {
            const date = new Date(year, month - 1, day);
            
            const formatted = formatDate(date);
            const isoFormatted = formatISODate(date);
            
            // Year should be present in formatted output
            expect(formatted).toContain(String(year));
            expect(isoFormatted).toContain(String(year));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle time components correctly', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('1900-01-01'), max: new Date('2099-12-31') })
            .filter(date => !isNaN(date.getTime())),
          (date) => {
            const timeResult = formatTime(date);
            
            // Time should be in HH:mm:ss format
            expect(timeResult).toMatch(/^\d{2}:\d{2}:\d{2}$/);
            
            const [hours, minutes, seconds] = timeResult.split(':').map(Number);
            
            expect(hours).toBeGreaterThanOrEqual(0);
            expect(hours).toBeLessThan(24);
            expect(minutes).toBeGreaterThanOrEqual(0);
            expect(minutes).toBeLessThan(60);
            expect(seconds).toBeGreaterThanOrEqual(0);
            expect(seconds).toBeLessThan(60);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: Number Formatting Consistency', () => {
    it('should format any integer consistently', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000000, max: 1000000 }),
          (num) => {
            const result1 = num.toLocaleString('zh-CN');
            const result2 = num.toLocaleString('zh-CN');
            
            expect(result1).toBe(result2);
            expect(typeof result1).toBe('string');
            expect(result1.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format any decimal consistently', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -10000, max: 10000, noNaN: true }),
          (num) => {
            const result = num.toLocaleString('zh-CN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            
            // Should have exactly 2 decimal places
            if (!result.includes('e') && !result.includes('E')) {
              const parts = result.replace(/,/g, '').split('.');
              if (parts.length === 2) {
                expect(parts[1].length).toBe(2);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain number ordering after formatting and parsing', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000 }),
          fc.integer({ min: 0, max: 1000000 }),
          (num1, num2) => {
            const formatted1 = num1.toLocaleString('zh-CN');
            const formatted2 = num2.toLocaleString('zh-CN');
            
            const parsed1 = parseFloat(formatted1.replace(/,/g, ''));
            const parsed2 = parseFloat(formatted2.replace(/,/g, ''));
            
            // Ordering should be preserved
            if (num1 < num2) {
              expect(parsed1).toBeLessThan(parsed2);
            } else if (num1 > num2) {
              expect(parsed1).toBeGreaterThan(parsed2);
            } else {
              expect(parsed1).toBe(parsed2);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format percentages correctly', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1, noNaN: true }),
          (num) => {
            const result = num.toLocaleString('zh-CN', {
              style: 'percent',
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            });
            
            expect(typeof result).toBe('string');
            expect(result).toContain('%');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle zero and negative numbers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: 1000 }),
          (num) => {
            const result = num.toLocaleString('zh-CN');
            
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            
            if (num === 0) {
              expect(result).toBe('0');
            } else if (num < 0) {
              expect(result).toContain('-');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: Text Sorting with Chinese Locale', () => {
    it('should sort Chinese text consistently', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.stringMatching(/^[\u4e00-\u9fa5]{1,5}$/),
            { minLength: 2, maxLength: 10 }
          ),
          (items) => {
            const sorted1 = [...items].sort((a, b) => a.localeCompare(b, 'zh-CN'));
            const sorted2 = [...items].sort((a, b) => a.localeCompare(b, 'zh-CN'));
            
            // Sorting should be consistent
            expect(sorted1).toEqual(sorted2);
            
            // Sorted array should have same length
            expect(sorted1.length).toBe(items.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain sort order for numbers as strings', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.integer({ min: 1, max: 100 }).map(n => String(n)),
            { minLength: 2, maxLength: 10 }
          ),
          (items) => {
            const sorted = [...items].sort((a, b) => 
              a.localeCompare(b, 'zh-CN', { numeric: true })
            );
            
            // Convert back to numbers and check ordering
            const numericSorted = sorted.map(Number);
            
            for (let i = 1; i < numericSorted.length; i++) {
              expect(numericSorted[i]).toBeGreaterThanOrEqual(numericSorted[i - 1]);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle mixed content sorting', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(
              fc.stringMatching(/^[\u4e00-\u9fa5]{1,3}$/),
              fc.stringMatching(/^[a-zA-Z]{1,5}$/),
              fc.integer({ min: 1, max: 100 }).map(n => String(n))
            ),
            { minLength: 3, maxLength: 10 }
          ),
          (items) => {
            const sorted = [...items].sort((a, b) => a.localeCompare(b, 'zh-CN'));
            
            // Should not throw and should return array of same length
            expect(sorted.length).toBe(items.length);
            expect(Array.isArray(sorted)).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 9: Format Reversibility', () => {
    it('should be able to parse formatted ISO dates back to Date', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') })
            .filter(date => !isNaN(date.getTime())), // Filter out invalid dates
          (originalDate) => {
            const formatted = formatISODate(originalDate);
            const parsed = new Date(formatted);
            
            // Should be valid date
            expect(parsed.toString()).not.toBe('Invalid Date');
            expect(!isNaN(parsed.getTime())).toBe(true);
            
            // Year, month, day should match
            expect(parsed.getFullYear()).toBe(originalDate.getFullYear());
            expect(parsed.getMonth()).toBe(originalDate.getMonth());
            expect(parsed.getDate()).toBe(originalDate.getDate());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be able to parse formatted numbers back to numbers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000000, max: 1000000 }),
          (originalNum) => {
            const formatted = originalNum.toLocaleString('zh-CN');
            const parsed = parseFloat(formatted.replace(/,/g, ''));
            
            expect(parsed).toBe(originalNum);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: Edge Cases and Boundaries', () => {
    it('should handle date boundaries correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            new Date('1900-01-01'),
            new Date('2099-12-31'),
            new Date('2000-01-01T00:00:00'),
            new Date('2000-12-31T23:59:59')
          ),
          (date) => {
            expect(() => formatDate(date)).not.toThrow();
            expect(() => formatDateTime(date)).not.toThrow();
            expect(() => formatISODate(date)).not.toThrow();
            
            const result = formatDate(date);
            expect(result.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle number boundaries correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            0,
            -0,
            1,
            -1,
            Number.MAX_SAFE_INTEGER,
            Number.MIN_SAFE_INTEGER,
            0.1,
            -0.1
          ),
          (num) => {
            expect(() => num.toLocaleString('zh-CN')).not.toThrow();
            
            const result = num.toLocaleString('zh-CN');
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle empty and whitespace in text sorting', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(
              fc.constant(''),
              fc.constant(' '),
              fc.stringMatching(/^[\u4e00-\u9fa5]{1,3}$/)
            ),
            { minLength: 2, maxLength: 5 }
          ),
          (items) => {
            expect(() => {
              [...items].sort((a, b) => a.localeCompare(b, 'zh-CN'));
            }).not.toThrow();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
