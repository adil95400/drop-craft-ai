/**
 * Performance & Optimization Dashboard - Enhanced
 * Web Vitals, Resource Waterfall, Bundle Analysis, AI Advisor
 */
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { PerformanceMonitorDashboard } from '@/components/performance/PerformanceMonitorDashboard';
import { ResourceWaterfall } from '@/components/performance/ResourceWaterfall';
import { BundleAnalyzer } from '@/components/performance/BundleAnalyzer';
import { AIPerformanceAdvisor } from '@/components/performance/AIPerformanceAdvisor';
import { PerformanceOptimizer } from '@/components/performance/PerformanceOptimizer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gauge, Activity, Network, Package, BrainCircuit, Settings } from 'lucide-react';

export default function PerformanceDashboardPage() {
  const { t: tPages } = useTranslation('pages');
  return (
    <>
      <Helmet>
        <title>Performance & Optimisation | ShopOpti</title>
        <meta name="description" content="Monitoring temps réel, analyse bundle, waterfall réseau et optimisation IA" />
      </Helmet>

      <ChannablePageWrapper
        title={tPages('performanceOptimisation.title')}
        description="Web Vitals, analyse de bundle, waterfall réseau et recommandations IA en temps réel"
        heroImage="analytics"
        badge={{ label: 'Temps réel', icon: Gauge }}
      >
        <Tabs defaultValue="monitoring" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="monitoring" className="flex items-center gap-1.5 text-xs">
              <Activity className="h-3.5 w-3.5" /> Monitoring
            </TabsTrigger>
            <TabsTrigger value="waterfall" className="flex items-center gap-1.5 text-xs">
              <Network className="h-3.5 w-3.5" /> Waterfall
            </TabsTrigger>
            <TabsTrigger value="bundles" className="flex items-center gap-1.5 text-xs">
              <Package className="h-3.5 w-3.5" /> Bundles
            </TabsTrigger>
            <TabsTrigger value="advisor" className="flex items-center gap-1.5 text-xs">
              <BrainCircuit className="h-3.5 w-3.5" /> Conseiller IA
            </TabsTrigger>
            <TabsTrigger value="optimizer" className="flex items-center gap-1.5 text-xs">
              <Settings className="h-3.5 w-3.5" /> Optimiseur
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring">
            <PerformanceMonitorDashboard />
          </TabsContent>

          <TabsContent value="waterfall">
            <ResourceWaterfall />
          </TabsContent>

          <TabsContent value="bundles">
            <BundleAnalyzer />
          </TabsContent>

          <TabsContent value="advisor">
            <AIPerformanceAdvisor />
          </TabsContent>

          <TabsContent value="optimizer">
            <PerformanceOptimizer />
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
