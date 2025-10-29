import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, Eye } from 'lucide-react';

interface AdsWidgetProps {
  isCustomizing: boolean;
}

export function AdsWidget({ isCustomizing }: AdsWidgetProps) {
  return (
    <Card className={isCustomizing ? 'ring-2 ring-primary/50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Publicités
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-blue-600" />
              <p className="text-xs text-muted-foreground">Impressions</p>
            </div>
            <p className="text-xl font-bold">124.5K</p>
            <p className="text-xs text-green-600">+18%</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <p className="text-xs text-muted-foreground">Clics</p>
            </div>
            <p className="text-xl font-bold">8.2K</p>
            <p className="text-xs text-green-600">+24%</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">CTR</span>
            <span className="font-semibold">6.6%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">CPC</span>
            <span className="font-semibold">0.42€</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">ROAS</span>
            <span className="font-semibold text-green-600">4.2x</span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Campagnes actives</p>
            <span className="font-semibold">12</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Données simulées</p>
        </div>
      </CardContent>
    </Card>
  );
}
