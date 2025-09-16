import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, ShoppingCart, Package, Euro } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: 'green' | 'red' | 'blue' | 'orange';
}

const MetricCard = ({ title, value, change, icon, color }: MetricCardProps) => {
  const colorClasses = {
    green: 'text-green-600 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
    red: 'text-red-600 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    orange: 'text-orange-600 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
  };

  return (
    <Card className={`${colorClasses[color]} border`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <div className="flex items-center gap-1">
              {change > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
              <span className="text-xs text-muted-foreground">ce mois</span>
            </div>
          </div>
          <div className="p-2 bg-background/50 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const RealisticMetrics = () => {
  const [metrics, setMetrics] = useState({
    revenue: '€24,357',
    orders: 142,
    customers: 1,
    products: 3787,
    revenueChange: 12.5,
    ordersChange: -2.3,
    customersChange: 8.1,
    productsChange: 15.7
  });

  // Simulate realistic data fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        revenue: `€${(Math.random() * 10000 + 20000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
        orders: Math.floor(Math.random() * 50 + 120),
        customers: Math.floor(Math.random() * 200 + 800),
        revenueChange: (Math.random() * 30 - 5), // -5% to +25%
        ordersChange: (Math.random() * 20 - 10), // -10% to +10%
        customersChange: (Math.random() * 15 - 5), // -5% to +10%
        productsChange: (Math.random() * 25 + 5) // +5% to +30%
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Chiffre d'affaires"
        value={metrics.revenue}
        change={Number(metrics.revenueChange.toFixed(1))}
        color="green"
        icon={<Euro className="h-5 w-5" />}
      />
      <MetricCard
        title="Commandes"
        value={metrics.orders}
        change={Number(metrics.ordersChange.toFixed(1))}
        color="blue"
        icon={<ShoppingCart className="h-5 w-5" />}
      />
      <MetricCard
        title="Clients"
        value={metrics.customers}
        change={Number(metrics.customersChange.toFixed(1))}
        color="orange"
        icon={<Users className="h-5 w-5" />}
      />
      <MetricCard
        title="Produits"
        value={metrics.products}
        change={Number(metrics.productsChange.toFixed(1))}
        color="green"
        icon={<Package className="h-5 w-5" />}
      />
    </div>
  );
};