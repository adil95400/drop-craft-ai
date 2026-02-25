import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryOverview } from '@/components/inventory/InventoryOverview';
import { PredictionsDashboard } from '@/components/inventory/PredictionsDashboard';
import { StockAlerts } from '@/components/inventory/StockAlerts';
import { RestockSuggestions } from '@/components/inventory/RestockSuggestions';
import {
  Package, TrendingUp, AlertTriangle, RefreshCw, Calendar,
  BarChart3
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

function StockForecastCalendar() {
  const { data: predictions = [] } = useQuery({
    queryKey: ['stock-forecast-calendar'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('inventory_predictions' as any)
        .select('*, inventory_items(product_name)')
        .eq('user_id', user.id)
        .order('recommended_reorder_date', { ascending: true })
        .limit(30);
      return data || [];
    },
  });

  // Generate forecast timeline (next 30 days)
  const forecastData = (() => {
    const days = [];
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      const dateStr = date.toISOString().slice(0, 10);

      // Count stockouts predicted on this day
      const stockouts = predictions.filter((p: any) => {
        if (!p.days_until_stockout) return false;
        const stockoutDate = new Date(p.prediction_date);
        stockoutDate.setDate(stockoutDate.getDate() + p.days_until_stockout);
        return stockoutDate.toISOString().slice(0, 10) === dateStr;
      }).length;

      // Count reorders on this day
      const reorders = predictions.filter((p: any) =>
        p.recommended_reorder_date?.slice(0, 10) === dateStr
      ).length;

      days.push({
        date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        ruptures: stockouts,
        réappros: reorders,
      });
    }
    return days;
  })();

  const upcomingReorders = predictions
    .filter((p: any) => p.recommended_reorder_date)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          Calendrier Prévisionnel Stock
        </h2>
        <p className="text-muted-foreground mt-1">
          Vue des 30 prochains jours : ruptures et réapprovisionnements prévus
        </p>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Prévisions à 30 jours</h3>
        {forecastData.some(d => d.ruptures > 0 || d.réappros > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" interval={4} />
              <YAxis className="text-xs" />
              <Tooltip />
              <Area
                type="stepAfter"
                dataKey="ruptures"
                name="Ruptures Prévues"
                stroke="hsl(var(--destructive))"
                fill="hsl(var(--destructive))"
                fillOpacity={0.2}
              />
              <Area
                type="stepAfter"
                dataKey="réappros"
                name="Réappros Planifiés"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-12">
            Aucune prédiction disponible. Générez des analyses IA dans l'onglet Prédictions.
          </p>
        )}
      </Card>

      {upcomingReorders.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Prochains Réapprovisionnements
          </h3>
          <div className="space-y-3">
            {upcomingReorders.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                <div>
                  <p className="font-medium text-sm">
                    {p.inventory_items?.product_name || 'Produit'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Demande prévue : {p.predicted_demand} unités
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">
                    {new Date(p.recommended_reorder_date).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'short'
                    })}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {p.days_until_stockout}j avant rupture
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default function InventoryPredictorPage() {
  return (
    <>
      <Helmet>
        <title>Smart Inventory Predictor — Prédictions IA</title>
        <meta name="description" content="Prédisez vos besoins en stock avec l'IA : alertes, suggestions et calendrier prévisionnel" />
      </Helmet>
      <ChannablePageWrapper
        title="Smart Inventory Predictor"
        description="Gérez votre stock intelligemment avec des prédictions IA et des alertes automatiques"
        heroImage="stock"
        badge={{ label: 'Prédictions IA', icon: TrendingUp }}
      >
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Stock
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Prédictions
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendrier
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

          <TabsContent value="calendar" className="mt-6">
            <StockForecastCalendar />
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <StockAlerts />
          </TabsContent>

          <TabsContent value="restock" className="mt-6">
            <RestockSuggestions />
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
