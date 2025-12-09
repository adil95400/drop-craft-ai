import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  Package, 
  RotateCcw, 
  Settings,
  Plus,
  CheckCircle
} from 'lucide-react';
import { useFulfillmentStats, useCarriers, useCreateCarrier } from '@/hooks/useFulfillment';
import { CarriersManager } from '@/components/fulfillment/CarriersManager';
import { ShipmentsTable } from '@/components/fulfillment/ShipmentsTable';
import { ReturnsManager } from '@/components/fulfillment/ReturnsManager';
import { FulfillmentAutomation } from '@/components/fulfillment/FulfillmentAutomation';

export default function FulfillmentPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: stats, isLoading } = useFulfillmentStats();
  const { data: carriers = [], isLoading: carriersLoading } = useCarriers();
  const createCarrier = useCreateCarrier();
  
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
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
          <Button size="sm">
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
    </div>
  );
}
