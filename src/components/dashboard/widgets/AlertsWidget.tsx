import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useDashboard } from '@/hooks/useDashboard';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface AlertsWidgetProps {
  isCustomizing: boolean;
}

export function AlertsWidget({ isCustomizing }: AlertsWidgetProps) {
  const { activityEvents, isLoading } = useDashboard();
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

  // Filter activity events to show only alerts/warnings
  const alerts = activityEvents
    .filter(e => e.status === 'error' || e.status === 'warning' || e.type === 'alert')
    .slice(0, 5)
    .map(e => ({
      type: e.status === 'error' ? 'warning' : 'info',
      title: e.title,
      message: e.description || '',
      action: undefined as string | undefined,
    }));
  const alertCount = alerts.length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />;
    }
  };

  const getAlertBgColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-red-500/10 border-red-500/20';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/20';
      default:
        return 'bg-orange-500/10 border-orange-500/20';
    }
  };

  if (isLoading) {
    return (
      <Card className={isCustomizing ? 'ring-2 ring-primary/50' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              {t('alerts.title', 'Alertes')}
            </div>
            <Badge variant="destructive">...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className={isCustomizing ? 'ring-2 ring-primary/50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            {t('alerts.title', 'Alertes')}
          </div>
          <Badge variant={alertCount > 0 ? "destructive" : "secondary"}>{alertCount}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alertCount === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">{t('alerts.noAlerts', 'Aucune alerte pour le moment')}</p>
          </div>
        ) : (
          <>
            {alerts?.slice(0, 3).map((alert, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity ${getAlertBgColor(alert.type)}`}
                onClick={() => alert.action && navigate(alert.action)}
              >
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <p className="text-xs text-muted-foreground">{alert.message}</p>
                </div>
              </div>
            ))}

            {alertCount > 3 && (
              <div className="pt-2 border-t">
                <button className="text-sm text-primary hover:underline w-full text-left">
                  {t('alerts.viewAll', 'Voir toutes les alertes')} ({alertCount}) →
                </button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}