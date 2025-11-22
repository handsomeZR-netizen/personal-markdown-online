/**
 * 离线功能设置管理器
 * 负责保存和加载离线功能的用户设置
 */

import { OfflineSettings, DEFAULT_OFFLINE_SETTINGS } from '@/types/offline';

const SETTINGS_KEY = 'offline_settings';

export class OfflineSettingsManager {
  /**
   * 获取当前设置
   */
  static getSettings(): OfflineSettings {
    if (typeof window === 'undefined') {
      return DEFAULT_OFFLINE_SETTINGS;
    }

    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (!stored) {
        return DEFAULT_OFFLINE_SETTINGS;
      }

      const settings = JSON.parse(stored) as OfflineSettings;
      
      // 合并默认设置，确保新增的设置项有默认值
      return {
        ...DEFAULT_OFFLINE_SETTINGS,
        ...settings,
      };
    } catch (error) {
      console.error('Failed to load offline settings:', error);
      return DEFAULT_OFFLINE_SETTINGS;
    }
  }

  /**
   * 保存设置
   */
  static saveSettings(settings: OfflineSettings): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      
      // 触发自定义事件，通知其他组件设置已更新
      window.dispatchEvent(new CustomEvent('offline-settings-changed', {
        detail: settings,
      }));
    } catch (error) {
      console.error('Failed to save offline settings:', error);
      throw error;
    }
  }

  /**
   * 重置为默认设置
   */
  static resetSettings(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(SETTINGS_KEY);
      
      // 触发自定义事件
      window.dispatchEvent(new CustomEvent('offline-settings-changed', {
        detail: DEFAULT_OFFLINE_SETTINGS,
      }));
    } catch (error) {
      console.error('Failed to reset offline settings:', error);
      throw error;
    }
  }

  /**
   * 监听设置变化
   */
  static onSettingsChange(callback: (settings: OfflineSettings) => void): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<OfflineSettings>;
      callback(customEvent.detail);
    };

    window.addEventListener('offline-settings-changed', handler);

    return () => {
      window.removeEventListener('offline-settings-changed', handler);
    };
  }

  /**
   * 获取单个设置项
   */
  static getSetting<K extends keyof OfflineSettings>(key: K): OfflineSettings[K] {
    const settings = this.getSettings();
    return settings[key];
  }

  /**
   * 更新单个设置项
   */
  static updateSetting<K extends keyof OfflineSettings>(
    key: K,
    value: OfflineSettings[K]
  ): void {
    const settings = this.getSettings();
    settings[key] = value;
    this.saveSettings(settings);
  }
}
