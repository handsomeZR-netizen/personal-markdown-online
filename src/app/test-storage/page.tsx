'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { CheckCircle2, XCircle, AlertCircle, Loader2, Info } from 'lucide-react'

export default function TestStoragePage() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any[]>([])
  
  const isLocalMode = process.env.NEXT_PUBLIC_DATABASE_MODE === 'local'
  const supabaseBrowser = getSupabaseBrowser()

  const addResult = (test: string, status: 'success' | 'error' | 'warning' | 'info', message: string, details?: any) => {
    setResults(prev => [...prev, { test, status, message, details, timestamp: new Date() }])
  }

  const runTests = async () => {
    setTesting(true)
    setResults([])
    
    // 检查是否在 local 模式
    if (isLocalMode || !supabaseBrowser) {
      addResult(
        '数据库模式',
        'info',
        '当前运行在 Local 模式，Supabase Storage 测试不可用',
        { mode: 'local', tip: '文件存储使用本地文件系统 (./uploads)' }
      )
      setTesting(false)
      return
    }

    try {
      // 测试 1: 检查环境变量
      addResult(
        '环境变量检查',
        process.env.NEXT_PUBLIC_SUPABASE_URL ? 'success' : 'error',
        process.env.NEXT_PUBLIC_SUPABASE_URL 
          ? `Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`
          : 'NEXT_PUBLIC_SUPABASE_URL 未配置'
      )

      // 测试 2: 检查 Supabase 连接
      try {
        const { data: buckets, error } = await supabaseBrowser.storage.listBuckets()
        
        if (error) {
          addResult('Supabase 连接', 'error', `连接失败: ${error.message}`, error)
        } else {
          addResult('Supabase 连接', 'success', `成功连接，找到 ${buckets?.length || 0} 个存储桶`, buckets)
        }
      } catch (err: any) {
        addResult('Supabase 连接', 'error', `连接异常: ${err.message}`, err)
      }

      // 测试 3: 检查 note-images 存储桶
      try {
        const { data: bucket, error } = await supabaseBrowser.storage.getBucket('note-images')
        
        if (error) {
          addResult('note-images 存储桶', 'error', `存储桶不存在或无法访问: ${error.message}`, error)
        } else {
          addResult('note-images 存储桶', 'success', '存储桶存在且可访问', bucket)
        }
      } catch (err: any) {
        addResult('note-images 存储桶', 'error', `检查失败: ${err.message}`, err)
      }

      // 测试 4: 检查用户认证状态
      try {
        const { data: { user }, error } = await supabaseBrowser.auth.getUser()
        
        if (error) {
          addResult('用户认证', 'warning', `未登录: ${error.message}`, error)
        } else if (user) {
          addResult('用户认证', 'success', `已登录: ${user.email}`, user)
        } else {
          addResult('用户认证', 'warning', '未登录，某些功能可能受限')
        }
      } catch (err: any) {
        addResult('用户认证', 'error', `检查失败: ${err.message}`, err)
      }

      // 测试 5: 测试文件上传（创建一个小的测试文件）
      try {
        const testFile = new Blob(['test'], { type: 'text/plain' })
        const fileName = `test-${Date.now()}.txt`
        
        const { data, error } = await supabaseBrowser.storage
          .from('note-images')
          .upload(fileName, testFile, {
            cacheControl: '3600',
            upsert: false,
          })

        if (error) {
          addResult('文件上传测试', 'error', `上传失败: ${error.message}`, error)
        } else {
          addResult('文件上传测试', 'success', '上传成功', data)
          
          // 清理测试文件
          await supabaseBrowser.storage.from('note-images').remove([fileName])
        }
      } catch (err: any) {
        addResult('文件上传测试', 'error', `上传异常: ${err.message}`, err)
      }

    } catch (err: any) {
      addResult('总体测试', 'error', `测试过程出错: ${err.message}`, err)
    } finally {
      setTesting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Storage 诊断工具</CardTitle>
          <CardDescription>
            测试 Supabase Storage 连接和配置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runTests} 
            disabled={testing}
            className="w-full"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                测试中...
              </>
            ) : (
              '开始测试'
            )}
          </Button>

          {results.length > 0 && (
            <div className="space-y-3 mt-6">
              <h3 className="font-semibold text-lg">测试结果</h3>
              {results.map((result, index) => (
                <Card key={index} className={`border-l-4 ${
                  result.status === 'success' ? 'border-l-green-500' :
                  result.status === 'error' ? 'border-l-red-500' :
                  result.status === 'info' ? 'border-l-blue-500' :
                  'border-l-yellow-500'
                }`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <div className="font-semibold">{result.test}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {result.message}
                        </div>
                        {result.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              查看详情
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card className="bg-muted/50 mt-6">
            <CardHeader>
              <CardTitle className="text-base">修复建议</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>如果测试失败，请按以下步骤操作：</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>在 Supabase Dashboard 创建 <code className="bg-background px-1 rounded">note-images</code> 存储桶</li>
                <li>设置存储桶为公开访问（Public bucket）</li>
                <li>在 SQL Editor 中执行 <code className="bg-background px-1 rounded">supabase-storage-complete-setup.sql</code></li>
                <li>确保用户已登录</li>
                <li>检查浏览器控制台是否有 CORS 错误</li>
              </ol>
              <p className="mt-4 text-xs text-muted-foreground">
                详细修复指南请查看: <code className="bg-background px-1 rounded">IMAGE_UPLOAD_FIX.md</code>
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
