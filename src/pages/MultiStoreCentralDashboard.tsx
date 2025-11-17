import { useState } from 'react';
import { useUnifiedStores } from '@/hooks/useUnifiedStores';
import { StoreSelector } from '@/components/stores/multi-store/StoreSelector';
import { StoreComparisonTable } from '@/components/stores/multi-store/StoreComparisonTable';
import { CrossStoreInventoryView } from '@/components/stores/multi-store/CrossStoreInventoryView';
import { StoreCreationWizard } from '@/components/stores/multi-store/StoreCreationWizard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Store, BarChart3, Package } from 'lucide-react';

export default function MultiStoreCentralDashboard() {
  const { stats, isLoadingStats } = useUnifiedStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string>();
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Multi-Boutiques</h1>
          <p className="text-muted-foreground mt-1">
            Gérez et comparez toutes vos boutiques
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StoreSelector
            selectedStoreId={selectedStoreId}
            onStoreChange={setSelectedStoreId}
          />
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Boutique
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <Store className="h-4 w-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="comparison">
            <BarChart3 className="h-4 w-4 mr-2" />
            Comparaison
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="h-4 w-4 mr-2" />
            Inventaire
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {isLoadingStats ? (
            <div className="text-center py-12 text-muted-foreground">
              Chargement...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm opacity-90">Boutiques Totales</span>
                    <Store className="h-5 w-5" />
                  </div>
                  <p className="text-3xl font-bold">{stats.length}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm opacity-90">Boutiques Actives</span>
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <p className="text-3xl font-bold">
                    {stats.filter((s) => s.is_active).length}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm opacity-90">Intégrations</span>
                    <Package className="h-5 w-5" />
                  </div>
                  <p className="text-3xl font-bold">
                    {stats.reduce((sum, s) => sum + s.total_integrations, 0)}
                  </p>
                </div>
              </div>
              <StoreComparisonTable stats={stats} />
            </>
          )}
        </TabsContent>

        <TabsContent value="comparison">
          <StoreComparisonTable stats={stats} />
        </TabsContent>

        <TabsContent value="inventory">
          <CrossStoreInventoryView />
        </TabsContent>
      </Tabs>

      {/* Creation Wizard */}
      <StoreCreationWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
