import { PriceRulesDashboard } from '@/components/price-rules';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PriceRulesPage() {
  const { t } = useTranslation('channels');

  return (
    <ChannablePageWrapper
      title={t('priceRules.title')}
      description={t('priceRules.description')}
      heroImage="products"
      badge={{ label: t('overview.prices'), icon: DollarSign }}
    >
      <PriceRulesDashboard />
    </ChannablePageWrapper>
  );
}
