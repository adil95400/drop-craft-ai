/**
 * Sprint 18: Performance & Scalability Dashboard Page
 */
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { PerformanceMonitorDashboard } from '@/components/performance/PerformanceMonitorDashboard';
import { Gauge } from 'lucide-react';

export default function PerformanceDashboardPage() {
  return (
    <>
      <Helmet>
        <title>Performance & Monitoring | ShopOpti</title>
        <meta name="description" content="Monitoring temps réel des performances, Web Vitals, cache et mémoire" />
      </Helmet>

      <ChannablePageWrapper
        title="Performance & Monitoring"
        description="Web Vitals, mémoire, cache et optimisation des requêtes en temps réel"
        heroImage="analytics"
        badge={{ label: 'Temps réel', icon: Gauge }}
      >
        <PerformanceMonitorDashboard />
      </ChannablePageWrapper>
    </>
  );
}
