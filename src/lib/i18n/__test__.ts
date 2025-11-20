/**
 * 简单的i18n功能测试
 * Simple i18n functionality test
 */

import { t, getTranslations } from './index';
import { formatDate, formatDateTime, formatRelativeTime } from './date-format';

// 测试翻译函数
console.log('=== 测试翻译函数 ===');
console.log('t("common.appName"):', t('common.appName'));
console.log('t("auth.login"):', t('auth.login'));
console.log('t("notes.createNote"):', t('notes.createNote'));
console.log('t("search.searchPlaceholder"):', t('search.searchPlaceholder'));

// 测试 getTranslations
console.log('\n=== 测试 getTranslations ===');
const authTranslations = getTranslations('auth');
console.log('authTranslations.login:', authTranslations.login);
console.log('authTranslations.register:', authTranslations.register);
console.log('authTranslations.logout:', authTranslations.logout);

// 测试日期格式化
console.log('\n=== 测试日期格式化 ===');
const now = new Date('2024-01-15T14:30:45');
console.log('formatDate(now):', formatDate(now));
console.log('formatDateTime(now):', formatDateTime(now));
console.log('formatRelativeTime(now):', formatRelativeTime(now));

// 测试不存在的键
console.log('\n=== 测试不存在的键 ===');
console.log('t("nonexistent.key"):', t('nonexistent.key'));

console.log('\n✅ 所有测试完成！');
