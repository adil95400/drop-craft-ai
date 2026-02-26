import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, MapPin, Calendar, ShoppingBag, Package, Euro, Edit, Trash2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  total_spent?: number;
  total_orders?: number;
  created_at: string;
  address?: string;
  city?: string;
  country?: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  items_count: number;
}

interface CustomerDetailSheetProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onSendEmail: (customer: Customer) => void;
}

export function CustomerDetailSheet({ 
  customer, 
  open, 
  onOpenChange, 
  onEdit, 
  onDelete, 
  onSendEmail 
}: CustomerDetailSheetProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (customer && open && user) {
      fetchCustomerOrders();
    }
  }, [customer, open, user]);

  const fetchCustomerOrders = async () => {
    if (!customer || !user) return;
    
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          created_at,
          order_items(id)
        `)
        .eq('user_id', user.id)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const mappedOrders: Order[] = (data || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number || `#${order.id.slice(0, 8)}`,
        status: order.status,
        total_amount: order.total_amount || 0,
        created_at: order.created_at,
        items_count: order.order_items?.length || 0
      }));

      setOrders(mappedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  if (!customer) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'pending':
      case 'processing':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'cancelled':
      case 'refunded':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">{customer.name}</SheetTitle>
            <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
              {customer.status}
            </Badge>
          </div>
          <SheetDescription>
            Client depuis {format(new Date(customer.created_at), 'MMMM yyyy', { locale: getDateFnsLocale() })}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] mt-6 pr-4">
          <div className="space-y-6">
            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onSendEmail(customer)}>
                <Send className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(customer)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button variant="destructive" size="sm" onClick={() => onDelete(customer)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>

            <Separator />

            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Informations de contact
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                    {customer.email}
                  </a>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${customer.phone}`} className="hover:underline">
                      {customer.phone}
                    </a>
                  </div>
                )}
                {(customer.address || customer.city) && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {[customer.address, customer.city, customer.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Euro className="h-4 w-4" />
                  <span className="text-xs uppercase">Total dépensé</span>
                </div>
                <div className="text-2xl font-bold">
                  €{customer.total_spent?.toLocaleString('fr-FR') || '0'}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="text-xs uppercase">Commandes</span>
                </div>
                <div className="text-2xl font-bold">
                  {customer.total_orders || 0}
                </div>
              </div>
            </div>

            <Separator />

            {/* Order History */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Historique des commandes
              </h4>
              
              {loadingOrders ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune commande</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <div 
                      key={order.id} 
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{order.order_number}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(order.created_at), 'dd MMM yyyy', { locale: getDateFnsLocale() })}
                          <span>•</span>
                          <span>{order.items_count} article{order.items_count > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-medium">€{order.total_amount.toLocaleString('fr-FR')}</div>
                        <Badge variant="outline" className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
