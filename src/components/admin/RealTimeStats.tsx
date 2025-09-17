import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  Zap, 
  Database, 
  RefreshCcw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

interface RealTimeMetrics {
  connectedUsers: number;
  systemLoad: number;
  errorRate: number;
  responseTime: number;
  databaseConnections: number;
  activeProcesses: number;
}

export const RealTimeStats: React.FC = () => {
  const { user } = useUnifiedAuth();
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    connectedUsers: 0,
    systemLoad: 0,
    errorRate: 0,
    responseTime: 0,
    databaseConnections: 0,
    activeProcesses: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchRealTimeMetrics = async () => {
    try {
      setLoading(true);
      
      // Simuler des métriques en temps réel (à remplacer par de vrais appels API)
      const mockMetrics: RealTimeMetrics = {
        connectedUsers: Math.floor(Math.random() * 50) + 10,
        systemLoad: Math.random() * 100,
        errorRate: Math.random() * 5,
        responseTime: Math.floor(Math.random() * 500) + 50,
        databaseConnections: Math.floor(Math.random() * 20) + 5,
        activeProcesses: Math.floor(Math.random() * 30) + 15
      };

      setMetrics(mockMetrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erreur lors du chargement des métriques:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealTimeMetrics();
    
    // Actualisation automatique toutes les 30 secondes
    const interval = setInterval(fetchRealTimeMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (value: number, threshold: number) => {
    if (value < threshold * 0.6) return 'text-green-600';
    if (value < threshold * 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (value: number, threshold: number) => {
    if (value < threshold * 0.6) return <Badge variant="secondary" className="bg-green-100 text-green-800">Optimal</Badge>;
    if (value < threshold * 0.8) return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Attention</Badge>;
    return <Badge variant="destructive">Critique</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Métriques Temps Réel</h3>
          <p className="text-sm text-muted-foreground">
            Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchRealTimeMetrics}
          disabled={loading}
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Connectés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.connectedUsers}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">Sessions actives</p>
              {getStatusBadge(metrics.connectedUsers, 100)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Charge Système</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.systemLoad, 100)}`}>
              {metrics.systemLoad.toFixed(1)}%
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">Utilisation CPU/Mémoire</p>
              {getStatusBadge(metrics.systemLoad, 100)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'Erreur</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.errorRate, 5)}`}>
              {metrics.errorRate.toFixed(2)}%
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">Erreurs/Requêtes</p>
              {getStatusBadge(metrics.errorRate, 5)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps de Réponse</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.responseTime, 1000)}`}>
              {metrics.responseTime}ms
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">Latence moyenne</p>
              {getStatusBadge(metrics.responseTime, 1000)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connexions DB</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.databaseConnections}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">Connexions actives</p>
              {getStatusBadge(metrics.databaseConnections, 50)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processus Actifs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeProcesses}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">Tâches en cours</p>
              {getStatusBadge(metrics.activeProcesses, 100)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};