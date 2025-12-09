import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PublicNoteNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            笔记未找到
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            这篇笔记可能已被删除、设为私密，或者链接不正确。
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/login" className="w-full">
              <Button className="w-full">登录查看我的笔记</Button>
            </Link>
            <Link href="/register" className="w-full">
              <Button variant="outline" className="w-full">
                注册新账号
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
