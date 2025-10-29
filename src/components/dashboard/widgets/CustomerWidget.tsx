import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, UserPlus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface CustomerWidgetProps {
  isCustomizing: boolean;
}

export function CustomerWidget({ isCustomizing }: CustomerWidgetProps) {
  return (
    <Card className={isCustomizing ? 'ring-2 ring-primary/50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Clients
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Clients</p>
            <p className="text-2xl font-bold">1,284</p>
          </div>
          <Progress value={75} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-green-600">
              <UserPlus className="h-3 w-3" />
              <p className="text-xs">Nouveaux</p>
            </div>
            <p className="text-xl font-bold">127</p>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-blue-600">
              <TrendingUp className="h-3 w-3" />
              <p className="text-xs">Actifs</p>
            </div>
            <p className="text-xl font-bold">892</p>
            <p className="text-xs text-muted-foreground">30 derniers jours</p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Taux de rétention</span>
            <span className="font-semibold text-green-600">94%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
