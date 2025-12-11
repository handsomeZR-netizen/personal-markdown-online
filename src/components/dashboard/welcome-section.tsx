"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, BookOpen, Lightbulb, Code, Layers, RefreshCw, Sparkles, Keyboard } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"

interface WelcomeSectionProps {
  userName?: string | null
  noteCount: number
}

// 鼓励消息列表
const encourageMessages = [
  "准备好开始记录今天的灵感了吗？",
  "今天也要元气满满地记录哦！",
  "每一个想法都值得被记录 ✨",
  "让我们一起捕捉灵感的火花吧！",
  "你的创意值得被珍藏 💡",
  "开始新的一天，记录新的想法！",
  "思维的碎片，终将汇成星河 🌟",
]

// 快捷键提示
const shortcuts = [
  { key: "Ctrl+N", desc: "新建笔记" },
  { key: "Ctrl+S", desc: "保存" },
  { key: "Ctrl+K", desc: "搜索" },
]

export function WelcomeSection({ userName, noteCount }: WelcomeSectionProps) {
  const [mounted, setMounted] = useState(false)
  const [greeting, setGreeting] = useState('')
  const [quote, setQuote] = useState('')
  const [focusScore] = useState(85)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [encourageMsg, setEncourageMsg] = useState('')
  const [isWaving, setIsWaving] = useState(false)
  const [showSparkles, setShowSparkles] = useState(false)
  const [typedGreeting, setTypedGreeting] = useState('')
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [isTypingComplete, setIsTypingComplete] = useState(false)
  const [showCursor, setShowCursor] = useState(true)

  // 打字机效果
  useEffect(() => {
    if (!mounted) return
    const fullGreeting = `${greeting}，${userName || '用户'}`
    let index = 0
    setTypedGreeting('')
    setIsTypingComplete(false)
    setShowCursor(true)
    
    const timer = setInterval(() => {
      if (index < fullGreeting.length) {
        setTypedGreeting(fullGreeting.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
        setIsTypingComplete(true)
        // 打字完成后光标闪烁几次然后消失
        setTimeout(() => setShowCursor(false), 2000)
      }
    }, 100)
    
    return () => clearInterval(timer)
  }, [mounted, greeting, userName])

  // 光标闪烁效果
  useEffect(() => {
    if (!isTypingComplete || !showCursor) return
    const blinkTimer = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 530)
    return () => clearInterval(blinkTimer)
  }, [isTypingComplete, showCursor])

  // 随机鼓励消息
  const shuffleEncourageMsg = useCallback(() => {
    const newMsg = encourageMessages[Math.floor(Math.random() * encourageMessages.length)]
    setEncourageMsg(newMsg)
    setShowSparkles(true)
    setTimeout(() => setShowSparkles(false), 1000)
  }, [])

  // 挥手动画
  const handleWave = () => {
    setIsWaving(true)
    setTimeout(() => setIsWaving(false), 1000)
  }

  useEffect(() => {
    setMounted(true)
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('早上好')
    else if (hour < 18) setGreeting('下午好')
    else setGreeting('晚上好')
    
    // 设置初始鼓励消息
    setEncourageMsg(encourageMessages[Math.floor(Math.random() * encourageMessages.length)])
    setQuote('保持渴望，保持愚蠢。 — 史蒂夫·乔布斯')

    // 加载名言
    fetchQuote()
    
    // 定时更换鼓励消息
    const msgTimer = setInterval(shuffleEncourageMsg, 15000)
    return () => clearInterval(msgTimer)
  }, [shuffleEncourageMsg])

  const fetchQuote = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/quote')
      const data = await response.json()
      setQuote(data.quote)
    } catch (error) {
      console.error('Failed to fetch quote:', error)
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  const features = [
    {
      icon: Lightbulb,
      title: "AI 智能助手",
      description: "自动生成标签、摘要和优化内容",
    },
    {
      icon: Code,
      title: "Markdown 编辑",
      description: "强大的编辑器，支持实时预览",
    },
    {
      icon: Layers,
      title: "智能分类",
      description: "通过标签轻松管理你的知识库",
    },
  ]

  return (
    <div className="space-y-6 mb-8">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2 flex"
        >
          <Card className="relative overflow-hidden border shadow-xl bg-card w-full">
            <div className="absolute top-0 right-0 w-64 h-64 bg-muted/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            
            <CardContent className="relative z-10 p-8 flex flex-col justify-between h-full min-h-[280px]">
              {/* 打字机效果的问候语 */}
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-4xl font-extrabold text-foreground tracking-tight relative">
                  {mounted && typedGreeting ? (
                    <>
                      {typedGreeting.split('').map((char, index) => (
                        <motion.span
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            duration: 0.1,
                            delay: index * 0.05,
                            ease: "easeOut"
                          }}
                          className="inline-block"
                          style={{ 
                            display: char === '，' || char === ' ' ? 'inline' : 'inline-block'
                          }}
                        >
                          {char === ' ' ? '\u00A0' : char}
                        </motion.span>
                      ))}
                      {/* 打字光标 */}
                      <motion.span
                        animate={{ 
                          opacity: showCursor ? 1 : 0,
                        }}
                        transition={{ duration: 0.1 }}
                        className="inline-block ml-0.5 w-[3px] h-[1em] bg-primary align-middle"
                        style={{ verticalAlign: 'text-bottom' }}
                      />
                    </>
                  ) : (
                    <span className="opacity-0">你好，{userName || '用户'}</span>
                  )}
                </h1>
                {/* 可点击的挥手 emoji */}
                <motion.button
                  onClick={handleWave}
                  animate={isWaving ? { 
                    rotate: [0, 14, -8, 14, -4, 10, 0],
                    transition: { duration: 0.8 }
                  } : {}}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-4xl cursor-pointer select-none origin-bottom-right"
                  aria-label="点击挥手"
                >
                  👋
                </motion.button>
              </div>
              
              {/* 可点击更换的鼓励消息 */}
              <motion.div 
                className="relative mb-8 max-w-md group cursor-pointer"
                onClick={shuffleEncourageMsg}
              >
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={encourageMsg || 'loading'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-muted-foreground text-lg inline-flex items-center gap-2"
                  >
                    {mounted ? encourageMsg : <span className="opacity-0">加载中...</span>}
                    <Sparkles className={`w-4 h-4 transition-all ${showSparkles ? 'text-yellow-500 animate-spin' : 'text-muted-foreground/50 group-hover:text-yellow-500'}`} />
                  </motion.p>
                </AnimatePresence>
                <span className="text-xs text-muted-foreground/50 block mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  点击换一条 ✨
                </span>
              </motion.div>
              
              <div className="flex flex-wrap gap-4 items-center">
                <Link href="/notes/new">
                  <Button 
                    size="lg" 
                    className="bg-foreground hover:bg-foreground/90 text-background dark:bg-primary-foreground dark:text-primary shadow-lg transition-all hover:-translate-y-1 group"
                  >
                    <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
                    创建新笔记
                  </Button>
                </Link>
                <Link href="/notes">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-border hover:bg-accent text-foreground dark:border-primary-foreground/20 dark:hover:bg-primary-foreground/10"
                  >
                    <BookOpen className="mr-2 h-5 w-5" />
                    查看仪表盘
                  </Button>
                </Link>
                
                {/* 快捷键提示按钮 */}
                <div className="relative">
                  <motion.button
                    onMouseEnter={() => setShowShortcuts(true)}
                    onMouseLeave={() => setShowShortcuts(false)}
                    whileHover={{ scale: 1.05 }}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    aria-label="查看快捷键"
                  >
                    <Keyboard className="w-5 h-5 text-muted-foreground" />
                  </motion.button>
                  
                  <AnimatePresence>
                    {showShortcuts && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 mb-2 p-3 bg-popover border rounded-lg shadow-lg min-w-[160px] z-20"
                      >
                        <p className="text-xs font-medium text-muted-foreground mb-2">快捷键</p>
                        <div className="space-y-1.5">
                          {shortcuts.map((s) => (
                            <div key={s.key} className="flex items-center justify-between gap-4 text-sm">
                              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">{s.key}</kbd>
                              <span className="text-muted-foreground">{s.desc}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Focus Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex"
        >
          <Card className="w-full bg-primary text-primary-foreground shadow-xl border-none relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/10 rounded-full blur-2xl translate-x-10 -translate-y-10 group-hover:bg-primary-foreground/20 transition-all duration-500"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/5 rounded-full blur-xl -translate-x-5 translate-y-5"></div>
            
            <CardContent className="p-8 flex flex-col justify-between h-full relative z-10 min-h-[280px]">
              <div>
                <p className="text-primary-foreground/80 font-medium mb-1">本周专注度</p>
                <h3 className="text-5xl font-bold mb-6">{focusScore}%</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-primary-foreground/80 mb-2">
                    <span>笔记目标</span>
                    <span>{Math.min(noteCount, 15)}/15</span>
                  </div>
                  <div className="w-full bg-primary-foreground/20 rounded-full h-2">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(Math.min(noteCount, 15) / 15) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="bg-primary-foreground/90 h-2 rounded-full"
                    ></motion.div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-primary-foreground/10">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-primary-foreground/70 leading-relaxed flex-1 group-hover:text-primary-foreground/90 transition-colors">
                      &ldquo;{quote}&rdquo;
                    </p>
                    <motion.button
                      onClick={fetchQuote}
                      disabled={isRefreshing}
                      whileHover={{ scale: 1.1, rotate: 15 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1.5 hover:bg-primary-foreground/20 rounded-lg transition-all flex-shrink-0 group/btn"
                      aria-label="刷新名言"
                    >
                      <RefreshCw className={`w-4 h-4 text-primary-foreground/70 group-hover/btn:text-primary-foreground transition-colors ${isRefreshing ? 'animate-spin' : ''}`} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Feature Grid */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-muted-foreground" />
          常用功能
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
            >
              <Card className="group relative bg-muted border shadow-sm hover:shadow-lg transition-all duration-300 hover:bg-card dark:hover:bg-accent cursor-pointer overflow-hidden h-full hover:-translate-y-1">
                <CardContent className="p-8 flex flex-col justify-between h-full">
                  <motion.div 
                    className="mb-6"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring" as const, stiffness: 300 }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-background group-hover:bg-primary flex items-center justify-center transition-all duration-300">
                      <feature.icon className="w-6 h-6 text-foreground group-hover:text-primary-foreground transition-colors duration-300" />
                    </div>
                  </motion.div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2 transition-colors leading-tight">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed group-hover:text-foreground transition-colors">
                      {feature.description}
                    </p>
                  </div>

                  {/* 箭头指示器 */}
                  <motion.div
                    className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100"
                    initial={{ x: -10, opacity: 0 }}
                    whileHover={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
