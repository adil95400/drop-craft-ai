/**
 * Vue liste des retours avec tableau optimisé
 */
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Clock, 
  CheckCircle, 
  Package, 
  Eye, 
  RefreshCw, 
  XCircle,
  MoreHorizontal,
  ArrowRight,
  Trash2
} from 'lucide-react'
import { Return, useReturns } from '@/hooks/useReturns'
import { ReturnDetailSheet } from './ReturnDetailSheet'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<Return['status'], { 
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  icon: typeof Clock
  color: string 
}> = {
  pending: { label: 'En attente', variant: 'secondary', icon: Clock, color: 'text-amber-500' },
  approved: { label: 'Approuvé', variant: 'default', icon: CheckCircle, color: 'text-blue-500' },
  received: { label: 'Reçu', variant: 'default', icon: Package, color: 'text-purple-500' },
  inspecting: { label: 'Inspection', variant: 'outline', icon: Eye, color: 'text-orange-500' },
  refunded: { label: 'Remboursé', variant: 'default', icon: RefreshCw, color: 'text-emerald-500' },
  rejected: { label: 'Rejeté', variant: 'destructive', icon: XCircle, color: 'text-red-500' },
  completed: { label: 'Terminé', variant: 'default', icon: CheckCircle, color: 'text-emerald-500' }
}

const REASON_LABELS: Record<string, string> = {
  defective: 'Défectueux',
  wrong_item: 'Mauvais article',
  not_as_described: 'Non conforme',
  changed_mind: 'Changement avis',
  damaged_shipping: 'Endommagé',
  other: 'Autre'
}

interface ReturnsListViewProps {
  returns: Return[]
  onStatusChange: (id: string, status: Return['status']) => void
}

export function ReturnsListView({ returns, onStatusChange }: ReturnsListViewProps) {
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleAllSelection = () => {
    if (selectedIds.length === returns.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(returns.map(r => r.id))
    }
  }

  const getNextStatus = (status: Return['status']): Return['status'] | null => {
    switch (status) {
      case 'pending': return 'approved'
      case 'approved': return 'received'
      case 'received': return 'inspecting'
      case 'inspecting': return 'refunded'
      case 'refunded': return 'completed'
      default: return null
    }
  }

  if (returns.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun retour</h3>
          <p className="text-muted-foreground">
            Aucune demande de retour ne correspond aux filtres sélectionnés
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === returns.length && returns.length > 0}
                  onCheckedChange={toggleAllSelection}
                />
              </TableHead>
              <TableHead>RMA</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Raison</TableHead>
              <TableHead className="text-center">Articles</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.map((returnItem) => {
              const statusConfig = STATUS_CONFIG[returnItem.status]
              const StatusIcon = statusConfig.icon
              const nextStatus = getNextStatus(returnItem.status)

              return (
                <TableRow 
                  key={returnItem.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedReturn(returnItem)
                    setIsDetailOpen(true)
                  }}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(returnItem.id)}
                      onCheckedChange={() => toggleSelection(returnItem.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-medium">
                      {returnItem.rma_number}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig.variant} className="gap-1">
                      <StatusIcon className={cn("h-3 w-3", statusConfig.color)} />
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {REASON_LABELS[returnItem.reason_category || 'other']}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">
                      {returnItem.items?.length || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {returnItem.refund_amount 
                      ? `€${returnItem.refund_amount.toLocaleString()}`
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(returnItem.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedReturn(returnItem)
                          setIsDetailOpen(true)
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        {nextStatus && (
                          <DropdownMenuItem onClick={() => onStatusChange(returnItem.id, nextStatus)}>
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Passer en "{STATUS_CONFIG[nextStatus].label}"
                          </DropdownMenuItem>
                        )}
                        {returnItem.status === 'pending' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => onStatusChange(returnItem.id, 'rejected')}
                              className="text-destructive"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Rejeter
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border rounded-lg shadow-lg p-4 flex items-center gap-4 z-50">
          <span className="text-sm font-medium">
            {selectedIds.length} sélectionné(s)
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelectedIds([])}>
              Annuler
            </Button>
            <Button size="sm">
              Actions groupées
            </Button>
          </div>
        </div>
      )}

      <ReturnDetailSheet
        returnItem={selectedReturn}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </>
  )
}
