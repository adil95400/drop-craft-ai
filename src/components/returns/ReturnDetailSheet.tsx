import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  CheckCircle, 
  XCircle, 
  Package, 
  RefreshCw, 
  Eye,
  Truck,
  Clock,
  Loader2
} from 'lucide-react'
import { Return, useReturns } from '@/hooks/useReturns'
import { useState } from 'react'

interface ReturnDetailSheetProps {
  returnItem: Return | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_CONFIG: Record<Return['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock; color: string }> = {
  pending: { label: 'En attente', variant: 'secondary', icon: Clock, color: 'text-yellow-600' },
  approved: { label: 'Approuvé', variant: 'default', icon: CheckCircle, color: 'text-blue-600' },
  received: { label: 'Reçu', variant: 'default', icon: Package, color: 'text-purple-600' },
  inspecting: { label: 'Inspection', variant: 'outline', icon: Eye, color: 'text-orange-600' },
  refunded: { label: 'Remboursé', variant: 'default', icon: RefreshCw, color: 'text-green-600' },
  rejected: { label: 'Rejeté', variant: 'destructive', icon: XCircle, color: 'text-red-600' },
  completed: { label: 'Terminé', variant: 'default', icon: CheckCircle, color: 'text-green-600' }
}

const REASON_LABELS: Record<string, string> = {
  defective: 'Produit défectueux',
  wrong_item: 'Mauvais article',
  not_as_described: 'Non conforme',
  changed_mind: 'Changement d\'avis',
  damaged_shipping: 'Endommagé à la livraison',
  other: 'Autre'
}

export function ReturnDetailSheet({ returnItem, open, onOpenChange }: ReturnDetailSheetProps) {
  const { updateStatus, updateReturn, isUpdating } = useReturns()
  const [trackingNumber, setTrackingNumber] = useState('')
  const [carrier, setCarrier] = useState('')
  const [notes, setNotes] = useState('')

  if (!returnItem) return null

  const statusConfig = STATUS_CONFIG[returnItem.status]
  const StatusIcon = statusConfig.icon

  const handleStatusChange = (newStatus: Return['status']) => {
    updateStatus({ id: returnItem.id, status: newStatus, notes: notes || undefined })
  }

  const handleAddTracking = () => {
    if (!trackingNumber) return
    updateReturn({ 
      id: returnItem.id, 
      updates: { 
        tracking_number: trackingNumber, 
        carrier: carrier || undefined 
      } 
    })
    setTrackingNumber('')
    setCarrier('')
  }

  const getNextActions = () => {
    switch (returnItem.status) {
      case 'pending':
        return [
          { label: 'Approuver', status: 'approved' as const, icon: CheckCircle, variant: 'default' as const },
          { label: 'Rejeter', status: 'rejected' as const, icon: XCircle, variant: 'destructive' as const }
        ]
      case 'approved':
        return [
          { label: 'Marquer reçu', status: 'received' as const, icon: Package, variant: 'default' as const }
        ]
      case 'received':
        return [
          { label: 'Commencer inspection', status: 'inspecting' as const, icon: Eye, variant: 'default' as const }
        ]
      case 'inspecting':
        return [
          { label: 'Rembourser', status: 'refunded' as const, icon: RefreshCw, variant: 'default' as const },
          { label: 'Rejeter', status: 'rejected' as const, icon: XCircle, variant: 'destructive' as const }
        ]
      case 'refunded':
        return [
          { label: 'Terminer', status: 'completed' as const, icon: CheckCircle, variant: 'default' as const }
        ]
      default:
        return []
    }
  }

  const nextActions = getNextActions()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
            {returnItem.rma_number}
          </SheetTitle>
          <SheetDescription>
            Créé le {new Date(returnItem.created_at).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status */}
          <div>
            <Label className="text-muted-foreground">Statut actuel</Label>
            <div className="mt-1">
              <Badge variant={statusConfig.variant} className="text-sm">
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Reason */}
          <div>
            <Label className="text-muted-foreground">Raison du retour</Label>
            <p className="mt-1 font-medium">
              {REASON_LABELS[returnItem.reason_category || 'other']}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{returnItem.reason}</p>
            {returnItem.description && (
              <p className="text-sm mt-2 p-3 bg-muted rounded-lg">{returnItem.description}</p>
            )}
          </div>

          <Separator />

          {/* Items */}
          <div>
            <Label className="text-muted-foreground">Articles ({returnItem.items?.length || 0})</Label>
            <div className="mt-2 space-y-2">
              {returnItem.items?.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{item.product_name}</span>
                    <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                  </div>
                  <span className="font-medium">€{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Refund */}
          {returnItem.refund_amount && (
            <>
              <Separator />
              <div className="flex justify-between items-center">
                <Label className="text-muted-foreground">Montant du remboursement</Label>
                <span className="text-xl font-bold">€{returnItem.refund_amount.toLocaleString()}</span>
              </div>
            </>
          )}

          {/* Tracking */}
          {returnItem.status === 'approved' && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label>Numéro de suivi retour</Label>
                {returnItem.tracking_number ? (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono">{returnItem.tracking_number}</span>
                    </div>
                    {returnItem.carrier && (
                      <p className="text-sm text-muted-foreground mt-1">{returnItem.carrier}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="Numéro de suivi"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                    <Input
                      placeholder="Transporteur (optionnel)"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                    />
                    <Button 
                      onClick={handleAddTracking} 
                      disabled={!trackingNumber || isUpdating}
                      className="w-full"
                    >
                      Ajouter le suivi
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Notes */}
          {returnItem.notes && (
            <>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Notes</Label>
                <p className="mt-1 text-sm p-3 bg-muted rounded-lg">{returnItem.notes}</p>
              </div>
            </>
          )}

          {/* Timeline */}
          <Separator />
          <div>
            <Label className="text-muted-foreground">Historique</Label>
            <div className="mt-2 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Créé</span>
                <span className="text-muted-foreground">
                  {new Date(returnItem.created_at).toLocaleString('fr-FR')}
                </span>
              </div>
              {returnItem.received_at && (
                <div className="flex justify-between">
                  <span>Reçu</span>
                  <span className="text-muted-foreground">
                    {new Date(returnItem.received_at).toLocaleString('fr-FR')}
                  </span>
                </div>
              )}
              {returnItem.inspected_at && (
                <div className="flex justify-between">
                  <span>Inspecté</span>
                  <span className="text-muted-foreground">
                    {new Date(returnItem.inspected_at).toLocaleString('fr-FR')}
                  </span>
                </div>
              )}
              {returnItem.refunded_at && (
                <div className="flex justify-between">
                  <span>Remboursé</span>
                  <span className="text-muted-foreground">
                    {new Date(returnItem.refunded_at).toLocaleString('fr-FR')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {nextActions.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label>Notes pour cette action</Label>
                <Textarea
                  placeholder="Ajouter des notes (optionnel)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
                <div className="flex gap-2">
                  {nextActions.map((action) => {
                    const ActionIcon = action.icon
                    return (
                      <Button
                        key={action.status}
                        variant={action.variant}
                        onClick={() => handleStatusChange(action.status)}
                        disabled={isUpdating}
                        className="flex-1"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ActionIcon className="h-4 w-4 mr-2" />
                        )}
                        {action.label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
