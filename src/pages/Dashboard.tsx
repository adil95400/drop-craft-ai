import { lazy, Suspense } from 'react'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { MetricsGrid } from '@/components/dashboard/MetricsGrid'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { RealTimeKPIs } from '@/components/dashboard/RealTimeKPIs'
import { SmartAlerts } from '@/components/dashboard/SmartAlerts'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useDashboardRefresh } from '@/hooks/useDashboardRefresh'
import { Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Lazy loading des composants lourds
const RealTimeAnalytics = lazy(() => import('@/components/dashboard/RealTimeAnalytics').then(m => ({ default: m.RealTimeAnalytics })))
const FeatureStatusDashboard = lazy(() => import('@/components/dashboard/FeatureStatusDashboard').then(m => ({ default: m.FeatureStatusDashboard })))
const PerformanceTestRunner = lazy(() => import('@/components/monitoring/PerformanceTestRunner').then(m => ({ default: m.PerformanceTestRunner })))
const EnrichmentDashboardWidget = lazy(() => import('@/components/enrichment').then(m => ({ default: m.EnrichmentDashboardWidget })))

// Composant de chargement pour les sections lazy
function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-12 animate-in fade-in">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useDashboardStats()
  const { isRefreshing, lastUpdate, refresh } = useDashboardRefresh()

  // État de chargement initial
  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Header avec bouton de rafraîchissement */}
      <DashboardHeader 
        isLive={!isError}
        isRefreshing={isRefreshing}
        onRefresh={refresh}
        lastUpdate={lastUpdate}
      />

      {/* Smart Alerts - Prominent at top */}
      <SmartAlerts />

      {/* Real-Time KPIs */}
      <RealTimeKPIs />

      {/* Static Metrics Grid */}
      <MetricsGrid stats={stats} isLoading={isRefreshing} />

      {/* Revenue Chart */}
      <RevenueChart />

      {/* Quick Actions */}
      <QuickActions />

      {/* Widget d'enrichissement produits - Lazy loaded */}
      <Suspense fallback={<SectionLoader />}>
        <EnrichmentDashboardWidget />
      </Suspense>

      {/* Tabbed Analytics Section - Lazy loaded */}
      <Tabs defaultValue="realtime" className="space-y-4">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
          <TabsTrigger value="realtime" className="text-xs sm:text-sm">Temps réel</TabsTrigger>
          <TabsTrigger value="features" className="text-xs sm:text-sm">Fonctionnalités</TabsTrigger>
          <TabsTrigger value="performance" className="text-xs sm:text-sm">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="realtime" className="mt-4">
          <Suspense fallback={<SectionLoader />}>
            <RealTimeAnalytics />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="features" className="mt-4">
          <Suspense fallback={<SectionLoader />}>
            <FeatureStatusDashboard />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="performance" className="mt-4">
          <Suspense fallback={<SectionLoader />}>
            <PerformanceTestRunner />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
