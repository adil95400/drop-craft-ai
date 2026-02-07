import { PriceRulesDashboard } from '@/components/price-rules';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { DollarSign } from 'lucide-react';

export default function PriceRulesPage() {
  return (
    <ChannablePageWrapper
      title="Règles de Prix"
      description="Tarification dynamique — Optimisez vos marges et restez compétitif"
      heroImage="products"
      badge={{ label: 'Prix', icon: DollarSign }}
    >
      <PriceRulesDashboard />
    </ChannablePageWrapper>
  );
}
