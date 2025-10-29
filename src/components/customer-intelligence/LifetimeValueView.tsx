import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCustomerBehavior } from '@/hooks/useCustomerBehavior';
import { TrendingUp, DollarSign } from 'lucide-react';

export function LifetimeValueView() {
  const { analyses, formatLifetimeValue } = useCustomerBehavior();

  const sortedByLTV = [...analyses]
    .filter(a => a.lifetime_value)
    .sort((a, b) => (b.lifetime_value || 0) - (a.lifetime_value || 0));

  const totalLTV = sortedByLTV.reduce((sum, a) => sum + (a.lifetime_value || 0), 0);
  const avgLTV = sortedByLTV.length > 0 ? totalLTV / sortedByLTV.length : 0;
  const topCustomers = sortedByLTV.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Valeur Vie Client (LTV)</h2>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">LTV Totale</p>
              <p className="text-3xl font-bold">{formatLifetimeValue(totalLTV)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-primary opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">LTV Moyenne</p>
              <p className="text-3xl font-bold">{formatLifetimeValue(avgLTV)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Clients Analysés</p>
              <p className="text-3xl font-bold">{sortedByLTV.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Customers */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Top 10 Clients par LTV</h3>
        <div className="space-y-3">
          {topCustomers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune donnée de valeur vie disponible
            </p>
          ) : (
            topCustomers.map((customer, index) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-4 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">
                      {customer.customer_name || customer.customer_email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {customer.customer_segment}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {customer.total_orders} commandes
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {formatLifetimeValue(customer.lifetime_value)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Score: {customer.behavioral_score}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* All Customers */}
      {sortedByLTV.length > 10 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Tous les Clients</h3>
          <div className="space-y-2">
            {sortedByLTV.slice(10).map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {customer.customer_name || customer.customer_email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {customer.total_orders} commandes • {customer.customer_segment}
                  </p>
                </div>
                <p className="text-lg font-semibold">
                  {formatLifetimeValue(customer.lifetime_value)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}