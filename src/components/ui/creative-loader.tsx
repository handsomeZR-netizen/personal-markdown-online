'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type LoaderVariant = 'dots' | 'pulse' | 'orbit' | 'wave' | 'bounce' | 'flip';

interface CreativeLoaderProps {
  variant?: LoaderVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
}

export function CreativeLoader({
  variant = 'orbit',
  size = 'md',
  className,
  message,
}: CreativeLoaderProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const loaders = {
    dots: <DotsLoader size={size} />,
    pulse: <PulseLoader size={size} />,
    orbit: <OrbitLoader size={size} />,
    wave: <WaveLoader size={size} />,
    bounce: <BounceLoader size={size} />,
    flip: <FlipLoader size={size} />,
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className={sizeClasses[size]}>{loaders[variant]}</div>
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-gray-600 dark:text-gray-400"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}

// 1. 轨道旋转加载器 - 最有趣的一个
function OrbitLoader({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const dotSize = size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4';
  
  return (
    <div className="relative w-full h-full">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{
            duration: 2 + i * 0.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <div
            className={cn(
              dotSize,
              'absolute top-0 left-1/2 -translate-x-1/2 rounded-full',
              i === 0 && 'bg-gray-900 dark:bg-gray-100',
              i === 1 && 'bg-gray-600 dark:bg-gray-400',
              i === 2 && 'bg-gray-400 dark:bg-gray-600'
            )}
          />
        </motion.div>
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className={cn(
            'rounded-full bg-gray-800 dark:bg-gray-200',
            size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-6 h-6'
          )}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
    </div>
  );
}

// 2. 脉冲波纹加载器
function PulseLoader({ size }: { size: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border-4 border-gray-900 dark:border-gray-100"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeOut',
          }}
        />
      ))}
      <div className={cn(
        'rounded-full bg-gray-900 dark:bg-gray-100',
        size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'
      )} />
    </div>
  );
}

// 3. 跳跃点加载器
function DotsLoader({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const dotSize = size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4';
  
  return (
    <div className="flex items-center justify-center gap-2 w-full h-full">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className={cn(dotSize, 'rounded-full bg-gray-900 dark:bg-gray-100')}
          animate={{
            y: [0, -15, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// 4. 波浪加载器
function WaveLoader({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const barWidth = size === 'sm' ? 'w-1' : size === 'md' ? 'w-1.5' : 'w-2';
  const barHeight = size === 'sm' ? 'h-8' : size === 'md' ? 'h-12' : 'h-16';
  
  return (
    <div className="flex items-center justify-center gap-1 w-full h-full">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className={cn(barWidth, barHeight, 'bg-gray-900 dark:bg-gray-100 rounded-full')}
          animate={{
            scaleY: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// 5. 弹跳方块加载器
function BounceLoader({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const boxSize = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-6 h-6';
  
  return (
    <div className="relative w-full h-full">
      <motion.div
        className={cn(boxSize, 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-gray-900 dark:bg-gray-100')}
        animate={{
          rotate: [0, 180, 360],
          borderRadius: ['20%', '50%', '20%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

// 6. 翻转卡片加载器
function FlipLoader({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const cardSize = size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : 'w-16 h-16';
  
  return (
    <motion.div
      className={cn(cardSize, 'rounded-lg bg-gray-900 dark:bg-gray-100')}
      style={{ perspective: 1000 }}
      animate={{
        rotateY: [0, 180, 360],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// 全屏加载覆盖层
export function LoadingOverlay({
  variant = 'orbit',
  message,
  blur = true,
}: {
  variant?: LoaderVariant;
  message?: string;
  blur?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        blur ? 'backdrop-blur-sm bg-white/80 dark:bg-gray-900/80' : 'bg-white/90 dark:bg-gray-900/90'
      )}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700"
      >
        <CreativeLoader variant={variant} size="lg" message={message} />
      </motion.div>
    </motion.div>
  );
}

// 按钮内加载状态
export function ButtonLoader({ variant = 'dots', size = 'sm' }: { variant?: LoaderVariant; size?: 'sm' | 'md' }) {
  return <CreativeLoader variant={variant} size={size} className="py-0" />;
}
