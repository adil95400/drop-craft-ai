import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarketplaceSyncDashboard } from '@/components/marketplace/MarketplaceSyncDashboard';
import { DynamicCampaignsDashboard } from '@/components/campaigns/DynamicCampaignsDashboard';
import { SEO } from '@/components/SEO';
import { Store, Megaphone, ArrowRightLeft, Zap } from 'lucide-react';
import { PageBanner } from '@/components/shared/PageBanner';

export default function MarketplaceCampaignsPage() {
  return (
    <>
      <SEO
        title="Sync Marketplace & Campagnes | Shopopti+"
        description="Synchronisation multi-marketplace et gestion des campagnes publicitaires dynamiques"
        path="/marketplace-campaigns"
        keywords="marketplace, synchronisation, campagnes, publicité, Shopify, Amazon, eBay"
      />
      <div className="container mx-auto py-8 space-y-6">
        <PageBanner
          icon={Store}
          title="Marketplace & Campagnes"
          description="Synchronisez vos produits et gérez vos campagnes publicitaires dynamiques"
          theme="green"
        />

        <Tabs defaultValue="sync" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="sync" className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Synchronisation
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Campagnes Dynamiques
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sync">
            <MarketplaceSyncDashboard />
          </TabsContent>

          <TabsContent value="campaigns">
            <DynamicCampaignsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
