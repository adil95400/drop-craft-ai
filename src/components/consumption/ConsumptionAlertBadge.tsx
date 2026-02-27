/**
 * Badge d'alerte de consommation - s'affiche dans le header
 */

import { useState } from 'react';
import { Bell, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger } from
'@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConsumptionTracking, ConsumptionAlert } from '@/hooks/useConsumptionTracking';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { cn } from '@/lib/utils';

const ALERT_STYLES = {
  warning_10: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    textColor: 'text-yellow-700 dark:text-yellow-400',
    borderColor: 'border-yellow-200 dark:border-yellow-800'
  },
  warning_5: {
    icon: AlertTriangle,
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    textColor: 'text-orange-700 dark:text-orange-400',
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
  exhausted: {
    icon: XCircle,
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    textColor: 'text-red-700 dark:text-red-400',
    borderColor: 'border-red-200 dark:border-red-800'
  },
  reset: {
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    textColor: 'text-green-700 dark:text-green-400',
    borderColor: 'border-green-200 dark:border-green-800'
  }
};

interface AlertItemProps {
  alert: ConsumptionAlert;
  onDismiss: (id: string) => void;
  onRead: (id: string) => void;
}

function AlertItem({ alert, onDismiss, onRead }: AlertItemProps) {
  const style = ALERT_STYLES[alert.alert_type] || ALERT_STYLES.warning_10;
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'p-3 rounded-lg border mb-2 transition-all cursor-pointer hover:shadow-sm',
        style.bgColor,
        style.borderColor,
        !alert.is_read && 'ring-2 ring-primary/20'
      )}
      onClick={() => onRead(alert.id)}>

      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5', style.textColor)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', style.textColor)}>
            {alert.message}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              {alert.current_usage} / {alert.limit_value} utilisés
            </span>
            <span className="text-xs text-muted-foreground">
              •
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(alert.id);
          }}>

          <XCircle className="h-3 w-3" />
        </Button>
      </div>
    </div>);

}

export function ConsumptionAlertBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const { alerts, unreadCount, markAlertRead, dismissAlert } = useConsumptionTracking();

  const hasAlerts = unreadCount > 0;
  const hasCriticalAlerts = alerts.some((a) => a.alert_type === 'exhausted');

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        

















      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Alertes de consommation</h4>
            {hasAlerts &&
            <Badge variant="secondary">{unreadCount} non lues</Badge>
            }
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          {alerts.length === 0 ?
          <div className="p-6 text-center text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">Aucune alerte</p>
              <p className="text-xs">Vos quotas sont en bonne santé</p>
            </div> :

          <div className="p-3">
              {alerts.map((alert) =>
            <AlertItem
              key={alert.id}
              alert={alert}
              onDismiss={dismissAlert}
              onRead={markAlertRead} />

            )}
            </div>
          }
        </ScrollArea>
        <div className="p-3 border-t bg-muted/30">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              setIsOpen(false);
              window.location.href = '/dashboard/consumption';
            }}>

            Voir tous les détails
          </Button>
        </div>
      </PopoverContent>
    </Popover>);

}