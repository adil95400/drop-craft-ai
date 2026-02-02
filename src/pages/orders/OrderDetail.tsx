/**
 * Composant amélioré pour OrderDetail avec Fulfillment Panel intégré
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  ArrowLeft, Package, User, MapPin, CreditCard, 
  Truck, Calendar, Mail, Phone, FileText, Printer,
  Box, Timer, Split
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { OrderFulfillmentPanel } from '@/components/orders/OrderFulfillmentPanel';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          items:order_items(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const handlePrint = () => {
    window.print();
    toast.success('Préparation de l\'impression...');
  };

  const handleGenerateLabel = () => {
    toast.info('Génération de l\'étiquette d\'expédition...');
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast.success(`Statut mis à jour: ${newStatus}`);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleFulfill = async (
    itemIds: string[], 
    quantities: Record<string, number>, 
    carrier: string, 
    tracking: string
  ) => {
    try {
      // Update order with tracking info
      await supabase
        .from('orders')
        .update({ 
          tracking_number: tracking,
          status: 'shipped',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast.success('Expédition enregistrée');
    } catch (error) {
      toast.error('Erreur lors de l\'expédition');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Commande introuvable</h2>
            <p className="text-muted-foreground mb-4">
              La commande que vous recherchez n'existe pas ou a été supprimée.
            </p>
            <Button onClick={() => navigate('/orders')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux commandes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    processing: 'bg-blue-500',
    shipped: 'bg-purple-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-red-500'
  };

  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    processing: 'En cours',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée'
  };

  // Transform order items for fulfillment panel
  const fulfillmentItems = (order.items || []).map((item: any) => ({
    id: item.id,
    product_name: item.product_name || 'Produit',
    sku: item.sku,
    quantity: item.quantity || 1,
    fulfilled_quantity: item.fulfilled_quantity || 0,
    unit_price: item.unit_price || 0,
    image_url: item.image_url,
  }));

  return (
    <>
      <Helmet>
        <title>Commande {order.order_number} - ShopOpti</title>
        <meta name="description" content={`Détails de la commande ${order.order_number}`} />
      </Helmet>

      <div className="container mx-auto py-8 px-4 max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/orders')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux commandes
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
            <Button variant="outline" onClick={handleGenerateLabel}>
              <FileText className="mr-2 h-4 w-4" />
              Étiquette
            </Button>
          </div>
        </div>

        {/* Titre et statut */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Commande {order.order_number}</h1>
            <p className="text-muted-foreground mt-1">
              Créée le {new Date(order.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <Badge className={statusColors[order.status] || 'bg-gray-500'}>
            {statusLabels[order.status] || order.status}
          </Badge>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details" className="gap-2">
              <Package className="h-4 w-4" />
              Détails
            </TabsTrigger>
            <TabsTrigger value="fulfillment" className="gap-2">
              <Truck className="h-4 w-4" />
              Fulfillment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne principale */}
              <div className="lg:col-span-2 space-y-6">
                {/* Articles */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Box className="h-5 w-5 text-primary" />
                      Articles commandés
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.items?.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.product_name}</h4>
                            <p className="text-sm text-muted-foreground">Quantité: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{item.unit_price?.toFixed(2)} €</div>
                            <div className="text-sm text-muted-foreground">
                              Total: {item.total_price?.toFixed(2)} €
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Sous-total</span>
                        <span>{(order.total_amount * 0.8).toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>TVA (20%)</span>
                        <span>{(order.total_amount * 0.2).toFixed(2)} €</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{order.total_amount?.toFixed(2)} €</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                {order.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{order.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Colonne latérale */}
              <div className="space-y-6">
                {/* Informations client */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Client
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {order.customer ? (
                      <>
                        <div>
                          <p className="font-semibold">{order.customer.first_name} {order.customer.last_name}</p>
                          {order.customer.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Mail className="h-3 w-3" />
                              {order.customer.email}
                            </div>
                          )}
                          {order.customer.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Phone className="h-3 w-3" />
                              {order.customer.phone}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucune information client</p>
                    )}
                  </CardContent>
                </Card>

                {/* Adresse de livraison */}
                {order.shipping_address && typeof order.shipping_address === 'object' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Adresse de livraison
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-1">
                        <p>{(order.shipping_address as any)?.street || 'Non spécifiée'}</p>
                        <p>{(order.shipping_address as any)?.postal_code} {(order.shipping_address as any)?.city}</p>
                        <p>{(order.shipping_address as any)?.country}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Paiement */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Paiement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Montant</span>
                      <span className="font-semibold">{order.total_amount?.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Devise</span>
                      <span>{order.currency}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Suivi */}
                {order.tracking_number && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-primary" />
                        Suivi de livraison
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-mono">{order.tracking_number}</p>
                      <Button className="w-full mt-3" variant="outline" size="sm">
                        Suivre le colis
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Actions rapides */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actions rapides</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => handleUpdateStatus('processing')}
                    >
                      Marquer en cours
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => handleUpdateStatus('shipped')}
                    >
                      Marquer expédiée
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => handleUpdateStatus('delivered')}
                    >
                      Marquer livrée
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fulfillment">
            <OrderFulfillmentPanel
              orderId={order.id}
              orderNumber={order.order_number}
              items={fulfillmentItems}
              status={order.status}
              tracking_number={order.tracking_number}
              onFulfill={handleFulfill}
              onPrintLabel={(items) => {
                toast.success(`Impression de ${items.length} étiquette(s)...`);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
