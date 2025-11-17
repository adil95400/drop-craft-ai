import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStorePerformanceAnalytics } from '@/hooks/useMultiStoreAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package } from 'lucide-react';

export function MultiStorePerformance() {
  const { data: analytics, isLoading } = useStorePerformanceAnalytics();

  if (isLoading) {
    return <div className="text-muted-foreground">Chargement des analyses...</div>;
  }

  if (!analytics || analytics.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">Aucune donnée d'analyse disponible.</p>
      </Card>
    );
  }

  const revenueData = analytics.map(a => ({
    name: a.store_name || a.store_identifier || 'Store',
    revenue: Number(a.total_revenue),
    orders: a.total_orders,
  }));

  const performanceData = analytics.map(a => ({
    name: a.store_name || a.store_identifier || 'Store',
    score: Number(a.performance_score),
    margin: Number(a.profit_margin),
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {analytics.slice(0, 4).map((store) => (
          <Card key={store.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{store.store_name}</p>
                <p className="text-2xl font-bold">{Number(store.total_revenue).toFixed(2)}€</p>
                <p className="text-xs text-muted-foreground">{store.total_orders} commandes</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="revenue" className="w-full">
        <TabsList>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="metrics">Métriques</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Comparaison des Revenus</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenus (€)" />
                <Bar dataKey="orders" fill="hsl(var(--secondary))" name="Commandes" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Scores de Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" name="Score" />
                <Line type="monotone" dataKey="margin" stroke="hsl(var(--secondary))" name="Marge (%)" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analytics.map((store) => (
              <Card key={store.id} className="p-4">
                <h4 className="font-semibold mb-3">{store.store_name}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Panier moyen:</span>
                    <span className="font-medium">{Number(store.avg_order_value).toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conversion:</span>
                    <span className="font-medium">{Number(store.conversion_rate).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Marge:</span>
                    <span className="font-medium">{Number(store.profit_margin).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CAC:</span>
                    <span className="font-medium">{Number(store.customer_acquisition_cost).toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">LTV:</span>
                    <span className="font-medium">{Number(store.customer_lifetime_value).toFixed(2)}€</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
