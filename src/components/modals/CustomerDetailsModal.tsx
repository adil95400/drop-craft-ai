import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Mail, Phone, MapPin, Calendar, DollarSign, ShoppingCart, 
  Star, TrendingUp, Activity, Package, Clock, CreditCard 
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
  status: 'active' | 'inactive' | 'vip' | 'new'
  totalSpent: number
  totalOrders: number
  lastOrder: string
  joinDate: string
  location: string
  segment: string
  tags: string[]
  lifetime_value: number
  avg_order_value: number
}

interface CustomerDetailsModalProps {
  customer: Customer
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Orders will be fetched from database when needed

export function CustomerDetailsModal({ customer, open, onOpenChange }: CustomerDetailsModalProps) {
  const [orders, setOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  useEffect(() => {
    if (open && customer.id) {
      loadCustomerOrders()
    }
  }, [open, customer.id])

  const loadCustomerOrders = async () => {
    setLoadingOrders(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!error && data) {
        setOrders(data.map((order: any) => ({
          id: order.order_number || order.id,
          date: order.created_at,
          total: order.total_amount || 0,
          status: order.status || 'pending',
          items: Array.isArray(order.order_items) ? order.order_items.length : 1
        })))
      }
    } catch (error) {
      console.error('Error loading customer orders:', error)
    } finally {
      setLoadingOrders(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails du Client</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Header */}
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={customer.avatar} alt={customer.name} />
              <AvatarFallback>{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold">{customer.name}</h3>
                <Badge className="bg-gradient-to-r from-blue-400 to-purple-500 text-white">
                  {customer.status.toUpperCase()}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {customer.email}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {customer.phone}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {customer.location}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Client depuis {new Date(customer.joinDate).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold text-green-600">{customer.totalSpent.toFixed(2)}€</p>
                <p className="text-sm text-muted-foreground">Total Dépensé</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{customer.totalOrders}</p>
                <p className="text-sm text-muted-foreground">Commandes</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold">{customer.avg_order_value.toFixed(0)}€</p>
                <p className="text-sm text-muted-foreground">Panier Moyen</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">{customer.lifetime_value}€</p>
                <p className="text-sm text-muted-foreground">Valeur Vie</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information */}
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="orders">Commandes</TabsTrigger>
              <TabsTrigger value="activity">Activité</TabsTrigger>
              <TabsTrigger value="preferences">Préférences</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Historique des Commandes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingOrders ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : orders.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Aucune commande</p>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{order.id}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.date).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-semibold">{order.total.toFixed(2)}€</p>
                          <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                            {order.status}
                          </Badge>
                        </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Activité Récente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Commande passée</p>
                        <p className="text-sm text-muted-foreground">Il y a 2 jours</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Email ouvert</p>
                        <p className="text-sm text-muted-foreground">Il y a 5 jours</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Préférences Client</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Catégories Préférées</h4>
                      <div className="flex gap-2">
                        <Badge>Électronique</Badge>
                        <Badge>Mode</Badge>
                        <Badge>Maison</Badge>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Communication</h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked />
                          Newsletters
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked />
                          Promotions
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>Notes Internes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">Client très satisfait du service. Recommande souvent nos produits à ses contacts.</p>
                      <p className="text-xs text-muted-foreground mt-1">Ajouté le 15/01/2024</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}