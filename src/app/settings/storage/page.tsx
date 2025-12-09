/**
 * Storage Settings Page
 * Displays storage usage and cleanup options
 */

import { Metadata } from 'next';
import { StorageSettingsClient } from './storage-settings-client';

export const metadata: Metadata = {
  title: '存储管理 - 设置',
  description: '管理您的存储空间使用情况',
};

export default function StorageSettingsPage() {
  return <StorageSettingsClient />;
}
