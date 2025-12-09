# 🎨 加载动画系统

## 🎉 欢迎使用新的加载动画系统！

你的应用现在拥有一套专业、有趣、不俗套的加载动画系统！

## ✨ 特色

- 🌀 **6 种独特动画** - Orbit, Pulse, Dots, Wave, Bounce, Flip
- 🚀 **开箱即用** - 已集成到应用中，立即可用
- 🎯 **多种使用方式** - 按钮、全局、容器、内联
- 🧠 **智能功能** - 防闪烁、超时、重试、进度跟踪
- 📱 **响应式设计** - 完美适配所有设备
- 🌙 **暗色模式** - 自动适配主题
- ♿ **无障碍支持** - 符合 WCAG 标准
- ⚡ **性能优异** - GPU 加速，流畅运行

## 🚀 快速开始

### 1. 查看演示

```bash
npm run dev
```

访问 http://localhost:3000/loading-demo 查看所有动画效果

### 2. 最简单的用法

```tsx
import { AsyncButton } from '@/components/ui/loading-button';

<AsyncButton onClick={async () => await saveNote()}>
  保存
</AsyncButton>
```

就这么简单！按钮会自动显示加载动画。

### 3. 全局加载

```tsx
import { useLoading } from '@/hooks/use-loading';

const { showLoading, hideLoading } = useLoading();

showLoading('正在处理...', 'orbit');
await doSomething();
hideLoading();
```

## 📚 文档

### 快速入门
- **5 分钟上手**: `doc/LOADING_QUICK_START.md`
- **完整指南**: `doc/LOADING_ANIMATIONS_GUIDE.md`
- **导入参考**: `doc/LOADING_IMPORTS_REFERENCE.md`
- **系统总结**: `doc/LOADING_SYSTEM_SUMMARY.md`

### 代码示例
- **使用示例**: `src/components/examples/loading-usage-example.tsx`
- **演示页面**: `src/app/loading-demo/page.tsx`
- **配置文件**: `src/config/loading.config.ts`

## 🎨 动画预览

### Orbit（轨道旋转）⭐ 最推荐
```tsx
<CreativeLoader variant="orbit" />
```
三个彩色小球围绕中心旋转，最有趣和独特

### Pulse（脉冲波纹）
```tsx
<CreativeLoader variant="pulse" />
```
从中心向外扩散的波纹效果，适合同步操作

### Dots（跳跃点）
```tsx
<CreativeLoader variant="dots" />
```
四个点依次跳跃，适合按钮内加载

### Wave（波浪）
```tsx
<CreativeLoader variant="wave" />
```
五个竖条形成波浪效果，适合数据流

### Bounce（弹跳方块）
```tsx
<CreativeLoader variant="bounce" />
```
旋转变形的方块，适合文件操作

### Flip（翻转卡片）
```tsx
<CreativeLoader variant="flip" />
```
3D 翻转效果，适合刷新操作

## 💡 使用场景

| 场景 | 推荐动画 | 示例代码 |
|-----|---------|---------|
| 保存笔记 | orbit | `<AsyncButton loaderVariant="orbit">保存</AsyncButton>` |
| 删除操作 | bounce | `showLoading('删除中...', 'bounce')` |
| 加载列表 | wave | `<LoadingContainer variant="wave">` |
| 同步数据 | pulse | `<AsyncButton loaderVariant="pulse">同步</AsyncButton>` |
| 上传文件 | flip | `<LoadingButton loaderVariant="flip">上传</LoadingButton>` |
| 按钮加载 | dots | `<AsyncButton loaderVariant="dots">提交</AsyncButton>` |

## 🛠️ 核心 API

### 组件

```tsx
// 创意加载动画
<CreativeLoader variant="orbit" size="md" message="加载中..." />

// 加载按钮
<LoadingButton loading={loading} loaderVariant="dots">保存</LoadingButton>

// 自动加载按钮
<AsyncButton onClick={async () => await save()}>保存</AsyncButton>

// 加载容器
<LoadingContainer isLoading={loading} variant="wave">
  <Content />
</LoadingContainer>

// 内联加载
<InlineLoader variant="dots" message="同步中..." />
```

### Hooks

```tsx
// 全局加载
const { showLoading, hideLoading } = useLoading();

// withLoading 包装器
const { withLoading } = useLoadingAction();

// 智能加载
const { loading, execute } = useSmartLoading();

// 批量操作
const { progress, execute } = useBatchProgress();
```

## 📦 文件结构

```
src/
├── components/
│   ├── ui/
│   │   ├── creative-loader.tsx      # 核心动画组件
│   │   ├── loading-button.tsx       # 加载按钮
│   │   ├── with-loading.tsx         # 加载容器
│   │   └── loading.ts               # 统一导出
│   ├── loading/
│   │   ├── loading-examples.tsx     # 使用示例
│   │   └── README.md                # 组件说明
│   └── examples/
│       └── loading-usage-example.tsx # 实际使用示例
├── hooks/
│   ├── use-loading.tsx              # 基础加载 Hook
│   └── use-smart-loading.ts         # 高级加载 Hooks
├── lib/
│   └── utils/
│       └── loading-helpers.ts       # 辅助函数
├── config/
│   └── loading.config.ts            # 配置文件
└── app/
    ├── layout.tsx                   # 已添加 LoadingProvider
    └── loading-demo/
        └── page.tsx                 # 演示页面

doc/
├── LOADING_QUICK_START.md           # 快速入门
├── LOADING_ANIMATIONS_GUIDE.md      # 完整指南
├── LOADING_IMPORTS_REFERENCE.md     # 导入参考
└── LOADING_SYSTEM_SUMMARY.md        # 系统总结
```

## 🎯 下一步

1. ✅ 访问 `/loading-demo` 查看所有动画
2. ✅ 阅读 `doc/LOADING_QUICK_START.md` 快速上手
3. ✅ 选择你喜欢的动画变体
4. ✅ 更新现有组件使用新的加载系统
5. ✅ 享受更好的用户体验！

## 🌟 推荐使用

### 对于新功能
使用新的加载系统：
- `AsyncButton` - 自动处理异步操作
- `useLoading` - 全局加载状态
- `LoadingContainer` - 区域加载

### 对于现有功能
逐步迁移到新系统，旧的组件仍然可用

## 💪 技术栈

- React 19
- TypeScript
- Framer Motion
- shadcn/ui
- Tailwind CSS

## 📞 需要帮助？

- 📖 查看文档：`doc/` 目录
- 💻 查看示例：`src/components/examples/`
- 🎨 在线演示：`/loading-demo`
- 🔧 配置文件：`src/config/loading.config.ts`

## 🎉 开始使用

现在就开始使用新的加载动画系统，让你的应用更加专业和有趣！

```tsx
import { AsyncButton } from '@/components/ui/loading-button';

<AsyncButton
  onClick={async () => {
    await saveNote();
  }}
  loaderVariant="orbit"
>
  保存笔记
</AsyncButton>
```

就是这么简单！🚀

---

**提示**: 所有动画都支持暗色模式，会自动适配你的主题设置。
