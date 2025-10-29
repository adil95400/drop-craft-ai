import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryOverview } from '@/components/inventory/InventoryOverview';
import { PredictionsDashboard } from '@/components/inventory/PredictionsDashboard';
import { StockAlerts } from '@/components/inventory/StockAlerts';
import { RestockSuggestions } from '@/components/inventory/RestockSuggestions';
import { Package, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';

export default function InventoryPredictorPage() {
  return (
    <>
      <Helmet>
        <title>Smart Inventory Predictor - Prédictions IA & Gestion Stock</title>
        <meta name="description" content="Prédisez vos besoins en stock avec l'IA : alertes automatiques, suggestions de réapprovisionnement et analyse des tendances" />
      </Helmet>
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Smart Inventory Predictor</h1>
            <p className="text-muted-foreground mt-2">
              Gérez votre stock intelligemment avec des prédictions IA et des alertes automatiques
            </p>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Stock
              </TabsTrigger>
              <TabsTrigger value="predictions" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Prédictions
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Alertes
              </TabsTrigger>
              <TabsTrigger value="restock" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Réappro
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <InventoryOverview />
            </TabsContent>

            <TabsContent value="predictions" className="mt-6">
              <PredictionsDashboard />
            </TabsContent>

            <TabsContent value="alerts" className="mt-6">
              <StockAlerts />
            </TabsContent>

            <TabsContent value="restock" className="mt-6">
              <RestockSuggestions />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}