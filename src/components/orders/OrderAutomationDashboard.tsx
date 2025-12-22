import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { 
  Package, Send, Truck, CheckCircle, XCircle, Clock, 
  RefreshCw, Settings, Zap, TrendingUp, AlertTriangle,
  ArrowRight, RotateCcw, Eye, ExternalLink
} from 'lucide-react'
import { useOrderAutomation } from '@/hooks/useOrderAutomation'
import { Skeleton } from '@/components/ui/skeleton'

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: React.ReactNode }> = {
    pending: { variant: 'secondary', label: 'En attente', icon: <Clock className="w-3 h-3" /> },
    sent: { variant: 'default', label: 'Envoyé', icon: <Send className="w-3 h-3" /> },
    confirmed: { variant: 'default', label: 'Confirmé', icon: <CheckCircle className="w-3 h-3" /> },
    processing: { variant: 'outline', label: 'En cours', icon: <Package className="w-3 h-3" /> },
    shipped: { variant: 'default', label: 'Expédié', icon: <Truck className="w-3 h-3" /> },
    delivered: { variant: 'default', label: 'Livré', icon: <CheckCircle className="w-3 h-3" /> },
    failed: { variant: 'destructive', label: 'Échoué', icon: <XCircle className="w-3 h-3" /> }
  }
  
  const { variant, label, icon } = config[status] || config.pending
  
  return (
    <Badge variant={variant} className="gap-1">
      {icon}
      {label}
    </Badge>
  )
}

export const OrderAutomationDashboard: React.FC = () => {
  const {
    rules,
    rulesLoading,
    supplierOrders,
    ordersLoading,
    stats,
    sendToSupplier,
    isSending,
    updateTracking,
    isUpdatingTracking,
    bulkUpdateTracking,
    isBulkUpdating,
    toggleRule,
    retryOrder,
    isRetrying,
    refetchOrders
  } = useOrderAutomation()

  const [selectedTab, setSelectedTab] = useState('queue')

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.todayOrders || 0}</p>
                <p className="text-xs text-muted-foreground">Aujourd'hui</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Send className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.processing || 0}</p>
                <p className="text-xs text-muted-foreground">En cours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Truck className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.shipped || 0}</p>
                <p className="text-xs text-muted-foreground">Expédiés</p>
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
                <p className="text-2xl font-bold">{stats?.delivered || 0}</p>
                <p className="text-xs text-muted-foreground">Livrés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.successRate || 0}%</p>
                <p className="text-xs text-muted-foreground">Taux succès</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="queue" className="gap-2">
              <Package className="w-4 h-4" />
              File d'attente
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-2">
              <Zap className="w-4 h-4" />
              Règles d'automatisation
            </TabsTrigger>
            <TabsTrigger value="tracking" className="gap-2">
              <Truck className="w-4 h-4" />
              Suivi expéditions
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetchOrders()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <Button 
              size="sm" 
              onClick={() => bulkUpdateTracking()}
              disabled={isBulkUpdating}
            >
              {isBulkUpdating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Truck className="w-4 h-4 mr-2" />
              )}
              Mettre à jour tous les suivis
            </Button>
          </div>
        </div>

        {/* Queue Tab */}
        <TabsContent value="queue" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Commandes à traiter</CardTitle>
              <CardDescription>
                Commandes en attente d'envoi aux fournisseurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : supplierOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Commande</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Suivi</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierOrders.map((shipment: any) => (
                      <TableRow key={shipment.id}>
                        <TableCell>
                          <div className="font-medium">
                            {shipment.order?.order_number || shipment.order_id?.slice(0, 8)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {shipment.order?.customer?.email || '-'}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {shipment.order?.total_amount?.toFixed(2) || '0.00'} €
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={shipment.status || 'pending'} />
                        </TableCell>
                        <TableCell>
                          {shipment.tracking_number ? (
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-mono">
                                {shipment.tracking_number}
                              </span>
                              {shipment.tracking_url && (
                                <a 
                                  href={shipment.tracking_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:text-primary/80"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(shipment.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {shipment.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isSending}
                                onClick={() => sendToSupplier({
                                  orderId: shipment.order_id,
                                  supplierId: 'default',
                                  items: [],
                                  shippingAddress: {}
                                })}
                              >
                                <Send className="w-3 h-3" />
                              </Button>
                            )}
                            {shipment.status === 'failed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isRetrying}
                                onClick={() => retryOrder(shipment.id)}
                              >
                                <RotateCcw className="w-3 h-3" />
                              </Button>
                            )}
                            {shipment.tracking_number && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isUpdatingTracking}
                                onClick={() => updateTracking({
                                  trackingNumber: shipment.tracking_number,
                                  carrier: shipment.carrier_code || 'DHL'
                                })}
                              >
                                <RefreshCw className="w-3 h-3" />
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
                  <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Aucune commande en attente</h3>
                  <p className="text-muted-foreground">
                    Les nouvelles commandes apparaîtront ici
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Règles d'automatisation</CardTitle>
                  <CardDescription>
                    Configurez des règles pour traiter automatiquement les commandes
                  </CardDescription>
                </div>
                <Button>
                  <Settings className="w-4 h-4 mr-2" />
                  Nouvelle règle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : rules.length > 0 ? (
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <div 
                      key={rule.id}
                      className="p-4 border rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${rule.isActive ? 'bg-green-500/10' : 'bg-muted'}`}>
                          <Zap className={`w-5 h-5 ${rule.isActive ? 'text-green-600' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <h4 className="font-medium">{rule.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Déclencheur: {rule.trigger}
                            {rule.actions.autoSendToSupplier && ' → Envoi fournisseur'}
                            {rule.actions.autoGenerateLabel && ' → Étiquette'}
                            {rule.actions.autoNotifyCustomer && ' → Notification'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          Priorité {rule.priority}
                        </Badge>
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={(checked) => toggleRule({ ruleId: rule.id, isActive: checked })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Aucune règle configurée</h3>
                  <p className="text-muted-foreground mb-4">
                    Créez des règles pour automatiser le traitement des commandes
                  </p>
                  <Button>
                    <Settings className="w-4 h-4 mr-2" />
                    Créer une règle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tracking Tab */}
        <TabsContent value="tracking" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Suivi des expéditions</CardTitle>
              <CardDescription>
                Suivi en temps réel de toutes les expéditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Suivi</TableHead>
                      <TableHead>Transporteur</TableHead>
                      <TableHead>Commande</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Dernière mise à jour</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierOrders
                      .filter((s: any) => s.tracking_number)
                      .map((shipment: any) => (
                        <TableRow key={shipment.id}>
                          <TableCell>
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {shipment.tracking_number}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {shipment.carrier_code || 'Standard'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {shipment.order?.order_number || '-'}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={shipment.status || 'pending'} />
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {new Date(shipment.updated_at).toLocaleString('fr-FR')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isUpdatingTracking}
                                onClick={() => updateTracking({
                                  trackingNumber: shipment.tracking_number,
                                  carrier: shipment.carrier_code || 'DHL'
                                })}
                              >
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                              {shipment.tracking_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  asChild
                                >
                                  <a 
                                    href={shipment.tracking_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
