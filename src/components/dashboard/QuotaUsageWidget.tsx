import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gauge, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import { useQuotaDashboard, getQuotaLabel } from '@/hooks/useQuotaDashboard';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_COLORS: Record<string, string> = {
  ok: 'bg-emerald-500',
  warning: 'bg-amber-500',
  critical: 'bg-orange-500',
  exceeded: 'bg-destructive',
};

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  ok: { label: 'OK', variant: 'secondary' },
  warning: { label: 'Attention', variant: 'outline' },
  critical: { label: 'Critique', variant: 'destructive' },
  exceeded: { label: 'Dépassée', variant: 'destructive' },
};

export function QuotaUsageWidget() {
  const { data, isLoading } = useQuotaDashboard();

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </Card>
    );
  }

  if (!data) return null;

  const hasIssues = data.items.some(i => i.status === 'critical' || i.status === 'exceeded');

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Utilisation des quotas</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">{data.plan}</Badge>
          {hasIssues && <AlertTriangle className="h-4 w-4 text-destructive" />}
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        <span>{data.total_actions_this_month} actions ce mois-ci</span>
      </div>

      <div className="space-y-4">
        {data.items.map((item) => {
          const isUnlimited = item.limit === -1;
          const badgeInfo = STATUS_BADGE[item.status];

          return (
            <div key={item.quota_key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{getQuotaLabel(item.quota_key)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {isUnlimited ? `${item.current_usage} / ∞` : `${item.current_usage} / ${item.limit}`}
                  </span>
                  {!isUnlimited && (
                    <Badge variant={badgeInfo.variant} className="text-xs">
                      {badgeInfo.label}
                    </Badge>
                  )}
                </div>
              </div>
              {!isUnlimited && (
                <Progress
                  value={Math.min(100, item.percentage)}
                  className="h-2"
                />
              )}
            </div>
          );
        })}
      </div>

      {data.items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucune donnée de quota disponible
        </p>
      )}

      {hasIssues && (
        <div className="mt-4 pt-4 border-t">
          <Button
            size="sm"
            className="w-full"
            onClick={() => (window.location.href = '/dashboard/subscription')}
          >
            <Zap className="h-4 w-4 mr-2" />
            Upgrader mon plan
          </Button>
        </div>
      )}
    </Card>
  );
}
