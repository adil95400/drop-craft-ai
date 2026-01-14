/**
 * PPC Feed Link Page
 */
import { PPCFeedLinkDashboard } from '@/components/ppc-feed-link';
import { FeedSubNavigation } from '@/components/feeds/FeedSubNavigation';

export default function PPCFeedLinkPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <FeedSubNavigation />
      <PPCFeedLinkDashboard />
    </div>
  );
}
