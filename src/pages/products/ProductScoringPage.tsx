import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { ProductSeoHub } from '@/components/seo/ProductSeoHub';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ProductScoringPage() {
  const { t: tPages } = useTranslation('pages');
  const { t } = useTranslation('pages');

  return (
    <ChannablePageWrapper
      title={t('seoScoringProduits.title')}
      description={t('seoScoringProduits.description')}
      heroImage="analytics"
      badge={{ label: 'SEO Engine', icon: Search }}
    >
      <ProductSeoHub />
    </ChannablePageWrapper>
  );
}
