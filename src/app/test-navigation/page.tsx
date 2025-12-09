'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestNavigationPage() {
  const router = useRouter()

  const handleButtonClick = () => {
    console.log('Button clicked!')
    alert('按钮点击成功！')
  }

  const handleRouterPush = () => {
    console.log('Router push to /dashboard')
    router.push('/dashboard')
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">导航测试页面</h1>

      <div className="space-y-6">
        {/* 测试 1: 普通按钮点击 */}
        <Card>
          <CardHeader>
            <CardTitle>测试 1: 普通按钮点击</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleButtonClick}>
              点击我测试
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              点击后应该弹出提示框
            </p>
          </CardContent>
        </Card>

        {/* 测试 2: Link 组件 */}
        <Card>
          <CardHeader>
            <CardTitle>测试 2: Link 组件导航</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                使用 Link 跳转到 Dashboard
              </Button>
            </Link>
            <Link href="/notes">
              <Button variant="outline" className="w-full">
                使用 Link 跳转到 Notes
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 测试 3: useRouter */}
        <Card>
          <CardHeader>
            <CardTitle>测试 3: useRouter 导航</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRouterPush} variant="secondary">
              使用 Router 跳转到 Dashboard
            </Button>
          </CardContent>
        </Card>

        {/* 测试 4: 原生 a 标签 */}
        <Card>
          <CardHeader>
            <CardTitle>测试 4: 原生 a 标签</CardTitle>
          </CardHeader>
          <CardContent>
            <a href="/dashboard" className="text-blue-500 underline">
              使用原生 a 标签跳转到 Dashboard
            </a>
          </CardContent>
        </Card>

        {/* 测试 5: 可点击的 Card */}
        <Link href="/features">
          <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105">
            <CardHeader>
              <CardTitle>测试 5: 可点击的卡片</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                点击整个卡片跳转到功能页面
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* 调试信息 */}
        <Card className="bg-muted">
          <CardHeader>
            <CardTitle>调试信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>✅ 如果能看到这个页面，说明 React 正常工作</p>
            <p>✅ 打开浏览器控制台查看日志</p>
            <p>✅ 尝试点击上面的按钮和链接</p>
            <p className="text-xs text-muted-foreground mt-4">
              当前路径: /test-navigation
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
