import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { SupplierPricingRules } from '@/components/suppliers/SupplierPricingRules';
import { MultiSupplierStockManager } from '@/components/suppliers/MultiSupplierStockManager';
import { WebhookMonitor } from '@/components/suppliers/WebhookMonitor';
import { DollarSign, Package, Webhook } from 'lucide-react';

export default function SupplierAdvancedPage() {
  const { supplierId } = useParams();
  const [activeTab, setActiveTab] = useState('pricing');

  if (!supplierId) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Identifiant fournisseur manquant</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestion avancée du fournisseur</h1>
        <p className="text-muted-foreground">
          Configurez la tarification dynamique, le monitoring du stock et les webhooks temps réel
        </p>
      </div>

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
    </div>
  );
}
