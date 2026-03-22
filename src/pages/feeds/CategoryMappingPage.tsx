/**
 * Category Mapping Page
 */
import { CategoryMappingDashboard } from '@/components/category-mapping';
import { FeedSubNavigation } from '@/components/feeds/FeedSubNavigation';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { GitBranch } from 'lucide-react';

export default function CategoryMappingPage() {
    const { t: tPages } = useTranslation('pages');

  return (
    <ChannablePageWrapper
      title={tPages('mappingCategories.title')}
      description="Associez vos catégories produits aux taxonomies des canaux de vente"
      heroImage="schema"
      badge={{ label: 'Mapping', icon: GitBranch }}
    >
      <FeedSubNavigation />
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.categoryMapping} />
      <CategoryMappingDashboard />
    </ChannablePageWrapper>
  );
}
