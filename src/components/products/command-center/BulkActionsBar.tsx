/**
 * Barre d'actions groupées pour le Command Center
 * Permet d'appliquer des actions sur plusieurs produits sélectionnés
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DollarSign, RefreshCw, Sparkles, Trash2, Download, 
  ChevronDown, X, Loader2, CheckCircle2, Tag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface BulkAction {
  id: string
  label: string
  icon: typeof DollarSign
  variant?: 'default' | 'destructive'
  requiresConfirmation?: boolean
}

interface BulkActionsBarProps {
  selectedCount: number
  selectedIds: string[]
  onClear: () => void
  onAction: (actionId: string, productIds: string[]) => Promise<void>
  isVisible: boolean
}

const bulkActions: BulkAction[] = [
  { id: 'apply_price_rule', label: 'Appliquer règle prix', icon: DollarSign },
  { id: 'sync_stores', label: 'Synchroniser', icon: RefreshCw },
  { id: 'optimize_ai', label: 'Optimiser IA', icon: Sparkles },
  { id: 'add_tag', label: 'Ajouter tag', icon: Tag },
  { id: 'export', label: 'Exporter', icon: Download },
  { id: 'delete', label: 'Supprimer', icon: Trash2, variant: 'destructive', requiresConfirmation: true },
]

export function BulkActionsBar({
  selectedCount,
  selectedIds,
  onClear,
  onAction,
  isVisible
}: BulkActionsBarProps) {
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [completedAction, setCompletedAction] = useState<string | null>(null)
  
  const handleAction = async (action: BulkAction) => {
    if (action.requiresConfirmation) {
      // In a real app, show confirmation dialog
      const confirmed = window.confirm(
        `Êtes-vous sûr de vouloir ${action.label.toLowerCase()} ${selectedCount} produits ?`
      )
      if (!confirmed) return
    }
    
    setProcessingAction(action.id)
    
    try {
      await onAction(action.id, selectedIds)
      setCompletedAction(action.id)
      setTimeout(() => setCompletedAction(null), 2000)
    } catch (error) {
      console.error('Bulk action failed:', error)
    } finally {
      setProcessingAction(null)
    }
  }
  
  return (
    <AnimatePresence>
      {isVisible && selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
            'flex items-center gap-3 px-4 py-3',
            'bg-background/95 backdrop-blur-xl border border-border/50',
            'rounded-2xl shadow-2xl',
            // Mobile responsive
            'max-w-[calc(100vw-2rem)] overflow-x-auto'
          )}
        >
          {/* Selection count */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge 
              variant="secondary" 
              className="bg-primary text-primary-foreground font-bold"
            >
              {selectedCount}
            </Badge>
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
              sélectionnés
            </span>
          </div>
          
          {/* Divider */}
          <div className="h-8 w-px bg-border shrink-0" />
          
          {/* Quick actions - visible on larger screens */}
          <div className="hidden md:flex items-center gap-2">
            {bulkActions.slice(0, 3).map((action) => {
              const Icon = action.icon
              const isProcessing = processingAction === action.id
              const isCompleted = completedAction === action.id
              
              return (
                <Button
                  key={action.id}
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  disabled={!!processingAction}
                  onClick={() => handleAction(action)}
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span className="hidden lg:inline">{action.label}</span>
                </Button>
              )
            })}
          </div>
          
          {/* Dropdown for more actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <span className="md:hidden">Actions</span>
                <span className="hidden md:inline">Plus</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {bulkActions.map((action, index) => {
                const Icon = action.icon
                const isProcessing = processingAction === action.id
                
                // Add separator before destructive actions
                const showSeparator = action.variant === 'destructive' && 
                  index > 0 && 
                  bulkActions[index - 1].variant !== 'destructive'
                
                return (
                  <div key={action.id}>
                    {showSeparator && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={() => handleAction(action)}
                      disabled={!!processingAction}
                      className={cn(
                        action.variant === 'destructive' && 'text-destructive focus:text-destructive'
                      )}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4 mr-2" />
                      )}
                      {action.label}
                    </DropdownMenuItem>
                  </div>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Clear selection */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
