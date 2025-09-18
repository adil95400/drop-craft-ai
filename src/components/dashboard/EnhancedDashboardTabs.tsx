import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  Shield, 
  Activity, 
  Settings, 
  Brain,
  Zap,
  Users,
  Package
} from 'lucide-react'
import { RealTimeMonitoring } from './RealTimeMonitoring'
import { SecurityDashboard } from './SecurityDashboard'
import { AdvancedAnalytics } from './AdvancedAnalytics'
import { ImportJobProcessor } from '@/components/import/ImportJobProcessor'
import { SystemHealthMonitor } from './SystemHealthMonitor'
import { PerformanceOptimizer } from './PerformanceOptimizer'

export function EnhancedDashboardTabs() {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid grid-cols-6 w-full">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Vue d'ensemble
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Analytics IA
        </TabsTrigger>
        <TabsTrigger value="monitoring" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Monitoring
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Sécurité
        </TabsTrigger>
        <TabsTrigger value="performance" className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Performance
        </TabsTrigger>
        <TabsTrigger value="business" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Business Intelligence
        </TabsTrigger>
        <TabsTrigger value="imports" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Imports
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6 mt-6">
        {/* Contenu de la vue d'ensemble sera géré par le composant parent */}
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6 mt-6">
        <AdvancedAnalytics />
      </TabsContent>

      <TabsContent value="business" className="space-y-6 mt-6">
        <BusinessIntelligence />
      </TabsContent>

      <TabsContent value="monitoring" className="space-y-6 mt-6">
        <RealTimeMonitoring />
        <SystemHealthMonitor />
      </TabsContent>

      <TabsContent value="security" className="space-y-6 mt-6">
        <SecurityDashboard />
      </TabsContent>

      <TabsContent value="performance" className="space-y-6 mt-6">
        <PerformanceOptimizer />
      </TabsContent>

      <TabsContent value="imports" className="space-y-6 mt-6">
        <ImportJobProcessor />
      </TabsContent>
    </Tabs>
  )
}