import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
  color: string;
}

export const StatCard = memo(({ label, value, change, icon: Icon, color }: StatCardProps) => {
  const isPositive = change.startsWith('+');
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:scale-105">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {label}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              <span 
                className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                  isPositive 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}
              >
                {change}
              </span>
            </div>
          </div>
          <div className={cn(
            "p-3 rounded-xl bg-gradient-to-br",
            color
          )}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';
