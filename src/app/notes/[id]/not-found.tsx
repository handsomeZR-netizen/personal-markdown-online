import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion } from 'lucide-react'

export default function NoteNotFound() {
  return (
    <div className="container mx-auto p-4 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <FileQuestion className="h-6 w-6 text-muted-foreground" />
            <CardTitle>笔记未找到</CardTitle>
          </div>
          <CardDescription>
            抱歉，您访问的笔记不存在或已被删除。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Link href="/notes" className="flex-1">
              <Button className="w-full">
                返回笔记列表
              </Button>
            </Link>
            <Link href="/notes/new" className="flex-1">
              <Button variant="outline" className="w-full">
                创建新笔记
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
