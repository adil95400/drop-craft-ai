import { ProductResearchScanner } from '@/components/product-research/ProductResearchScanner';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { TrendingUp } from 'lucide-react';

export default function ProductResearchPage() {
  return (
    <ChannablePageWrapper
      title="Product Research AI"
      description="Trouvez les produits gagnants avant vos concurrents avec notre scanner IA"
      heroImage="research"
      badge={{ label: "IA", icon: TrendingUp }}
    >
      <ProductResearchScanner />
    </ChannablePageWrapper>
  );
}
