import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  RotateCcw, CheckCircle, XCircle, Clock, Package, 
  CreditCard, RefreshCw, Eye, Zap, TrendingDown,
  AlertTriangle, ArrowDownLeft
} from 'lucide-react'
import { useReturnsManagement } from '@/hooks/useReturnsManagement'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: React.ReactNode }> = {
    pending: { variant: 'secondary', label: 'En attente', icon: <Clock className="w-3 h-3" /> },
    approved: { variant: 'default', label: 'Approuvé', icon: <CheckCircle className="w-3 h-3" /> },
    rejected: { variant: 'destructive', label: 'Refusé', icon: <XCircle className="w-3 h-3" /> },
    received: { variant: 'outline', label: 'Reçu', icon: <Package className="w-3 h-3" /> },
    refunded: { variant: 'default', label: 'Remboursé', icon: <CreditCard className="w-3 h-3" /> }
  }
  
  const { variant, label, icon } = config[status] || config.pending
  
  return (
    <Badge variant={variant} className="gap-1">
      {icon}
      {label}
    </Badge>
  )
}

export const ReturnsManagementPanel: React.FC = () => {
  const {
    returns,
    returnsLoading,
    stats,
    processReturn,
    isProcessing,
    processRefund,
    isRefunding,
    autoProcess,
    isAutoProcessing,
    refetch
  } = useReturnsManagement()

  const [selectedReturn, setSelectedReturn] = useState<any>(null)
  const [actionDialog, setActionDialog] = useState<'approve' | 'reject' | 'refund' | null>(null)
  const [notes, setNotes] = useState('')
  const [refundAmount, setRefundAmount] = useState('')

  const handleAction = () => {
    if (!selectedReturn) return

    if (actionDialog === 'approve' || actionDialog === 'reject') {
      processReturn({
        returnId: selectedReturn.id,
        action: actionDialog,
        notes
      })
    } else if (actionDialog === 'refund') {
      processRefund({
        returnId: selectedReturn.id,
        amount: parseFloat(refundAmount) || selectedReturn.refundAmount,
        method: 'original_payment'
      })
    }

    setActionDialog(null)
    setSelectedReturn(null)
    setNotes('')
    setRefundAmount('')
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.approved || 0}</p>
                <p className="text-xs text-muted-foreground">Approuvés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.received || 0}</p>
                <p className="text-xs text-muted-foreground">Reçus</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <CreditCard className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.refunded || 0}</p>
                <p className="text-xs text-muted-foreground">Remboursés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalRefundAmount?.toFixed(0) || 0}€</p>
                <p className="text-xs text-muted-foreground">Remboursé</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Zap className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.approvalRate || 0}%</p>
                <p className="text-xs text-muted-foreground">Taux approbation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Returns Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5" />
                Gestion des retours
              </CardTitle>
              <CardDescription>
                Traitez les demandes de retour et remboursements
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {returnsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : returns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((ret) => (
                  <TableRow key={ret.id}>
                    <TableCell>
                      <span className="font-medium">{ret.orderNumber}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ret.customerName}</div>
                        <div className="text-sm text-muted-foreground">{ret.customerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{ret.reason}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{ret.refundAmount?.toFixed(2) || '0.00'}€</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ret.status} />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(ret.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {ret.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() => {
                                setSelectedReturn(ret)
                                setActionDialog('approve')
                              }}
                            >
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => {
                                setSelectedReturn(ret)
                                setActionDialog('reject')
                              }}
                            >
                              <XCircle className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isAutoProcessing}
                              onClick={() => autoProcess(ret.id)}
                              title="Traitement automatique"
                            >
                              <Zap className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {(ret.status === 'approved' || ret.status === 'received') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReturn(ret)
                              setRefundAmount(ret.refundAmount?.toString() || '')
                              setActionDialog('refund')
                            }}
                          >
                            <CreditCard className="w-3 h-3" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <RotateCcw className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Aucune demande de retour</h3>
              <p className="text-muted-foreground">
                Les demandes de retour apparaîtront ici
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog === 'approve' && 'Approuver le retour'}
              {actionDialog === 'reject' && 'Refuser le retour'}
              {actionDialog === 'refund' && 'Effectuer le remboursement'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog === 'approve' && 'Confirmez l\'approbation de cette demande de retour.'}
              {actionDialog === 'reject' && 'Indiquez le motif du refus.'}
              {actionDialog === 'refund' && 'Confirmez le montant du remboursement.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedReturn && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">Commande: {selectedReturn.orderNumber}</p>
                <p className="text-sm text-muted-foreground">Client: {selectedReturn.customerName}</p>
                <p className="text-sm text-muted-foreground">Montant: {selectedReturn.refundAmount?.toFixed(2)}€</p>
              </div>
            )}

            {actionDialog === 'refund' && (
              <div className="space-y-2">
                <Label htmlFor="refundAmount">Montant du remboursement</Label>
                <Input
                  id="refundAmount"
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            )}

            {(actionDialog === 'approve' || actionDialog === 'reject') && (
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajoutez des notes..."
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Annuler
            </Button>
            <Button 
              onClick={handleAction}
              disabled={isProcessing || isRefunding}
              variant={actionDialog === 'reject' ? 'destructive' : 'default'}
            >
              {(isProcessing || isRefunding) && (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              )}
              {actionDialog === 'approve' && 'Approuver'}
              {actionDialog === 'reject' && 'Refuser'}
              {actionDialog === 'refund' && 'Rembourser'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
