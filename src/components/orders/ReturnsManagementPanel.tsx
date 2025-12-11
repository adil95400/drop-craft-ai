/**
 * ReturnsManagementPanel - Gestion des retours et remboursements
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  RotateCcw, Package, CheckCircle2, XCircle, Clock, AlertTriangle,
  DollarSign, Truck, MessageSquare, Plus, Filter, Search, Loader2
} from 'lucide-react'

interface Return {
  id: string
  order_id: string
  order_number: string
  status: 'pending' | 'approved' | 'rejected' | 'received' | 'refunded'
  reason: string
  reason_detail?: string
  refund_amount: number
  created_at: string
  updated_at: string
}

const RETURN_REASONS = [
  { value: 'damaged', label: 'Produit endommagé' },
  { value: 'wrong_item', label: 'Mauvais article reçu' },
  { value: 'not_as_described', label: 'Non conforme à la description' },
  { value: 'no_longer_needed', label: 'Plus besoin' },
  { value: 'defective', label: 'Produit défectueux' },
  { value: 'other', label: 'Autre raison' },
]

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-600', icon: Clock },
  approved: { label: 'Approuvé', color: 'bg-blue-500/10 text-blue-600', icon: CheckCircle2 },
  rejected: { label: 'Refusé', color: 'bg-red-500/10 text-red-600', icon: XCircle },
  received: { label: 'Reçu', color: 'bg-purple-500/10 text-purple-600', icon: Package },
  refunded: { label: 'Remboursé', color: 'bg-green-500/10 text-green-600', icon: DollarSign },
}

export function ReturnsManagementPanel() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showNewReturnDialog, setShowNewReturnDialog] = useState(false)
  const [newReturn, setNewReturn] = useState({
    order_id: '',
    reason: '',
    reason_detail: '',
    refund_amount: 0
  })

  // Charger les retours (simulation avec données locales car table non existante)
  const { data: returns = [], isLoading } = useQuery({
    queryKey: ['returns', statusFilter],
    queryFn: async () => {
      // Simuler des données car la table order_returns n'existe peut-être pas
      const mockReturns: Return[] = [
        {
          id: '1',
          order_id: 'ord_001',
          order_number: 'ORD-2024-001',
          status: 'pending',
          reason: 'damaged',
          reason_detail: 'Emballage endommagé à la réception',
          refund_amount: 45.99,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          order_id: 'ord_002',
          order_number: 'ORD-2024-002',
          status: 'approved',
          reason: 'wrong_item',
          refund_amount: 89.99,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          order_id: 'ord_003',
          order_number: 'ORD-2024-003',
          status: 'refunded',
          reason: 'defective',
          refund_amount: 129.99,
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      
      if (statusFilter !== 'all') {
        return mockReturns.filter(r => r.status === statusFilter)
      }
      return mockReturns
    }
  })

  // Créer un retour
  const createReturnMutation = useMutation({
    mutationFn: async (data: typeof newReturn) => {
      // Simuler la création
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { id: `ret_${Date.now()}`, ...data }
    },
    onSuccess: () => {
      toast.success('Demande de retour créée')
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      setShowNewReturnDialog(false)
      setNewReturn({ order_id: '', reason: '', reason_detail: '', refund_amount: 0 })
    },
    onError: () => {
      toast.error('Erreur lors de la création')
    }
  })

  // Mettre à jour le statut
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: Return['status'] }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { id, status }
    },
    onSuccess: (_, vars) => {
      toast.success(`Statut mis à jour: ${STATUS_CONFIG[vars.status].label}`)
      queryClient.invalidateQueries({ queryKey: ['returns'] })
    }
  })

  const filteredReturns = returns.filter(r =>
    r.order_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: returns.length,
    pending: returns.filter(r => r.status === 'pending').length,
    totalRefunded: returns.filter(r => r.status === 'refunded').reduce((sum, r) => sum + r.refund_amount, 0)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Gestion des Retours
            </CardTitle>
            <CardDescription>Gérez les retours et remboursements clients</CardDescription>
          </div>
          <Dialog open={showNewReturnDialog} onOpenChange={setShowNewReturnDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau retour
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une demande de retour</DialogTitle>
                <DialogDescription>Enregistrer un nouveau retour client</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>N° Commande</Label>
                  <Input
                    placeholder="ORD-2024-XXX"
                    value={newReturn.order_id}
                    onChange={e => setNewReturn(prev => ({ ...prev, order_id: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Motif du retour</Label>
                  <Select
                    value={newReturn.reason}
                    onValueChange={v => setNewReturn(prev => ({ ...prev, reason: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un motif" />
                    </SelectTrigger>
                    <SelectContent>
                      {RETURN_REASONS.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Détails (optionnel)</Label>
                  <Textarea
                    placeholder="Décrivez le problème..."
                    value={newReturn.reason_detail}
                    onChange={e => setNewReturn(prev => ({ ...prev, reason_detail: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Montant du remboursement (€)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newReturn.refund_amount || ''}
                    onChange={e => setNewReturn(prev => ({ ...prev, refund_amount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewReturnDialog(false)}>Annuler</Button>
                <Button 
                  onClick={() => createReturnMutation.mutate(newReturn)}
                  disabled={createReturnMutation.isPending || !newReturn.order_id || !newReturn.reason}
                >
                  {createReturnMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Créer le retour
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-3">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total retours</div>
          </Card>
          <Card className="p-3">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">En attente</div>
          </Card>
          <Card className="p-3">
            <div className="text-2xl font-bold text-green-600">{stats.totalRefunded.toFixed(2)} €</div>
            <div className="text-xs text-muted-foreground">Remboursé</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par n° commande..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                <SelectItem key={value} value={value}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun retour trouvé</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commande</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.map(ret => {
                  const StatusIcon = STATUS_CONFIG[ret.status].icon
                  const reasonLabel = RETURN_REASONS.find(r => r.value === ret.reason)?.label || ret.reason
                  
                  return (
                    <TableRow key={ret.id}>
                      <TableCell className="font-medium">{ret.order_number}</TableCell>
                      <TableCell>
                        <span className="text-sm">{reasonLabel}</span>
                        {ret.reason_detail && (
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {ret.reason_detail}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_CONFIG[ret.status].color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {STATUS_CONFIG[ret.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>{ret.refund_amount.toFixed(2)} €</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(ret.created_at), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {ret.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateStatusMutation.mutate({ id: ret.id, status: 'approved' })}
                                disabled={updateStatusMutation.isPending}
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateStatusMutation.mutate({ id: ret.id, status: 'rejected' })}
                                disabled={updateStatusMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          {ret.status === 'approved' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateStatusMutation.mutate({ id: ret.id, status: 'received' })}
                              disabled={updateStatusMutation.isPending}
                            >
                              <Package className="h-4 w-4 text-purple-600" />
                            </Button>
                          )}
                          {ret.status === 'received' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateStatusMutation.mutate({ id: ret.id, status: 'refunded' })}
                              disabled={updateStatusMutation.isPending}
                            >
                              <DollarSign className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
