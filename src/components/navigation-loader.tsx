'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CreativeLoader } from './ui/creative-loader';

/**
 * 全局导航加载指示器
 * 在页面切换时显示加载动画
 */
export function NavigationLoader() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  useEffect(() => {
    // 当路径改变时，显示加载动画
    if (pathname !== prevPathname) {
      setIsLoading(true);
      setPrevPathname(pathname);

      // 短暂延迟后隐藏加载动画
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [pathname, prevPathname]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
        >
          <CreativeLoader variant="orbit" size="lg" message="加载中..." />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
