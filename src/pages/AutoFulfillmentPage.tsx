import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { FulfillmentDashboard } from '@/components/auto-fulfillment/FulfillmentDashboard'
import { FulfillmentOrdersMonitor } from '@/components/auto-fulfillment/FulfillmentOrdersMonitor'
import { RoutingRulesManager } from '@/components/auto-fulfillment/RoutingRulesManager'
import { SupplierConnectionsManager } from '@/components/auto-fulfillment/SupplierConnectionsManager'
import { 
  Zap, Package, Settings, Truck, BarChart3
} from 'lucide-react'

export default function AutoFulfillmentPage() {
  return (
    <>
      <Helmet>
        <title>Auto-Fulfillment — Commande automatique en 1-click</title>
        <meta name="description" content="Automatisez vos commandes fournisseurs. Fulfillment en 1-click, tracking automatique et routage intelligent." />
      </Helmet>

      <ChannablePageWrapper
        title="Auto-Fulfillment"
        description="Automatisez vos commandes fournisseurs et le suivi des colis en temps réel"
        heroImage="automation"
        badge={{ label: 'Fulfillment', icon: Zap }}
      >
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Commandes
            </TabsTrigger>
            <TabsTrigger value="routing" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Routage
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Fournisseurs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><FulfillmentDashboard /></TabsContent>
          <TabsContent value="orders"><FulfillmentOrdersMonitor /></TabsContent>
          <TabsContent value="routing"><RoutingRulesManager /></TabsContent>
          <TabsContent value="suppliers"><SupplierConnectionsManager /></TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  )
}
