import React, { useState, useEffect } from 'react'
import { Truck, MapPin, Clock, CheckCircle, AlertCircle, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useRealOrders } from '@/hooks/useRealOrders'

interface OrderRoutingRule {
  id: string
  supplier_id: string
  supplier_name: string
  routing_method: 'api' | 'edi' | 'email'
  api_endpoint?: string
  email_address?: string
  edi_config?: any
  is_active: boolean
}

interface OrderToRoute {
  id: string
  order_number: string
  customer_name: string
  total_amount: number
  items: Array<{
    product_name: string
    supplier_name?: string
    qty: number
  }>
  routing_status: 'pending' | 'routed' | 'failed'
  routing_attempts: number
  created_at: string
}

export const OrderRouter = () => {
  const { toast } = useToast()
  const [routingRules, setRoutingRules] = useState<OrderRoutingRule[]>([])
  const [ordersToRoute, setOrdersToRoute] = useState<OrderToRoute[]>([])
  const [selectedOrder, setSelectedOrder] = useState<OrderToRoute | null>(null)
  const [routingNotes, setRoutingNotes] = useState('')
  const [routing, setRouting] = useState(false)
  const { orders } = useRealOrders()

  useEffect(() => {
    fetchRoutingRules()
    fetchOrdersToRoute()
  }, [])

  const fetchRoutingRules = async () => {
    try {
      // Mock routing rules for now since table doesn't exist
      const mockRules: OrderRoutingRule[] = [
        {
          id: '1',
          supplier_id: 'supplier1',
          supplier_name: 'Fournisseur A',
          routing_method: 'api',
          api_endpoint: 'https://api.supplier-a.com/orders',
          is_active: true
        },
        {
          id: '2',
          supplier_id: 'supplier2',
          supplier_name: 'Fournisseur B',
          routing_method: 'email',
          email_address: 'orders@supplier-b.com',
          is_active: true
        }
      ]

      setRoutingRules(mockRules)
    } catch (error) {
      console.error('Error fetching routing rules:', error)
    }
  }

  const fetchOrdersToRoute = async () => {
    try {
      // Simulate orders to route from real orders
      const pendingOrders = orders
        .filter(order => order.status === 'pending')
        .map(order => ({
          id: order.id,
          order_number: order.order_number,
          customer_name: order.customers?.name || 'Client inconnu',
          total_amount: order.total_amount,
          items: order.order_items?.map(item => ({
            product_name: item.product_name,
            supplier_name: 'Fournisseur A', // This would come from product data
            qty: item.qty
          })) || [],
          routing_status: 'pending' as const,
          routing_attempts: 0,
          created_at: order.created_at
        }))

      setOrdersToRoute(pendingOrders)
    } catch (error) {
      console.error('Error fetching orders to route:', error)
    }
  }

  const routeOrder = async (order: OrderToRoute, method: 'manual' | 'auto' = 'manual') => {
    setRouting(true)

    try {
      // Group items by supplier
      const itemsBySupplier = order.items.reduce((acc, item) => {
        const supplier = item.supplier_name || 'Unknown'
        if (!acc[supplier]) acc[supplier] = []
        acc[supplier].push(item)
        return acc
      }, {} as Record<string, typeof order.items>)

      // Route to each supplier
      for (const [supplierName, items] of Object.entries(itemsBySupplier)) {
        const rule = routingRules.find(r => r.supplier_name === supplierName)
        
        if (!rule) {
          console.warn(`No routing rule found for supplier: ${supplierName}`)
          continue
        }

        const routingData = {
          order_id: order.id,
          order_number: order.order_number,
          customer_name: order.customer_name,
          items: items,
          total_amount: items.reduce((sum, item) => sum + (item.qty * 10), 0), // Mock calculation
          notes: routingNotes
        }

        // Route based on method
        switch (rule.routing_method) {
          case 'api':
            await routeViaAPI(rule, routingData)
            break
          case 'edi':
            await routeViaEDI(rule, routingData)
            break
          case 'email':
            await routeViaEmail(rule, routingData)
            break
        }
      }

      // Update order status
      await supabase
        .from('orders')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      // Log to activity_logs instead of non-existent order_routing_logs
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('activity_logs')
          .insert({
            user_id: user.id,
            action: 'order_routing',
            entity_type: 'order',
            entity_id: order.id,
            description: `Commande ${order.order_number} routée (${method})`,
            details: {
              routing_method: method,
              routing_data: itemsBySupplier,
              status: 'success',
              notes: routingNotes
            }
          })
      }

      toast({
        title: "Commande routée",
        description: `La commande ${order.order_number} a été routée vers les fournisseurs`
      })

      // Refresh orders
      fetchOrdersToRoute()
      setSelectedOrder(null)
      setRoutingNotes('')

    } catch (error: any) {
      console.error('Error routing order:', error)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('activity_logs')
          .insert({
            user_id: user.id,
            action: 'order_routing_failed',
            entity_type: 'order',
            entity_id: order.id,
            description: `Échec routage commande ${order.order_number}`,
            details: {
              routing_method: method,
              status: 'failed',
              error_message: error.message,
              notes: routingNotes
            }
          })
      }

      toast({
        title: "Erreur de routage",
        description: "Impossible de router la commande",
        variant: "destructive"
      })
    } finally {
      setRouting(false)
    }
  }

  const routeViaAPI = async (rule: OrderRoutingRule, data: any) => {
    if (!rule.api_endpoint) throw new Error('API endpoint not configured')
    
    // Simulate API call
    console.log('Routing via API:', rule.api_endpoint, data)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const routeViaEDI = async (rule: OrderRoutingRule, data: any) => {
    // Simulate EDI processing
    console.log('Routing via EDI:', rule.edi_config, data)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const routeViaEmail = async (rule: OrderRoutingRule, data: any) => {
    if (!rule.email_address) throw new Error('Email address not configured')

    // Simulate email sending
    console.log('Routing via Email:', rule.email_address, data)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const getStatusBadge = (status: OrderToRoute['routing_status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>
      case 'routed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Routée</Badge>
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Échec</Badge>
    }
  }

  const getRoutingMethodIcon = (method: string) => {
    switch (method) {
      case 'api':
        return <Truck className="h-4 w-4" />
      case 'edi':
        return <MapPin className="h-4 w-4" />
      case 'email':
        return <Send className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Routage des commandes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">{ordersToRoute.filter(o => o.routing_status === 'pending').length}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{ordersToRoute.filter(o => o.routing_status === 'routed').length}</p>
              <p className="text-sm text-muted-foreground">Routées</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold">{ordersToRoute.filter(o => o.routing_status === 'failed').length}</p>
              <p className="text-sm text-muted-foreground">Échecs</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Commandes à router</h3>
            {ordersToRoute.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune commande en attente de routage</p>
              </div>
            ) : (
              <div className="space-y-2">
                {ordersToRoute.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{order.order_number}</span>
                        {getStatusBadge(order.routing_status)}
                        {order.routing_attempts > 0 && (
                          <Badge variant="outline">{order.routing_attempts} tentatives</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.customer_name} • {order.items.length} article(s) • {order.total_amount}€
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            Router
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Router la commande {selectedOrder?.order_number}</DialogTitle>
                          </DialogHeader>
                          
                          {selectedOrder && (
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Articles à router :</h4>
                                <div className="space-y-2">
                                  {selectedOrder.items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                                      <span className="text-sm">{item.product_name}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm">Qty: {item.qty}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {item.supplier_name}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium mb-2">Règles de routage actives :</h4>
                                <div className="space-y-2">
                                  {routingRules.map((rule) => (
                                    <div key={rule.id} className="flex items-center justify-between p-2 bg-muted rounded">
                                      <div className="flex items-center gap-2">
                                        {getRoutingMethodIcon(rule.routing_method)}
                                        <span className="text-sm">{rule.supplier_name}</span>
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        {rule.routing_method.toUpperCase()}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">Notes de routage :</label>
                                <Textarea
                                  placeholder="Informations spéciales pour le fournisseur..."
                                  value={routingNotes}
                                  onChange={(e) => setRoutingNotes(e.target.value)}
                                />
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  onClick={() => routeOrder(selectedOrder, 'manual')}
                                  disabled={routing}
                                  className="flex-1"
                                >
                                  {routing ? 'Routage en cours...' : 'Router maintenant'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
