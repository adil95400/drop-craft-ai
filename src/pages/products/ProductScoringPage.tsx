import { ProductScoringDashboard } from '@/components/product-scoring';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Sparkles } from 'lucide-react';

export default function ProductScoringPage() {
  return (
    <ChannablePageWrapper
      title="Scoring Produits"
      description="Analysez et améliorez le score de qualité de vos fiches produits"
      heroImage="products"
      badge={{ label: 'Scoring', icon: Sparkles }}
    >
      <ProductScoringDashboard />
    </ChannablePageWrapper>
  );
}
