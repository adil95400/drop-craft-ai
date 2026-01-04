import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Plus, 
  Package, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2,
  RotateCcw,
  Eye,
  MoreHorizontal,
  Truck
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useReturns, Return } from '@/hooks/useReturns'
import { CreateReturnDialog } from './CreateReturnDialog'
import { ReturnDetailSheet } from './ReturnDetailSheet'

const STATUS_CONFIG: Record<Return['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  pending: { label: 'En attente', variant: 'secondary', icon: Clock },
  approved: { label: 'Approuvé', variant: 'default', icon: CheckCircle },
  received: { label: 'Reçu', variant: 'default', icon: Package },
  inspecting: { label: 'Inspection', variant: 'outline', icon: Eye },
  refunded: { label: 'Remboursé', variant: 'default', icon: RefreshCw },
  rejected: { label: 'Rejeté', variant: 'destructive', icon: XCircle },
  completed: { label: 'Terminé', variant: 'default', icon: CheckCircle }
}

const REASON_LABELS: Record<string, string> = {
  defective: 'Produit défectueux',
  wrong_item: 'Mauvais article',
  not_as_described: 'Non conforme',
  changed_mind: 'Changement d\'avis',
  damaged_shipping: 'Endommagé à la livraison',
  other: 'Autre'
}

export function ReturnsManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const { returns, stats, isLoading, refetch, updateStatus } = useReturns({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: searchTerm
  })

  const filteredReturns = returns.filter(r => {
    if (!searchTerm) return true
    return r.rma_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
           r.reason.toLowerCase().includes(searchTerm.toLowerCase())
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Chargement des retours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion des Retours (RMA)</h2>
          <p className="text-muted-foreground">Gérez les demandes de retour et remboursements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau retour
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Retours</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.pending} en attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En traitement</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved + stats.received}</div>
            <p className="text-xs text-muted-foreground">{stats.received} reçus</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminés</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">{stats.rejected} rejetés</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remboursés</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalRefunded.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total remboursé</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher par RMA ou raison..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="approved">Approuvés</SelectItem>
            <SelectItem value="received">Reçus</SelectItem>
            <SelectItem value="inspecting">En inspection</SelectItem>
            <SelectItem value="refunded">Remboursés</SelectItem>
            <SelectItem value="rejected">Rejetés</SelectItem>
            <SelectItem value="completed">Terminés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Returns List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Tous ({returns.length})</TabsTrigger>
          <TabsTrigger value="pending">En attente ({stats.pending})</TabsTrigger>
          <TabsTrigger value="processing">En traitement ({stats.approved + stats.received})</TabsTrigger>
          <TabsTrigger value="completed">Terminés ({stats.completed})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredReturns.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <RotateCcw className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun retour</h3>
                <p className="text-muted-foreground mb-4">
                  Aucune demande de retour n'a été enregistrée
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un retour
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredReturns.map((returnItem) => {
                const statusConfig = STATUS_CONFIG[returnItem.status]
                const StatusIcon = statusConfig.icon

                return (
                  <Card 
                    key={returnItem.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedReturn(returnItem)
                      setIsDetailOpen(true)
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <StatusIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold">{returnItem.rma_number}</span>
                              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {REASON_LABELS[returnItem.reason_category || 'other'] || returnItem.reason}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {returnItem.items?.length || 0} article(s)
                            </p>
                            {returnItem.refund_amount && (
                              <p className="text-sm text-muted-foreground">
                                €{returnItem.refund_amount.toLocaleString()}
                              </p>
                            )}
                          </div>

                          <div className="text-right text-sm text-muted-foreground">
                            {new Date(returnItem.created_at).toLocaleDateString('fr-FR')}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                setSelectedReturn(returnItem)
                                setIsDetailOpen(true)
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                              {returnItem.status === 'pending' && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  updateStatus({ id: returnItem.id, status: 'approved' })
                                }}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approuver
                                </DropdownMenuItem>
                              )}
                              {returnItem.status === 'approved' && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  updateStatus({ id: returnItem.id, status: 'received' })
                                }}>
                                  <Truck className="h-4 w-4 mr-2" />
                                  Marquer reçu
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending">
          {returns.filter(r => r.status === 'pending').length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucun retour en attente
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {returns.filter(r => r.status === 'pending').map((returnItem) => (
                <Card key={returnItem.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-semibold">{returnItem.rma_number}</span>
                      <p className="text-sm text-muted-foreground">{returnItem.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateStatus({ id: returnItem.id, status: 'rejected' })}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeter
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => updateStatus({ id: returnItem.id, status: 'approved' })}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approuver
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="processing">
          {returns.filter(r => ['approved', 'received', 'inspecting'].includes(r.status)).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucun retour en traitement
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {returns.filter(r => ['approved', 'received', 'inspecting'].includes(r.status)).map((returnItem) => {
                const statusConfig = STATUS_CONFIG[returnItem.status]
                return (
                  <Card key={returnItem.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{returnItem.rma_number}</span>
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{returnItem.reason}</p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => {
                          setSelectedReturn(returnItem)
                          setIsDetailOpen(true)
                        }}
                      >
                        Gérer
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {returns.filter(r => ['completed', 'refunded', 'rejected'].includes(r.status)).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucun retour terminé
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {returns.filter(r => ['completed', 'refunded', 'rejected'].includes(r.status)).map((returnItem) => {
                const statusConfig = STATUS_CONFIG[returnItem.status]
                return (
                  <Card key={returnItem.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{returnItem.rma_number}</span>
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {returnItem.refund_amount ? `€${returnItem.refund_amount} remboursé` : returnItem.reason}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(returnItem.updated_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateReturnDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <ReturnDetailSheet 
        returnItem={selectedReturn} 
        open={isDetailOpen} 
        onOpenChange={setIsDetailOpen} 
      />
    </div>
  )
}
