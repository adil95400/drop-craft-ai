import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { SupplierPricingRules } from '@/components/suppliers/SupplierPricingRules';
import { MultiSupplierStockManager } from '@/components/suppliers/MultiSupplierStockManager';
import { WebhookMonitor } from '@/components/suppliers/WebhookMonitor';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { DollarSign, Package, Webhook, Settings } from 'lucide-react';

export default function SupplierAdvancedPage() {
  const { supplierId } = useParams();
  const [activeTab, setActiveTab] = useState('pricing');

  if (!supplierId) {
    return (
      <ChannablePageWrapper
        title="Gestion avancée"
        description="Identifiant fournisseur manquant"
        heroImage="suppliers"
        badge={{ label: 'Fournisseur', icon: Settings }}
      >
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Identifiant fournisseur manquant</p>
        </Card>
      </ChannablePageWrapper>
    );
  }

  return (
    <ChannablePageWrapper
      title="Gestion avancée du fournisseur"
      description="Tarification dynamique, monitoring du stock et webhooks temps réel"
      heroImage="suppliers"
      badge={{ label: 'Avancé', icon: Settings }}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Tarification dynamique
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Stock multi-fournisseurs
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks temps réel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-4 mt-6">
          <SupplierPricingRules supplierId={supplierId} />
        </TabsContent>

        <TabsContent value="stock" className="space-y-4 mt-6">
          <MultiSupplierStockManager supplierId={supplierId} />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4 mt-6">
          <WebhookMonitor />
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
