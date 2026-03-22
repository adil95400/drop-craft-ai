import { PriceMonitoringDashboard } from '@/components/price-monitoring';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PriceMonitoringPage() {
  const { t } = useTranslation('pages');

  return (
    <ChannablePageWrapper
      title={t('monitoringPrixStock.title')}
      description={t('monitoringPrixStock.description')}
      heroImage="analytics"
      badge={{ label: 'Monitoring', icon: TrendingUp }}
    >
      <PriceMonitoringDashboard />
    </ChannablePageWrapper>
  );
}
