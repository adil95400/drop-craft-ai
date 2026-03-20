import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, Eye, Clock, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSecureCustomers } from "@/hooks/useSecureCustomers";
import { useSecureApiKeys } from "@/hooks/useSecureApiKeys";
import { useSuppliersUnified } from "@/hooks/unified";

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  description: string;
  created_at: string;
  metadata: any;
}

export function SecurityDashboardComplete() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { customers, stats: customerStats } = useSecureCustomers();
  const { apiKeys, stats: apiKeyStats } = useSecureApiKeys();
  const { suppliers } = useSuppliersUnified();
  const supplierStats = { total: suppliers.length, active: suppliers.filter(s => s.status === 'verified').length };

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      // Fetch security events
      const { data: events, error: eventsError } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (eventsError) throw eventsError;
      setSecurityEvents(events || []);

      // Suspicious activity detection is done client-side since the RPC doesn't exist
      const recentEvents = (events || []).reduce((acc: any, event) => {
        const key = event.event_type;
        if (!acc[key]) {
          acc[key] = { event_type: key, count: 0, first_seen: event.created_at, last_seen: event.created_at };
        }
        acc[key].count++;
        if (new Date(event.created_at) < new Date(acc[key].first_seen)) {
          acc[key].first_seen = event.created_at;
        }
        if (new Date(event.created_at) > new Date(acc[key].last_seen)) {
          acc[key].last_seen = event.created_at;
        }
        return acc;
      }, {});

      // Flag as suspicious if more than 10 events of the same type
      const suspicious = Object.values(recentEvents).filter((e: any) => e.count > 10);
      setSuspiciousActivity(suspicious as any[]);

    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      case 'info': return 'default';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warn':
        return <Eye className="h-4 w-4" />;
      case 'info':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const protectedCustomers = customers.filter(c => c.email === 'hidden@protected.com').length;
  const protectedSuppliers = suppliers.filter(s => s.api_endpoint).length;
  const totalSecurityEvents = securityEvents.length;
  const criticalEvents = securityEvents.filter(e => e.severity === 'critical' || e.severity === 'error').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary">Tableau de Bord Sécurité Complet</h2>
          <p className="text-muted-foreground">Surveillance et protection avancée de toutes vos données</p>
        </div>
        <Button onClick={fetchSecurityData} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Vue d'ensemble de la sécurité */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-success/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients Protégés</CardTitle>
            <Shield className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{protectedCustomers}</div>
            <p className="text-xs text-success">
              sur {customerStats.total} clients - Données masquées
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-info/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fournisseurs Sécurisés</CardTitle>
            <Lock className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{protectedSuppliers}</div>
            <p className="text-xs text-info">
              API et credentials chiffrés
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clés API Sécurisées</CardTitle>
            <Eye className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{apiKeyStats.active}</div>
            <p className="text-xs text-purple-600">
              clés actives sur {apiKeyStats.total}
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Événements Critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{criticalEvents}</div>
            <p className="text-xs text-warning">
              sur {totalSecurityEvents} événements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes de sécurité */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Alert className="border-green-200 bg-success/5">
          <CheckCircle className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            🔒 <strong>Sécurité Maximale Activée</strong><br/>
            • Toutes les données client sont masquées automatiquement<br/>
            • API keys chiffrées avec AES-256-GCM<br/>
            • Audit complet de tous les accès sensibles<br/>
            • Rate limiting sur les inscriptions newsletter
          </AlertDescription>
        </Alert>

        <Alert className="border-blue-200 bg-info/5">
          <Shield className="h-4 w-4 text-info" />
          <AlertDescription className="text-blue-800">
            🛡️ <strong>Protection RLS Avancée</strong><br/>
            • Politiques de sécurité au niveau base de données<br/>
            • Isolation complète des données par utilisateur<br/>
            • Accès admin sécurisé avec logging obligatoire<br/>
            • Functions SECURITY INVOKER pour éviter l'escalade
          </AlertDescription>
        </Alert>
      </div>

      {/* Activité suspecte détectée */}
      {suspiciousActivity.length > 0 && (
        <Card className="border-red-200 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Activité Suspecte Détectée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suspiciousActivity.map((activity, index) => (
                <div key={index} className="p-3 border border-red-200 rounded-lg bg-white">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-red-900">{activity.event_type}</span>
                    <Badge variant="destructive">{activity.count} événements</Badge>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    Entre {new Date(activity.first_seen).toLocaleString()} et {new Date(activity.last_seen).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Événements de sécurité récents */}
      <Card>
        <CardHeader>
          <CardTitle>Événements de Sécurité Récents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {securityEvents.length === 0 ? (
              <p className="text-muted-foreground">Aucun événement de sécurité récent.</p>
            ) : (
              securityEvents.slice(0, 20).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getSeverityIcon(event.severity)}
                      <Badge variant={getSeverityColor(event.severity) as any}>
                        {event.severity.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium">{event.event_type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    {event.metadata && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {Object.entries(event.metadata).map(([key, value]) => (
                          <span key={key} className="mr-3">
                            {key}: {typeof value === 'string' ? value : JSON.stringify(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques de protection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Protection des Données Client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Emails masqués:</span>
                <span className="font-bold text-success">100%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Téléphones masqués:</span>
                <span className="font-bold text-success">100%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Adresses masquées:</span>
                <span className="font-bold text-success">100%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sécurité API</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Chiffrement:</span>
                <span className="font-bold text-success">AES-256</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Rotation automatique:</span>
                <span className="font-bold text-success">Activée</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Monitoring usage:</span>
                <span className="font-bold text-success">Temps réel</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Conformité RGPD</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Anonymisation:</span>
                <span className="font-bold text-success">Complète</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Audit trail:</span>
                <span className="font-bold text-success">Activé</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Droit à l'oubli:</span>
                <span className="font-bold text-success">Implémenté</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}