import { useState, useEffect } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, CheckCircle, XCircle, Clock, Bell } from 'lucide-react';
import { TimeRange } from '@/hooks/useDashboardConfig';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AlertsWidgetAdvancedProps {
  timeRange: TimeRange;
  settings: Record<string, unknown>;
  lastRefresh: Date;
}

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  created_at: string;
  acknowledged: boolean;
}

export function AlertsWidgetAdvanced({ timeRange, settings, lastRefresh }: AlertsWidgetAdvancedProps) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [user, lastRefresh]);

  async function loadAlerts() {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('active_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setAlerts((data || []).map(d => ({
        id: d.id,
        title: d.title,
        message: d.message || '',
        severity: (d.severity as 'info' | 'warning' | 'error') || 'info',
        created_at: d.created_at || new Date().toISOString(),
        acknowledged: d.acknowledged || false,
      })));
    } catch (e) {
      console.error('Failed to load alerts:', e);
    } finally {
      setIsLoading(false);
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'error':
        return <Badge variant="destructive" className="text-xs">Critique</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="text-xs">Attention</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Info</Badge>;
    }
  };

  if (isLoading) {
    return (
      <CardContent className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </CardContent>
    );
  }

  const criticalCount = alerts.filter(a => a.severity === 'error').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  return (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Bell className="h-5 w-5 text-red-500" />
            </div>
            <span>Alertes</span>
          </div>
          <div className="flex gap-1">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-xs">{criticalCount}</Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="secondary" className="text-xs">{warningCount}</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground">Aucune alerte active</p>
          </div>
        ) : (
          <ScrollArea className="h-[180px]">
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg"
                >
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{alert.title}</p>
                      {getSeverityBadge(alert.severity)}
                    </div>
                    {alert.message && (
                      <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(alert.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </>
  );
}
