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
        <title>Auto-Fulfillment System - ShopOpti</title>
        <meta name="description" content="Automatisez vos commandes fournisseurs avec notre système intelligent de fulfillment. Routing automatique, suivi en temps réel et gestion multi-fournisseurs." />
      </Helmet>
      
      <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
            📦 Auto-Fulfillment
          </h1>
          <p className="text-sm md:text-xl text-muted-foreground">
            Automatisez vos commandes et suivez vos livraisons
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4 md:space-y-6">
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-4">
              <TabsTrigger value="dashboard" className="flex items-center gap-2 whitespace-nowrap px-3 md:px-4">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden xs:inline">Dashboard</span>
                <span className="xs:hidden">Stats</span>
              </TabsTrigger>
              <TabsTrigger value="connections" className="flex items-center gap-2 whitespace-nowrap px-3 md:px-4">
                <Plug className="w-4 h-4" />
                <span className="hidden xs:inline">Fournisseurs</span>
                <span className="xs:hidden">Fourn.</span>
              </TabsTrigger>
              <TabsTrigger value="routing" className="flex items-center gap-2 whitespace-nowrap px-3 md:px-4">
                <Route className="w-4 h-4" />
                <span>Routing</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2 whitespace-nowrap px-3 md:px-4">
                <Package className="w-4 h-4" />
                <span className="hidden xs:inline">Commandes</span>
                <span className="xs:hidden">Cmd.</span>
              </TabsTrigger>
            </TabsList>
          </div>

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