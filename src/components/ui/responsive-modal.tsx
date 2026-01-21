/**
 * ResponsiveModal - Modal adaptative qui devient un Drawer sur mobile
 * Améliore l'UX mobile avec animations fluides et gestion optimisée
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"

// Dialog components
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

// Drawer components
import {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"

interface ResponsiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
  /** Force mobile/desktop mode */
  forceMode?: "mobile" | "desktop"
}

interface ResponsiveModalContentProps {
  children: React.ReactNode
  className?: string
  /** Max width for desktop dialog */
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-4xl",
}

// Context to share modal state
const ResponsiveModalContext = React.createContext<{
  isMobile: boolean
  isOpen: boolean
}>({
  isMobile: false,
  isOpen: false,
})

export function ResponsiveModal({
  open,
  onOpenChange,
  children,
  forceMode,
}: ResponsiveModalProps) {
  const isMobileQuery = useMediaQuery("(max-width: 768px)")
  const isMobile = forceMode ? forceMode === "mobile" : isMobileQuery

  const contextValue = React.useMemo(
    () => ({ isMobile, isOpen: open }),
    [isMobile, open]
  )

  if (isMobile) {
    return (
      <ResponsiveModalContext.Provider value={contextValue}>
        <Drawer open={open} onOpenChange={onOpenChange}>
          {children}
        </Drawer>
      </ResponsiveModalContext.Provider>
    )
  }

  return (
    <ResponsiveModalContext.Provider value={contextValue}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {children}
      </Dialog>
    </ResponsiveModalContext.Provider>
  )
}

export function ResponsiveModalTrigger({
  children,
  className,
  asChild,
}: {
  children: React.ReactNode
  className?: string
  asChild?: boolean
}) {
  const { isMobile } = React.useContext(ResponsiveModalContext)

  if (isMobile) {
    return (
      <DrawerTrigger className={className} asChild={asChild}>
        {children}
      </DrawerTrigger>
    )
  }

  return (
    <DialogTrigger className={className} asChild={asChild}>
      {children}
    </DialogTrigger>
  )
}

export function ResponsiveModalContent({
  children,
  className,
  size = "lg",
}: ResponsiveModalContentProps) {
  const { isMobile } = React.useContext(ResponsiveModalContext)

  if (isMobile) {
    return (
      <DrawerContent
        className={cn(
          "max-h-[90vh] overflow-y-auto",
          className
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </DrawerContent>
    )
  }

  return (
    <DialogContent
      className={cn(
        sizeClasses[size],
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        className
      )}
    >
      {children}
    </DialogContent>
  )
}

export function ResponsiveModalHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { isMobile } = React.useContext(ResponsiveModalContext)

  if (isMobile) {
    return <DrawerHeader className={className}>{children}</DrawerHeader>
  }

  return <DialogHeader className={className}>{children}</DialogHeader>
}

export function ResponsiveModalFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { isMobile } = React.useContext(ResponsiveModalContext)

  if (isMobile) {
    return (
      <DrawerFooter className={cn("pb-safe", className)}>
        {children}
      </DrawerFooter>
    )
  }

  return <DialogFooter className={className}>{children}</DialogFooter>
}

export function ResponsiveModalTitle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { isMobile } = React.useContext(ResponsiveModalContext)

  if (isMobile) {
    return <DrawerTitle className={className}>{children}</DrawerTitle>
  }

  return <DialogTitle className={className}>{children}</DialogTitle>
}

export function ResponsiveModalDescription({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { isMobile } = React.useContext(ResponsiveModalContext)

  if (isMobile) {
    return <DrawerDescription className={className}>{children}</DrawerDescription>
  }

  return <DialogDescription className={className}>{children}</DialogDescription>
}

export function ResponsiveModalClose({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  const { isMobile } = React.useContext(ResponsiveModalContext)

  if (isMobile) {
    return <DrawerClose className={className}>{children}</DrawerClose>
  }

  return <DialogClose className={className}>{children}</DialogClose>
}

// Hook to get modal context
export function useResponsiveModal() {
  return React.useContext(ResponsiveModalContext)
}

// Re-export for convenience
export {
  ResponsiveModal as Modal,
  ResponsiveModalTrigger as ModalTrigger,
  ResponsiveModalContent as ModalContent,
  ResponsiveModalHeader as ModalHeader,
  ResponsiveModalFooter as ModalFooter,
  ResponsiveModalTitle as ModalTitle,
  ResponsiveModalDescription as ModalDescription,
  ResponsiveModalClose as ModalClose,
}
