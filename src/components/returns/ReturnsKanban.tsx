/**
 * Vue Kanban pour la gestion des retours
 * Affiche les retours par statut avec drag-and-drop
 */
import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { 
  Clock, 
  CheckCircle, 
  Package, 
  Eye, 
  RefreshCw, 
  XCircle,
  ArrowRight,
  MoreHorizontal
} from 'lucide-react'
import { Return, useReturns } from '@/hooks/useReturns'
import { ReturnDetailSheet } from './ReturnDetailSheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const COLUMNS = [
  { id: 'pending', label: 'En attente', icon: Clock, color: 'bg-amber-500/10 border-amber-500/20', iconColor: 'text-amber-500' },
  { id: 'approved', label: 'Approuvés', icon: CheckCircle, color: 'bg-blue-500/10 border-blue-500/20', iconColor: 'text-blue-500' },
  { id: 'received', label: 'Reçus', icon: Package, color: 'bg-purple-500/10 border-purple-500/20', iconColor: 'text-purple-500' },
  { id: 'inspecting', label: 'Inspection', icon: Eye, color: 'bg-orange-500/10 border-orange-500/20', iconColor: 'text-orange-500' },
  { id: 'refunded', label: 'Remboursés', icon: RefreshCw, color: 'bg-emerald-500/10 border-emerald-500/20', iconColor: 'text-emerald-500' },
] as const

const REASON_LABELS: Record<string, string> = {
  defective: 'Défectueux',
  wrong_item: 'Mauvais article',
  not_as_described: 'Non conforme',
  changed_mind: 'Changement avis',
  damaged_shipping: 'Endommagé',
  other: 'Autre'
}

interface ReturnCardProps {
  returnItem: Return
  onView: () => void
  onQuickAction?: (status: Return['status']) => void
}

function ReturnCard({ returnItem, onView, onQuickAction }: ReturnCardProps) {
  const getNextStatus = (): Return['status'] | null => {
    switch (returnItem.status) {
      case 'pending': return 'approved'
      case 'approved': return 'received'
      case 'received': return 'inspecting'
      case 'inspecting': return 'refunded'
      default: return null
    }
  }

  const nextStatus = getNextStatus()

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.01] border-l-4 border-l-primary/50"
      onClick={onView}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="font-mono text-sm font-medium truncate">
              {returnItem.rma_number}
            </div>
            <Badge variant="outline" className="text-xs">
              {REASON_LABELS[returnItem.reason_category || 'other']}
            </Badge>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
                <Eye className="h-4 w-4 mr-2" />
                Voir détails
              </DropdownMenuItem>
              {nextStatus && onQuickAction && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onQuickAction(nextStatus); }}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Passer à l'étape suivante
                </DropdownMenuItem>
              )}
              {returnItem.status === 'pending' && onQuickAction && (
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onQuickAction('rejected'); }}
                  className="text-destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeter
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{returnItem.items?.length || 0} article(s)</span>
          {returnItem.refund_amount && (
            <span className="font-medium text-foreground">
              €{returnItem.refund_amount.toLocaleString()}
            </span>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground mt-1">
          {new Date(returnItem.created_at).toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'short' 
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function ReturnsKanban() {
  const { returns, updateStatus, isUpdating } = useReturns()
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const columnData = useMemo(() => {
    return COLUMNS.map(column => ({
      ...column,
      items: returns.filter(r => r.status === column.id)
    }))
  }, [returns])

  const handleQuickAction = (returnItem: Return, newStatus: Return['status']) => {
    updateStatus({ id: returnItem.id, status: newStatus })
  }

  return (
    <>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {columnData.map((column) => {
            const Icon = column.icon
            return (
              <div 
                key={column.id} 
                className={cn(
                  "w-72 shrink-0 rounded-lg border p-3",
                  column.color
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", column.iconColor)} />
                    <span className="font-medium text-sm">{column.label}</span>
                  </div>
                  <Badge variant="secondary" className="h-5 px-2 text-xs">
                    {column.items.length}
                  </Badge>
                </div>
                
                <div className="space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto">
                  {column.items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Aucun retour
                    </div>
                  ) : (
                    column.items.map((returnItem) => (
                      <ReturnCard
                        key={returnItem.id}
                        returnItem={returnItem}
                        onView={() => {
                          setSelectedReturn(returnItem)
                          setIsDetailOpen(true)
                        }}
                        onQuickAction={(status) => handleQuickAction(returnItem, status)}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <ReturnDetailSheet
        returnItem={selectedReturn}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </>
  )
}
