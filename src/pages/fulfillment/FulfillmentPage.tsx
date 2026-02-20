import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { 
  Truck, 
  Package, 
  RotateCcw,
  Settings,
  Plus,
  CheckCircle,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  Weight,
  Loader2,
  Bell,
  BarChart3
} from 'lucide-react';
import { useFulfillmentStats, useCarriers, useCreateCarrier } from '@/hooks/useFulfillment';
import { CarriersManager } from '@/components/fulfillment/CarriersManager';
import { ShipmentsTable } from '@/components/fulfillment/ShipmentsTable';
import { FulfillmentAutomation } from '@/components/fulfillment/FulfillmentAutomation';
import { ReturnsHub } from '@/components/returns';
import { TrackingDashboardContent } from '@/components/fulfillment/TrackingDashboardContent';
import { NotificationsContent } from '@/components/fulfillment/NotificationsContent';
import { FulfillmentProDashboard } from '@/components/fulfillment/FulfillmentProDashboard';
import { FulfillmentOrdersEnhanced } from '@/components/fulfillment/FulfillmentOrdersEnhanced';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function FulfillmentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  
  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['dashboard', 'overview', 'carriers', 'returns', 'tracking', 'notifications', 'automation'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'dashboard') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', value);
    }
    setSearchParams(searchParams, { replace: true });
  };
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newShipmentOpen, setNewShipmentOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    processing_delay: '24h',
    notification_mode: 'shipped',
    default_carrier: 'auto'
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [shipmentForm, setShipmentForm] = useState({
    recipient_name: '',
    recipient_email: '',
    recipient_phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    country: 'France',
    carrier_id: '',
    weight: '',
    notes: ''
  });
  
  const { data: stats, isLoading } = useFulfillmentStats();
  const { data: carriers = [], isLoading: carriersLoading } = useCarriers();
  const createCarrier = useCreateCarrier();
  const queryClient = useQueryClient();
  
  const createShipmentMutation = useMutation({
    mutationFn: async (data: typeof shipmentForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      
      const { error } = await supabase.from('fulfillment_shipments').insert([{
        user_id: user.id,
        carrier_id: data.carrier_id || null,
        destination_address: {
          recipient_name: data.recipient_name,
          recipient_email: data.recipient_email,
          recipient_phone: data.recipient_phone,
          line1: data.address_line1,
          line2: data.address_line2,
          city: data.city,
          postal_code: data.postal_code,
          country: data.country
        },
        weight: data.weight ? parseFloat(data.weight) : null,
        notes: data.notes || null,
        status: 'pending'
      }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-shipments'] });
      queryClient.invalidateQueries({ queryKey: ['fulfillment-stats'] });
      toast.success('Expédition créée avec succès');
      setNewShipmentOpen(false);
      setShipmentForm({
        recipient_name: '',
        recipient_email: '',
        recipient_phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        postal_code: '',
        country: 'France',
        carrier_id: '',
        weight: '',
        notes: ''
      });
    },
    onError: (err: Error) => toast.error(err.message)
  });
  
  const handleCreateCarrier = (carrier: any) => {
    createCarrier.mutate(carrier);
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Store settings in user_settings table or local storage
      const { error } = await supabase.from('user_settings').upsert({
        user_id: user.id,
        setting_key: 'fulfillment_settings',
        setting_value: settingsForm,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,setting_key'
      });

      if (error) {
        // Fallback to localStorage if table doesn't exist
        localStorage.setItem('fulfillment_settings', JSON.stringify(settingsForm));
      }

      toast.success('Paramètres sauvegardés');
      setSettingsOpen(false);
    } catch (error) {
      console.error('Save settings error:', error);
      // Fallback to localStorage
      localStorage.setItem('fulfillment_settings', JSON.stringify(settingsForm));
      toast.success('Paramètres sauvegardés localement');
      setSettingsOpen(false);
    } finally {
      setIsSavingSettings(false);
    }
  };
  return (
    <ChannablePageWrapper
      title="Logistique & Expéditions"
      subtitle="Fulfillment"
      description={`${stats?.total_shipments || 0} expéditions • ${stats?.in_transit || 0} en transit • Taux de livraison: ${stats?.delivery_rate || 0}%`}
      heroImage="orders"
      badge={{ label: "Logistique", icon: Truck }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
          <Button onClick={() => setNewShipmentOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle expédition
          </Button>
        </div>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Expéditions totales</p>
                <p className="text-xl md:text-2xl font-bold mt-1">{stats?.total_shipments || 0}</p>
              </div>
              <div className="p-2 md:p-3 rounded-xl bg-blue-500/10">
                <Package className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">En transit</p>
                <p className="text-xl md:text-2xl font-bold mt-1">{stats?.in_transit || 0}</p>
              </div>
              <div className="p-2 md:p-3 rounded-xl bg-orange-500/10">
                <Truck className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Livrées</p>
                <p className="text-xl md:text-2xl font-bold mt-1">{stats?.delivered || 0}</p>
              </div>
              <div className="p-2 md:p-3 rounded-xl bg-green-500/10">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Retours en cours</p>
                <p className="text-xl md:text-2xl font-bold mt-1">{stats?.pending_returns || 0}</p>
              </div>
              <div className="p-2 md:p-3 rounded-xl bg-purple-500/10">
                <RotateCcw className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Additional Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Coût total d'expédition</p>
                <p className="text-2xl font-bold">{(stats?.total_shipping_cost || 0).toLocaleString('fr-FR')} €</p>
              </div>
              <Badge variant="outline">Ce mois</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de livraison</p>
                <p className="text-2xl font-bold">{stats?.delivery_rate || 0}%</p>
              </div>
              <Badge variant={stats?.delivery_rate && stats.delivery_rate >= 95 ? 'default' : 'secondary'}>
                {stats?.delivery_rate && stats.delivery_rate >= 95 ? 'Excellent' : 'À améliorer'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 h-auto bg-muted/50">
          <TabsTrigger value="dashboard" className="text-xs md:text-sm py-2 data-[state=active]:bg-background">
            <BarChart3 className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Dash</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="text-xs md:text-sm py-2 data-[state=active]:bg-background">
            <Package className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Commandes</span>
            <span className="sm:hidden">Cmd</span>
          </TabsTrigger>
          <TabsTrigger value="carriers" className="text-xs md:text-sm py-2 data-[state=active]:bg-background">
            <Truck className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Transporteurs</span>
            <span className="sm:hidden">Transp.</span>
          </TabsTrigger>
          <TabsTrigger value="tracking" className="text-xs md:text-sm py-2 data-[state=active]:bg-background">
            <MapPin className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Suivi</span>
            <span className="sm:hidden">Suivi</span>
          </TabsTrigger>
          <TabsTrigger value="returns" className="text-xs md:text-sm py-2 data-[state=active]:bg-background">
            <RotateCcw className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Retours</span>
            <span className="sm:hidden">Retours</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs md:text-sm py-2 data-[state=active]:bg-background">
            <Bell className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Notifications</span>
            <span className="sm:hidden">Notif.</span>
          </TabsTrigger>
          <TabsTrigger value="automation" className="text-xs md:text-sm py-2 data-[state=active]:bg-background">
            <Settings className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Automatisation</span>
            <span className="sm:hidden">Auto.</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <FulfillmentProDashboard />
        </TabsContent>
        
        <TabsContent value="overview">
          <FulfillmentOrdersEnhanced />
        </TabsContent>
        
        <TabsContent value="carriers">
          <CarriersManager 
            carriers={carriers} 
            isLoading={carriersLoading} 
            onCreate={handleCreateCarrier}
          />
        </TabsContent>
        
        <TabsContent value="tracking">
          <TrackingDashboardContent />
        </TabsContent>
        
        <TabsContent value="returns">
          <ReturnsHub />
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationsContent />
        </TabsContent>
        
        <TabsContent value="automation">
          <FulfillmentAutomation />
        </TabsContent>
      </Tabs>
      
      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Paramètres Logistique
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Délai de traitement par défaut</Label>
              <Select 
                value={settingsForm.processing_delay}
                onValueChange={(v) => setSettingsForm(prev => ({ ...prev, processing_delay: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12 heures</SelectItem>
                  <SelectItem value="24h">24 heures</SelectItem>
                  <SelectItem value="48h">48 heures</SelectItem>
                  <SelectItem value="72h">72 heures</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notification client automatique</Label>
              <Select 
                value={settingsForm.notification_mode}
                onValueChange={(v) => setSettingsForm(prev => ({ ...prev, notification_mode: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Désactivé</SelectItem>
                  <SelectItem value="shipped">À l'expédition</SelectItem>
                  <SelectItem value="all">Toutes les étapes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Transporteur par défaut</Label>
              <Select 
                value={settingsForm.default_carrier}
                onValueChange={(v) => setSettingsForm(prev => ({ ...prev, default_carrier: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Sélection automatique</SelectItem>
                  {carriers.map((carrier: any) => (
                    <SelectItem key={carrier.id} value={carrier.id}>
                      {carrier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
              {isSavingSettings && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sauvegarder
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* New Shipment Dialog */}
      <Dialog open={newShipmentOpen} onOpenChange={setNewShipmentOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Nouvelle Expédition</DialogTitle>
                <p className="text-sm text-muted-foreground">Créer une expédition manuelle</p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Recipient Info */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-foreground">
                <User className="h-4 w-4 text-primary" />
                Destinataire
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient_name">Nom complet *</Label>
                  <Input
                    id="recipient_name"
                    value={shipmentForm.recipient_name}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, recipient_name: e.target.value })}
                    placeholder="Jean Dupont"
                    className="h-11 bg-muted/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient_email" className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </Label>
                  <Input
                    id="recipient_email"
                    type="email"
                    value={shipmentForm.recipient_email}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, recipient_email: e.target.value })}
                    placeholder="jean@example.com"
                    className="h-11 bg-muted/30"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="recipient_phone" className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Téléphone
                  </Label>
                  <Input
                    id="recipient_phone"
                    value={shipmentForm.recipient_phone}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, recipient_phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                    className="h-11 bg-muted/30"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                Adresse de livraison
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_line1">Adresse *</Label>
                  <Input
                    id="address_line1"
                    value={shipmentForm.address_line1}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, address_line1: e.target.value })}
                    placeholder="123 rue de Paris"
                    className="h-11 bg-muted/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_line2">Complément d'adresse</Label>
                  <Input
                    id="address_line2"
                    value={shipmentForm.address_line2}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, address_line2: e.target.value })}
                    placeholder="Bâtiment A, Étage 3"
                    className="h-11 bg-muted/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Code postal *</Label>
                    <Input
                      id="postal_code"
                      value={shipmentForm.postal_code}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, postal_code: e.target.value })}
                      placeholder="75001"
                      className="h-11 bg-muted/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville *</Label>
                    <Input
                      id="city"
                      value={shipmentForm.city}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, city: e.target.value })}
                      placeholder="Paris"
                      className="h-11 bg-muted/30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Select
                    value={shipmentForm.country}
                    onValueChange={(value) => setShipmentForm({ ...shipmentForm, country: value })}
                  >
                    <SelectTrigger className="h-11 bg-muted/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="France">France</SelectItem>
                      <SelectItem value="Belgique">Belgique</SelectItem>
                      <SelectItem value="Suisse">Suisse</SelectItem>
                      <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                      <SelectItem value="Allemagne">Allemagne</SelectItem>
                      <SelectItem value="Espagne">Espagne</SelectItem>
                      <SelectItem value="Italie">Italie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Shipping Options */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-foreground">
                <Truck className="h-4 w-4 text-primary" />
                Options d'expédition
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carrier_id">Transporteur</Label>
                  <Select
                    value={shipmentForm.carrier_id || 'auto'}
                    onValueChange={(value) => setShipmentForm({ ...shipmentForm, carrier_id: value === 'auto' ? '' : value })}
                  >
                    <SelectTrigger className="h-11 bg-muted/30">
                      <SelectValue placeholder="Sélection automatique" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="auto">Sélection automatique</SelectItem>
                      {carriers.map((carrier: any) => (
                        <SelectItem key={carrier.id} value={carrier.id}>
                          {carrier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight" className="flex items-center gap-1">
                    <Weight className="h-3 w-3" /> Poids (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={shipmentForm.weight}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, weight: e.target.value })}
                    placeholder="0.5"
                    className="h-11 bg-muted/30"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Notes
                </Label>
                <Textarea
                  id="notes"
                  value={shipmentForm.notes}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, notes: e.target.value })}
                  placeholder="Instructions spéciales, références..."
                  className="bg-muted/30 min-h-[80px]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setNewShipmentOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={() => createShipmentMutation.mutate(shipmentForm)}
              disabled={createShipmentMutation.isPending || !shipmentForm.recipient_name || !shipmentForm.address_line1 || !shipmentForm.city || !shipmentForm.postal_code}
            >
              {createShipmentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer l'expédition
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ChannablePageWrapper>
  );
}
