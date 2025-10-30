import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EnhancedIntegrationsHub } from '@/components/integrations/EnhancedIntegrationsHub'
import { ExtensionStore } from '@/components/extensions/ExtensionStore'
import { ExtensionNavigator } from '@/components/extensions/ExtensionNavigator'
import { ExtensionAuthManager } from '@/components/extensions/ExtensionAuthManager'
import { ExtensionInstallGuide } from '@/components/extensions/ExtensionInstallGuide'
import { ExtensionDashboard } from '@/components/extensions/ExtensionDashboard'
import { ReviewImporterConfig } from '@/components/extensions/ReviewImporterConfig'
import { AliExpressImporter } from '@/components/extensions/AliExpressImporter'
import { PriceMonitoring, StockAlerts, AutoOrders, MonitoringConfig, AutomationDashboard } from '@/components/autods'
import { Puzzle, Zap, Grid, Chrome, BookOpen, Activity, Star, ShoppingCart, TrendingUp, Package, ShoppingBag, Settings, Bot } from 'lucide-react'

export default function Extensions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-background">
      <div className="container mx-auto p-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-12">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="navigator" className="flex items-center gap-2">
              <Grid className="w-4 h-4" />
              Centre
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Intégrations
            </TabsTrigger>
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Puzzle className="w-4 h-4" />
              Store
            </TabsTrigger>
            <TabsTrigger value="chrome" className="flex items-center gap-2">
              <Chrome className="w-4 h-4" />
              Chrome
            </TabsTrigger>
            <TabsTrigger value="guide" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Guide
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Avis
            </TabsTrigger>
            <TabsTrigger value="aliexpress" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              AliExpress
            </TabsTrigger>
            <TabsTrigger value="price-monitoring" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Prix
            </TabsTrigger>
            <TabsTrigger value="stock-alerts" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Stock
            </TabsTrigger>
            <TabsTrigger value="auto-orders" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Auto-Orders
            </TabsTrigger>
            <TabsTrigger value="monitoring-config" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Config
            </TabsTrigger>
            <TabsTrigger value="automation-dashboard" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Automation
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <ExtensionDashboard />
          </TabsContent>
          
          <TabsContent value="navigator">
            <ExtensionNavigator />
          </TabsContent>
          
          <TabsContent value="integrations">
            <EnhancedIntegrationsHub />
          </TabsContent>
          
          <TabsContent value="store">
            <ExtensionStore />
          </TabsContent>
          
          <TabsContent value="chrome">
            <ExtensionAuthManager />
          </TabsContent>
          
          <TabsContent value="guide">
            <ExtensionInstallGuide />
          </TabsContent>
          
          <TabsContent value="reviews">
            <ReviewImporterConfig />
          </TabsContent>
          
          <TabsContent value="aliexpress">
            <AliExpressImporter />
          </TabsContent>
          
          <TabsContent value="price-monitoring">
            <PriceMonitoring />
          </TabsContent>
          
          <TabsContent value="stock-alerts">
            <StockAlerts />
          </TabsContent>
          
          <TabsContent value="auto-orders">
            <AutoOrders />
          </TabsContent>
          
          <TabsContent value="monitoring-config">
            <MonitoringConfig />
          </TabsContent>
          
          <TabsContent value="automation-dashboard">
            <AutomationDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}