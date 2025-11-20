"use client"

import { motion, HTMLMotionProps } from "framer-motion"
import { Button, ButtonProps } from "@/components/ui/button"
import { forwardRef } from "react"

type AnimatedButtonProps = ButtonProps & {
  children: React.ReactNode
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, ...props }, ref) => {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Button ref={ref} {...props}>
          {children}
        </Button>
      </motion.div>
    )
  }
)

AnimatedButton.displayName = "AnimatedButton"
