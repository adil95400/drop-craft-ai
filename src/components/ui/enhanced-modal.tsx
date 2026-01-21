/**
 * Enhanced Modal - Modal avec animations avancées et responsive
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useIsMobile, usePrefersReducedMotion } from "@/hooks/use-media-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"

interface EnhancedModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  /** Modal size */
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  /** Show back button instead of close */
  showBackButton?: boolean
  onBack?: () => void
  /** Prevent close on overlay click */
  preventClose?: boolean
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-4xl",
}

const EnhancedModalContext = React.createContext<{
  isMobile: boolean
  prefersReducedMotion: boolean
}>({
  isMobile: false,
  prefersReducedMotion: false,
})

export function EnhancedModal({
  open,
  onOpenChange,
  children,
  size = "lg",
  showBackButton = false,
  onBack,
  preventClose = false,
}: EnhancedModalProps) {
  const isMobile = useIsMobile()
  const prefersReducedMotion = usePrefersReducedMotion()

  const handleOpenChange = (value: boolean) => {
    if (preventClose && !value) return
    onOpenChange(value)
  }

  const contextValue = React.useMemo(
    () => ({ isMobile, prefersReducedMotion }),
    [isMobile, prefersReducedMotion]
  )

  if (isMobile) {
    return (
      <EnhancedModalContext.Provider value={contextValue}>
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerContent className="max-h-[90vh] overflow-hidden flex flex-col">
            {showBackButton && onBack && (
              <div className="absolute left-4 top-4 z-10">
                <Button variant="ghost" size="icon" onClick={onBack}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-4 pb-safe">
              {children}
            </div>
          </DrawerContent>
        </Drawer>
      </EnhancedModalContext.Provider>
    )
  }

  return (
    <EnhancedModalContext.Provider value={contextValue}>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className={cn(sizeClasses[size], "overflow-hidden")}>
          {showBackButton && onBack && (
            <div className="absolute left-4 top-4 z-10">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>
          )}
          {children}
        </DialogContent>
      </Dialog>
    </EnhancedModalContext.Provider>
  )
}

/**
 * Modal Header avec icon et badge optionnels
 */
export function EnhancedModalHeader({
  children,
  className,
  icon,
  badge,
}: {
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
  badge?: React.ReactNode
}) {
  const { isMobile } = React.useContext(EnhancedModalContext)
  const Header = isMobile ? DrawerHeader : DialogHeader

  return (
    <Header className={cn("relative", className)}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-start gap-3"
      >
        {icon && (
          <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {children}
          {badge && <div className="mt-2">{badge}</div>}
        </div>
      </motion.div>
    </Header>
  )
}

/**
 * Modal Title
 */
export function EnhancedModalTitle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { isMobile } = React.useContext(EnhancedModalContext)
  const Title = isMobile ? DrawerTitle : DialogTitle

  return (
    <Title className={cn("text-lg font-semibold", className)}>
      {children}
    </Title>
  )
}

/**
 * Modal Description
 */
export function EnhancedModalDescription({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { isMobile } = React.useContext(EnhancedModalContext)
  const Description = isMobile ? DrawerDescription : DialogDescription

  return (
    <Description className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </Description>
  )
}

/**
 * Modal Body avec scroll
 */
export function EnhancedModalBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className={cn("flex-1 overflow-y-auto py-4", className)}
    >
      {children}
    </motion.div>
  )
}

/**
 * Modal Footer avec actions
 */
export function EnhancedModalFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { isMobile } = React.useContext(EnhancedModalContext)
  const Footer = isMobile ? DrawerFooter : DialogFooter

  return (
    <Footer
      className={cn(
        "border-t bg-muted/30 -mx-6 px-6 py-4",
        isMobile && "-mx-4 px-4",
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full"
      >
        {children}
      </motion.div>
    </Footer>
  )
}

/**
 * Step indicator pour les modales multi-étapes
 */
export function ModalStepIndicator({
  currentStep,
  totalSteps,
  labels,
  className,
}: {
  currentStep: number
  totalSteps: number
  labels?: string[]
  className?: string
}) {
  return (
    <div className={cn("flex items-center justify-center gap-2 mb-6", className)}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <React.Fragment key={index}>
          <motion.div
            initial={false}
            animate={{
              scale: index === currentStep ? 1.1 : 1,
              backgroundColor:
                index < currentStep
                  ? "hsl(var(--primary))"
                  : index === currentStep
                  ? "hsl(var(--primary))"
                  : "hsl(var(--muted))",
            }}
            transition={{ duration: 0.2 }}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium",
              index <= currentStep
                ? "text-primary-foreground"
                : "text-muted-foreground"
            )}
          >
            {index + 1}
          </motion.div>
          {index < totalSteps - 1 && (
            <motion.div
              initial={false}
              animate={{
                backgroundColor:
                  index < currentStep
                    ? "hsl(var(--primary))"
                    : "hsl(var(--muted))",
              }}
              className="h-0.5 w-8 rounded-full"
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

/**
 * Hook for modal context
 */
export function useEnhancedModal() {
  return React.useContext(EnhancedModalContext)
}
