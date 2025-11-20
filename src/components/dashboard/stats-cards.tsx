"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Tag, FolderOpen, Calendar } from "lucide-react"

interface StatsCardsProps {
  noteCount: number
  tagCount: number
  categoryCount: number
  recentNoteDate?: Date
}

export function StatsCards({
  noteCount,
  tagCount,
  categoryCount,
  recentNoteDate,
}: StatsCardsProps) {
  const stats = [
    {
      icon: FileText,
      label: "总笔记数",
      value: noteCount,
      color: "text-foreground",
      bgColor: "bg-muted",
    },
    {
      icon: Tag,
      label: "标签数",
      value: tagCount,
      color: "text-foreground",
      bgColor: "bg-muted",
    },
    {
      icon: FolderOpen,
      label: "分类数",
      value: categoryCount,
      color: "text-foreground",
      bgColor: "bg-muted",
    },
    {
      icon: Calendar,
      label: "最近更新",
      value: recentNoteDate
        ? new Date(recentNoteDate).toLocaleDateString("zh-CN", {
            month: "short",
            day: "numeric",
          })
        : "暂无",
      color: "text-foreground",
      bgColor: "bg-muted",
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
      },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          variants={itemVariants}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-card border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <motion.p
                    className="text-2xl font-bold"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    {stat.value}
                  </motion.p>
                </div>
                <motion.div
                  className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
