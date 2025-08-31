import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdvancedAnalyticsDashboard } from "@/components/enterprise/AdvancedAnalyticsDashboard"
import { EnterpriseIntegrationDashboard } from "@/components/enterprise/EnterpriseIntegrationDashboard"
import { SystemMonitoringDashboard } from "@/components/enterprise/SystemMonitoringDashboard"
import { BarChart3, Settings, Activity } from "lucide-react"

export default function AdvancedAnalyticsEnterprisePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Analytics Avancés & Enterprise
        </h1>
        <p className="text-xl text-muted-foreground">
          Surveillance système, intégrations enterprise et analyses prédictives avancées
        </p>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics Avancés
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Intégrations Enterprise
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Monitoring Système
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AdvancedAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="integrations">
          <EnterpriseIntegrationDashboard />
        </TabsContent>

        <TabsContent value="monitoring">
          <SystemMonitoringDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}