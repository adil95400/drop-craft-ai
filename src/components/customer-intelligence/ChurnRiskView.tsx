import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCustomerBehavior } from '@/hooks/useCustomerBehavior';
import { AlertTriangle, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export function ChurnRiskView() {
  const { analyses, getChurnRiskLevel } = useCustomerBehavior();

  const riskLevels = {
    critical: analyses.filter(a => (a.churn_probability || 0) >= 75),
    high: analyses.filter(a => (a.churn_probability || 0) >= 50 && (a.churn_probability || 0) < 75),
    medium: analyses.filter(a => (a.churn_probability || 0) >= 25 && (a.churn_probability || 0) < 50),
    low: analyses.filter(a => (a.churn_probability || 0) < 25),
  };

  const avgChurn = analyses.length > 0
    ? Math.round(analyses.reduce((sum, a) => sum + (a.churn_probability || 0), 0) / analyses.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analyse du Risque de Churn</h2>
      </div>

      {/* Risk Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-950/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Critique</p>
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">{riskLevels.critical.length}</p>
          <p className="text-xs text-muted-foreground mt-1">≥75% risque</p>
        </Card>

        <Card className="p-6 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Élevé</p>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-orange-600">{riskLevels.high.length}</p>
          <p className="text-xs text-muted-foreground mt-1">50-74% risque</p>
        </Card>

        <Card className="p-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Moyen</p>
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-yellow-600">{riskLevels.medium.length}</p>
          <p className="text-xs text-muted-foreground mt-1">25-49% risque</p>
        </Card>

        <Card className="p-6 border-green-200 bg-green-50 dark:bg-green-950/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Faible</p>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">{riskLevels.low.length}</p>
          <p className="text-xs text-muted-foreground mt-1">&lt;25% risque</p>
        </Card>
      </div>

      {/* Average Churn */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Risque de Churn Moyen</h3>
          <Badge variant={avgChurn >= 50 ? 'destructive' : 'secondary'}>
            {avgChurn}%
          </Badge>
        </div>
        <Progress value={avgChurn} className="h-3" />
      </Card>

      {/* High Risk Customers */}
      {riskLevels.critical.length > 0 && (
        <Card className="p-6 border-red-200">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Clients à Risque Critique ({riskLevels.critical.length})
          </h3>
          <div className="space-y-3">
            {riskLevels.critical.map((customer) => (
              <div key={customer.id} className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">
                      {customer.customer_name || customer.customer_email}
                    </p>
                    <p className="text-sm text-muted-foreground">{customer.customer_email}</p>
                  </div>
                  <Badge variant="destructive">{customer.churn_probability}%</Badge>
                </div>
                
                <Progress value={customer.churn_probability} className="h-2 mb-3" />
                
                <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground">Score:</span>{' '}
                    <span className="font-medium">{customer.behavioral_score}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Segment:</span>{' '}
                    <span className="font-medium">{customer.customer_segment}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Commandes:</span>{' '}
                    <span className="font-medium">{customer.total_orders}</span>
                  </div>
                </div>

                {customer.recommended_actions && Array.isArray(customer.recommended_actions) && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Actions Urgentes:</p>
                    <ul className="space-y-1">
                      {customer.recommended_actions.slice(0, 2).map((action: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground">
                          • {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* High Risk Customers */}
      {riskLevels.high.length > 0 && (
        <Card className="p-6 border-orange-200">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Clients à Risque Élevé ({riskLevels.high.length})
          </h3>
          <div className="grid gap-3">
            {riskLevels.high.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">
                    {customer.customer_name || customer.customer_email}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-muted-foreground">
                      Score: {customer.behavioral_score}
                    </span>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">
                      {customer.customer_segment}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="destructive">{customer.churn_probability}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}