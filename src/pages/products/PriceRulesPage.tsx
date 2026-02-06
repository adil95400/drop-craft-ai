import { PriceRulesDashboard } from '@/components/price-rules';
import { PageLayout } from '@/components/shared';

export default function PriceRulesPage() {
  return (
    <PageLayout
      title="Règles de Prix"
      subtitle="Tarification dynamique — Optimisez vos marges et restez compétitif"
    >
      <PriceRulesDashboard />
    </PageLayout>
  );
}
