/**
 * PPC Feed Link Page
 */
import { PPCFeedLinkDashboard } from '@/components/ppc-feed-link';
import { FeedSubNavigation } from '@/components/feeds/FeedSubNavigation';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';

export default function PPCFeedLinkPage() {
  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <FeedSubNavigation />
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.ppcFeedLink} />
      <PPCFeedLinkDashboard />
    </div>
  );
}