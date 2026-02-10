/**
 * PPC Feed Link Page - ChannablePageWrapper Standard
 */
import { PPCFeedLinkDashboard } from '@/components/ppc-feed-link';
import { FeedSubNavigation } from '@/components/feeds/FeedSubNavigation';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';
import { Link2 } from 'lucide-react';

export default function PPCFeedLinkPage() {
  return (
    <ChannablePageWrapper
      title="PPC Feed Link"
      subtitle="Feeds"
      description="Connectez vos feeds aux campagnes publicitaires pour un suivi automatisé"
      heroImage="analytics"
      badge={{ label: "PPC", icon: Link2 }}
    >
      <FeedSubNavigation />
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.ppcFeedLink} />
      <PPCFeedLinkDashboard />
    </ChannablePageWrapper>
  );
}
