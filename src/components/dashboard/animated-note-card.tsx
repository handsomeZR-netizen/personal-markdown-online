"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import Link from "next/link"
import { DeleteNoteIconButton } from "@/components/notes/delete-note-icon-button"
import { useState, useEffect } from "react"

interface AnimatedNoteCardProps {
  note: {
    id: string
    title: string
    content: string
    updatedAt: Date
  }
  index: number
}

export function AnimatedNoteCard({ note, index }: AnimatedNoteCardProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const formatDate = (date: Date) => {
    if (!mounted) return ''
    return new Date(date).toLocaleDateString("zh-CN")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring" as const,
        stiffness: 100,
        delay: index * 0.1,
      }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
    >
      <Card className="flex flex-col h-full hover:shadow-xl transition-shadow bg-card border hover:border-foreground/20">
        <Link href={`/notes/${note.id}`} className="flex-1 cursor-pointer">
          <CardHeader>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              <CardTitle className="truncate">{note.title}</CardTitle>
            </motion.div>
          </CardHeader>
          <CardContent>
            <motion.p
              className="text-muted-foreground line-clamp-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.3 }}
            >
              {note.content}
            </motion.p>
          </CardContent>
        </Link>
        <CardFooter className="flex justify-between items-center">
          <motion.span
            className="text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.4 }}
          >
            {formatDate(note.updatedAt)}
          </motion.span>
          <div className="flex gap-2">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Link href={`/notes/${note.id}/edit`}>
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <DeleteNoteIconButton noteId={note.id} />
            </motion.div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
