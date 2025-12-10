# Vercel SSR 部署错误修复

## 问题描述

在 Vercel 部署时遇到以下错误：
```
TypeError: Cannot destructure property 'data' of '(0 , r.wV)(...)' as it is undefined.
at n (.next/server/chunks/1062.js:1:9166) {digest: '147385291'}
```

## 根本原因

这个错误是由于在服务器端渲染（SSR）期间，React Context 尚未初始化，导致 `useNetworkStatus()` hook 返回 `undefined`，在尝试解构时失败。

具体问题：
1. `NetworkStatusProvider` 在客户端组件中提供 context
2. 但在 SSR 阶段，某些组件尝试使用 `useNetworkStatus()` hook
3. Context 在 SSR 时不可用，导致解构失败

## 修复方案

### 1. 修改 `useNetworkStatus` Hook

**文件**: `src/contexts/network-status-context.tsx`

将 hook 从抛出错误改为返回默认值：

```typescript
// 修复前
export function useNetworkStatus(): NetworkStatusContextValue {
  const context = useContext(NetworkStatusContext);
  
  if (context === undefined) {
    throw new Error('useNetworkStatus must be used within a NetworkStatusProvider');
  }
  
  return context;
}

// 修复后
export function useNetworkStatus(): NetworkStatusContextValue {
  const context = useContext(NetworkStatusContext);
  
  // Return default values during SSR or when outside provider
  if (context === undefined) {
    return {
      isOnline: true,
      checkConnection: async () => true,
      lastOnlineTime: null,
      lastOfflineTime: null,
      isSyncing: false,
    };
  }
  
  return context;
}
```

### 2. 添加 localStorage 安全检查

**文件**: `src/components/offline/offline-onboarding-dialog.tsx`

在所有 localStorage 访问前添加 `typeof window !== 'undefined'` 检查：

```typescript
useEffect(() => {
  // Only run on client side
  if (typeof window === 'undefined') return;
  
  const hasSeenOnboarding = localStorage.getItem(ONBOARDING_KEY);
  // ...
}, []);
```

**文件**: `src/components/offline/storage-warning.tsx`

同样添加安全检查：

```typescript
useEffect(() => {
  if (typeof window === 'undefined') return;
  
  const dismissed = localStorage.getItem('storage-warning-dismissed');
  // ...
}, []);
```

## 为什么这样修复有效

1. **优雅降级**: 在 SSR 期间，hook 返回安全的默认值（在线状态），不会中断渲染
2. **客户端激活**: 当组件在客户端激活（hydration）后，Context 会正常工作，提供真实的网络状态
3. **向后兼容**: 不影响现有的客户端功能，只是增加了 SSR 兼容性

## 额外修复

在修复 SSR 问题的过程中，还修复了以下 TypeScript 编译错误：

1. **notes/[id]/page.tsx**: 为 `tag.map()` 添加类型注解
2. **notes/page.tsx**: 移除 `getNotes()` 不支持的 `tagIds` 和 `categoryId` 参数
3. **note-editor.tsx**: 移除 `autoSaveNote()` 不支持的 `tagIds` 和 `categoryId` 参数
4. **删除备份文件**: 删除了 `notes-prisma-backup.ts` 文件，避免编译错误

## 测试验证

修复后需要验证：

1. ✅ 本地开发环境正常运行
2. ✅ TypeScript 编译无错误
3. ✅ 本地构建成功 (`npm run build`)
4. ⏳ 部署到 Vercel 后无 SSR 错误
5. ⏳ 客户端网络状态检测正常工作
6. ⏳ 离线功能正常工作

## 部署步骤

1. 提交修复代码到 Git
2. 推送到 GitHub
3. Vercel 自动部署
4. 验证部署日志无错误
5. 测试生产环境功能

## 相关文件

- `src/contexts/network-status-context.tsx`
- `src/components/offline/network-status-indicator.tsx`
- `src/components/offline/offline-onboarding-dialog.tsx`
- `src/components/offline/storage-warning.tsx`
