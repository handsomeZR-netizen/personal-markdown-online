"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Plus, Sparkles, FileText, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false)

  const actions = [
    {
      icon: FileText,
      label: "新建笔记",
      href: "/notes/new",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      icon: Sparkles,
      label: "AI 助手",
      href: "/ai",
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute bottom-16 right-0 flex flex-col gap-3"
          >
            {actions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={action.href}>
                  <motion.div
                    whileHover={{ scale: 1.1, x: -5 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-sm font-medium bg-background px-3 py-2 rounded-lg shadow-lg border">
                      {action.label}
                    </span>
                    <Button
                      size="icon"
                      className={`h-12 w-12 rounded-full shadow-lg ${action.color}`}
                    >
                      <action.icon className="h-5 w-5" />
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>
      </motion.div>
    </div>
  )
}
