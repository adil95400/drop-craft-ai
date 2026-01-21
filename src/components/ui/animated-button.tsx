/**
 * Animated Button avec micro-interactions et feedback visuel
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Check, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, ButtonProps } from "@/components/ui/button"

type ButtonState = "idle" | "loading" | "success" | "error"

interface AnimatedButtonProps extends Omit<ButtonProps, "onClick"> {
  onClick?: () => void | Promise<void>
  /** Auto-reset state after success/error */
  autoReset?: boolean
  autoResetDelay?: number
  /** Show success/error feedback */
  showFeedback?: boolean
  /** Custom loading text */
  loadingText?: string
  /** Custom success text */
  successText?: string
  /** Custom error text */
  errorText?: string
  /** Icon to show before text */
  icon?: React.ReactNode
  /** Force a specific state */
  forceState?: ButtonState
}

export function AnimatedButton({
  children,
  onClick,
  disabled,
  className,
  variant = "default",
  size = "default",
  autoReset = true,
  autoResetDelay = 2000,
  showFeedback = true,
  loadingText,
  successText = "Succès !",
  errorText = "Erreur",
  icon,
  forceState,
  ...props
}: AnimatedButtonProps) {
  const [state, setState] = React.useState<ButtonState>("idle")
  
  const currentState = forceState ?? state

  React.useEffect(() => {
    if ((currentState === "success" || currentState === "error") && autoReset) {
      const timeout = setTimeout(() => {
        setState("idle")
      }, autoResetDelay)
      return () => clearTimeout(timeout)
    }
  }, [currentState, autoReset, autoResetDelay])

  const handleClick = async () => {
    if (!onClick || currentState === "loading") return

    setState("loading")

    try {
      await onClick()
      if (showFeedback) {
        setState("success")
      } else {
        setState("idle")
      }
    } catch (error) {
      if (showFeedback) {
        setState("error")
      } else {
        setState("idle")
      }
      throw error
    }
  }

  const isDisabled = disabled || currentState === "loading"

  const getVariant = () => {
    if (currentState === "success") return "default"
    if (currentState === "error") return "destructive"
    return variant
  }

  return (
    <Button
      {...props}
      variant={getVariant()}
      size={size}
      disabled={isDisabled}
      onClick={handleClick}
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        currentState === "success" && "bg-green-600 hover:bg-green-600",
        className
      )}
    >
      <AnimatePresence mode="wait">
        {currentState === "idle" && (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            {icon}
            {children}
          </motion.span>
        )}

        {currentState === "loading" && (
          <motion.span
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText || children}
          </motion.span>
        )}

        {currentState === "success" && (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15, type: "spring" }}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            {successText}
          </motion.span>
        )}

        {currentState === "error" && (
          <motion.span
            key="error"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            {errorText}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Ripple effect on click */}
      <motion.div
        className="absolute inset-0 bg-white/20 pointer-events-none"
        initial={false}
        animate={
          currentState === "loading"
            ? { opacity: [0, 0.1, 0] }
            : { opacity: 0 }
        }
        transition={{
          duration: 1.5,
          repeat: currentState === "loading" ? Infinity : 0,
        }}
      />
    </Button>
  )
}

/**
 * Button group pour actions multiples
 */
export function ButtonGroup({
  children,
  className,
  orientation = "horizontal",
}: {
  children: React.ReactNode
  className?: string
  orientation?: "horizontal" | "vertical"
}) {
  return (
    <div
      className={cn(
        "flex gap-2",
        orientation === "vertical" && "flex-col",
        className
      )}
    >
      {children}
    </div>
  )
}
