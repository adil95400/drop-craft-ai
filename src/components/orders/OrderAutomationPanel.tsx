import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { toast } from "sonner";
import { productionLogger } from '@/utils/productionLogger';
import { 
  Package, Send, Truck, CheckCircle, XCircle, Clock, 
  ExternalLink, RefreshCw, Eye, AlertTriangle 
} from 'lucide-react'

interface SupplierOrder {
  id: string
  order_id: string
  supplier_id: string
  supplier_order_reference: string | null
  status: string
  tracking_number: string | null
  tracking_url: string | null
  items: any[]
  total_amount: number
  currency: string
  sent_at: string | null
  delivered_at: string | null
  error_message: string | null
  retry_count: number
  created_at: string
  updated_at: string
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-500" />
    case 'sent':
      return <Send className="w-4 h-4 text-blue-500" />
    case 'processing':
      return <Package className="w-4 h-4 text-orange-500" />
    case 'shipped':
      return <Truck className="w-4 h-4 text-purple-500" />
    case 'delivered':
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />
    default:
      return <AlertTriangle className="w-4 h-4 text-gray-500" />
  }
}

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, { variant: any; label: string }> = {
    pending: { variant: 'secondary', label: 'En attente' },
    sent: { variant: 'default', label: 'Envoyé' },
    processing: { variant: 'default', label: 'En cours' },
    shipped: { variant: 'default', label: 'Expédié' },
    delivered: { variant: 'default', label: 'Livré' },
    failed: { variant: 'destructive', label: 'Échoué' }
  }
  
  const config = variants[status] || variants.pending
  
  return (
    <Badge variant={config.variant} className="gap-1">
      <StatusIcon status={status} />
      {config.label}
    </Badge>
  )
}

export const OrderAutomationPanel: React.FC = () => {
  const { toast } = useToast()
  const [orders, setOrders] = useState<SupplierOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [processingOrder, setProcessingOrder] = useState<string | null>(null)
  const [bulkUpdating, setBulkUpdating] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      // Using orders table as fallback since supplier_orders needs migration approval
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setOrders(data as any || [])
    } catch (error) {
      productionLogger.error('Failed to load orders', error as Error, 'OrderAutomation');
      toast({
        title: "Erreur",
        description: "Impossible de charger les commandes fournisseurs",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendToSupplier = async (orderId: string) => {
    try {
      setProcessingOrder(orderId)
      
      const order = orders.find(o => o.id === orderId)
      if (!order) return

      const { data, error } = await supabase.functions.invoke('supplier-order-place', {
        body: {
          order_id: orderId,
          supplier_id: order.supplier_id,
          items: order.items,
          total_amount: order.total_amount
        }
      })

      if (error) throw error

      toast({
        title: "Commande envoyée",
        description: `Commande envoyée avec succès au fournisseur`,
      })

      loadOrders() // Refresh
    } catch (error) {
      productionLogger.error('Failed to send order', error as Error, 'OrderAutomation');
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la commande au fournisseur",
        variant: "destructive"
      })
    } finally {
      setProcessingOrder(null)
    }
  }

  const handleUpdateTracking = async (orderId: string) => {
    try {
      setProcessingOrder(orderId)
      
      const order = orders.find(o => o.id === orderId)
      if (!order?.tracking_number) return

      const { data, error } = await supabase.functions.invoke('order-tracking', {
        body: {
          orderId,
          trackingNumber: order.tracking_number,
          action: 'update'
        }
      })

      if (error) throw error

      toast({
        title: "Suivi mis à jour",
        description: `Statut de suivi mis à jour: ${data.tracking.statusLabel}`,
      })

      loadOrders() // Refresh
    } catch (error) {
      productionLogger.error('Failed to update tracking', error as Error, 'OrderAutomation');
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le suivi",
        variant: "destructive"
      })
    } finally {
      setProcessingOrder(null)
    }
  }

  const handleBulkTrackingUpdate = async () => {
    try {
      setBulkUpdating(true)

      const { data, error } = await supabase.functions.invoke('order-tracking', {
        body: {
          action: 'bulk'
        }
      })

      if (error) throw error

      toast({
        title: "Mise à jour groupée terminée",
        description: `${data.updated} commandes mises à jour`,
      })

      loadOrders() // Refresh
    } catch (error) {
      productionLogger.error('Failed to bulk update', error as Error, 'OrderAutomation');
      toast({
        title: "Erreur",
        description: "Impossible de faire la mise à jour groupée",
        variant: "destructive"
      })
    } finally {
      setBulkUpdating(false)
    }
  }

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing' || o.status === 'sent').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    failed: orders.filter(o => o.status === 'failed').length
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">En attente</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
            <div className="text-sm text-muted-foreground">En cours</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.shipped}</div>
            <div className="text-sm text-muted-foreground">Expédié</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <div className="text-sm text-muted-foreground">Livré</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-muted-foreground">Échoué</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Automatisation des Commandes</CardTitle>
              <CardDescription>
                Gestion automatisée des commandes fournisseurs et suivi des livraisons
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={loadOrders}
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
              
              <Button 
                onClick={handleBulkTrackingUpdate}
                disabled={bulkUpdating}
              >
                {bulkUpdating && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Mettre à jour tous les suivis
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Chargement des commandes...</p>
            </div>
          ) : orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commande</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Suivi</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.supplier_order_reference || order.order_id}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.items?.length} article(s)
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>{order.supplier_id}</TableCell>
                    
                    <TableCell>
                      <div className="font-medium">
                        {order.total_amount?.toFixed(2)} {order.currency}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <StatusBadge status={order.status} />
                      {order.error_message && (
                        <div className="text-xs text-red-600 mt-1">
                          {order.error_message}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {order.tracking_number ? (
                        <div>
                          <div className="text-sm font-medium">{order.tracking_number}</div>
                          {order.tracking_url && (
                            <a 
                              href={order.tracking_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              Suivre <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Pas de suivi</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex gap-1">
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendToSupplier(order.id)}
                            disabled={processingOrder === order.id}
                          >
                            <Send className="w-3 h-3" />
                          </Button>
                        )}
                        
                        {order.tracking_number && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateTracking(order.id)}
                            disabled={processingOrder === order.id}
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                        >
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
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucune commande fournisseur</h3>
              <p className="text-muted-foreground">
                Les commandes envoyées aux fournisseurs apparaîtront ici
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}