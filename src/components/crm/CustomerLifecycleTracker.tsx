/**
 * Sprint 19: Customer Lifecycle Tracker
 * Visual lifecycle stages with transition tracking
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UserPlus, ShoppingCart, Repeat, Crown, UserX, ArrowRight } from 'lucide-react';

interface LifecycleStage {
  id: string;
  name: string;
  icon: React.ElementType;
  count: number;
  percentage: number;
  color: string;
}

interface CustomerLifecycleTrackerProps {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  repeatCustomers: number;
  vipCustomers: number;
  atRiskCustomers: number;
}

export function CustomerLifecycleTracker({
  totalCustomers,
  newCustomers,
  activeCustomers,
  repeatCustomers,
  vipCustomers,
  atRiskCustomers,
}: CustomerLifecycleTrackerProps) {
  const total = totalCustomers || 1;

  const stages: LifecycleStage[] = [
    { id: 'new', name: 'Nouveaux', icon: UserPlus, count: newCustomers, percentage: (newCustomers / total) * 100, color: 'bg-blue-500' },
    { id: 'active', name: 'Actifs', icon: ShoppingCart, count: activeCustomers, percentage: (activeCustomers / total) * 100, color: 'bg-green-500' },
    { id: 'repeat', name: 'Récurrents', icon: Repeat, count: repeatCustomers, percentage: (repeatCustomers / total) * 100, color: 'bg-purple-500' },
    { id: 'vip', name: 'VIP', icon: Crown, count: vipCustomers, percentage: (vipCustomers / total) * 100, color: 'bg-yellow-500' },
    { id: 'at-risk', name: 'À risque', icon: UserX, count: atRiskCustomers, percentage: (atRiskCustomers / total) * 100, color: 'bg-red-500' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Cycle de vie client</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Funnel visualization */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {stages.map((stage, i) => {
            const Icon = stage.icon;
            return (
              <div key={stage.id} className="flex items-center">
                <div className="text-center min-w-[80px]">
                  <div className={`w-10 h-10 rounded-full ${stage.color}/10 flex items-center justify-center mx-auto mb-1`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium">{stage.name}</p>
                  <p className="text-lg font-bold">{stage.count}</p>
                  <Badge variant="outline" className="text-[10px]">{stage.percentage.toFixed(0)}%</Badge>
                </div>
                {i < stages.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground mx-1 flex-shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Bar breakdown */}
        <div className="space-y-2">
          {stages.map(stage => (
            <div key={stage.id} className="flex items-center gap-3">
              <span className="text-xs w-20 text-muted-foreground">{stage.name}</span>
              <Progress value={stage.percentage} className="h-2 flex-1" />
              <span className="text-xs font-medium w-10 text-right">{stage.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
