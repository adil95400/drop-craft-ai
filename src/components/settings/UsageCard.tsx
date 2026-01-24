import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Package, Key, HardDrive, Clock } from "lucide-react";

interface UsageItem {
  label: string;
  current: number;
  limit: number;
  unit?: string;
  icon: React.ElementType;
}

interface UsageCardProps {
  planName: string;
  trialDaysLeft?: number;
  renewalDate?: string;
  productCount: number;
  productLimit: number;
  apiCallsCount: number;
  apiCallsLimit: number;
  storageUsedMB: number;
  storageLimitMB: number;
}

export function UsageCard({
  planName,
  trialDaysLeft,
  renewalDate,
  productCount,
  productLimit,
  apiCallsCount,
  apiCallsLimit,
  storageUsedMB,
  storageLimitMB,
}: UsageCardProps) {
  const usageItems: UsageItem[] = [
    {
      label: 'Produits',
      current: productCount,
      limit: productLimit,
      icon: Package,
    },
    {
      label: 'Appels API',
      current: apiCallsCount,
      limit: apiCallsLimit,
      icon: Key,
    },
    {
      label: 'Stockage',
      current: storageUsedMB,
      limit: storageLimitMB,
      unit: 'MB',
      icon: HardDrive,
    },
  ];

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-primary';
  };

  return (
    <Card className="border-border bg-card shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Usage du plan</CardTitle>
              <CardDescription className="text-xs">Ce mois-ci</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-primary">{planName}</Badge>
            {trialDaysLeft !== undefined && trialDaysLeft > 0 && (
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                <Clock className="mr-1 h-3 w-3" />
                {trialDaysLeft}j d'essai
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {usageItems.map((item) => {
          const percentage = Math.min((item.current / item.limit) * 100, 100);
          const displayCurrent = item.unit ? `${item.current.toFixed(1)}${item.unit}` : item.current;
          const displayLimit = item.unit ? `${item.limit}${item.unit}` : item.limit;
          
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                </div>
                <span className="text-muted-foreground">
                  {displayCurrent} / {displayLimit}
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={percentage} 
                  className="h-2"
                />
                {percentage >= 90 && (
                  <span className="absolute right-0 -top-5 text-xs text-destructive font-medium">
                    {Math.round(percentage)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {renewalDate && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Prochain renouvellement : <span className="font-medium text-foreground">{renewalDate}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
