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
  Package,
  TrendingUp
} from 'lucide-react'
import { RealTimeMonitoring } from './RealTimeMonitoring'
import { SecurityDashboard } from './SecurityDashboard'
import { AdvancedAnalytics } from './AdvancedAnalytics'
import { BusinessIntelligence } from './BusinessIntelligence'
import { ImportJobProcessor } from '@/components/import/ImportJobProcessor'
import { SystemHealthMonitor } from './SystemHealthMonitor'
import { PerformanceOptimizer } from './PerformanceOptimizer'
import { NotificationCenter } from './NotificationCenter'
import { AutomationHub } from './AutomationHub'
import { KPIWidgets } from './KPIWidgets'
import { RepricingDashboard } from '@/components/repricing/RepricingDashboard'

export function EnhancedDashboardTabs() {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid grid-cols-9 w-full">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Vue d'ensemble
        </TabsTrigger>
        <TabsTrigger value="kpi" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          KPI
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Analytics IA
        </TabsTrigger>
        <TabsTrigger value="repricing" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Repricing
        </TabsTrigger>
        <TabsTrigger value="automation" className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Automation
        </TabsTrigger>
        <TabsTrigger value="monitoring" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Monitoring
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Sécurité
        </TabsTrigger>
        <TabsTrigger value="business" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Business Intelligence
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Notifications
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6 mt-6">
        {/* Contenu de la vue d'ensemble sera géré par le composant parent */}
      </TabsContent>

      <TabsContent value="kpi" className="space-y-6 mt-6">
        <KPIWidgets />
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6 mt-6">
        <AdvancedAnalytics />
      </TabsContent>

      <TabsContent value="repricing" className="space-y-6 mt-6">
        <RepricingDashboard />
      </TabsContent>

      <TabsContent value="automation" className="space-y-6 mt-6">
        <AutomationHub />
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

      <TabsContent value="notifications" className="space-y-6 mt-6">
        <NotificationCenter />
        <PerformanceOptimizer />
        <ImportJobProcessor />
      </TabsContent>
    </Tabs>
  )
}