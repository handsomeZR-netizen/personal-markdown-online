'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function NoteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Note error:', error)
  }, [error])

  return (
    <div className="container mx-auto p-4 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertCircle className="h-6 w-6" />
            <CardTitle>加载笔记时出错</CardTitle>
          </div>
          <CardDescription>
            {error.message || '无法加载此笔记，它可能已被删除或您没有访问权限。'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={reset} className="flex-1">
              重试
            </Button>
            <Link href="/notes" className="flex-1">
              <Button variant="outline" className="w-full">
                返回笔记列表
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
