import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarketplaceSyncDashboard } from '@/components/marketplace/MarketplaceSyncDashboard';
import { DynamicCampaignsDashboard } from '@/components/campaigns/DynamicCampaignsDashboard';
import { SEO } from '@/components/SEO';
import { Store, Megaphone, ArrowRightLeft, Zap } from 'lucide-react';

export default function MarketplaceCampaignsPage() {
  return (
    <>
      <SEO
        title="Sync Marketplace & Campagnes | Shopopti+"
        description="Synchronisation multi-marketplace et gestion des campagnes publicitaires dynamiques"
        path="/marketplace-campaigns"
        keywords="marketplace, synchronisation, campagnes, publicité, Shopify, Amazon, eBay"
      />
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Marketplace & Campagnes</h1>
          <p className="text-muted-foreground">
            Synchronisez vos produits sur plusieurs marketplaces et gérez vos campagnes publicitaires dynamiques
          </p>
        </div>

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
