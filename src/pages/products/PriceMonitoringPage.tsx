import { PriceMonitoringDashboard } from '@/components/price-monitoring';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { TrendingUp } from 'lucide-react';

export default function PriceMonitoringPage() {
  return (
    <ChannablePageWrapper
      title="Monitoring Prix & Stock"
      description="Suivi en temps réel des variations de prix et alertes de stock"
      heroImage="analytics"
      badge={{ label: 'Monitoring', icon: TrendingUp }}
    >
      <PriceMonitoringDashboard />
    </ChannablePageWrapper>
  );
}
