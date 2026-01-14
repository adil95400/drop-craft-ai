/**
 * Category Mapping Page
 */
import { CategoryMappingDashboard } from '@/components/category-mapping';
import { FeedSubNavigation } from '@/components/feeds/FeedSubNavigation';

export default function CategoryMappingPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <FeedSubNavigation />
      <CategoryMappingDashboard />
    </div>
  );
}
