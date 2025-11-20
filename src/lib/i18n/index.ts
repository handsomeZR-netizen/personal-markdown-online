/**
 * 国际化工具函数
 * Internationalization utility functions
 */

import translations, { type Translation } from './zh-CN';

/**
 * 获取翻译文本
 * Get translated text
 * 
 * @example
 * t('auth.login') // '登录'
 * t('notes.createNote') // '创建笔记'
 */
export function t(key: string): string {
  const keys = key.split('.');
  let value: any = translations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  return typeof value === 'string' ? value : key;
}

/**
 * 获取翻译对象的某个分类
 * Get a category of translations
 * 
 * @example
 * const authTranslations = getTranslations('auth')
 * authTranslations.login // '登录'
 */
export function getTranslations<K extends keyof Translation>(
  category: K
): Translation[K] {
  return translations[category];
}

/**
 * 获取所有翻译
 * Get all translations
 */
export function getAllTranslations(): Translation {
  return translations;
}

/**
 * 带参数的翻译函数
 * Translation function with parameters
 * 
 * @example
 * tp('pagination.showing', { from: 1, to: 20, total: 100 })
 * // '显示 1 至 20 条，共 100 条'
 */
export function tp(key: string, params: Record<string, string | number>): string {
  let text = t(key);
  
  Object.entries(params).forEach(([param, value]) => {
    text = text.replace(`{${param}}`, String(value));
  });
  
  return text;
}

// 导出翻译对象供直接使用
export { translations };
export default t;
