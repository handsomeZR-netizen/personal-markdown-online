'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Key } from 'lucide-react';
import { isUsingFreeAPI } from '@/lib/ai/config';

export function APIStatusBadge() {
  const [isFree, setIsFree] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkFreeAPI = () => setIsFree(isUsingFreeAPI());
    checkFreeAPI();
    
    // 监听storage变化
    window.addEventListener('storage', checkFreeAPI);
    return () => window.removeEventListener('storage', checkFreeAPI);
  }, []);

  // 避免水合不匹配
  if (!mounted) {
    return null;
  }

  if (isFree) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-xs font-medium">
        <Sparkles className="h-3 w-3" />
        使用默认免费 API
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-medium">
      <Key className="h-3 w-3" />
      使用自定义 API
    </div>
  );
}
