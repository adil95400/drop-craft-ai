import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Shield, 
  Database, 
  Clock, 
  CheckCircle, 
  XCircle,
  Bell,
  X,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SystemAlert {
  id: string;
  type: 'security' | 'performance' | 'maintenance' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  resolved: boolean;
  actionRequired: boolean;
}

export const SystemAlertsPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRealAlerts = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch real data from multiple sources
      const [securityEvents, activeAlerts, importJobs] = await Promise.all([
        supabase
          .from('security_events')
          .select('*')
          .in('severity', ['critical', 'warning', 'error'])
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('active_alerts')
          .select('*, alert_rules(*)')
          .eq('status', 'triggered')
          .order('triggered_at', { ascending: false })
          .limit(10),
        supabase
          .from('import_jobs')
          .select('*')
          .eq('status', 'failed')
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const realAlerts: SystemAlert[] = [];

      // Convert security events
      if (securityEvents.data) {
        securityEvents.data.forEach((event: any) => {
          realAlerts.push({
            id: `sec_${event.id}`,
            type: 'security',
            severity: event.severity === 'critical' ? 'critical' : event.severity === 'error' ? 'high' : 'medium',
            title: event.event_type || 'Événement de sécurité',
            description: event.description || 'Événement de sécurité détecté',
            timestamp: new Date(event.created_at),
            resolved: false,
            actionRequired: event.severity === 'critical'
          });
        });
      }

      // Convert active alerts
      if (activeAlerts.data) {
        activeAlerts.data.forEach((alert: any) => {
          realAlerts.push({
            id: `alert_${alert.id}`,
            type: 'performance',
            severity: 'high',
            title: alert.alert_rules?.name || 'Alerte de monitoring',
            description: `Valeur actuelle: ${alert.current_value} - Seuil dépassé`,
            timestamp: new Date(alert.triggered_at),
            resolved: false,
            actionRequired: true
          });
        });
      }

      // Convert failed import jobs
      if (importJobs.data) {
        importJobs.data.forEach((job: any) => {
          realAlerts.push({
            id: `import_${job.id}`,
            type: 'error',
            severity: 'medium',
            title: 'Échec d\'importation',
            description: `Import ${job.source_type || 'inconnu'} échoué: ${job.errors?.[0] || 'Erreur inconnue'}`,
            timestamp: new Date(job.created_at),
            resolved: false,
            actionRequired: true
          });
        });
      }

      // Sort by timestamp
      realAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setAlerts(realAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRealAlerts();

    // Real-time subscription
    const channel = supabase
      .channel('system-alerts-panel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security_events' }, () => {
        fetchRealAlerts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_alerts' }, () => {
        fetchRealAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRealAlerts]);

  const getSeverityColor = (severity: SystemAlert['severity']) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getTypeIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'security': return <Shield className="h-4 w-4" />;
      case 'performance': return <AlertTriangle className="h-4 w-4" />;
      case 'maintenance': return <Clock className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      // If it's an active_alerts item, update in database
      if (alertId.startsWith('alert_')) {
        const realId = alertId.replace('alert_', '');
        await supabase
          .from('active_alerts')
          .update({ status: 'resolved', resolved_at: new Date().toISOString() })
          .eq('id', realId);
      }

      // Log the action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('security_events').insert({
          user_id: user.id,
          event_type: 'alert_resolved',
          severity: 'info',
          description: `Admin resolved system alert ${alertId}`,
          metadata: { alert_id: alertId }
        });
      }

      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, resolved: true } : alert
        )
      );

      toast({
        title: "Alerte résolue",
        description: "L'alerte a été marquée comme résolue"
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: "Erreur",
        description: "Impossible de résoudre l'alerte",
        variant: "destructive"
      });
    }
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const unresolvedAlerts = alerts.filter(alert => !alert.resolved);
  const criticalAlerts = unresolvedAlerts.filter(alert => alert.severity === 'critical');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertes Système
            {unresolvedAlerts.length > 0 && (
              <Badge variant="destructive">
                {unresolvedAlerts.length}
              </Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchRealAlerts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-2">Chargement des alertes...</p>
          </div>
        ) : unresolvedAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground">Aucune alerte système active</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tous les systèmes fonctionnent normalement
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {criticalAlerts.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>{criticalAlerts.length} alerte(s) critique(s)</strong> nécessitent une attention immédiate
                </AlertDescription>
              </Alert>
            )}

            {unresolvedAlerts.map((alert) => (
              <div key={alert.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                      {getTypeIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.actionRequired && (
                      <Button size="sm" onClick={() => resolveAlert(alert.id)}>
                        Résoudre
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
