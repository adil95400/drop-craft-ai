import { ProductScoringDashboard } from '@/components/product-scoring';
import { PageLayout } from '@/components/shared';

export default function ProductScoringPage() {
  return (
    <PageLayout
      title="Scoring Produits"
      subtitle="Analysez et améliorez le score de qualité de vos fiches produits"
    >
      <ProductScoringDashboard />
    </PageLayout>
  );
}
