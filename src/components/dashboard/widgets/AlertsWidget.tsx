import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AlertsWidgetProps {
  isCustomizing: boolean;
}

export function AlertsWidget({ isCustomizing }: AlertsWidgetProps) {
  return (
    <Card className={isCustomizing ? 'ring-2 ring-primary/50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Alertes
          </div>
          <Badge variant="destructive">3</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Stock critique</p>
            <p className="text-xs text-muted-foreground">3 produits en rupture de stock</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Budget publicitaire</p>
            <p className="text-xs text-muted-foreground">85% du budget mensuel utilisé</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Analyse disponible</p>
            <p className="text-xs text-muted-foreground">Nouvelles insights clients prêtes</p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <button className="text-sm text-primary hover:underline w-full text-left">
            Voir toutes les alertes →
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
