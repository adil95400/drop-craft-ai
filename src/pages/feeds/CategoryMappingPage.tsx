/**
 * Category Mapping Page
 */
import { CategoryMappingDashboard } from '@/components/category-mapping';
import { FeedSubNavigation } from '@/components/feeds/FeedSubNavigation';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';

export default function CategoryMappingPage() {
  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <FeedSubNavigation />
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.categoryMapping} />
      <CategoryMappingDashboard />
    </div>
  );
}