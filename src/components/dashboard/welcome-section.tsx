"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Sparkles, BookOpen, FolderTree, User } from "lucide-react"
import Link from "next/link"

interface WelcomeSectionProps {
  userName?: string | null
  noteCount: number
}

export function WelcomeSection({ userName, noteCount }: WelcomeSectionProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 15,
      },
    },
  }

  const features = [
    {
      icon: Sparkles,
      title: "AI 智能助手",
      description: "使用 AI 自动生成标签、摘要和优化内容",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: BookOpen,
      title: "Markdown 编辑",
      description: "强大的 Markdown 编辑器，实时预览",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: FolderTree,
      title: "智能分类",
      description: "通过标签和分类轻松管理你的笔记",
      gradient: "from-green-500 to-emerald-500",
    },
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 mb-8"
    >
      {/* 欢迎区域 */}
      <motion.div variants={itemVariants}>
        <Card className="relative overflow-hidden border-none shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent" />
          <CardContent className="relative pt-8 pb-8 px-8">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 space-y-4">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="flex items-center gap-3"
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg"
                  >
                    <User className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                      欢迎回来{userName ? `, ${userName}` : ''}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      {noteCount === 0
                        ? "开始你的第一篇笔记，记录灵感和想法"
                        : `你已经创建了 ${noteCount} 篇笔记`}
                    </p>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Link href="/notes/new">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button size="lg" className="shadow-lg">
                        <Plus className="mr-2 h-5 w-5" />
                        创建新笔记
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 功能卡片 */}
      {noteCount === 0 && (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ 
                y: -8, 
                transition: { type: "spring", stiffness: 300, damping: 20 } 
              }}
            >
              <Card className="h-full border-none shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
                <CardContent className="pt-6 pb-6 relative">
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                    }}
                  />
                  <div className="relative z-10">
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        delay: 0.3 + index * 0.1,
                      }}
                      className="mb-4"
                    >
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg`}>
                        <feature.icon className="h-7 w-7 text-white" />
                      </div>
                    </motion.div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
