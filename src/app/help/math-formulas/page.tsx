import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  ArrowLeft,
  FileText,
  Code,
  BookOpen,
  Lightbulb,
  Copy
} from "lucide-react"

export default async function MathFormulasGuidePage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const basicExamples = [
    { name: "分数", code: "\\frac{a}{b}", desc: "a/b 分数形式" },
    { name: "上标", code: "x^2", desc: "x 的平方" },
    { name: "下标", code: "x_i", desc: "x 下标 i" },
    { name: "平方根", code: "\\sqrt{x}", desc: "x 的平方根" },
    { name: "n次根", code: "\\sqrt[n]{x}", desc: "x 的 n 次根" },
    { name: "求和", code: "\\sum_{i=1}^{n} x_i", desc: "求和符号" },
    { name: "积分", code: "\\int_a^b f(x)dx", desc: "定积分" },
    { name: "极限", code: "\\lim_{x \\to \\infty}", desc: "极限符号" }
  ]

  const greekLetters = [
    { lower: "α", code: "\\alpha" },
    { lower: "β", code: "\\beta" },
    { lower: "γ", code: "\\gamma" },
    { lower: "δ", code: "\\delta" },
    { lower: "ε", code: "\\epsilon" },
    { lower: "θ", code: "\\theta" },
    { lower: "λ", code: "\\lambda" },
    { lower: "μ", code: "\\mu" },
    { lower: "π", code: "\\pi" },
    { lower: "σ", code: "\\sigma" },
    { lower: "φ", code: "\\phi" },
    { lower: "ω", code: "\\omega" }
  ]

  const symbols = [
    { symbol: "±", code: "\\pm" },
    { symbol: "×", code: "\\times" },
    { symbol: "÷", code: "\\div" },
    { symbol: "≠", code: "\\neq" },
    { symbol: "≤", code: "\\leq" },
    { symbol: "≥", code: "\\geq" },
    { symbol: "≈", code: "\\approx" },
    { symbol: "∞", code: "\\infty" },
    { symbol: "∂", code: "\\partial" },
    { symbol: "∇", code: "\\nabla" },
    { symbol: "∈", code: "\\in" },
    { symbol: "∉", code: "\\notin" }
  ]

  const famousFormulas = [
    {
      name: "二次方程求根公式",
      code: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
      desc: "求解 ax² + bx + c = 0"
    },
    {
      name: "欧拉公式",
      code: "e^{i\\pi} + 1 = 0",
      desc: "数学中最美的公式"
    },
    {
      name: "勾股定理",
      code: "a^2 + b^2 = c^2",
      desc: "直角三角形三边关系"
    },
    {
      name: "泰勒展开",
      code: "f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n",
      desc: "函数的无穷级数展开"
    },
    {
      name: "高斯积分",
      code: "\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}",
      desc: "正态分布的基础"
    },
    {
      name: "傅里叶变换",
      code: "\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(x) e^{-2\\pi i x \\xi} dx",
      desc: "信号处理的核心"
    }
  ]

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="mb-8">
        <Link href="/help">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回帮助中心
          </Button>
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">数学公式指南</h1>
            <p className="text-muted-foreground">学习如何在笔记中使用 LaTeX 数学公式</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* 基本语法 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Code className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle>基本语法</CardTitle>
                <CardDescription>如何在笔记中插入数学公式</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">行内公式</h4>
              <p className="text-sm text-muted-foreground mb-2">
                使用单个美元符号 <code className="px-1 py-0.5 bg-background rounded">$...$</code> 包裹公式
              </p>
              <div className="flex items-center gap-2 p-2 bg-background rounded border">
                <code className="text-sm flex-1">质能方程：$E = mc^2$</code>
                <span className="text-muted-foreground">→</span>
                <span className="text-sm">质能方程：E = mc²</span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">块级公式</h4>
              <p className="text-sm text-muted-foreground mb-2">
                使用双美元符号 <code className="px-1 py-0.5 bg-background rounded">$$...$$</code> 包裹公式，公式会单独成行并居中显示
              </p>
              <div className="p-2 bg-background rounded border">
                <code className="text-sm block mb-2">$$\int_&#123;-\infty&#125;^&#123;\infty&#125; e^&#123;-x^2&#125; dx = \sqrt&#123;\pi&#125;$$</code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 常用公式 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle>常用公式语法</CardTitle>
                <CardDescription>最常用的数学公式写法</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {basicExamples.map((example, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 group">
                  <div>
                    <span className="font-medium text-sm">{example.name}</span>
                    <p className="text-xs text-muted-foreground">{example.desc}</p>
                  </div>
                  <code className="px-2 py-1 bg-background rounded border text-xs font-mono">
                    ${example.code}$
                  </code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 希腊字母 */}
        <Card>
          <CardHeader>
            <CardTitle>希腊字母</CardTitle>
            <CardDescription>数学公式中常用的希腊字母</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {greekLetters.map((letter, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-lg font-serif">{letter.lower}</span>
                  <code className="text-xs text-muted-foreground">{letter.code}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 常用符号 */}
        <Card>
          <CardHeader>
            <CardTitle>常用符号</CardTitle>
            <CardDescription>数学运算和关系符号</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {symbols.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-lg">{item.symbol}</span>
                  <code className="text-xs text-muted-foreground">{item.code}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 矩阵 */}
        <Card>
          <CardHeader>
            <CardTitle>矩阵</CardTitle>
            <CardDescription>如何输入矩阵</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">圆括号矩阵</h4>
                <pre className="text-xs bg-background p-2 rounded border overflow-x-auto">
{`\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}`}
                </pre>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">方括号矩阵</h4>
                <pre className="text-xs bg-background p-2 rounded border overflow-x-auto">
{`\\begin{bmatrix}
1 & 2 & 3 \\\\
4 & 5 & 6
\\end{bmatrix}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 经典公式示例 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <CardTitle>经典公式示例</CardTitle>
                <CardDescription>一些著名的数学公式</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {famousFormulas.map((formula, index) => (
                <div key={index} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{formula.name}</h4>
                      <p className="text-xs text-muted-foreground">{formula.desc}</p>
                    </div>
                  </div>
                  <code className="block text-sm bg-background p-2 rounded border font-mono overflow-x-auto">
                    $${formula.code}$$
                  </code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 注意事项 */}
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="text-yellow-600 dark:text-yellow-400">注意事项</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="text-yellow-500">•</span>
                <span>公式中的空格会被忽略，使用 <code className="px-1 bg-background rounded">\,</code> <code className="px-1 bg-background rounded">\;</code> <code className="px-1 bg-background rounded">\quad</code> 添加空格</span>
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-500">•</span>
                <span>特殊字符需要转义：<code className="px-1 bg-background rounded">\%</code> <code className="px-1 bg-background rounded">\$</code> <code className="px-1 bg-background rounded">\&</code> <code className="px-1 bg-background rounded">\#</code></span>
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-500">•</span>
                <span>复杂公式建议使用块级模式 ($$...$$) 以获得更好的显示效果</span>
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-500">•</span>
                <span>如果公式无法渲染，请检查语法是否正确，特别是括号是否匹配</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* 更多资源 */}
        <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">更多资源</h3>
                <p className="text-sm text-muted-foreground">
                  查看 KaTeX 官方文档了解更多支持的语法
                </p>
              </div>
              <a href="https://katex.org/docs/supported.html" target="_blank" rel="noopener noreferrer">
                <Button variant="outline">KaTeX 文档</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
