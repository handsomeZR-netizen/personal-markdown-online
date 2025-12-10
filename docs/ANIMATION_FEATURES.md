# 动画功能说明

## 新增动画效果

使用 Framer Motion 为应用添加了丰富的动画效果，提升用户体验。

## 主要功能

### 1. 欢迎区域 (WelcomeSection)
- **渐入动画**：页面加载时元素依次淡入
- **弹簧动画**：标题和按钮使用弹簧效果
- **悬停效果**：按钮悬停时放大
- **点击反馈**：按钮点击时缩小

**位置**：`src/components/dashboard/welcome-section.tsx`

### 2. 统计卡片 (StatsCards)
- **交错动画**：卡片依次出现
- **悬停提升**：鼠标悬停时卡片上浮
- **图标旋转**：悬停时图标旋转 360°
- **数字动画**：数字淡入效果

**位置**：`src/components/dashboard/stats-cards.tsx`

### 3. 笔记卡片 (AnimatedNoteCard)
- **入场动画**：从下方滑入
- **悬停效果**：卡片上浮并增强阴影
- **边框动画**：悬停时边框颜色变化
- **按钮动画**：编辑和删除按钮的缩放效果

**位置**：`src/components/dashboard/animated-note-card.tsx`

### 4. 浮动操作按钮 (FAB)
- **展开动画**：点击后展开快捷操作
- **旋转效果**：主按钮旋转 45°
- **交错显示**：子按钮依次出现
- **标签动画**：悬停时标签滑入

**位置**：`src/components/dashboard/floating-action-button.tsx`

### 5. 功能介绍卡片
- **图标动画**：图标从旋转状态弹入
- **悬停提升**：卡片悬停时上浮
- **渐变背景**：使用渐变色增强视觉效果

## 动画参数

### 弹簧动画
```typescript
{
  type: "spring",
  stiffness: 100-400,  // 刚度
  damping: 17-20,      // 阻尼
}
```

### 交错动画
```typescript
{
  staggerChildren: 0.1,  // 子元素延迟
  delayChildren: 0.2,    // 初始延迟
}
```

### 悬停效果
```typescript
whileHover={{ 
  scale: 1.05,    // 放大 5%
  y: -5,          // 上移 5px
}}
```

### 点击效果
```typescript
whileTap={{ 
  scale: 0.95     // 缩小 5%
}}
```

## 性能优化

1. **使用 `motion.div`**：只在需要动画的元素上使用
2. **避免过度动画**：保持动画简洁流畅
3. **使用 `AnimatePresence`**：处理元素的进入和退出
4. **硬件加速**：使用 `transform` 和 `opacity` 属性

## 自定义动画

### 添加新动画
```typescript
const customVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5 }
  }
}

<motion.div
  variants={customVariants}
  initial="hidden"
  animate="visible"
>
  内容
</motion.div>
```

### 手势动画
```typescript
<motion.div
  drag
  dragConstraints={{ left: 0, right: 300 }}
  whileDrag={{ scale: 1.1 }}
>
  可拖拽元素
</motion.div>
```

## 浏览器兼容性

- Chrome/Edge: 完全支持
- Firefox: 完全支持
- Safari: 完全支持
- 移动浏览器: 完全支持

## 注意事项

1. 动画会增加初始包大小（~30KB gzipped）
2. 在低性能设备上可能需要减少动画
3. 使用 `prefers-reduced-motion` 媒体查询尊重用户偏好
4. 避免在列表中使用过多复杂动画

## 未来改进

- [ ] 添加主题切换动画
- [ ] 页面路由过渡动画
- [ ] 加载状态骨架屏动画
- [ ] 通知消息动画
- [ ] 模态框动画
