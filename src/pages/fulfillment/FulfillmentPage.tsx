import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  Loader2
} from 'lucide-react';
import { useFulfillmentStats, useCarriers, useCreateCarrier } from '@/hooks/useFulfillment';
import { CarriersManager } from '@/components/fulfillment/CarriersManager';
import { ShipmentsTable } from '@/components/fulfillment/ShipmentsTable';
import { ReturnsManager } from '@/components/fulfillment/ReturnsManager';
import { FulfillmentAutomation } from '@/components/fulfillment/FulfillmentAutomation';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function FulfillmentPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newShipmentOpen, setNewShipmentOpen] = useState(false);
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
  
  const statCards = [
    {
      title: 'Expéditions totales',
      value: stats?.total_shipments || 0,
      icon: Package,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'En transit',
      value: stats?.in_transit || 0,
      icon: Truck,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    },
    {
      title: 'Livrées',
      value: stats?.delivered || 0,
      icon: CheckCircle,
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    {
      title: 'Retours en cours',
      value: stats?.pending_returns || 0,
      icon: RotateCcw,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    }
  ];
  
  const handleCreateCarrier = (carrier: any) => {
    createCarrier.mutate(carrier);
  };
  
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Logistique & Expéditions</h1>
          <p className="text-muted-foreground">
            Gestion des transporteurs, expéditions et retours
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
          <Button size="sm" onClick={() => setNewShipmentOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle expédition
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xl md:text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 md:p-3 rounded-full ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Additional Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
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
        <Card>
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs md:text-sm py-2">
            <Package className="h-4 w-4 mr-1 md:mr-2" />
            Expéditions
          </TabsTrigger>
          <TabsTrigger value="carriers" className="text-xs md:text-sm py-2">
            <Truck className="h-4 w-4 mr-1 md:mr-2" />
            Transporteurs
          </TabsTrigger>
          <TabsTrigger value="returns" className="text-xs md:text-sm py-2">
            <RotateCcw className="h-4 w-4 mr-1 md:mr-2" />
            Retours
          </TabsTrigger>
          <TabsTrigger value="automation" className="text-xs md:text-sm py-2">
            <Settings className="h-4 w-4 mr-1 md:mr-2" />
            Automatisation
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <ShipmentsTable />
        </TabsContent>
        
        <TabsContent value="carriers">
          <CarriersManager 
            carriers={carriers} 
            isLoading={carriersLoading} 
            onCreate={handleCreateCarrier}
          />
        </TabsContent>
        
        <TabsContent value="returns">
          <ReturnsManager />
        </TabsContent>
        
        <TabsContent value="automation">
          <FulfillmentAutomation />
        </TabsContent>
      </Tabs>
      
      {/* Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-lg bg-background border-border shadow-2xl">
          <DialogHeader className="pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Paramètres d'expédition</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Configurez vos préférences de livraison
                </p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
                <div>
                  <Label className="font-medium">Génération automatique des étiquettes</Label>
                  <p className="text-sm text-muted-foreground">Créer les étiquettes dès confirmation</p>
                </div>
                <Badge variant="outline">Activé</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
                <div>
                  <Label className="font-medium">Notifications client</Label>
                  <p className="text-sm text-muted-foreground">Envoyer les emails de suivi</p>
                </div>
                <Badge variant="outline">Activé</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
                <div>
                  <Label className="font-medium">Transporteur par défaut</Label>
                  <p className="text-sm text-muted-foreground">Sélection automatique</p>
                </div>
                <Badge>Le moins cher</Badge>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                Fermer
              </Button>
              <Button onClick={() => { setSettingsOpen(false); setActiveTab('automation'); }}>
                Gérer les règles
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* New Shipment Modal */}
      <Dialog open={newShipmentOpen} onOpenChange={setNewShipmentOpen}>
        <DialogContent className="sm:max-w-2xl bg-background border-border shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-500/10">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Nouvelle expédition</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Créez une nouvelle expédition manuelle
                </p>
              </div>
            </div>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); createShipmentMutation.mutate(shipmentForm); }} className="space-y-6 pt-4">
            {/* Destinataire */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Informations destinataire
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Nom complet *
                  </Label>
                  <Input
                    value={shipmentForm.recipient_name}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, recipient_name: e.target.value })}
                    placeholder="Jean Dupont"
                    className="h-11 bg-muted/30"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={shipmentForm.recipient_email}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, recipient_email: e.target.value })}
                    placeholder="jean@exemple.com"
                    className="h-11 bg-muted/30"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Téléphone
                  </Label>
                  <Input
                    value={shipmentForm.recipient_phone}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, recipient_phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                    className="h-11 bg-muted/30"
                  />
                </div>
              </div>
            </div>
            
            {/* Adresse */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Adresse de livraison
              </Label>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Adresse *
                  </Label>
                  <Input
                    value={shipmentForm.address_line1}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, address_line1: e.target.value })}
                    placeholder="123 Rue de la Paix"
                    className="h-11 bg-muted/30"
                    required
                  />
                </div>
                <Input
                  value={shipmentForm.address_line2}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, address_line2: e.target.value })}
                  placeholder="Appartement, étage, etc. (optionnel)"
                  className="h-11 bg-muted/30"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Input
                    value={shipmentForm.postal_code}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, postal_code: e.target.value })}
                    placeholder="Code postal *"
                    className="h-11 bg-muted/30"
                    required
                  />
                  <Input
                    value={shipmentForm.city}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, city: e.target.value })}
                    placeholder="Ville *"
                    className="h-11 bg-muted/30"
                    required
                  />
                  <Select
                    value={shipmentForm.country}
                    onValueChange={(value) => setShipmentForm({ ...shipmentForm, country: value })}
                  >
                    <SelectTrigger className="h-11 bg-muted/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="France">France</SelectItem>
                      <SelectItem value="Belgique">Belgique</SelectItem>
                      <SelectItem value="Suisse">Suisse</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Allemagne">Allemagne</SelectItem>
                      <SelectItem value="Espagne">Espagne</SelectItem>
                      <SelectItem value="Italie">Italie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Options d'expédition */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Options d'expédition
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    Transporteur
                  </Label>
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
                  <Label className="flex items-center gap-2 text-sm">
                    <Weight className="h-4 w-4 text-muted-foreground" />
                    Poids (kg)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={shipmentForm.weight}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, weight: e.target.value })}
                    placeholder="0.5"
                    className="h-11 bg-muted/30"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Notes
                </Label>
                <Textarea
                  value={shipmentForm.notes}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, notes: e.target.value })}
                  placeholder="Instructions spéciales de livraison..."
                  className="bg-muted/30 min-h-[80px]"
                />
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setNewShipmentOpen(false)}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={createShipmentMutation.isPending || !shipmentForm.recipient_name || !shipmentForm.address_line1}
                className="bg-green-600 hover:bg-green-700"
              >
                {createShipmentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer l'expédition
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
