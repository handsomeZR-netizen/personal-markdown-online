'use client';

import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState, useCallback, useRef, useEffect, ReactNode, MouseEvent } from 'react';

// 交互式加载动画 - 带有点击反馈效果
interface InteractiveLoaderProps {
  children: ReactNode;
  onClick?: () => Promise<void> | void;
  disabled?: boolean;
  className?: string;
  loaderVariant?: 'ripple' | 'scale' | 'glow' | 'shake' | 'slide';
  loaderColor?: string;
  showRipple?: boolean;
  hapticFeedback?: boolean;
}

export function InteractiveLoader({
  children,
  onClick,
  disabled = false,
  className,
  loaderVariant = 'ripple',
  loaderColor,
  showRipple = true,
  hapticFeedback = true,
}: InteractiveLoaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const rippleIdRef = useRef(0);

  // 触发触觉反馈（如果支持）
  const triggerHaptic = useCallback(() => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [hapticFeedback]);

  // 添加水波纹效果
  const addRipple = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!showRipple || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = rippleIdRef.current++;

    setRipples(prev => [...prev, { x, y, id }]);

    // 自动移除水波纹
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
  }, [showRipple]);

  // 处理点击
  const handleClick = useCallback(async (e: MouseEvent<HTMLDivElement>) => {
    if (disabled || isLoading) return;

    addRipple(e);
    triggerHaptic();

    if (onClick) {
      const result = onClick();
      if (result instanceof Promise) {
        setIsLoading(true);
        try {
          await result;
        } finally {
          // 最小加载时间
          await new Promise(resolve => setTimeout(resolve, 300));
          setIsLoading(false);
        }
      }
    }
  }, [disabled, isLoading, onClick, addRipple, triggerHaptic]);

  // 加载动画变体
  const loadingVariants = {
    ripple: {
      scale: [1, 1.02, 1],
      transition: { duration: 0.3, repeat: Infinity, repeatDelay: 0.5 },
    },
    scale: {
      scale: [1, 0.98, 1],
      transition: { duration: 0.2, repeat: Infinity },
    },
    glow: {
      boxShadow: [
        '0 0 0 0 rgba(var(--primary), 0.4)',
        '0 0 20px 5px rgba(var(--primary), 0.2)',
        '0 0 0 0 rgba(var(--primary), 0)',
      ],
      transition: { duration: 1, repeat: Infinity },
    },
    shake: {
      x: [0, -2, 2, -2, 2, 0],
      transition: { duration: 0.4, repeat: Infinity, repeatDelay: 0.3 },
    },
    slide: {
      x: [0, 5, 0],
      transition: { duration: 0.5, repeat: Infinity },
    },
  };

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={handleClick}
      animate={isLoading ? loadingVariants[loaderVariant] : undefined}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
    >
      {/* 水波纹效果 */}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            className={cn(
              'absolute rounded-full pointer-events-none',
              loaderColor ? '' : 'bg-primary/30'
            )}
            style={{
              left: ripple.x,
              top: ripple.y,
              backgroundColor: loaderColor ? `${loaderColor}30` : undefined,
            }}
            initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0.5 }}
            animate={{ width: 200, height: 200, x: -100, y: -100, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* 加载指示器覆盖层 */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px] z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingSpinner color={loaderColor} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 子内容 */}
      <div className={cn(isLoading && 'opacity-50')}>
        {children}
      </div>
    </motion.div>
  );
}

// 简单的加载旋转器
function LoadingSpinner({ color }: { color?: string }) {
  return (
    <motion.div
      className={cn(
        'w-5 h-5 border-2 border-t-transparent rounded-full',
        color ? '' : 'border-primary'
      )}
      style={color ? { borderColor: color, borderTopColor: 'transparent' } : undefined}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// 卡片点击加载效果
interface CardLoaderProps {
  children: ReactNode;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
  loadingMessage?: string;
}

export function CardLoader({
  children,
  isLoading = false,
  onClick,
  className,
  loadingMessage,
}: CardLoaderProps) {
  return (
    <motion.div
      className={cn(
        'relative rounded-lg overflow-hidden transition-shadow',
        onClick && 'cursor-pointer hover:shadow-lg',
        className
      )}
      onClick={onClick}
      whileHover={onClick ? { y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
    >
      {/* 加载覆盖层 */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            {loadingMessage && (
              <motion.p
                className="mt-3 text-sm text-muted-foreground"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {loadingMessage}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 顶部加载进度条 */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="absolute top-0 left-0 right-0 h-1 bg-muted z-30 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="h-full bg-primary"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </motion.div>
  );
}

// 列表项加载效果
interface ListItemLoaderProps {
  children: ReactNode;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
  index?: number;
}

export function ListItemLoader({
  children,
  isLoading = false,
  onClick,
  className,
  index = 0,
}: ListItemLoaderProps) {
  return (
    <motion.div
      className={cn(
        'relative overflow-hidden',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={onClick ? { backgroundColor: 'rgba(var(--accent), 0.1)' } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
    >
      {/* 左侧加载指示条 */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            style={{ originY: 0 }}
          />
        )}
      </AnimatePresence>

      {/* 加载时的脉冲效果 */}
      <motion.div
        className={cn(isLoading && 'opacity-70')}
        animate={isLoading ? { opacity: [0.7, 1, 0.7] } : { opacity: 1 }}
        transition={isLoading ? { duration: 1.5, repeat: Infinity } : undefined}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// 按钮点击加载效果
interface ButtonLoaderWrapperProps {
  children: ReactNode;
  isLoading?: boolean;
  onClick?: () => Promise<void> | void;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function ButtonLoaderWrapper({
  children,
  isLoading = false,
  onClick,
  disabled = false,
  className,
  variant = 'default',
  size = 'md',
}: ButtonLoaderWrapperProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = isLoading || internalLoading;

  const handleClick = useCallback(async () => {
    if (disabled || loading || !onClick) return;

    const result = onClick();
    if (result instanceof Promise) {
      setInternalLoading(true);
      try {
        await result;
      } finally {
        await new Promise(resolve => setTimeout(resolve, 300));
        setInternalLoading(false);
      }
    }
  }, [disabled, loading, onClick]);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  };

  return (
    <motion.button
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      onClick={handleClick}
      disabled={disabled || loading}
      whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loader"
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
            <span>加载中...</span>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// 图标按钮加载效果
interface IconButtonLoaderProps {
  icon: ReactNode;
  loadingIcon?: ReactNode;
  isLoading?: boolean;
  onClick?: () => Promise<void> | void;
  disabled?: boolean;
  className?: string;
  title?: string;
}

export function IconButtonLoader({
  icon,
  loadingIcon,
  isLoading = false,
  onClick,
  disabled = false,
  className,
  title,
}: IconButtonLoaderProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = isLoading || internalLoading;

  const handleClick = useCallback(async () => {
    if (disabled || loading || !onClick) return;

    const result = onClick();
    if (result instanceof Promise) {
      setInternalLoading(true);
      try {
        await result;
      } finally {
        await new Promise(resolve => setTimeout(resolve, 300));
        setInternalLoading(false);
      }
    }
  }, [disabled, loading, onClick]);

  return (
    <motion.button
      className={cn(
        'relative inline-flex items-center justify-center w-10 h-10 rounded-lg',
        'hover:bg-accent transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      onClick={handleClick}
      disabled={disabled || loading}
      title={title}
      whileTap={!disabled && !loading ? { scale: 0.9 } : undefined}
      whileHover={!disabled && !loading ? { scale: 1.05 } : undefined}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
          >
            {loadingIcon || (
              <motion.div
                className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="icon"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {icon}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
