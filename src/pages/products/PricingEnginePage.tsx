import { PricingEngineDashboard } from '@/components/pricing-engine';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Calculator } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PricingEnginePage() {
  const { t } = useTranslation('pages');

  return (
    <ChannablePageWrapper
      title={t('moteurDeReglesPricing.title')}
      description={t('moteurDeReglesPricing.description')}
      heroImage="products"
      badge={{ label: 'Pricing Engine', icon: Calculator }}
    >
      <PricingEngineDashboard />
    </ChannablePageWrapper>
  );
}
