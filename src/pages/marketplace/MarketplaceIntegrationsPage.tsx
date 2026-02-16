/**
 * MarketplaceIntegrationsPage — Sprint 20: Marketplace & Intégrations
 */
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, Code, Plug, Star } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { MarketplaceServiceHub } from '@/components/marketplace/MarketplaceServiceHub';
import { SDKCodeGenerator } from '@/components/marketplace/SDKCodeGenerator';
import { IntegrationConnectors } from '@/components/marketplace/IntegrationConnectors';

export default function MarketplaceIntegrationsPage() {
  const [activeTab, setActiveTab] = useState('marketplace');

  return (
    <ChannablePageWrapper
      title="Marketplace"
      subtitle="Intégrations"
      description="Explorez les services, connecteurs tiers et SDK pour étendre votre plateforme"
      heroImage="marketing"
      badge={{ label: 'Pro', icon: Star }}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="marketplace" className="gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Services</span>
            <span className="sm:hidden">Services</span>
          </TabsTrigger>
          <TabsTrigger value="connectors" className="gap-2">
            <Plug className="h-4 w-4" />
            <span className="hidden sm:inline">Connecteurs</span>
            <span className="sm:hidden">Connect.</span>
          </TabsTrigger>
          <TabsTrigger value="sdk" className="gap-2">
            <Code className="h-4 w-4" />
            <span className="hidden sm:inline">SDK Développeur</span>
            <span className="sm:hidden">SDK</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-6 mt-6">
          <MarketplaceServiceHub />
        </TabsContent>
        <TabsContent value="connectors" className="space-y-6 mt-6">
          <IntegrationConnectors />
        </TabsContent>
        <TabsContent value="sdk" className="space-y-6 mt-6">
          <SDKCodeGenerator />
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
