/**
 * État vide style Channable — Premium, minimal, pro
 */

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LucideIcon, Plus, Search, FolderOpen, Inbox } from 'lucide-react'

interface ChannableEmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
  variant?: 'default' | 'search' | 'folder' | 'inbox'
}

const defaultIcons = {
  default: Inbox,
  search: Search,
  folder: FolderOpen,
  inbox: Inbox,
}

export function ChannableEmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  variant = 'default'
}: ChannableEmptyStateProps) {
  const Icon = icon || defaultIcons[variant]
  const ActionIcon = action?.icon || Plus

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center text-center py-14 px-6",
        className
      )}
    >
      {/* Icon — cleaner, more refined */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.05 }}
        className="mb-5"
      >
        <div className="h-16 w-16 rounded-2xl bg-muted/60 border border-border/30 flex items-center justify-center">
          <Icon className="h-7 w-7 text-muted-foreground/60" />
        </div>
      </motion.div>

      <h3 className="text-base font-semibold mb-1.5">{title}</h3>

      {description && (
        <p className="text-[13px] text-muted-foreground max-w-sm mb-5 leading-relaxed">{description}</p>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-wrap gap-2.5 justify-center">
          {action && (
            <Button 
              onClick={action.onClick}
              size="sm"
              className="rounded-xl gap-2 shadow-sm h-9"
            >
              <ActionIcon className="h-3.5 w-3.5" />
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" size="sm" onClick={secondaryAction.onClick} className="rounded-xl h-9">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  )
}
