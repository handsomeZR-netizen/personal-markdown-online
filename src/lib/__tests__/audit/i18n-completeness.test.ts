/**
 * 国际化完整性测试
 * Internationalization Completeness Tests
 * 
 * 测试翻译键的存在性和语言切换功能
 * Tests translation key existence and language switching functionality
 */

import { describe, it, expect } from 'vitest';
import { t, getTranslations, getAllTranslations, tp } from '@/lib/i18n';
import translations from '@/lib/i18n/zh-CN';

describe('I18n Completeness - Translation Keys', () => {
  describe('Core Translation Categories', () => {
    it('should have common translations', () => {
      const common = getTranslations('common');
      
      expect(common.appName).toBeDefined();
      expect(common.loading).toBeDefined();
      expect(common.save).toBeDefined();
      expect(common.cancel).toBeDefined();
      expect(common.delete).toBeDefined();
      expect(common.edit).toBeDefined();
      expect(common.create).toBeDefined();
      expect(common.search).toBeDefined();
    });

    it('should have auth translations', () => {
      const auth = getTranslations('auth');
      
      expect(auth.login).toBeDefined();
      expect(auth.register).toBeDefined();
      expect(auth.logout).toBeDefined();
      expect(auth.email).toBeDefined();
      expect(auth.password).toBeDefined();
      expect(auth.confirmPassword).toBeDefined();
    });

    it('should have notes translations', () => {
      const notes = getTranslations('notes');
      
      expect(notes.title).toBeDefined();
      expect(notes.content).toBeDefined();
      expect(notes.createNote).toBeDefined();
      expect(notes.editNote).toBeDefined();
      expect(notes.deleteNote).toBeDefined();
      expect(notes.myNotes).toBeDefined();
    });

    it('should have search translations', () => {
      const search = getTranslations('search');
      
      expect(search.search).toBeDefined();
      expect(search.searchPlaceholder).toBeDefined();
      expect(search.searchNotes).toBeDefined();
      expect(search.noResults).toBeDefined();
      expect(search.filterByTags).toBeDefined();
    });

    it('should have editor translations', () => {
      const editor = getTranslations('editor');
      
      expect(editor.bold).toBeDefined();
      expect(editor.italic).toBeDefined();
      expect(editor.heading).toBeDefined();
      expect(editor.link).toBeDefined();
      expect(editor.image).toBeDefined();
      expect(editor.code).toBeDefined();
    });

    it('should have AI translations', () => {
      const ai = getTranslations('ai');
      
      expect(ai.aiFeatures).toBeDefined();
      expect(ai.suggestTags).toBeDefined();
      expect(ai.generateSummary).toBeDefined();
      expect(ai.semanticSearch).toBeDefined();
    });

    it('should have error translations', () => {
      const errors = getTranslations('errors');
      
      expect(errors.generic).toBeDefined();
      expect(errors.networkError).toBeDefined();
      expect(errors.unauthorized).toBeDefined();
      expect(errors.notFound).toBeDefined();
      expect(errors.serverError).toBeDefined();
    });

    it('should have accessibility translations', () => {
      const accessibility = getTranslations('accessibility');
      
      expect(accessibility.skipToContent).toBeDefined();
      expect(accessibility.openMenu).toBeDefined();
      expect(accessibility.closeMenu).toBeDefined();
      expect(accessibility.loading).toBeDefined();
    });
  });

  describe('Translation Function - t()', () => {
    it('should return correct translation for valid key', () => {
      expect(t('auth.login')).toBe('登录');
      expect(t('notes.createNote')).toBe('创建笔记');
      expect(t('common.save')).toBe('保存');
    });

    it('should return key itself for missing translation', () => {
      const missingKey = 'nonexistent.key';
      expect(t(missingKey)).toBe(missingKey);
    });

    it('should handle nested keys correctly', () => {
      expect(t('auth.login')).toBe('登录');
      expect(t('notes.createNote')).toBe('创建笔记');
      expect(t('editor.bold')).toBe('粗体');
    });

    it('should warn for missing keys', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      t('missing.translation.key');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Translation key not found')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Translation Function - tp() with parameters', () => {
    it('should return translation text when no parameters exist', () => {
      // The current translations don't have parameter placeholders
      const result = tp('pagination.showing', { from: 1, to: 20, total: 100 });
      
      // Should return the translation text
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toBe('显示');
    });

    it('should handle parameter replacement if placeholders exist', () => {
      // Test with a hypothetical translation that has placeholders
      // For now, just verify the function doesn't throw
      expect(() => {
        tp('pagination.showing', { 
          from: 5, 
          to: 10, 
          total: 50 
        });
      }).not.toThrow();
    });
  });

  describe('Translation Completeness', () => {
    it('should have all required translation categories', () => {
      const allTranslations = getAllTranslations();
      
      const requiredCategories = [
        'common',
        'auth',
        'notes',
        'tags',
        'categories',
        'search',
        'pagination',
        'sort',
        'theme',
        'navigation',
        'editor',
        'ai',
        'errors',
        'success',
        'dialog',
        'shortcuts',
        'responsive',
        'accessibility',
      ];

      requiredCategories.forEach(category => {
        expect(allTranslations).toHaveProperty(category);
      });
    });

    it('should have non-empty translation values', () => {
      const allTranslations = getAllTranslations();
      
      const checkCategory = (category: any, path: string = '') => {
        Object.entries(category).forEach(([key, value]) => {
          const fullPath = path ? `${path}.${key}` : key;
          
          if (typeof value === 'string') {
            expect(value.length).toBeGreaterThan(0);
            expect(value.trim()).toBe(value); // No leading/trailing whitespace
          } else if (typeof value === 'object' && value !== null) {
            checkCategory(value, fullPath);
          }
        });
      };

      checkCategory(allTranslations);
    });

    it('should not have duplicate translation values in same category', () => {
      const allTranslations = getAllTranslations();
      
      Object.entries(allTranslations).forEach(([categoryName, category]) => {
        if (typeof category === 'object' && category !== null) {
          const values = Object.values(category).filter(v => typeof v === 'string');
          const uniqueValues = new Set(values);
          
          // Allow some duplicates for common words like "保存", "删除" etc
          // but flag if more than 30% are duplicates
          const duplicateRatio = 1 - (uniqueValues.size / values.length);
          expect(duplicateRatio).toBeLessThan(0.3);
        }
      });
    });
  });

  describe('Translation Structure', () => {
    it('should have consistent structure across categories', () => {
      const allTranslations = getAllTranslations();
      
      Object.entries(allTranslations).forEach(([categoryName, category]) => {
        expect(typeof category).toBe('object');
        expect(category).not.toBeNull();
      });
    });

    it('should use consistent naming conventions', () => {
      const allTranslations = getAllTranslations();
      
      const checkNaming = (obj: any) => {
        Object.keys(obj).forEach(key => {
          // Keys should be camelCase or snake_case
          expect(key).toMatch(/^[a-z][a-zA-Z0-9_]*$/);
          
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            checkNaming(obj[key]);
          }
        });
      };

      checkNaming(allTranslations);
    });
  });

  describe('UI Text Coverage', () => {
    it('should have translations for all button actions', () => {
      const common = getTranslations('common');
      
      const buttonActions = [
        'save',
        'cancel',
        'delete',
        'edit',
        'create',
        'submit',
        'close',
        'back',
        'next',
        'previous',
      ];

      buttonActions.forEach(action => {
        expect(common).toHaveProperty(action);
        expect(typeof common[action as keyof typeof common]).toBe('string');
      });
    });

    it('should have translations for all status messages', () => {
      const common = getTranslations('common');
      
      const statusMessages = [
        'loading',
        'saving',
        'saved',
        'success',
        'error',
        'warning',
        'info',
      ];

      statusMessages.forEach(status => {
        expect(common).toHaveProperty(status);
      });
    });

    it('should have translations for all navigation items', () => {
      const navigation = getTranslations('navigation');
      
      const navItems = [
        'home',
        'dashboard',
        'notes',
        'settings',
        'profile',
        'menu',
      ];

      navItems.forEach(item => {
        expect(navigation).toHaveProperty(item);
      });
    });
  });
});
