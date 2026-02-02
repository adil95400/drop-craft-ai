/**
 * QuotaUsageCard - Affiche l'utilisation d'un quota spécifique
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Infinity, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface QuotaUsageCardProps {
  label: string;
  current: number;
  limit: number;
  isUnlimited: boolean;
  icon?: React.ReactNode;
  showUpgradeButton?: boolean;
  className?: string;
}

export function QuotaUsageCard({
  label,
  current,
  limit,
  isUnlimited,
  icon,
  showUpgradeButton = true,
  className
}: QuotaUsageCardProps) {
  const navigate = useNavigate();
  const percentage = isUnlimited ? 0 : Math.min(100, (current / limit) * 100);
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 95;

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {icon}
            {label}
          </CardTitle>
          {isUnlimited ? (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <Infinity className="h-3 w-3 mr-1" />
              Illimité
            </Badge>
          ) : isCritical ? (
            <Badge variant="destructive">Limite atteinte</Badge>
          ) : isWarning ? (
            <Badge variant="outline" className="border-warning text-warning">
              <TrendingUp className="h-3 w-3 mr-1" />
              {Math.round(percentage)}%
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {isUnlimited ? (
          <div className="text-2xl font-bold text-primary">
            {current.toLocaleString()}
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-1 mb-2">
              <span className={cn(
                "text-2xl font-bold",
                isCritical && "text-destructive",
                isWarning && !isCritical && "text-warning"
              )}>
                {current.toLocaleString()}
              </span>
              <span className="text-muted-foreground">
                / {limit.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={percentage} 
              className={cn(
                "h-2",
                isCritical && "[&>div]:bg-destructive",
                isWarning && !isCritical && "[&>div]:bg-warning"
              )} 
            />
            <p className="text-xs text-muted-foreground mt-2">
              {limit - current > 0 
                ? `${(limit - current).toLocaleString()} restants` 
                : 'Limite atteinte'}
            </p>
          </>
        )}
        
        {showUpgradeButton && isCritical && !isUnlimited && (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3 w-full"
            onClick={() => navigate('/dashboard/subscription')}
          >
            Augmenter ma limite
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
