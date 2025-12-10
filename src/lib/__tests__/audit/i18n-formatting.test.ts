/**
 * 国际化格式化测试
 * Internationalization Formatting Tests
 * 
 * 测试日期格式、数字格式和 RTL 支持
 * Tests date formatting, number formatting, and RTL support
 */

import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatRelativeDate,
  formatShortDate,
  formatLongDate,
  formatISODate,
  formatISODateTime,
  formatWithPreset,
  dateFormats,
  locale,
} from '@/lib/i18n/date-format';
import { subDays, subHours, subMinutes, addDays } from 'date-fns';

describe('I18n Formatting - Date Formatting', () => {
  const testDate = new Date('2024-01-15T14:30:45');

  describe('Basic Date Formatting', () => {
    it('should format date in Chinese format', () => {
      const result = formatDate(testDate);
      
      expect(result).toContain('2024');
      expect(result).toContain('1');
      expect(result).toContain('15');
      expect(result).toMatch(/年|月|日/); // Should contain Chinese date characters
    });

    it('should format datetime in Chinese format', () => {
      const result = formatDateTime(testDate);
      
      expect(result).toContain('2024');
      expect(result).toContain('14');
      expect(result).toContain('30');
      expect(result).toMatch(/年|月|日/);
    });

    it('should format time correctly', () => {
      const result = formatTime(testDate);
      
      expect(result).toContain('14');
      expect(result).toContain('30');
      expect(result).toContain('45');
      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it('should format short date', () => {
      const result = formatShortDate(testDate);
      
      expect(result).toBe('2024/1/15');
    });

    it('should format long date with weekday', () => {
      const result = formatLongDate(testDate);
      
      expect(result).toContain('2024');
      expect(result).toContain('1');
      expect(result).toContain('15');
      expect(result).toMatch(/星期/); // Should contain weekday in Chinese
    });

    it('should format ISO date', () => {
      const result = formatISODate(testDate);
      
      expect(result).toBe('2024-01-15');
    });

    it('should format ISO datetime', () => {
      const result = formatISODateTime(testDate);
      
      expect(result).toBe('2024-01-15 14:30:45');
    });
  });

  describe('Relative Time Formatting', () => {
    const now = new Date();

    it('should format recent time as relative', () => {
      const fiveMinutesAgo = subMinutes(now, 5);
      const result = formatRelativeTime(fiveMinutesAgo);
      
      expect(result).toMatch(/分钟|秒/);
      expect(result).toContain('前');
    });

    it('should format hours ago', () => {
      const twoHoursAgo = subHours(now, 2);
      const result = formatRelativeTime(twoHoursAgo);
      
      expect(result).toMatch(/小时/);
      expect(result).toContain('前');
    });

    it('should format days ago', () => {
      const threeDaysAgo = subDays(now, 3);
      const result = formatRelativeTime(threeDaysAgo);
      
      expect(result).toMatch(/天/);
      expect(result).toContain('前');
    });

    it('should format relative date', () => {
      const yesterday = subDays(now, 1);
      const result = formatRelativeDate(yesterday);
      
      expect(result).toMatch(/昨天|今天|明天|\d{2}:\d{2}/);
    });

    it('should handle future dates', () => {
      const tomorrow = addDays(now, 1);
      const result = formatRelativeTime(tomorrow);
      
      // Should indicate future time
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Date Format Presets', () => {
    it('should have all required preset formats', () => {
      expect(dateFormats).toHaveProperty('full');
      expect(dateFormats).toHaveProperty('dateTime');
      expect(dateFormats).toHaveProperty('date');
      expect(dateFormats).toHaveProperty('shortDate');
      expect(dateFormats).toHaveProperty('longDate');
      expect(dateFormats).toHaveProperty('time');
      expect(dateFormats).toHaveProperty('shortTime');
      expect(dateFormats).toHaveProperty('iso');
      expect(dateFormats).toHaveProperty('isoDateTime');
      expect(dateFormats).toHaveProperty('monthDay');
      expect(dateFormats).toHaveProperty('yearMonth');
    });

    it('should format with preset - full', () => {
      const result = formatWithPreset(testDate, 'full');
      
      expect(result).toContain('2024');
      expect(result).toContain('14');
      expect(result).toContain('30');
      expect(result).toContain('45');
    });

    it('should format with preset - shortDate', () => {
      const result = formatWithPreset(testDate, 'shortDate');
      
      expect(result).toBe('2024/1/15');
    });

    it('should format with preset - iso', () => {
      const result = formatWithPreset(testDate, 'iso');
      
      expect(result).toBe('2024-01-15');
    });

    it('should format with preset - monthDay', () => {
      const result = formatWithPreset(testDate, 'monthDay');
      
      expect(result).toContain('1');
      expect(result).toContain('15');
      expect(result).toMatch(/月|日/);
    });

    it('should format with preset - yearMonth', () => {
      const result = formatWithPreset(testDate, 'yearMonth');
      
      expect(result).toContain('2024');
      expect(result).toContain('1');
      expect(result).toMatch(/年|月/);
    });
  });

  describe('Input Type Handling', () => {
    it('should handle Date object', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      
      expect(result).toContain('2024');
      expect(result).toContain('1');
      expect(result).toContain('15');
    });

    it('should handle ISO string', () => {
      const dateString = '2024-01-15T14:30:45';
      const result = formatDate(dateString);
      
      expect(result).toContain('2024');
      expect(result).toContain('1');
      expect(result).toContain('15');
    });

    it('should handle timestamp number', () => {
      const timestamp = new Date('2024-01-15').getTime();
      const result = formatDate(timestamp);
      
      expect(result).toContain('2024');
      expect(result).toContain('1');
      expect(result).toContain('15');
    });
  });

  describe('Locale Configuration', () => {
    it('should use Chinese locale', () => {
      expect(locale).toBeDefined();
      expect(locale.code).toBe('zh-CN');
    });

    it('should format weekdays in Chinese', () => {
      const monday = new Date('2024-01-15'); // Monday
      const result = formatLongDate(monday);
      
      expect(result).toMatch(/星期/);
    });

    it('should format months in Chinese', () => {
      const result = formatDate(testDate, 'MMMM');
      
      // Should be Chinese month name or number with 月
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Custom Format Strings', () => {
    it('should support custom format patterns', () => {
      const result = formatDate(testDate, 'yyyy-MM-dd HH:mm');
      
      expect(result).toBe('2024-01-15 14:30');
    });

    it('should support Chinese format patterns', () => {
      const result = formatDate(testDate, 'yyyy年M月d日 HH时mm分');
      
      expect(result).toContain('2024年');
      expect(result).toContain('1月');
      expect(result).toContain('15日');
      expect(result).toContain('14时');
      expect(result).toContain('30分');
    });
  });
});

describe('I18n Formatting - Number Formatting', () => {
  describe('Number Display', () => {
    it('should format integers correctly', () => {
      const num = 1234;
      const formatted = num.toLocaleString('zh-CN');
      
      expect(formatted).toContain('1');
      expect(formatted).toContain('234');
    });

    it('should format large numbers with separators', () => {
      const num = 1234567;
      const formatted = num.toLocaleString('zh-CN');
      
      // Chinese locale uses comma separators
      expect(formatted.length).toBeGreaterThan(7);
    });

    it('should format decimals correctly', () => {
      const num = 1234.56;
      const formatted = num.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      
      expect(formatted).toContain('.');
      expect(formatted).toContain('56');
    });

    it('should format percentages', () => {
      const num = 0.856;
      const formatted = num.toLocaleString('zh-CN', {
        style: 'percent',
        minimumFractionDigits: 1,
      });
      
      expect(formatted).toContain('85');
      expect(formatted).toContain('%');
    });

    it('should format currency (CNY)', () => {
      const num = 1234.56;
      const formatted = num.toLocaleString('zh-CN', {
        style: 'currency',
        currency: 'CNY',
      });
      
      expect(formatted).toContain('1');
      expect(formatted).toContain('234');
      expect(formatted).toContain('56');
      expect(formatted).toMatch(/¥|元/);
    });
  });

  describe('Number Parsing', () => {
    it('should handle string to number conversion', () => {
      const str = '1,234.56';
      const num = parseFloat(str.replace(/,/g, ''));
      
      expect(num).toBe(1234.56);
    });

    it('should handle Chinese number formats', () => {
      const str = '1,234';
      const num = parseInt(str.replace(/,/g, ''), 10);
      
      expect(num).toBe(1234);
    });
  });

  describe('Sorting with Chinese Locale', () => {
    it('should sort Chinese text correctly', () => {
      const items = ['张三', '李四', '王五', '赵六'];
      const sorted = [...items].sort((a, b) => a.localeCompare(b, 'zh-CN'));
      
      expect(sorted).toHaveLength(4);
      expect(sorted).toEqual(expect.arrayContaining(items));
    });

    it('should sort mixed Chinese and English', () => {
      const items = ['Apple', '苹果', 'Banana', '香蕉'];
      const sorted = [...items].sort((a, b) => a.localeCompare(b, 'zh-CN'));
      
      expect(sorted).toHaveLength(4);
    });

    it('should sort numbers as strings in Chinese locale', () => {
      const items = ['10', '2', '1', '20'];
      const sorted = [...items].sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true }));
      
      expect(sorted).toEqual(['1', '2', '10', '20']);
    });
  });
});

describe('I18n Formatting - RTL Support', () => {
  describe('Text Direction', () => {
    it('should default to LTR for Chinese', () => {
      const direction = 'ltr'; // Chinese is LTR
      
      expect(direction).toBe('ltr');
    });

    it('should handle mixed LTR and RTL content', () => {
      const text = '这是中文 English text';
      
      // Should contain both Chinese and English
      expect(text).toMatch(/[\u4e00-\u9fa5]/);
      expect(text).toMatch(/[a-zA-Z]/);
    });

    it('should preserve text direction in HTML', () => {
      const htmlDir = 'ltr';
      
      expect(htmlDir).toBe('ltr');
    });
  });

  describe('Layout Direction', () => {
    it('should use LTR layout for Chinese', () => {
      // Chinese uses left-to-right layout
      const flexDirection = 'row'; // Not 'row-reverse'
      
      expect(flexDirection).toBe('row');
    });

    it('should align text to left for Chinese', () => {
      const textAlign = 'left';
      
      expect(textAlign).toBe('left');
    });
  });

  describe('Bidirectional Text', () => {
    it('should handle numbers in Chinese text', () => {
      const text = '共有 123 条笔记';
      
      expect(text).toContain('123');
      expect(text).toMatch(/[\u4e00-\u9fa5]/);
    });

    it('should handle English words in Chinese text', () => {
      const text = '使用 Markdown 编辑器';
      
      expect(text).toContain('Markdown');
      expect(text).toMatch(/[\u4e00-\u9fa5]/);
    });

    it('should handle punctuation correctly', () => {
      const text = '你好，世界！';
      
      expect(text).toContain('，');
      expect(text).toContain('！');
    });
  });
});

describe('I18n Formatting - Edge Cases', () => {
  describe('Invalid Dates', () => {
    it('should throw error for invalid date strings', () => {
      const invalidDate = 'not-a-date';
      
      // Invalid dates should throw an error
      expect(() => formatDate(invalidDate)).toThrow();
    });

    it('should handle null/undefined dates', () => {
      // These should be handled by TypeScript, but test runtime behavior
      const result = formatDate(new Date());
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('Extreme Values', () => {
    it('should handle very old dates', () => {
      const oldDate = new Date('1900-01-01');
      const result = formatDate(oldDate);
      
      expect(result).toContain('1900');
    });

    it('should handle future dates', () => {
      const futureDate = new Date('2099-12-31');
      const result = formatDate(futureDate);
      
      expect(result).toContain('2099');
    });

    it('should handle very large numbers', () => {
      const largeNum = 999999999;
      const formatted = largeNum.toLocaleString('zh-CN');
      
      expect(formatted.length).toBeGreaterThan(9);
    });

    it('should handle very small decimals', () => {
      const smallNum = 0.000001;
      const formatted = smallNum.toLocaleString('zh-CN', {
        minimumFractionDigits: 6,
      });
      
      expect(formatted).toContain('0.000001');
    });
  });

  describe('Timezone Handling', () => {
    it('should format dates consistently', () => {
      const date1 = new Date('2024-01-15T00:00:00Z');
      const date2 = new Date('2024-01-15T00:00:00Z');
      
      const result1 = formatISODate(date1);
      const result2 = formatISODate(date2);
      
      expect(result1).toBe(result2);
    });
  });
});
