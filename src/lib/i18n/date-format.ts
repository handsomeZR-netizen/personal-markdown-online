/**
 * 日期格式化工具（中文）
 * Date formatting utilities (Chinese)
 */

import { format, formatDistance, formatRelative } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 中文locale配置
 * Chinese locale configuration
 */
export const locale = zhCN;

/**
 * 格式化日期
 * Format date
 * 
 * @example
 * formatDate(new Date()) // '2024年1月1日'
 * formatDate(new Date(), 'yyyy-MM-dd') // '2024-01-01'
 */
export function formatDate(
  date: Date | string | number,
  formatStr: string = 'yyyy年M月d日'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  return format(dateObj, formatStr, { locale });
}

/**
 * 格式化日期时间
 * Format date and time
 * 
 * @example
 * formatDateTime(new Date()) // '2024年1月1日 14:30'
 */
export function formatDateTime(
  date: Date | string | number,
  formatStr: string = 'yyyy年M月d日 HH:mm'
): string {
  return formatDate(date, formatStr);
}

/**
 * 格式化时间
 * Format time only
 * 
 * @example
 * formatTime(new Date()) // '14:30:45'
 */
export function formatTime(
  date: Date | string | number,
  formatStr: string = 'HH:mm:ss'
): string {
  return formatDate(date, formatStr);
}

/**
 * 格式化相对时间（距离现在）
 * Format relative time (distance from now)
 * 
 * @example
 * formatRelativeTime(new Date()) // '几秒前'
 * formatRelativeTime(subDays(new Date(), 1)) // '1天前'
 */
export function formatRelativeTime(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  return formatDistance(dateObj, new Date(), {
    addSuffix: true,
    locale,
  });
}

/**
 * 格式化相对日期
 * Format relative date
 * 
 * @example
 * formatRelativeDate(new Date()) // '今天 14:30'
 * formatRelativeDate(subDays(new Date(), 1)) // '昨天 14:30'
 */
export function formatRelativeDate(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  return formatRelative(dateObj, new Date(), { locale });
}

/**
 * 格式化为短日期
 * Format as short date
 * 
 * @example
 * formatShortDate(new Date()) // '2024/1/1'
 */
export function formatShortDate(date: Date | string | number): string {
  return formatDate(date, 'yyyy/M/d');
}

/**
 * 格式化为长日期
 * Format as long date
 * 
 * @example
 * formatLongDate(new Date()) // '2024年1月1日 星期一'
 */
export function formatLongDate(date: Date | string | number): string {
  return formatDate(date, 'yyyy年M月d日 EEEE');
}

/**
 * 格式化为ISO日期
 * Format as ISO date
 * 
 * @example
 * formatISODate(new Date()) // '2024-01-01'
 */
export function formatISODate(date: Date | string | number): string {
  return formatDate(date, 'yyyy-MM-dd');
}

/**
 * 格式化为ISO日期时间
 * Format as ISO datetime
 * 
 * @example
 * formatISODateTime(new Date()) // '2024-01-01 14:30:45'
 */
export function formatISODateTime(date: Date | string | number): string {
  return formatDate(date, 'yyyy-MM-dd HH:mm:ss');
}

/**
 * 常用日期格式预设
 * Common date format presets
 */
export const dateFormats = {
  // 完整日期时间：2024年1月1日 14:30:45
  full: 'yyyy年M月d日 HH:mm:ss',
  
  // 日期时间：2024年1月1日 14:30
  dateTime: 'yyyy年M月d日 HH:mm',
  
  // 日期：2024年1月1日
  date: 'yyyy年M月d日',
  
  // 短日期：2024/1/1
  shortDate: 'yyyy/M/d',
  
  // 长日期：2024年1月1日 星期一
  longDate: 'yyyy年M月d日 EEEE',
  
  // 时间：14:30:45
  time: 'HH:mm:ss',
  
  // 短时间：14:30
  shortTime: 'HH:mm',
  
  // ISO日期：2024-01-01
  iso: 'yyyy-MM-dd',
  
  // ISO日期时间：2024-01-01 14:30:45
  isoDateTime: 'yyyy-MM-dd HH:mm:ss',
  
  // 月日：1月1日
  monthDay: 'M月d日',
  
  // 年月：2024年1月
  yearMonth: 'yyyy年M月',
} as const;

/**
 * 使用预设格式格式化日期
 * Format date using preset format
 * 
 * @example
 * formatWithPreset(new Date(), 'full') // '2024年1月1日 14:30:45'
 */
export function formatWithPreset(
  date: Date | string | number,
  preset: keyof typeof dateFormats
): string {
  return formatDate(date, dateFormats[preset]);
}
