import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container mx-auto p-4 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <FileQuestion className="h-6 w-6 text-muted-foreground" />
            <CardTitle>页面未找到</CardTitle>
          </div>
          <CardDescription>
            抱歉，您访问的页面不存在或已被移除。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full">
                返回首页
              </Button>
            </Link>
            <Link href="/notes" className="flex-1">
              <Button variant="outline" className="w-full">
                查看笔记
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
