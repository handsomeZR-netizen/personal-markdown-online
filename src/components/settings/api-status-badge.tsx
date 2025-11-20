'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Key } from 'lucide-react';
import { isUsingFreeAPI } from '@/lib/ai/config';

export function APIStatusBadge() {
  const [isFree, setIsFree] = useState(true);

  useEffect(() => {
    const checkFreeAPI = () => setIsFree(isUsingFreeAPI());
    checkFreeAPI();
    
    // 监听storage变化
    window.addEventListener('storage', checkFreeAPI);
    return () => window.removeEventListener('storage', checkFreeAPI);
  }, []);

  if (isFree) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
        <Sparkles className="h-3 w-3" />
        免费体验API
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
      <Key className="h-3 w-3" />
      自定义API
    </div>
  );
}
