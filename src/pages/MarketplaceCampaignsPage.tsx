import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarketplaceSyncDashboard } from '@/components/marketplace/MarketplaceSyncDashboard';
import { DynamicCampaignsDashboard } from '@/components/campaigns/DynamicCampaignsDashboard';
import { SEO } from '@/components/SEO';
import { Store, Megaphone, ArrowRightLeft } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function MarketplaceCampaignsPage() {
  return (
    <>
      <SEO
        title="Sync Marketplace & Campagnes | Shopopti+"
        description="Synchronisation multi-marketplace et gestion des campagnes publicitaires dynamiques"
        path="/marketplace-campaigns"
        keywords="marketplace, synchronisation, campagnes, publicité, Shopify, Amazon, eBay"
      />
      <ChannablePageWrapper
        title="Marketplace & Campagnes"
        description="Synchronisez vos produits et gérez vos campagnes publicitaires dynamiques"
        heroImage="integrations"
        badge={{ label: 'Marketplace', icon: Store }}
      >
        <Tabs defaultValue="sync" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="sync" className="flex items-center gap-2"><ArrowRightLeft className="h-4 w-4" />Synchronisation</TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2"><Megaphone className="h-4 w-4" />Campagnes Dynamiques</TabsTrigger>
          </TabsList>
          <TabsContent value="sync"><MarketplaceSyncDashboard /></TabsContent>
          <TabsContent value="campaigns"><DynamicCampaignsDashboard /></TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
