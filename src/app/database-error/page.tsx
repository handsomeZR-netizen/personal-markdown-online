import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Database, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { getCachedStartupValidation } from '@/lib/startup-validator';

export const dynamic = 'force-dynamic';

export default async function DatabaseErrorPage() {
  const validation = await getCachedStartupValidation();
  
  return (
    <div className="container mx-auto p-4 flex items-center justify-center min-h-[80vh]">
      <Card className="max-w-2xl w-full border-destructive">
        <CardHeader>
          <div className="flex items-center gap-3 text-destructive mb-2">
            <Database className="h-8 w-8" />
            <div>
              <CardTitle className="text-2xl">数据库配置错误</CardTitle>
              <CardDescription className="text-base mt-1">
                应用程序无法连接到数据库，请检查您的配置
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Mode */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              当前配置
            </h3>
            <p className="text-sm text-muted-foreground">
              数据库模式: <span className="font-mono font-semibold">{validation.mode}</span>
            </p>
          </div>

          {/* Errors */}
          {validation.errors.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                错误信息
              </h3>
              <ul className="space-y-2">
                {validation.errors.map((error, index) => (
                  <li key={index} className="text-sm bg-destructive/10 p-3 rounded border border-destructive/20">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-yellow-600 dark:text-yellow-500 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                警告信息
              </h3>
              <ul className="space-y-2">
                {validation.warnings.map((warning, index) => (
                  <li key={index} className="text-sm bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {validation.databaseValidation?.diagnostics?.suggestions && 
           validation.databaseValidation.diagnostics.suggestions.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                💡 建议
              </h3>
              <ul className="space-y-2">
                {validation.databaseValidation.diagnostics.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm bg-blue-50 dark:bg-blue-950/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Setup Instructions */}
          {validation.setupInstructions && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                📋 设置说明
              </h3>
              <pre className="text-xs bg-muted p-4 rounded overflow-x-auto whitespace-pre-wrap">
                {validation.setupInstructions}
              </pre>
            </div>
          )}

          {/* Documentation Links */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              📚 相关文档
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Link 
                href="/docs/LOCAL_DATABASE_SETUP.md" 
                target="_blank"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                本地数据库设置指南
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link 
                href="/docs/DATABASE_MODES.md" 
                target="_blank"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                数据库模式说明
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link 
                href="/docs/TROUBLESHOOTING.md" 
                target="_blank"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                故障排除指南
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={() => window.location.reload()} 
              className="flex-1"
              variant="default"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              重新检查连接
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="flex-1"
            >
              返回首页
            </Button>
          </div>

          {/* Additional Help */}
          <div className="text-xs text-muted-foreground text-center pt-4 border-t">
            <p>如果问题持续存在，请查看控制台日志获取更多详细信息</p>
            <p className="mt-1">或运行 <code className="bg-muted px-1 py-0.5 rounded">npm run db:validate</code> 进行诊断</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
