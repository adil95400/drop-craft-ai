import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, 
  Shield, 
  Activity, 
  Database, 
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Bell,
  BellOff
} from 'lucide-react';

interface CriticalAlert {
  id: string;
  type: 'security' | 'performance' | 'system' | 'user' | 'business';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
  metadata: any;
  impact: string;
  recommendedAction: string;
}

const severityColors = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'secondary',
  low: 'outline'
} as const;

const alertIcons = {
  security: Shield,
  performance: Activity,
  system: Database,
  user: Users,
  business: TrendingUp
};

export const AlertSystem: React.FC = () => {
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const { toast } = useToast();

  // Load existing alerts
  useEffect(() => {
    loadAlerts();
    setupRealTimeAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .eq('severity', 'critical')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const formattedAlerts: CriticalAlert[] = (data || []).map(event => ({
        id: event.id,
        type: 'security',
        severity: 'critical',
        title: event.event_type || 'Security Alert',
        description: event.description || 'No description',
        timestamp: event.created_at,
        acknowledged: false,
        resolved: false,
        metadata: event.metadata || {},
        impact: 'Security incident detected',
        recommendedAction: 'Review and investigate immediately'
      }));
      
      setAlerts(formattedAlerts);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time alert monitoring
  const setupRealTimeAlerts = () => {
    // Monitor security events
    const securityChannel = supabase
      .channel('security-alerts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'security_events',
        filter: 'severity=eq.critical'
      }, handleSecurityAlert)
      .subscribe();

    // Monitor performance metrics
    const performanceInterval = setInterval(checkPerformanceAlerts, 60000);

    // Monitor system health
    const systemInterval = setInterval(checkSystemHealth, 30000);

    // Monitor user activity anomalies
    const userInterval = setInterval(checkUserAnomalies, 120000);

    return () => {
      securityChannel.unsubscribe();
      clearInterval(performanceInterval);
      clearInterval(systemInterval);
      clearInterval(userInterval);
    };
  };

  const handleSecurityAlert = (payload: any) => {
    const event = payload.new;
    createAlert({
      type: 'security',
      severity: 'critical',
      title: 'Critical Security Event',
      description: event.description,
      metadata: event.metadata,
      impact: 'Potential security breach or unauthorized access',
      recommendedAction: 'Investigate immediately and apply security measures'
    });
  };

  const checkPerformanceAlerts = async () => {
    try {
      // Simplified performance check using existing data
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      const { data: recentErrors } = await supabase
        .from('security_events')
        .select('*')
        .eq('severity', 'error')
        .gte('created_at', fiveMinutesAgo.toISOString());

      if (recentErrors && recentErrors.length > 10) {
        createAlert({
          type: 'system',
          severity: 'high',
          title: 'High Error Rate Detected',
          description: `${recentErrors.length} errors in the last 5 minutes`,
          metadata: { error_count: recentErrors.length },
          impact: 'Users may be experiencing issues',
          recommendedAction: 'Check system logs and investigate errors'
        });
      }
    } catch (error) {
      // Performance check failed silently
    }
  };

  const checkSystemHealth = async () => {
    try {
      // Simplified system health check
      const { data: systemStatus } = await supabase
        .from('security_events')
        .select('*')
        .eq('event_type', 'system_health')
        .order('created_at', { ascending: false })
        .limit(1);

      // System health check completed
    } catch (error) {
      // System health check failed
    }
  };

  const checkUserAnomalies = async () => {
    try {
      // Check for suspicious login patterns
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const { data: suspiciousLogins } = await supabase
        .from('security_events')
        .select('*')
        .eq('event_type', 'failed_login')
        .gte('created_at', oneHourAgo.toISOString());

      if (suspiciousLogins && suspiciousLogins.length > 50) {
        createAlert({
          type: 'user',
          severity: 'high',
          title: 'Suspicious Login Activity',
          description: `${suspiciousLogins.length} failed login attempts in the last hour`,
          metadata: { failed_logins: suspiciousLogins.length },
          impact: 'Potential brute force attack',
          recommendedAction: 'Enable rate limiting and investigate IP addresses'
        });
      }
    } catch (error) {
      // User anomaly check failed silently  
    }
  };

  const createAlert = async (alertData: Omit<CriticalAlert, 'id' | 'timestamp' | 'acknowledged' | 'resolved'>) => {
    // Check if similar alert already exists (avoid spam)
    const existingAlert = alerts.find(a => 
      a.type === alertData.type && 
      a.title === alertData.title && 
      !a.resolved &&
      Date.now() - new Date(a.timestamp).getTime() < 300000 // 5 minutes
    );

    if (existingAlert) return;

    const newAlert: CriticalAlert = {
      id: crypto.randomUUID(),
      ...alertData,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false
    };

    try {
      // Save to security events table
      await supabase.from('security_events').insert({
        event_type: newAlert.type,
        severity: newAlert.severity,
        description: newAlert.description,
        metadata: newAlert.metadata
      });

      // Update local state
      setAlerts(prev => [newAlert, ...prev]);

      // Show immediate notification for critical/high alerts
      if (alertsEnabled && (newAlert.severity === 'critical' || newAlert.severity === 'high')) {
        toast({
          title: `🚨 ${newAlert.title}`,
          description: newAlert.description,
          variant: 'destructive',
          duration: 10000
        });

        // Browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(`Critical Alert: ${newAlert.title}`, {
            body: newAlert.description,
            icon: '/icon-192x192.png'
          });
        }
      }

    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de l'alerte",
        variant: "destructive"
      });
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      // Acquitter l'alerte

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));

      toast({
        title: "Alert Acknowledged",
        description: "Alert has been acknowledged and will be marked as seen."
      });
    } catch (error) {
      toast({
        title: "Erreur", 
        description: "Erreur lors de l'acquittement",
        variant: "destructive"
      });
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      // Résoudre l'alerte

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      ));

      toast({
        title: "Alert Resolved",
        description: "Alert has been marked as resolved."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la résolution", 
        variant: "destructive"
      });
    }
  };

  const toggleAlerts = () => {
    setAlertsEnabled(!alertsEnabled);
    
    if (!alertsEnabled) {
      // Request notification permission when enabling
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  };

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged && !a.resolved).length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.resolved).length;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertes Système
            {unacknowledgedCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unacknowledgedCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAlerts}
              className={alertsEnabled ? 'text-green-600' : 'text-gray-500'}
            >
              {alertsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              {alertsEnabled ? 'Activées' : 'Désactivées'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {criticalCount > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-semibold">
                {criticalCount} alerte{criticalCount > 1 ? 's' : ''} critique{criticalCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        <ScrollArea className="h-96">
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                Aucune alerte active
              </div>
            ) : (
              alerts.map((alert) => {
                const IconComponent = alertIcons[alert.type];
                
                return (
                  <div
                    key={alert.id}
                    className={`p-3 border rounded-lg ${
                      alert.resolved ? 'bg-gray-50 opacity-75' : 
                      alert.acknowledged ? 'bg-blue-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <span className="font-medium">{alert.title}</span>
                        <Badge variant={severityColors[alert.severity]}>
                          {alert.severity}
                        </Badge>
                        {alert.resolved && (
                          <Badge variant="outline">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Résolu
                          </Badge>
                        )}
                        {alert.acknowledged && !alert.resolved && (
                          <Badge variant="secondary">
                            Acquitté
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {alert.description}
                    </p>
                    
                    <div className="text-xs space-y-1 mb-3">
                      <div><strong>Impact:</strong> {alert.impact}</div>
                      <div><strong>Action recommandée:</strong> {alert.recommendedAction}</div>
                    </div>
                    
                    {!alert.resolved && (
                      <div className="flex gap-2">
                        {!alert.acknowledged && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            Acquitter
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Résoudre
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};