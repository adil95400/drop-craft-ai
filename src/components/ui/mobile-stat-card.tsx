import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MobileStatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: number;
  trendLabel?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Carte de statistiques optimisée pour mobile
 * Affichage compact sur mobile, étendu sur desktop
 */
export function MobileStatCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-primary',
  trend,
  trendLabel,
  onClick,
  className,
}: MobileStatCardProps) {
  return (
    <Card 
      className={cn(
        "transition-all duration-200 card-mobile",
        onClick && "cursor-pointer hover:shadow-lg hover:scale-105 active:scale-95",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="p-2 sm:p-4 pb-1 sm:pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate pr-2">
            {title}
          </CardTitle>
          {Icon && (
            <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0", iconColor)} />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-4 pt-0">
        <div className="text-lg sm:text-2xl font-bold truncate">{value}</div>
        {(trend !== undefined || trendLabel) && (
          <p className="text-[9px] sm:text-xs text-muted-foreground mt-1 line-clamp-1">
            {trend !== undefined && (
              <span className={cn(
                trend >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
            )}
            {trendLabel && <span className="hidden sm:inline ml-1">{trendLabel}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface MobileStatGridProps {
  children: React.ReactNode;
  cols?: 2 | 3 | 4 | 6;
  className?: string;
}

/**
 * Grille responsive pour les cartes de statistiques
 */
export function MobileStatGrid({ 
  children, 
  cols = 4,
  className 
}: MobileStatGridProps) {
  const gridClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  };
  
  return (
    <div className={cn(
      "grid gap-2 sm:gap-4",
      gridClasses[cols],
      className
    )}>
      {children}
    </div>
  );
}
