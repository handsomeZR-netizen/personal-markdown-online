"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, MessageCircle, Sparkles, Brain, FileText, Wand2 } from "lucide-react"
import { FeatureDetailDialog } from "./feature-detail-dialog"
import { 
  semanticSearchFeature, 
  naturalLanguageQueryFeature,
  aiTagSuggestionFeature,
  aiSummaryFeature,
  aiFormatFeature,
  aiWritingAssistantFeature
} from "./ai-feature-data"

// 语义搜索卡片
export function SemanticSearchCard() {
  return (
    <FeatureDetailDialog feature={semanticSearchFeature}>
      <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Search className="h-5 w-5 text-cyan-500" />
            </div>
            <Badge variant="secondary" className="text-xs">AI</Badge>
          </div>
          <CardTitle className="text-lg mt-3">语义搜索</CardTitle>
          <CardDescription>
            基于 AI 的智能语义搜索，理解查询意图找到相关笔记
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-xs">向量嵌入</Badge>
            <Badge variant="outline" className="text-xs">相似度匹配</Badge>
            <Badge variant="outline" className="text-xs">搜索历史</Badge>
          </div>
        </CardContent>
      </Card>
    </FeatureDetailDialog>
  )
}

// 自然语言查询卡片
export function NaturalLanguageQueryCard() {
  return (
    <FeatureDetailDialog feature={naturalLanguageQueryFeature}>
      <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageCircle className="h-5 w-5 text-purple-500" />
            </div>
            <Badge variant="secondary" className="text-xs">AI</Badge>
          </div>
          <CardTitle className="text-lg mt-3">自然语言查询</CardTitle>
          <CardDescription>
            用自然语言提问，AI 基于笔记内容智能回答
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-xs">RAG 模式</Badge>
            <Badge variant="outline" className="text-xs">对话历史</Badge>
            <Badge variant="outline" className="text-xs">Markdown</Badge>
          </div>
        </CardContent>
      </Card>
    </FeatureDetailDialog>
  )
}

// AI 标签建议卡片
export function AITagSuggestionCard() {
  return (
    <FeatureDetailDialog feature={aiTagSuggestionFeature}>
      <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <Badge variant="secondary" className="text-xs">AI</Badge>
          </div>
          <CardTitle className="text-lg mt-3">AI 标签建议</CardTitle>
          <CardDescription>
            AI 分析笔记内容，智能推荐相关标签
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-xs">内容分析</Badge>
            <Badge variant="outline" className="text-xs">一键应用</Badge>
          </div>
        </CardContent>
      </Card>
    </FeatureDetailDialog>
  )
}

// AI 内容摘要卡片
export function AISummaryCard() {
  return (
    <FeatureDetailDialog feature={aiSummaryFeature}>
      <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Brain className="h-5 w-5 text-emerald-500" />
            </div>
            <Badge variant="secondary" className="text-xs">AI</Badge>
          </div>
          <CardTitle className="text-lg mt-3">AI 内容摘要</CardTitle>
          <CardDescription>
            AI 自动生成笔记摘要，快速了解内容要点
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-xs">自动生成</Badge>
            <Badge variant="outline" className="text-xs">核心要点</Badge>
          </div>
        </CardContent>
      </Card>
    </FeatureDetailDialog>
  )
}

// AI 排版检查卡片
export function AIFormatCard() {
  return (
    <FeatureDetailDialog feature={aiFormatFeature}>
      <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="h-5 w-5 text-pink-500" />
            </div>
            <Badge variant="secondary" className="text-xs">AI</Badge>
          </div>
          <CardTitle className="text-lg mt-3">AI 排版检查</CardTitle>
          <CardDescription>
            AI 智能优化文档排版，修正语法错误，保持内容不变
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-xs">流式输出</Badge>
            <Badge variant="outline" className="text-xs">防注入</Badge>
            <Badge variant="outline" className="text-xs">霓虹灯效果</Badge>
          </div>
        </CardContent>
      </Card>
    </FeatureDetailDialog>
  )
}

// AI 写作助手卡片
export function AIWritingAssistantCard() {
  return (
    <FeatureDetailDialog feature={aiWritingAssistantFeature}>
      <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wand2 className="h-5 w-5 text-violet-500" />
            </div>
            <Badge variant="secondary" className="text-xs">AI</Badge>
          </div>
          <CardTitle className="text-lg mt-3">AI 写作助手</CardTitle>
          <CardDescription>
            智能改写文档，支持多种风格预设和自定义指令
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-xs">5种风格</Badge>
            <Badge variant="outline" className="text-xs">自定义指令</Badge>
            <Badge variant="outline" className="text-xs">实时预览</Badge>
          </div>
        </CardContent>
      </Card>
    </FeatureDetailDialog>
  )
}

// AI 功能卡片组
export function AIFeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <SemanticSearchCard />
      <NaturalLanguageQueryCard />
      <AITagSuggestionCard />
      <AISummaryCard />
      <AIFormatCard />
      <AIWritingAssistantCard />
    </div>
  )
}
