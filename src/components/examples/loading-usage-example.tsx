'use client';

/**
 * 加载动画实际使用示例
 * 
 * 这个文件展示了如何在真实场景中使用新的加载动画系统
 */

import { useState } from 'react';
import { AsyncButton, LoadingButton } from '@/components/ui/loading-button';
import { LoadingContainer, InlineLoader } from '@/components/ui/with-loading';
import { useLoading, useLoadingAction } from '@/hooks/use-loading';
import { useSmartLoading, useBatchProgress } from '@/hooks/use-smart-loading';

// ============================================
// 示例 1: 简单的保存按钮
// ============================================
export function SaveNoteExample() {
  const saveNote = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('笔记已保存');
  };

  return (
    <AsyncButton
      onClick={saveNote}
      loaderVariant="orbit"
      successMessage="保存成功！"
    >
      保存笔记
    </AsyncButton>
  );
}

// ============================================
// 示例 2: 带确认的删除操作
// ============================================
export function DeleteNoteExample({ noteId }: { noteId: string }) {
  const { showLoading, hideLoading } = useLoading();

  const handleDelete = async () => {
    if (!confirm('确定要删除这条笔记吗？')) return;

    showLoading('正在删除...', 'bounce');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('笔记已删除:', noteId);
    } finally {
      hideLoading();
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
    >
      删除
    </button>
  );
}

// ============================================
// 示例 3: 列表加载
// ============================================
export function NoteListExample() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 模拟加载数据
  useState(() => {
    setTimeout(() => {
      setNotes([
        { id: 1, title: '笔记 1' },
        { id: 2, title: '笔记 2' },
        { id: 3, title: '笔记 3' },
      ]);
      setLoading(false);
    }, 2000);
  });

  return (
    <LoadingContainer
      isLoading={loading}
      variant="wave"
      message="加载笔记列表..."
    >
      <div className="space-y-2">
        {notes.map(note => (
          <div key={note.id} className="p-4 border rounded">
            {note.title}
          </div>
        ))}
      </div>
    </LoadingContainer>
  );
}

// ============================================
// 示例 4: 表单提交
// ============================================
export function LoginFormExample() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('登录成功');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="邮箱"
        className="w-full px-4 py-2 border rounded"
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="密码"
        className="w-full px-4 py-2 border rounded"
      />
      <LoadingButton
        type="submit"
        loading={loading}
        loaderVariant="pulse"
        loadingText="登录中..."
        className="w-full"
      >
        登录
      </LoadingButton>
    </form>
  );
}

// ============================================
// 示例 5: 使用 withLoading 包装器
// ============================================
export function SyncDataExample() {
  const { withLoading } = useLoadingAction();

  const handleSync = async () => {
    await withLoading(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('数据同步完成');
      },
      '正在同步数据...',
      'pulse'
    );
  };

  return (
    <button
      onClick={handleSync}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      同步数据
    </button>
  );
}

// ============================================
// 示例 6: 智能加载（带重试）
// ============================================
export function SmartLoadingExample() {
  const { loading, error, execute } = useSmartLoading({
    minTime: 300,
    maxTime: 10000,
    retries: 3,
  });

  const handleLoad = async () => {
    try {
      await execute(async () => {
        // 模拟可能失败的操作
        if (Math.random() > 0.7) {
          throw new Error('网络错误');
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        return '数据加载成功';
      });
    } catch (err) {
      console.error('加载失败:', err);
    }
  };

  return (
    <div className="space-y-2">
      <LoadingButton
        loading={loading}
        loaderVariant="orbit"
        onClick={handleLoad}
      >
        智能加载
      </LoadingButton>
      {error && (
        <p className="text-red-500 text-sm">错误: {error.message}</p>
      )}
    </div>
  );
}

// ============================================
// 示例 7: 批量操作进度
// ============================================
export function BatchOperationExample() {
  const { progress, loading, execute } = useBatchProgress<number>();

  const handleBatchProcess = async () => {
    const items = Array.from({ length: 10 }, (_, i) => i + 1);

    await execute(items, async (item, index) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`处理项目 ${item}`);
    });
  };

  return (
    <div className="space-y-4">
      <LoadingButton
        loading={loading}
        loaderVariant="wave"
        onClick={handleBatchProcess}
      >
        批量处理
      </LoadingButton>

      {loading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>进度: {progress.current} / {progress.total}</span>
            <span>{progress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 示例 8: 内联加载指示器
// ============================================
export function InlineLoadingExample() {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSyncing(false);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleSync}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        开始同步
      </button>

      {syncing && (
        <InlineLoader variant="dots" message="正在同步到云端..." />
      )}
    </div>
  );
}

// ============================================
// 示例 9: 覆盖层模式
// ============================================
export function OverlayLoadingExample() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleRefresh}
        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
      >
        刷新数据
      </button>

      <LoadingContainer
        isLoading={refreshing}
        variant="flip"
        message="刷新中..."
        overlay={true}
        className="min-h-[200px]"
      >
        <div className="p-6 border rounded">
          <h3 className="text-lg font-bold mb-2">数据内容</h3>
          <p>这里是一些数据内容...</p>
          <p>刷新时会显示覆盖层</p>
        </div>
      </LoadingContainer>
    </div>
  );
}

// ============================================
// 组合示例：完整的笔记编辑器
// ============================================
export function CompleteNoteEditorExample() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const { showLoading, hideLoading } = useLoading();

  // 手动保存
  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('笔记已保存');
    } finally {
      setSaving(false);
    }
  };

  // 自动保存
  const handleAutoSave = async () => {
    setAutoSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setAutoSaving(false);
  };

  // 发布
  const handlePublish = async () => {
    showLoading('正在发布笔记...', 'orbit');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('笔记已发布');
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <input
        type="text"
        value={title}
        onChange={e => {
          setTitle(e.target.value);
          handleAutoSave();
        }}
        placeholder="笔记标题"
        className="w-full px-4 py-2 border rounded"
      />

      <textarea
        value={content}
        onChange={e => {
          setContent(e.target.value);
          handleAutoSave();
        }}
        placeholder="笔记内容"
        className="w-full px-4 py-2 border rounded h-32"
      />

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <LoadingButton
            loading={saving}
            loaderVariant="orbit"
            onClick={handleSave}
          >
            保存
          </LoadingButton>

          <AsyncButton
            onClick={handlePublish}
            loaderVariant="pulse"
            variant="outline"
          >
            发布
          </AsyncButton>
        </div>

        {autoSaving && (
          <InlineLoader variant="dots" message="自动保存中..." />
        )}
      </div>
    </div>
  );
}
