/**
 * ChannableBulkActions - Actions en masse style Channable
 * Barre d'actions pour sélection multiple
 */

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  RefreshCw, Trash2, Power, PowerOff, ChevronDown,
  Download, Upload, Settings2, X, CheckCheck
} from 'lucide-react'

export interface BulkAction {
  id: string
  label: string
  icon: React.ElementType
  variant?: 'default' | 'destructive' | 'outline'
  onClick: (selectedIds: string[]) => void
  disabled?: boolean
}

interface ChannableBulkActionsProps {
  selectedCount: number
  totalCount: number
  selectedIds: string[]
  onSelectAll: () => void
  onDeselectAll: () => void
  isAllSelected: boolean
  actions: BulkAction[]
  className?: string
}

export function ChannableBulkActions({
  selectedCount,
  totalCount,
  selectedIds,
  onSelectAll,
  onDeselectAll,
  isAllSelected,
  actions,
  className
}: ChannableBulkActionsProps) {
  const hasSelection = selectedCount > 0

  const primaryActions = actions.slice(0, 3)
  const moreActions = actions.slice(3)

  return (
    <AnimatePresence>
      {hasSelection && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            "flex items-center gap-3 p-3 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg",
            className
          )}
        >
          {/* Selection Info */}
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={(checked) => checked ? onSelectAll() : onDeselectAll()}
              className="data-[state=checked]:bg-primary"
            />
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className="bg-primary/10 text-primary border-primary/20 font-medium"
              >
                {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
              </Badge>
              <span className="text-sm text-muted-foreground">
                sur {totalCount}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-border" />

          {/* Primary Actions */}
          <div className="flex items-center gap-2">
            {primaryActions.map(action => {
              const Icon = action.icon
              return (
                <Button
                  key={action.id}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={() => action.onClick(selectedIds)}
                  disabled={action.disabled}
                  className={cn(
                    "gap-1.5",
                    action.variant === 'destructive' && "hover:bg-destructive/90"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {action.label}
                </Button>
              )
            })}

            {/* More Actions Dropdown */}
            {moreActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    Plus
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {moreActions.map((action, index) => {
                    const Icon = action.icon
                    return (
                      <div key={action.id}>
                        {index > 0 && action.variant === 'destructive' && (
                          <DropdownMenuSeparator />
                        )}
                        <DropdownMenuItem
                          onClick={() => action.onClick(selectedIds)}
                          disabled={action.disabled}
                          className={cn(
                            action.variant === 'destructive' && "text-destructive focus:text-destructive"
                          )}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {action.label}
                        </DropdownMenuItem>
                      </div>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Clear Selection */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onDeselectAll}
            className="ml-auto h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Note: DEFAULT_CHANNEL_BULK_ACTIONS removed - actions should be defined
// in the parent component with real handlers connected to Supabase
