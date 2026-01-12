/**
 * État vide style Channable
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6",
        className
      )}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="relative mb-6"
      >
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary/10" />
        <div className="absolute -bottom-1 -left-3 h-4 w-4 rounded-full bg-primary/20" />
      </motion.div>

      {/* Title */}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap gap-3 justify-center">
          {action && (
            <Button 
              onClick={action.onClick}
              className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg shadow-primary/20"
            >
              <ActionIcon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  )
}
