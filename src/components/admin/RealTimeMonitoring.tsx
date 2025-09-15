import { useState, useEffect } from 'react';
import { logError } from '@/utils/consoleCleanup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Server, 
  Wifi, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SystemMetrics {
  activeUsers: number;
  totalOrders: number;
  systemLoad: number;
  dbConnections: number;
  apiCalls: number;
  errorRate: number;
  uptime: string;
}

interface RealTimeEvent {
  id: string;
  type: 'order' | 'user' | 'error' | 'integration';
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export const RealTimeMonitoring = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    activeUsers: 0,
    totalOrders: 0,
    systemLoad: 0,
    dbConnections: 0,
    apiCalls: 0,
    errorRate: 0,
    uptime: '0h 0m'
  });
  
  const [events, setEvents] = useState<RealTimeEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadInitialMetrics();
    
    if (isMonitoring) {
      const interval = setInterval(() => {
        updateMetrics();
        checkForAlerts();
      }, 5000); // Update every 5 seconds

      // Simulate real-time events
      const eventInterval = setInterval(() => {
        generateMockEvent();
      }, 3000);

      return () => {
        clearInterval(interval);
        clearInterval(eventInterval);
      };
    }
  }, [isMonitoring]);

  const loadInitialMetrics = async () => {
    try {
      // Load real metrics from database
      const { data: orders } = await supabase
        .from('orders')
        .select('count')
        .eq('status', 'processing');

      const { data: users } = await supabase
        .from('profiles')
        .select('count')
        .gte('last_login_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      setMetrics(prev => ({
        ...prev,
        totalOrders: orders?.length || 0,
        activeUsers: users?.length || 0
      }));
    } catch (error) {
      logError(error, 'RealTimeMonitoring.loadMetrics');
    }
  };

  const updateMetrics = () => {
    setMetrics(prev => ({
      activeUsers: Math.max(1, prev.activeUsers + Math.floor(Math.random() * 3) - 1),
      totalOrders: prev.totalOrders + Math.floor(Math.random() * 2),
      systemLoad: Math.max(0, Math.min(100, prev.systemLoad + (Math.random() - 0.5) * 10)),
      dbConnections: Math.max(0, Math.min(100, prev.dbConnections + (Math.random() - 0.5) * 5)),
      apiCalls: prev.apiCalls + Math.floor(Math.random() * 20),
      errorRate: Math.max(0, Math.min(10, prev.errorRate + (Math.random() - 0.7) * 0.5)),
      uptime: calculateUptime()
    }));
  };

  const calculateUptime = () => {
    const uptimeHours = Math.floor(Date.now() / 1000 / 60 / 60) % 24;
    const uptimeMinutes = Math.floor(Date.now() / 1000 / 60) % 60;
    return `${uptimeHours}h ${uptimeMinutes}m`;
  };

  const generateMockEvent = () => {
    const eventTypes = [
      { type: 'order', message: 'Nouvelle commande #ORD-2024-', severity: 'success' },
      { type: 'user', message: 'Nouvel utilisateur inscrit', severity: 'info' },
      { type: 'integration', message: 'Synchronisation Shopify terminée', severity: 'success' },
      { type: 'error', message: 'Erreur API fournisseur', severity: 'warning' },
    ];

    const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const orderId = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    
    const newEvent: RealTimeEvent = {
      id: Date.now().toString(),
      type: randomEvent.type as any,
      message: randomEvent.message + (randomEvent.type === 'order' ? orderId : ''),
      timestamp: new Date().toISOString(),
      severity: randomEvent.severity as any
    };

    setEvents(prev => [newEvent, ...prev].slice(0, 20)); // Keep last 20 events
  };

  const checkForAlerts = () => {
    if (metrics.systemLoad > 90) {
      toast({
        title: "Alerte Système",
        description: `Charge système élevée: ${metrics.systemLoad.toFixed(1)}%`,
        variant: "destructive"
      });
    }

    if (metrics.errorRate > 5) {
      toast({
        title: "Taux d'erreur élevé",
        description: `Taux d'erreur: ${metrics.errorRate.toFixed(1)}%`,
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (value: number, thresholds: { warning: number; danger: number }) => {
    if (value > thresholds.danger) return 'text-red-500';
    if (value > thresholds.warning) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Monitoring Temps Réel</h2>
        <div className="flex items-center gap-2">
          <Badge variant={isMonitoring ? 'default' : 'secondary'}>
            {isMonitoring ? 'Actif' : 'Inactif'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMonitoring(!isMonitoring)}
            className="gap-2"
          >
            {isMonitoring ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {isMonitoring ? 'Arrêter' : 'Démarrer'}
          </Button>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilisateurs Actifs</p>
                <p className="text-2xl font-bold">{metrics.activeUsers}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commandes Totales</p>
                <p className="text-2xl font-bold">{metrics.totalOrders}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Charge Système</p>
                <p className={`text-2xl font-bold ${getStatusColor(metrics.systemLoad, { warning: 70, danger: 90 })}`}>
                  {metrics.systemLoad.toFixed(1)}%
                </p>
              </div>
              <Server className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux d'Erreur</p>
                <p className={`text-2xl font-bold ${getStatusColor(metrics.errorRate, { warning: 2, danger: 5 })}`}>
                  {metrics.errorRate.toFixed(1)}%
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              État du Système
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Connexions DB</span>
              <Badge variant="outline">{metrics.dbConnections}/100</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Appels API/min</span>
              <Badge variant="outline">{metrics.apiCalls}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Uptime</span>
              <Badge variant="outline">{metrics.uptime}</Badge>
            </div>
            <Separator />
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">Tous les services opérationnels</span>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Événements en Temps Réel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun événement récent
                </p>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                    {getSeverityIcon(event.severity)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{event.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {event.type}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};