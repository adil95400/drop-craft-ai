/**
 * PPC Feed Link Page - Enhanced with PPC Automation Engine
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PPCFeedLinkDashboard } from '@/components/ppc-feed-link';
import { PPCAutomationEngine } from '@/components/ppc/PPCAutomationEngine';
import { FeedSubNavigation } from '@/components/feeds/FeedSubNavigation';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';
import { Link2, Brain } from 'lucide-react';

export default function PPCFeedLinkPage() {
  return (
    <ChannablePageWrapper
      title="PPC Automation"
      subtitle="Feeds & Publicité"
      description="Connectez vos feeds aux campagnes publicitaires avec automatisation IA avancée"
      heroImage="analytics"
      badge={{ label: "PPC", icon: Link2 }}
    >
      <FeedSubNavigation />
      <Tabs defaultValue="automation" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="automation" className="gap-2"><Brain className="h-4 w-4" />Automation PPC</TabsTrigger>
          <TabsTrigger value="feed-links" className="gap-2"><Link2 className="h-4 w-4" />Feed Links</TabsTrigger>
        </TabsList>
        <TabsContent value="automation">
          <PPCAutomationEngine />
        </TabsContent>
        <TabsContent value="feed-links">
          <AdvancedFeatureGuide {...ADVANCED_GUIDES.ppcFeedLink} />
          <PPCFeedLinkDashboard />
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
