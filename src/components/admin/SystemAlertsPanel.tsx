import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

  const generateMockAlerts = (): SystemAlert[] => {
    const mockAlerts: SystemAlert[] = [
      {
        id: '1',
        type: 'security',
        severity: 'high',
        title: 'Tentatives de connexion suspectes détectées',
        description: '15 tentatives de connexion échouées depuis la même IP dans les 10 dernières minutes',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        resolved: false,
        actionRequired: true
      },
      {
        id: '2',
        type: 'performance',
        severity: 'medium',
        title: 'Latence élevée détectée',
        description: 'Le temps de réponse moyen dépasse 2 secondes sur les requêtes API',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        resolved: false,
        actionRequired: true
      },
      {
        id: '3',
        type: 'maintenance',
        severity: 'low',
        title: 'Sauvegarde automatique programmée',
        description: 'Sauvegarde complète de la base de données prévue dans 2 heures',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        resolved: false,
        actionRequired: false
      },
      {
        id: '4',
        type: 'error',
        severity: 'critical',
        title: 'Erreur de synchronisation fournisseur',
        description: 'La synchronisation avec le fournisseur BigBuy a échoué - 500 produits non synchronisés',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        resolved: false,
        actionRequired: true
      }
    ];

    return mockAlerts;
  };

  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true);
      // Simuler un délai de chargement
      setTimeout(() => {
        setAlerts(generateMockAlerts());
        setLoading(false);
      }, 1000);
    };

    loadAlerts();
  }, []);

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
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );

    // Logger l'action
    await supabase.from('security_events').insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      event_type: 'alert_resolved',
      severity: 'info',
      description: `Admin resolved system alert ${alertId}`,
      metadata: { alert_id: alertId }
    });
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const unresolvedAlerts = alerts.filter(alert => !alert.resolved);
  const criticalAlerts = unresolvedAlerts.filter(alert => alert.severity === 'critical');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Alertes Système
          {unresolvedAlerts.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {unresolvedAlerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Chargement des alertes...</p>
          </div>
        ) : unresolvedAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground">Aucune alerte système active</p>
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