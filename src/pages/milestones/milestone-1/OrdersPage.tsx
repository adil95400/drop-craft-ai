import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  ShoppingCart,
  Package,
  Truck,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Edit,
  RefreshCw,
  Plus,
  ArrowUpDown,
  ExternalLink,
  FileText,
  MessageSquare,
  User,
  MapPin,
  Trash2
} from 'lucide-react';

import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'] & {
  customer_name: string;
  customer_email: string;
  platform: string;
  platform_order_id: string;
  items: OrderItem[];
  order_items?: any[];
}

interface OrderItem {
  id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  variant_info?: any;
}

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  totalRevenue: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_name,
            product_sku,
            quantity,
            unit_price,
            total_price,
            variant_info
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedOrders = data?.map(order => ({
        ...order,
        customer_name: 'Client inconnu', // Not in schema - would need join with customers
        customer_email: '', // Not in schema - would need join with customers  
        platform: 'Direct', // Not in schema - would need platform info
        platform_order_id: order.id, // Use order ID as fallback
        items: order.order_items?.map((item: any) => ({
          ...item,
          quantity: item.quantity || 1
        })) || []
      })) || [];

      setOrders(mappedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les commandes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'shipped' && { shipped_at: new Date().toISOString() }),
          ...(newStatus === 'delivered' && { delivered_at: new Date().toISOString() })
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `Commande mise à jour vers: ${newStatus}`,
      });

      await loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    }
  };

  const handleSyncOrders = async (platform?: string) => {
    setIsLoading(true);
    try {
      const platforms = platform ? [platform] : ['shopify', 'woocommerce', 'amazon', 'ebay'];
      
      for (const p of platforms) {
        const { data, error } = await supabase.functions.invoke(`${p}-sync`, {
          body: {
            action: 'sync_orders',
            date_range: {
              from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              to: new Date().toISOString()
            }
          }
        });

        if (error) throw error;
      }

      toast({
        title: "Synchronisation terminée",
        description: `Commandes synchronisées depuis ${platforms.join(', ')}`,
      });

      await loadOrders();
    } catch (error) {
      console.error('Error syncing orders:', error);
      toast({
        title: "Erreur de synchronisation",
        description: "Échec de la synchronisation des commandes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrder = async (orderData: any) => {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: `ORD-${Date.now()}`,
          total_amount: orderData.totalAmount,
          currency: 'EUR',
          status: 'pending',
          shipping_address: orderData.shippingAddress,
          notes: orderData.notes,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Add order items
      const items = orderData.items.map((item: any) => ({
        order_id: order.id,
        product_name: item.productName,
        product_sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.quantity * item.unitPrice
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(items);

      if (itemsError) throw itemsError;

      toast({
        title: "Commande créée",
        description: `Commande ${order.order_number} créée avec succès.`,
      });

      setShowCreateDialog(false);
      await loadOrders();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande.",
        variant: "destructive",
      });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPlatform = platformFilter === 'all' || order.platform === platformFilter;
    
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const stats: OrderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalRevenue: orders.reduce((acc, o) => acc + o.total_amount, 0)
  };

  const platforms = ['all', ...Array.from(new Set(orders.map(o => o.platform)))];
  const statuses = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
      case 'refunded':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'shipped':
        return 'outline';
      case 'delivered':
        return 'default';
      case 'cancelled':
      case 'refunded':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Commandes</h1>
          <p className="text-muted-foreground mt-2">
            Milestone 1 - Orders in/out centralisé (création, statuts, notes)
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => handleSyncOrders()} disabled={isLoading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Synchroniser
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Commande
          </Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Traitement</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expédiées</CardTitle>
            <Truck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.shipped}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livrées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="tracking">Suivi</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Rechercher par numéro, client ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status === 'all' ? 'Tous les statuts' : status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Plateforme" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map(platform => (
                      <SelectItem key={platform} value={platform}>
                        {platform === 'all' ? 'Toutes plateformes' : platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des Commandes</CardTitle>
              <CardDescription>
                {filteredOrders.length} commandes affichées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Plateforme</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-medium">{order.order_number}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.items.length} article{order.items.length > 1 ? 's' : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          €{order.total_amount.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">{order.currency}</div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusVariant(order.status)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(order.status)}
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {order.platform}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderDialog(true);
                            }}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Select onValueChange={(value) => handleStatusUpdate(order.id, value)}>
                            <SelectTrigger className="w-8 h-8 p-0">
                              <Edit className="w-3 h-3" />
                            </SelectTrigger>
                            <SelectContent>
                              {statuses.slice(1).map(status => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking">
          <Card>
            <CardHeader>
              <CardTitle>Suivi des Expéditions</CardTitle>
              <CardDescription>
                Suivez vos colis et gérez les numéros de tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Truck className="h-4 w-4" />
                <AlertDescription>
                  Le système de suivi des expéditions sera intégré avec les transporteurs.
                  Fonctionnalité disponible dans la prochaine version.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics des Commandes</CardTitle>
              <CardDescription>
                Analysez vos performances de vente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Évolution des Commandes</h4>
                  <div className="text-2xl font-bold text-green-600">+12%</div>
                  <p className="text-sm text-muted-foreground">vs. mois dernier</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Panier Moyen</h4>
                  <div className="text-2xl font-bold">€{(stats.totalRevenue / stats.total || 0).toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">par commande</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Commande {selectedOrder?.order_number}
            </DialogTitle>
            <DialogDescription>
              Détails de la commande du {selectedOrder && new Date(selectedOrder.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <OrderDetailsView 
              order={selectedOrder} 
              onStatusUpdate={handleStatusUpdate}
              onClose={() => setShowOrderDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Order Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer une Nouvelle Commande</DialogTitle>
            <DialogDescription>
              Création manuelle d'une commande
            </DialogDescription>
          </DialogHeader>

          <CreateOrderForm 
            onSubmit={handleCreateOrder}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Order Details Component
interface OrderDetailsViewProps {
  order: Order;
  onStatusUpdate: (orderId: string, status: string) => void;
  onClose: () => void;
}

function OrderDetailsView({ order, onStatusUpdate, onClose }: OrderDetailsViewProps) {
  const [notes, setNotes] = useState(order.notes || '');
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations Commande</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium">Statut:</span>
              <Badge variant={getStatusVariant(order.status)}>
                {order.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Plateforme:</span>
              <Badge variant="outline">{order.platform}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total:</span>
              <span className="font-bold">€{order.total_amount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-4 h-4" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-medium">Nom:</span>
              <div>{order.customer_name}</div>
            </div>
            <div>
              <span className="font-medium">Email:</span>
              <div>{order.customer_email}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Articles Commandés</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Prix unitaire</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell className="font-mono">{item.product_sku}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>€{item.unit_price}</TableCell>
                  <TableCell className="font-medium">€{item.total_price}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Notes and Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ajouter des notes sur cette commande..."
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="status">Changer le statut</Label>
              <Select onValueChange={(value) => onStatusUpdate(order.id, value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="processing">Traitement</SelectItem>
                  <SelectItem value="shipped">Expédiée</SelectItem>
                  <SelectItem value="delivered">Livrée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tracking">Numéro de suivi</Label>
              <Input
                id="tracking"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Entrez le numéro de tracking"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          Sauvegarder
        </Button>
      </div>
    </div>
  );
}

// Create Order Form Component
interface CreateOrderFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

function CreateOrderForm({ onSubmit, onCancel }: CreateOrderFormProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    items: [{ productName: '', sku: '', quantity: 1, unitPrice: 0 }],
    shippingAddress: '',
    notes: ''
  });

  const handleSubmit = () => {
    const totalAmount = formData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    onSubmit({ ...formData, totalAmount });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productName: '', sku: '', quantity: 1, unitPrice: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customerName">Nom du client</Label>
          <Input
            id="customerName"
            value={formData.customerName}
            onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="customerEmail">Email du client</Label>
          <Input
            id="customerEmail"
            type="email"
            value={formData.customerEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Articles</Label>
          <Button type="button" onClick={addItem} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        </div>
        {formData.items.map((item, index) => (
          <div key={index} className="grid grid-cols-5 gap-2 mb-2">
            <Input
              placeholder="Nom produit"
              value={item.productName}
              onChange={(e) => updateItem(index, 'productName', e.target.value)}
            />
            <Input
              placeholder="SKU"
              value={item.sku}
              onChange={(e) => updateItem(index, 'sku', e.target.value)}
            />
            <Input
              type="number"
              placeholder="Qté"
              value={item.quantity}
              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Prix"
              value={item.unitPrice}
              onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeItem(index)}
              disabled={formData.items.length === 1}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>

      <div>
        <Label htmlFor="shippingAddress">Adresse de livraison</Label>
        <Textarea
          id="shippingAddress"
          value={formData.shippingAddress}
          onChange={(e) => setFormData(prev => ({ ...prev, shippingAddress: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={handleSubmit}>
          Créer la commande
        </Button>
      </div>
    </div>
  );
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'processing':
      return 'default';
    case 'shipped':
      return 'outline';
    case 'delivered':
      return 'default';
    case 'cancelled':
    case 'refunded':
      return 'destructive';
    default:
      return 'outline';
  }
}