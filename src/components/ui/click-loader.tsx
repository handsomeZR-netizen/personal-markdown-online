'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState, useCallback, createContext, useContext, ReactNode } from 'react';

// 点击加载动画变体
export type ClickLoaderVariant = 
  | 'ripple'      // 水波纹扩散
  | 'pulse'       // 脉冲闪烁
  | 'spinner'     // 旋转圆环
  | 'dots'        // 跳动点
  | 'progress'    // 进度条
  | 'bounce'      // 弹跳
  | 'morph'       // 形变
  | 'glow';       // 发光

interface ClickLoaderProps {
  variant?: ClickLoaderVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

// 尺寸配置
const sizeConfig = {
  xs: { container: 'w-4 h-4', dot: 'w-1 h-1', ring: 'w-4 h-4' },
  sm: { container: 'w-6 h-6', dot: 'w-1.5 h-1.5', ring: 'w-6 h-6' },
  md: { container: 'w-8 h-8', dot: 'w-2 h-2', ring: 'w-8 h-8' },
  lg: { container: 'w-12 h-12', dot: 'w-3 h-3', ring: 'w-12 h-12' },
};

export function ClickLoader({ 
  variant = 'spinner', 
  size = 'sm',
  color,
  className 
}: ClickLoaderProps) {
  const sizes = sizeConfig[size];
  
  const loaders: Record<ClickLoaderVariant, JSX.Element> = {
    ripple: <RippleLoader sizes={sizes} color={color} />,
    pulse: <PulseLoader sizes={sizes} color={color} />,
    spinner: <SpinnerLoader sizes={sizes} color={color} />,
    dots: <DotsLoader sizes={sizes} color={color} />,
    progress: <ProgressLoader sizes={sizes} color={color} />,
    bounce: <BounceLoader sizes={sizes} color={color} />,
    morph: <MorphLoader sizes={sizes} color={color} />,
    glow: <GlowLoader sizes={sizes} color={color} />,
  };

  return (
    <div className={cn('inline-flex items-center justify-center', sizes.container, className)}>
      {loaders[variant]}
    </div>
  );
}

// 水波纹加载器
function RippleLoader({ sizes, color }: { sizes: typeof sizeConfig.sm; color?: string }) {
  return (
    <div className="relative w-full h-full">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn(
            'absolute inset-0 rounded-full border-2',
            color ? '' : 'border-primary'
          )}
          style={color ? { borderColor: color } : undefined}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// 脉冲加载器
function PulseLoader({ sizes, color }: { sizes: typeof sizeConfig.sm; color?: string }) {
  return (
    <motion.div
      className={cn(
        'w-full h-full rounded-full',
        color ? '' : 'bg-primary'
      )}
      style={color ? { backgroundColor: color } : undefined}
      animate={{
        scale: [1, 1.3, 1],
        opacity: [1, 0.5, 1],
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// 旋转圆环加载器
function SpinnerLoader({ sizes, color }: { sizes: typeof sizeConfig.sm; color?: string }) {
  return (
    <motion.div
      className={cn(
        'w-full h-full rounded-full border-2 border-t-transparent',
        color ? '' : 'border-primary'
      )}
      style={color ? { borderColor: color, borderTopColor: 'transparent' } : undefined}
      animate={{ rotate: 360 }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

// 跳动点加载器
function DotsLoader({ sizes, color }: { sizes: typeof sizeConfig.sm; color?: string }) {
  return (
    <div className="flex items-center justify-center gap-0.5 w-full h-full">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn(
            sizes.dot,
            'rounded-full',
            color ? '' : 'bg-primary'
          )}
          style={color ? { backgroundColor: color } : undefined}
          animate={{
            y: [0, -4, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// 进度条加载器
function ProgressLoader({ sizes, color }: { sizes: typeof sizeConfig.sm; color?: string }) {
  return (
    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
      <motion.div
        className={cn(
          'h-full rounded-full',
          color ? '' : 'bg-primary'
        )}
        style={color ? { backgroundColor: color } : undefined}
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

// 弹跳加载器
function BounceLoader({ sizes, color }: { sizes: typeof sizeConfig.sm; color?: string }) {
  return (
    <motion.div
      className={cn(
        'w-3/4 h-3/4 rounded-lg',
        color ? '' : 'bg-primary'
      )}
      style={color ? { backgroundColor: color } : undefined}
      animate={{
        y: [0, -8, 0],
        scaleY: [1, 0.8, 1],
        scaleX: [1, 1.1, 1],
      }}
      transition={{
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// 形变加载器
function MorphLoader({ sizes, color }: { sizes: typeof sizeConfig.sm; color?: string }) {
  return (
    <motion.div
      className={cn(
        'w-3/4 h-3/4',
        color ? '' : 'bg-primary'
      )}
      style={color ? { backgroundColor: color } : undefined}
      animate={{
        borderRadius: ['20%', '50%', '20%'],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// 发光加载器
function GlowLoader({ sizes, color }: { sizes: typeof sizeConfig.sm; color?: string }) {
  return (
    <motion.div
      className={cn(
        'w-3/4 h-3/4 rounded-full',
        color ? '' : 'bg-primary'
      )}
      style={color ? { backgroundColor: color } : undefined}
      animate={{
        boxShadow: [
          '0 0 0 0 rgba(var(--primary), 0.4)',
          '0 0 0 10px rgba(var(--primary), 0)',
          '0 0 0 0 rgba(var(--primary), 0)',
        ],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// 点击加载状态上下文
interface ClickLoadingState {
  [key: string]: boolean;
}

interface ClickLoadingContextType {
  loadingStates: ClickLoadingState;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
  withClickLoading: <T>(key: string, fn: () => Promise<T>) => Promise<T>;
}

const ClickLoadingContext = createContext<ClickLoadingContextType | undefined>(undefined);

export function ClickLoadingProvider({ children }: { children: ReactNode }) {
  const [loadingStates, setLoadingStates] = useState<ClickLoadingState>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] ?? false;
  }, [loadingStates]);

  const withClickLoading = useCallback(async <T,>(key: string, fn: () => Promise<T>): Promise<T> => {
    setLoading(key, true);
    try {
      const result = await fn();
      return result;
    } finally {
      // 最小显示时间300ms，避免闪烁
      await new Promise(resolve => setTimeout(resolve, 300));
      setLoading(key, false);
    }
  }, [setLoading]);

  return (
    <ClickLoadingContext.Provider value={{ loadingStates, setLoading, isLoading, withClickLoading }}>
      {children}
    </ClickLoadingContext.Provider>
  );
}

export function useClickLoading() {
  const context = useContext(ClickLoadingContext);
  if (!context) {
    throw new Error('useClickLoading must be used within ClickLoadingProvider');
  }
  return context;
}

// 可点击加载按钮包装器
interface ClickableWithLoaderProps {
  children: ReactNode;
  loadingKey: string;
  variant?: ClickLoaderVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  loaderPosition?: 'left' | 'right' | 'center' | 'replace';
}

export function ClickableWithLoader({
  children,
  loadingKey,
  variant = 'spinner',
  size = 'sm',
  className,
  loaderPosition = 'left',
}: ClickableWithLoaderProps) {
  const { isLoading } = useClickLoading();
  const loading = isLoading(loadingKey);

  if (loaderPosition === 'replace' && loading) {
    return (
      <div className={cn('inline-flex items-center justify-center', className)}>
        <ClickLoader variant={variant} size={size} />
      </div>
    );
  }

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <AnimatePresence>
        {loading && loaderPosition === 'left' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <ClickLoader variant={variant} size={size} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {loaderPosition === 'center' && loading ? (
        <ClickLoader variant={variant} size={size} />
      ) : (
        children
      )}
      
      <AnimatePresence>
        {loading && loaderPosition === 'right' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <ClickLoader variant={variant} size={size} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
