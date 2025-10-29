import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface InventoryWidgetProps {
  isCustomizing: boolean;
}

export function InventoryWidget({ isCustomizing }: InventoryWidgetProps) {
  return (
    <Card className={isCustomizing ? 'ring-2 ring-primary/50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Inventaire
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Taux de disponibilité</p>
          <p className="text-2xl font-bold text-green-600">98%</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">En stock</span>
            </div>
            <Badge variant="secondary">342</Badge>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-orange-500/10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm">Stock bas</span>
            </div>
            <Badge variant="secondary">12</Badge>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm">Rupture</span>
            </div>
            <Badge variant="secondary">3</Badge>
          </div>
        </div>

        <div className="pt-2 border-t text-sm text-muted-foreground">
          <p>Prochaine réception: <span className="font-semibold">Dans 2 jours</span></p>
        </div>
      </CardContent>
    </Card>
  );
}
