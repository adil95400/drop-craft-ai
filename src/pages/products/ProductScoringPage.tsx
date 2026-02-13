/**
 * Page Scoring & SEO Produits — Hub unifié
 * 100% connecté API V1, scores structurés, impact business, quotas, historique
 */
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { ProductSeoHub } from '@/components/seo/ProductSeoHub';
import { Search } from 'lucide-react';

export default function ProductScoringPage() {
  return (
    <ChannablePageWrapper
      title="SEO & Scoring Produits"
      description="Moteur de scoring structuré avec impact business, historique et optimisation IA"
      heroImage="analytics"
      badge={{ label: 'SEO Engine', icon: Search }}
    >
      <ProductSeoHub />
    </ChannablePageWrapper>
  );
}
