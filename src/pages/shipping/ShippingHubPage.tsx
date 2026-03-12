import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ship, Globe, Calculator, GitBranch } from 'lucide-react';
import { ShippingZonesTab } from '@/components/shipping/ShippingZonesTab';
import { ShippingRatesTab } from '@/components/shipping/ShippingRatesTab';
import { ShippingRulesTab } from '@/components/shipping/ShippingRulesTab';
import { ShippingCalculatorTab } from '@/components/shipping/ShippingCalculatorTab';

export default function ShippingHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'zones');

  const handleTabChange = (v: string) => {
    setActiveTab(v);
    setSearchParams(v === 'zones' ? {} : { tab: v }, { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>Expédition & Tarifs | Drop-Craft AI</title>
        <meta name="description" content="Gérez vos zones d'expédition, tarifs transporteurs et règles de routage." />
      </Helmet>
      <ChannablePageWrapper
        title="Expédition & Tarifs"
        subtitle="Shipping"
        description="Zones, tarifs, règles d'acheminement et calculateur de frais de port"
        heroImage="orders"
        badge={{ label: 'Shipping', icon: Ship }}
      >
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50">
            <TabsTrigger value="zones" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Zones</span>
            </TabsTrigger>
            <TabsTrigger value="rates" className="gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Tarifs</span>
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-2">
              <GitBranch className="h-4 w-4" />
              <span className="hidden sm:inline">Règles</span>
            </TabsTrigger>
            <TabsTrigger value="calculator" className="gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Calculateur</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="zones"><ShippingZonesTab /></TabsContent>
          <TabsContent value="rates"><ShippingRatesTab /></TabsContent>
          <TabsContent value="rules"><ShippingRulesTab /></TabsContent>
          <TabsContent value="calculator"><ShippingCalculatorTab /></TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
