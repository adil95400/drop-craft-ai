import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Settings, 
  Play, 
  Pause,
  RefreshCw,
  MapPin,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TrackingOrder {
  id: string;
  order_number: string;
  tracking_number?: string;
  carrier?: string;
  status: string;
  last_update: string;
  customer_name: string;
  tracking_events: TrackingEvent[];
}

interface TrackingEvent {
  timestamp: string;
  status: string;
  location: string;
  description: string;
}

interface AutoTrackingSettings {
  enabled: boolean;
  updateInterval: number; // minutes
  carriers: string[];
  notifyCustomers: boolean;
  autoUpdateStatus: boolean;
}

export const AutoTrackingManager = () => {
  const [orders, setOrders] = useState<TrackingOrder[]>([]);
  const [settings, setSettings] = useState<AutoTrackingSettings>({
    enabled: true,
    updateInterval: 30,
    carriers: ['colissimo', 'chronopost', 'ups', 'dhl', 'fedex'],
    notifyCustomers: true,
    autoUpdateStatus: true
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [newTracking, setNewTracking] = useState({
    orderId: '',
    trackingNumber: '',
    carrier: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
    
    if (settings.enabled) {
      const interval = setInterval(() => {
        updateAllTrackingInfo();
      }, settings.updateInterval * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [settings.enabled, settings.updateInterval]);

  const loadOrders = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['processing', 'shipped', 'in_transit'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedOrders = (ordersData || []).map(order => ({
        id: order.id,
        order_number: order.order_number,
        tracking_number: order.tracking_number,
        carrier: order.carrier,
        status: order.status,
        last_update: order.updated_at,
        customer_name: 'Client inconnu',
        tracking_events: generateMockEvents(order.status)
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les commandes",
        variant: "destructive"
      });
    }
  };

  const generateMockEvents = (status: string): TrackingEvent[] => {
    const baseEvents = [
      {
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'order_placed',
        location: 'Entrepôt Paris',
        description: 'Commande reçue et préparée'
      },
      {
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'shipped',
        location: 'Centre de tri Roissy',
        description: 'Colis expédié'
      }
    ];

    if (status === 'in_transit' || status === 'delivered') {
      baseEvents.push({
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        status: 'in_transit',
        location: 'Centre de tri Lyon',
        description: 'Colis en transit'
      });
    }

    if (status === 'delivered') {
      baseEvents.push({
        timestamp: new Date().toISOString(),
        status: 'delivered',
        location: 'Adresse de livraison',
        description: 'Colis livré'
      });
    }

    return baseEvents;
  };

  const updateAllTrackingInfo = async () => {
    setIsUpdating(true);
    
    try {
      // Call the order-tracking edge function
      const { data, error } = await supabase.functions.invoke('order-tracking', {
        body: { action: 'update_all' }
      });

      if (error) throw error;

      await loadOrders();
      
      toast({
        title: "Suivi mis à jour",
        description: `${data?.updated_count || 0} commandes mises à jour`,
      });
    } catch (error) {
      console.error('Error updating tracking:', error);
      toast({
        title: "Erreur de mise à jour",
        description: "Impossible de mettre à jour le suivi",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const addTrackingNumber = async () => {
    if (!newTracking.orderId || !newTracking.trackingNumber || !newTracking.carrier) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('order-tracking', {
        body: {
          action: 'setup_tracking',
          order_id: newTracking.orderId,
          tracking_number: newTracking.trackingNumber,
          carrier: newTracking.carrier
        }
      });

      if (error) throw error;

      setNewTracking({ orderId: '', trackingNumber: '', carrier: '' });
      await loadOrders();
      
      toast({
        title: "Numéro de suivi ajouté",
        description: "Le suivi automatique est activé",
      });
    } catch (error) {
      console.error('Error adding tracking:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le numéro de suivi",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'shipped': return <Truck className="h-4 w-4 text-blue-500" />;
      case 'in_transit': return <Package className="h-4 w-4 text-purple-500" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'in_transit': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const carrierOptions = [
    { value: 'colissimo', label: 'Colissimo' },
    { value: 'chronopost', label: 'Chronopost' },
    { value: 'ups', label: 'UPS' },
    { value: 'dhl', label: 'DHL' },
    { value: 'fedex', label: 'FedEx' },
    { value: 'dpd', label: 'DPD' },
    { value: 'gls', label: 'GLS' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Package className="h-6 w-6" />
          Suivi Automatique
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant={settings.enabled ? 'default' : 'secondary'}>
            {settings.enabled ? 'Actif' : 'Inactif'}
          </Badge>
          <Button
            variant="outline"
            onClick={updateAllTrackingInfo}
            disabled={isUpdating}
            className="gap-2"
          >
            {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Actualiser
          </Button>
        </div>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-tracking">Suivi automatique</Label>
              <p className="text-sm text-muted-foreground">Met à jour automatiquement les statuts</p>
            </div>
            <Switch
              id="auto-tracking"
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="interval">Intervalle de mise à jour (minutes)</Label>
              <Input
                id="interval"
                type="number"
                value={settings.updateInterval}
                onChange={(e) => setSettings(prev => ({ ...prev, updateInterval: parseInt(e.target.value) || 30 }))}
                min="5"
                max="1440"
              />
            </div>
            <div>
              <Label htmlFor="notify">Notifications clients</Label>
              <Switch
                id="notify"
                checked={settings.notifyCustomers}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifyCustomers: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Ajouter un Numéro de Suivi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="order-select">Commande</Label>
              <Select value={newTracking.orderId} onValueChange={(value) => setNewTracking(prev => ({ ...prev, orderId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {orders.filter(o => !o.tracking_number).map(order => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.order_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tracking-input">Numéro de suivi</Label>
              <Input
                id="tracking-input"
                value={newTracking.trackingNumber}
                onChange={(e) => setNewTracking(prev => ({ ...prev, trackingNumber: e.target.value }))}
                placeholder="Ex: ABC123456789"
              />
            </div>
            <div>
              <Label htmlFor="carrier-select">Transporteur</Label>
              <Select value={newTracking.carrier} onValueChange={(value) => setNewTracking(prev => ({ ...prev, carrier: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {carrierOptions.map(carrier => (
                    <SelectItem key={carrier.value} value={carrier.value}>
                      {carrier.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={addTrackingNumber} className="w-full">
                Ajouter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Commandes Suivies ({orders.length})</h3>
        
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(order.status)}
                    <span className="font-medium">{order.order_number}</span>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Client: {order.customer_name}
                  </p>
                </div>
                
                {order.tracking_number && (
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4" />
                      <span className="font-mono">{order.tracking_number}</span>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.carrier?.toUpperCase()}
                    </p>
                  </div>
                )}
              </div>
              
              {order.tracking_events.length > 0 && (
                <>
                  <Separator className="my-3" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Historique de suivi</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {order.tracking_events.map((event, index) => (
                        <div key={index} className="flex items-start gap-3 text-sm">
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs">{event.location}</span>
                          </div>
                          <div className="flex-2">
                            <span className="text-xs">{event.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
        
        {orders.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune commande à suivre</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};