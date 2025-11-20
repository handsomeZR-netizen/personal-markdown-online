# 国际化 (i18n) 使用指南

本项目使用中文作为主要语言，所有UI文本、标签和消息都已翻译为中文。

## 文件结构

```
src/lib/i18n/
├── index.ts          # 翻译工具函数
├── zh-CN.ts          # 中文翻译文件
├── date-format.ts    # 日期格式化工具
└── README.md         # 使用文档
```

## 基本使用

### 1. 导入翻译函数

```typescript
import { t, getTranslations } from '@/lib/i18n';
```

### 2. 使用翻译

#### 方式一：使用 `t()` 函数

```typescript
// 在组件中使用
const loginText = t('auth.login'); // '登录'
const createNote = t('notes.createNote'); // '创建笔记'
const appName = t('common.appName'); // '笔记管理平台'
```

#### 方式二：使用 `getTranslations()` 获取分类

```typescript
// 获取整个分类的翻译
const authTranslations = getTranslations('auth');

console.log(authTranslations.login); // '登录'
console.log(authTranslations.register); // '注册'
console.log(authTranslations.logout); // '退出登录'
```

### 3. 在组件中使用

#### React Server Component

```typescript
import { t } from '@/lib/i18n';

export default function LoginPage() {
  return (
    <div>
      <h1>{t('auth.login')}</h1>
      <form>
        <label>{t('auth.email')}</label>
        <input type="email" placeholder={t('auth.email')} />
        
        <label>{t('auth.password')}</label>
        <input type="password" placeholder={t('auth.password')} />
        
        <button type="submit">{t('auth.login')}</button>
      </form>
    </div>
  );
}
```

#### React Client Component

```typescript
'use client';

import { t } from '@/lib/i18n';
import { toast } from 'sonner';

export function NoteForm() {
  const handleSubmit = async () => {
    try {
      // ... 保存逻辑
      toast.success(t('notes.createSuccess'));
    } catch (error) {
      toast.error(t('notes.createError'));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder={t('notes.title')} />
      <textarea placeholder={t('notes.content')} />
      <button type="submit">{t('common.save')}</button>
    </form>
  );
}
```

## 日期格式化

### 导入日期格式化函数

```typescript
import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatRelativeDate,
  formatWithPreset,
  dateFormats,
} from '@/lib/i18n/date-format';
```

### 使用示例

```typescript
const now = new Date();

// 基本格式化
formatDate(now); // '2024年1月1日'
formatDateTime(now); // '2024年1月1日 14:30'
formatTime(now); // '14:30:45'

// 相对时间
formatRelativeTime(now); // '几秒前'
formatRelativeTime(subDays(now, 1)); // '1天前'
formatRelativeDate(now); // '今天 14:30'

// 使用预设格式
formatWithPreset(now, 'full'); // '2024年1月1日 14:30:45'
formatWithPreset(now, 'shortDate'); // '2024/1/1'
formatWithPreset(now, 'iso'); // '2024-01-01'

// 自定义格式
formatDate(now, 'yyyy年M月d日 EEEE'); // '2024年1月1日 星期一'
```

### 在组件中使用

```typescript
import { formatRelativeTime, formatDateTime } from '@/lib/i18n/date-format';

export function NoteCard({ note }) {
  return (
    <div>
      <h3>{note.title}</h3>
      <p>{formatRelativeTime(note.createdAt)}</p>
      <small>{formatDateTime(note.updatedAt)}</small>
    </div>
  );
}
```

## 可用的翻译分类

- `common` - 通用文本（保存、取消、确认等）
- `auth` - 认证相关（登录、注册、退出等）
- `notes` - 笔记相关（创建、编辑、删除等）
- `tags` - 标签相关
- `categories` - 分类相关
- `search` - 搜索和筛选
- `pagination` - 分页
- `sort` - 排序
- `theme` - 主题
- `navigation` - 导航
- `editor` - Markdown编辑器
- `ai` - AI功能
- `errors` - 错误消息
- `success` - 成功消息
- `dialog` - 对话框
- `shortcuts` - 快捷键
- `responsive` - 响应式
- `accessibility` - 无障碍

## 添加新的翻译

如需添加新的翻译，请编辑 `zh-CN.ts` 文件：

```typescript
export const translations = {
  // ... 现有翻译
  
  // 添加新的分类
  newCategory: {
    newKey: '新的翻译文本',
    anotherKey: '另一个翻译',
  },
} as const;
```

然后在代码中使用：

```typescript
t('newCategory.newKey'); // '新的翻译文本'
```

## 最佳实践

1. **始终使用翻译函数**：不要在代码中硬编码中文文本
2. **语义化的键名**：使用清晰的键名，如 `auth.login` 而不是 `text1`
3. **分类组织**：将相关的翻译放在同一分类下
4. **日期使用中文格式**：使用提供的日期格式化函数，确保日期显示为中文格式
5. **错误处理**：如果翻译键不存在，函数会返回键名本身并在控制台警告

## TypeScript 支持

所有翻译函数都有完整的 TypeScript 类型支持：

```typescript
// 类型安全的翻译
const translations = getTranslations('auth');
translations.login; // ✅ 类型正确
translations.invalidKey; // ❌ TypeScript 错误

// 自动补全
t('auth.'); // IDE 会显示所有可用的键
```
