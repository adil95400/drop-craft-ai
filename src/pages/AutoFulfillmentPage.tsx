import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SupplierConnectionsManager } from '@/components/auto-fulfillment/SupplierConnectionsManager';
import { RoutingRulesManager } from '@/components/auto-fulfillment/RoutingRulesManager';
import { FulfillmentOrdersMonitor } from '@/components/auto-fulfillment/FulfillmentOrdersMonitor';
import { FulfillmentDashboard } from '@/components/auto-fulfillment/FulfillmentDashboard';
import { Plug, Route, Package, BarChart3 } from 'lucide-react';

export default function AutoFulfillmentPage() {
  return (
    <>
      <Helmet>
        <title>Auto-Fulfillment System - Drop Craft AI</title>
        <meta name="description" content="Automatisez vos commandes fournisseurs avec notre système intelligent de fulfillment. Routing automatique, suivi en temps réel et gestion multi-fournisseurs." />
      </Helmet>
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            📦 Auto-Fulfillment System
          </h1>
          <p className="text-xl text-muted-foreground">
            Automatisez vos commandes vers les fournisseurs et suivez vos livraisons en temps réel
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center gap-2">
              <Plug className="w-4 h-4" />
              <span className="hidden sm:inline">Fournisseurs</span>
            </TabsTrigger>
            <TabsTrigger value="routing" className="flex items-center gap-2">
              <Route className="w-4 h-4" />
              <span className="hidden sm:inline">Routing</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Commandes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <FulfillmentDashboard />
          </TabsContent>

          <TabsContent value="connections">
            <SupplierConnectionsManager />
          </TabsContent>

          <TabsContent value="routing">
            <RoutingRulesManager />
          </TabsContent>

          <TabsContent value="orders">
            <FulfillmentOrdersMonitor />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
