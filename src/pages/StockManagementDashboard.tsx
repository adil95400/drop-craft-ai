import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StockPredictionsDashboard } from '@/components/stores/stock/StockPredictionsDashboard';
import { ReorderSuggestions } from '@/components/stores/stock/ReorderSuggestions';
import { StockAlertsPanel } from '@/components/stores/stock/StockAlertsPanel';
import { TrendingUp, Package, Bell } from 'lucide-react';

export default function StockManagementDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestion Intelligente des Stocks
        </h1>
        <p className="text-muted-foreground mt-1">
          Prédictions IA, réassort automatique et alertes en temps réel
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="predictions">
            <TrendingUp className="h-4 w-4 mr-2" />
            Prédictions
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            <Package className="h-4 w-4 mr-2" />
            Réassort
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="h-4 w-4 mr-2" />
            Alertes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <StockPredictionsDashboard />
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <ReorderSuggestions />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <StockAlertsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
