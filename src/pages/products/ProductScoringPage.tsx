import { ProductScoringDashboard } from '@/components/product-scoring';
import { ChannablePageWrapper } from '@/components/channable';
import { Star } from 'lucide-react';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';

export default function ProductScoringPage() {
  return (
    <ChannablePageWrapper
      title="Scoring Produits"
      subtitle="Évaluation IA"
      description="Analysez et améliorez le score de qualité de vos fiches produits avec notre algorithme d'IA."
      heroImage="products"
      badge={{ label: 'IA Score', icon: Star }}
    >
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.productScoring} />
      <ProductScoringDashboard />
    </ChannablePageWrapper>
  );
}
