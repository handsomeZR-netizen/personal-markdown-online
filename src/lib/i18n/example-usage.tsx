/**
 * 国际化使用示例
 * Example usage of i18n utilities
 * 
 * 这个文件展示了如何在组件中使用翻译和日期格式化功能
 * This file demonstrates how to use translation and date formatting in components
 */

import { t, getTranslations } from './index';
import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatWithPreset,
} from './date-format';

// ============================================
// 示例 1: 在 Server Component 中使用翻译
// Example 1: Using translations in Server Component
// ============================================

export function LoginPageExample() {
  return (
    <div>
      <h1>{t('auth.login')}</h1>
      <form>
        <label>{t('auth.email')}</label>
        <input type="email" placeholder={t('auth.email')} />
        
        <label>{t('auth.password')}</label>
        <input type="password" placeholder={t('auth.password')} />
        
        <button type="submit">{t('auth.login')}</button>
        <a href="/register">{t('auth.registerNow')}</a>
      </form>
    </div>
  );
}

// ============================================
// 示例 2: 使用 getTranslations 获取分类
// Example 2: Using getTranslations to get category
// ============================================

export function NoteEditorExample() {
  const noteTranslations = getTranslations('notes');
  const commonTranslations = getTranslations('common');
  
  return (
    <div>
      <h2>{noteTranslations.createNote}</h2>
      <input placeholder={noteTranslations.title} />
      <textarea placeholder={noteTranslations.content} />
      <button>{commonTranslations.save}</button>
      <button>{commonTranslations.cancel}</button>
    </div>
  );
}

// ============================================
// 示例 3: 在 Client Component 中使用
// Example 3: Using in Client Component
// ============================================

'use client';

export function NoteFormExample() {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 模拟保存操作
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 使用翻译显示成功消息
      alert(t('notes.createSuccess'));
    } catch (error) {
      // 使用翻译显示错误消息
      alert(t('notes.createError'));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{t('notes.newNote')}</h2>
      <input placeholder={t('notes.title')} required />
      <textarea placeholder={t('notes.content')} required />
      <button type="submit">{t('common.create')}</button>
    </form>
  );
}

// ============================================
// 示例 4: 日期格式化
// Example 4: Date formatting
// ============================================

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export function NoteCardExample({ note }: { note: Note }) {
  return (
    <div>
      <h3>{note.title}</h3>
      <p>{note.content.substring(0, 100)}...</p>
      
      {/* 相对时间 */}
      <small>{formatRelativeTime(note.createdAt)}</small>
      
      {/* 完整日期时间 */}
      <small>{formatDateTime(note.updatedAt)}</small>
      
      {/* 使用预设格式 */}
      <small>{formatWithPreset(note.createdAt, 'shortDate')}</small>
    </div>
  );
}

// ============================================
// 示例 5: 组合使用翻译和日期格式化
// Example 5: Combining translations and date formatting
// ============================================

export function NoteListExample({ notes }: { notes: Note[] }) {
  const noteTranslations = getTranslations('notes');
  
  if (notes.length === 0) {
    return (
      <div>
        <p>{noteTranslations.noNotes}</p>
        <p>{noteTranslations.noNotesDescription}</p>
      </div>
    );
  }
  
  return (
    <div>
      <h2>{noteTranslations.myNotes}</h2>
      {notes.map(note => (
        <div key={note.id}>
          <h3>{note.title}</h3>
          <p>
            {noteTranslations.createdAt}: {formatDate(note.createdAt)}
          </p>
          <p>
            {noteTranslations.updatedAt}: {formatRelativeTime(note.updatedAt)}
          </p>
        </div>
      ))}
    </div>
  );
}

// ============================================
// 示例 6: 搜索和筛选
// Example 6: Search and filter
// ============================================

export function SearchExample() {
  const searchTranslations = getTranslations('search');
  const commonTranslations = getTranslations('common');
  
  return (
    <div>
      <input 
        type="search" 
        placeholder={searchTranslations.searchPlaceholder}
      />
      <button>{commonTranslations.search}</button>
      <button>{searchTranslations.clearFilters}</button>
    </div>
  );
}

// ============================================
// 示例 7: 错误处理
// Example 7: Error handling
// ============================================

export function ErrorExample({ error }: { error: Error }) {
  const errorTranslations = getTranslations('errors');
  
  return (
    <div>
      <h2>{errorTranslations.generic}</h2>
      <p>{error.message}</p>
    </div>
  );
}

// ============================================
// 示例 8: 对话框确认
// Example 8: Dialog confirmation
// ============================================

export function DeleteConfirmExample({ onConfirm }: { onConfirm: () => void }) {
  const dialogTranslations = getTranslations('dialog');
  const noteTranslations = getTranslations('notes');
  const commonTranslations = getTranslations('common');
  
  return (
    <div>
      <h3>{noteTranslations.deleteNote}</h3>
      <p>{noteTranslations.deleteConfirm}</p>
      <p>{dialogTranslations.cannotUndo}</p>
      <button onClick={onConfirm}>{commonTranslations.confirm}</button>
      <button>{commonTranslations.cancel}</button>
    </div>
  );
}
