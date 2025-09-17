import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle,
  CheckCircle,
  Lock,
  Eye,
  Settings,
  RefreshCw,
  Download,
  Users
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  user_id: string;
  event_type: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  metadata: any;
  created_at: string;
}

interface SecurityAlert {
  id: string;
  type: 'suspicious_login' | 'data_breach' | 'unauthorized_access' | 'rate_limit_exceeded';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affected_users: number;
  status: 'active' | 'investigating' | 'resolved';
  created_at: string;
}

const AdminSecurity = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      // Simulate fetching security events and alerts
      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          user_id: 'user-123',
          event_type: 'login_success',
          severity: 'info',
          description: 'Successful admin login',
          metadata: { ip: '192.168.1.1', user_agent: 'Chrome/120.0' },
          created_at: '2024-01-20T10:30:00Z'
        },
        {
          id: '2',
          user_id: 'user-456',
          event_type: 'sensitive_data_access',
          severity: 'warning',
          description: 'Customer sensitive data accessed',
          metadata: { table: 'customers', action: 'SELECT' },
          created_at: '2024-01-20T09:15:00Z'
        },
        {
          id: '3',
          user_id: 'user-789',
          event_type: 'failed_login',
          severity: 'warning',
          description: 'Multiple failed login attempts',
          metadata: { ip: '10.0.0.1', attempts: 5 },
          created_at: '2024-01-20T08:45:00Z'
        }
      ];

      const mockAlerts: SecurityAlert[] = [
        {
          id: '1',
          type: 'suspicious_login',
          severity: 'medium',
          title: 'Tentatives de connexion suspectes',
          description: 'Multiple failed login attempts from unknown IP addresses',
          affected_users: 3,
          status: 'investigating',
          created_at: '2024-01-20T08:30:00Z'
        },
        {
          id: '2',
          type: 'rate_limit_exceeded',
          severity: 'low',
          title: 'Limite de taux API dépassée',
          description: 'API rate limits exceeded for several endpoints',
          affected_users: 1,
          status: 'resolved',
          created_at: '2024-01-19T16:20:00Z'
        }
      ];

      setEvents(mockEvents);
      setAlerts(mockAlerts);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de sécurité",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critique</Badge>;
      case 'warning':
        return <Badge variant="secondary">Attention</Badge>;
      case 'info':
        return <Badge variant="outline">Info</Badge>;
      case 'high':
        return <Badge variant="destructive">Élevé</Badge>;
      case 'medium':
        return <Badge variant="secondary">Moyen</Badge>;
      case 'low':
        return <Badge variant="outline">Faible</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge variant="default">Résolu</Badge>;
      case 'investigating':
        return <Badge variant="secondary">En cours</Badge>;
      case 'active':
        return <Badge variant="destructive">Actif</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Centre de Sécurité</h1>
          <p className="text-muted-foreground">Surveillez et gérez la sécurité de votre plateforme</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
          <Button>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Tableau de Bord</TabsTrigger>
          <TabsTrigger value="events">Événements</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
          <TabsTrigger value="settings">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Score Sécurité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">94/100</div>
                <p className="text-xs text-muted-foreground">Excellent</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Alertes Actives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {alerts.filter(a => a.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">À traiter</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Événements 24h</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{events.length}</div>
                <p className="text-xs text-muted-foreground">Dernières 24h</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Utilisateurs Surveillés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground">Comptes actifs</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Alertes Récentes</CardTitle>
                <CardDescription>Incidents de sécurité à surveiller</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <ShieldAlert className="w-4 h-4 text-orange-500" />
                        <div>
                          <p className="font-medium text-sm">{alert.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {alert.affected_users} utilisateur(s) affecté(s)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(alert.severity)}
                        {getStatusBadge(alert.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Événements Récents</CardTitle>
                <CardDescription>Activités de sécurité en temps réel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Eye className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="font-medium text-sm">{event.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.created_at).toLocaleTimeString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      {getSeverityBadge(event.severity)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{event.description}</CardTitle>
                      <CardDescription>
                        Type: {event.event_type} • 
                        Utilisateur: {event.user_id.slice(0, 8)}... • 
                        {new Date(event.created_at).toLocaleString('fr-FR')}
                      </CardDescription>
                    </div>
                    {getSeverityBadge(event.severity)}
                  </div>
                </CardHeader>
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <CardContent>
                    <div className="bg-secondary/30 rounded-lg p-3">
                      <p className="text-sm font-medium mb-2">Métadonnées:</p>
                      <pre className="text-xs text-muted-foreground overflow-auto">
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5" />
                        {alert.title}
                      </CardTitle>
                      <CardDescription>{alert.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(alert.severity)}
                      {getStatusBadge(alert.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type d'incident</p>
                      <p className="font-semibold capitalize">{alert.type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Utilisateurs affectés</p>
                      <p className="font-semibold">{alert.affected_users}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Créée le</p>
                      <p className="font-semibold">
                        {new Date(alert.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Statut</p>
                      <p className="font-semibold capitalize">{alert.status}</p>
                    </div>
                  </div>
                  
                  {alert.status !== 'resolved' && (
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Enquêter
                      </Button>
                      <Button variant="outline" size="sm">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Résoudre
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de Sécurité</CardTitle>
              <CardDescription>Configuration des règles de sécurité</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Durée session (minutes)</label>
                  <Input placeholder="60" />
                </div>
                <div>
                  <label className="text-sm font-medium">Tentatives login max</label>
                  <Input placeholder="5" />
                </div>
                <div>
                  <label className="text-sm font-medium">Rotation clés API (jours)</label>
                  <Input placeholder="90" />
                </div>
                <div>
                  <label className="text-sm font-medium">Rétention logs (jours)</label>
                  <Input placeholder="365" />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button>
                  <Settings className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
                <Button variant="outline">
                  <Shield className="w-4 h-4 mr-2" />
                  Test Sécurité
                </Button>
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Audit Complet
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Gestion Utilisateurs</CardTitle>
              <CardDescription>Contrôles d'accès et permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border border-green-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-green-700">Utilisateurs Actifs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">1,247</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-blue-700">Administrateurs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">5</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-red-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-red-700">Comptes Bloqués</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">12</div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex gap-2">
                  <Button>
                    <Users className="w-4 h-4 mr-2" />
                    Gérer Utilisateurs
                  </Button>
                  <Button variant="outline">
                    <Lock className="w-4 h-4 mr-2" />
                    Permissions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSecurity;