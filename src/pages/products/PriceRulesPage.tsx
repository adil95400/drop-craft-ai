import { PriceRulesDashboard } from '@/components/price-rules';
import { ChannablePageWrapper } from '@/components/channable';
import { DollarSign } from 'lucide-react';

export default function PriceRulesPage() {
  return (
    <ChannablePageWrapper
      title="Règles de Prix"
      subtitle="Tarification dynamique"
      description="Définissez des règles de prix automatiques pour optimiser vos marges et rester compétitif."
      heroImage="products"
      badge={{ label: 'Pricing', icon: DollarSign }}
    >
      <PriceRulesDashboard />
    </ChannablePageWrapper>
  );
}
