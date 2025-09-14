import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/integrations/supabase/client';
import {
  Shield,
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Activity,
  Database,
  Zap,
  Eye,
  Settings,
  Lock,
  RefreshCw,
  Download,
  Upload,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  BarChart3
} from 'lucide-react';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalSuppliers: number;
  systemLoad: number;
  databaseSize: number;
  apiCalls: number;
  errorRate: number;
  securityEvents: number;
  onlineUsers: number;
}

interface RecentActivity {
  id: string;
  type: 'user_signup' | 'order_placed' | 'security_alert' | 'system_backup' | 'import_completed';
  message: string;
  user: string;
  time: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export const SuperAdminDashboard = () => {
  const { isAdmin, loading: authLoading } = useAdminRole();
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalSuppliers: 0,
    systemLoad: 0,
    databaseSize: 0,
    apiCalls: 0,
    errorRate: 0,
    securityEvents: 0,
    onlineUsers: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin && !authLoading) {
      loadDashboardData();
      const interval = setInterval(loadDashboardData, 30000); // Actualiser toutes les 30s
      return () => clearInterval(interval);
    }
  }, [isAdmin, authLoading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Charger les métriques système
      const metricsData = await loadSystemMetrics();
      setMetrics(metricsData);

      // Charger les activités récentes
      const activitiesData = await loadRecentActivities();
      setRecentActivities(activitiesData);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du tableau de bord",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSystemMetrics = async (): Promise<SystemMetrics> => {
    // Simuler le chargement de métriques réelles
    // En production, ces données viendraient de votre API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      totalUsers: Math.floor(Math.random() * 5000) + 15000,
      activeUsers: Math.floor(Math.random() * 1000) + 2500,
      totalOrders: Math.floor(Math.random() * 10000) + 45000,
      totalRevenue: Math.floor(Math.random() * 500000) + 2500000,
      totalProducts: Math.floor(Math.random() * 50000) + 150000,
      totalSuppliers: Math.floor(Math.random() * 100) + 350,
      systemLoad: Math.floor(Math.random() * 40) + 45,
      databaseSize: Math.random() * 2 + 3.5,
      apiCalls: Math.floor(Math.random() * 500000) + 1200000,
      errorRate: Math.random() * 0.03 + 0.01,
      securityEvents: Math.floor(Math.random() * 20) + 5,
      onlineUsers: Math.floor(Math.random() * 200) + 150
    };
  };

  const loadRecentActivities = async (): Promise<RecentActivity[]> => {
    // Simuler le chargement d'activités récentes
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
      {
        id: '1',
        type: 'user_signup',
        message: 'Nouveau compte utilisateur créé',
        user: 'marie.dupont@email.com',
        time: 'Il y a 2 min',
        severity: 'success'
      },
      {
        id: '2',
        type: 'order_placed',
        message: 'Commande importante passée',
        user: 'Client Premium #1247',
        time: 'Il y a 5 min',
        severity: 'info'
      },
      {
        id: '3',
        type: 'security_alert',
        message: 'Tentative de connexion suspecte détectée',
        user: 'Système de sécurité',
        time: 'Il y a 8 min',
        severity: 'warning'
      },
      {
        id: '4',
        type: 'import_completed',
        message: 'Import de 2,500 produits terminé',
        user: 'Fournisseur TechCorp',
        time: 'Il y a 12 min',
        severity: 'success'
      },
      {
        id: '5',
        type: 'system_backup',
        message: 'Sauvegarde système automatique réussie',
        user: 'Système',
        time: 'Il y a 15 min',
        severity: 'info'
      }
    ];
  };

  const runSystemAction = async (action: string) => {
    toast({
      title: "Action en cours",
      description: `Exécution de: ${action}...`
    });

    // Simuler l'exécution de l'action
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast({
      title: "Action terminée",
      description: `${action} exécuté avec succès`
    });

    // Recharger les données après l'action
    loadDashboardData();
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_signup': return Users;
      case 'order_placed': return ShoppingCart;
      case 'security_alert': return Shield;
      case 'import_completed': return Upload;
      case 'system_backup': return Database;
      default: return Activity;
    }
  };

  const getSeverityColor = (severity: RecentActivity['severity']) => {
    switch (severity) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Accès restreint</h3>
            <p className="text-muted-foreground">Vous devez être administrateur pour accéder à cette page.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Contrôle total du système • Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadDashboardData} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            {metrics.onlineUsers} utilisateurs en ligne
          </Badge>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+12.5%</span>
              <span>{metrics.activeUsers.toLocaleString()} actifs</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{(metrics.totalRevenue / 1000000).toFixed(1)}M</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+18.2%</span>
              <span>ce mois</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits Catalogue</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.totalProducts / 1000).toFixed(0)}K</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Upload className="h-3 w-3 text-blue-600" />
              <span>+3.2K cette semaine</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Santé Système</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(100 - metrics.systemLoad).toFixed(1)}%</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Tous services opérationnels</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets principaux */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="system">Système</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activités récentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activité en Temps Réel
                </CardTitle>
                <CardDescription>
                  Dernières actions et événements système
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className={`p-1.5 rounded-full bg-muted ${getSeverityColor(activity.severity)}`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">{activity.user}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Performance système */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Système
                </CardTitle>
                <CardDescription>
                  Métriques de performance en temps réel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Charge CPU</span>
                    <span className={metrics.systemLoad > 80 ? 'text-red-600' : metrics.systemLoad > 60 ? 'text-yellow-600' : 'text-green-600'}>
                      {metrics.systemLoad.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={metrics.systemLoad} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Base de données</span>
                    <span>{metrics.databaseSize.toFixed(1)} GB</span>
                  </div>
                  <Progress value={35} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Taux d'erreur API</span>
                    <span className={metrics.errorRate > 0.05 ? 'text-red-600' : metrics.errorRate > 0.02 ? 'text-yellow-600' : 'text-green-600'}>
                      {(metrics.errorRate * 100).toFixed(2)}%
                    </span>
                  </div>
                  <Progress value={metrics.errorRate * 1000} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Appels API (24h)</span>
                    <span>{(metrics.apiCalls / 1000).toFixed(0)}K</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  État des Services
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Principale</span>
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Opérationnel
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Base de données</span>
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Opérationnel
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Stockage</span>
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Opérationnel
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Edge Functions</span>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Maintenance
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Statistiques Réseau
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Appels API/h</span>
                  <span className="font-medium">{(metrics.apiCalls / 24).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Bande passante</span>
                  <span className="font-medium">2.4 GB/h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Latence moyenne</span>
                  <span className="font-medium">45ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Disponibilité</span>
                  <span className="font-medium text-green-600">99.97%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Tâches Système
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Dernière sauvegarde</span>
                  <span className="font-medium">Il y a 2h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Nettoyage logs</span>
                  <span className="font-medium">Il y a 6h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Optimisation DB</span>
                  <span className="font-medium">Il y a 1j</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Scan sécurité</span>
                  <span className="font-medium">Il y a 3h</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Événements de Sécurité
                </CardTitle>
                <CardDescription>
                  {metrics.securityEvents} événements dans les dernières 24h
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Tentatives de connexion suspectes</span>
                    </div>
                    <Badge variant="destructive">3</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">Accès données sensibles</span>
                    </div>
                    <Badge variant="secondary">12</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Connexions réussies</span>
                    </div>
                    <Badge variant="default">847</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Statut Sécurité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Authentification 2FA</span>
                  <Badge variant="default">Activée</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Chiffrement données</span>
                  <Badge variant="default">AES-256</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Certificats SSL</span>
                  <Badge variant="default">Valides</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pare-feu</span>
                  <Badge variant="default">Actif</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Audit logs</span>
                  <Badge variant="default">Complets</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => runSystemAction('Sauvegarde système')}
            >
              <Database className="h-6 w-6" />
              <span className="text-sm">Backup BDD</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => runSystemAction('Scan de sécurité')}
            >
              <Shield className="h-6 w-6" />
              <span className="text-sm">Scan Sécurité</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => runSystemAction('Optimisation base de données')}
            >
              <Settings className="h-6 w-6" />
              <span className="text-sm">Optimiser DB</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => runSystemAction('Export des données')}
            >
              <Download className="h-6 w-6" />
              <span className="text-sm">Export Données</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => runSystemAction('Nettoyage des logs')}
            >
              <RefreshCw className="h-6 w-6" />
              <span className="text-sm">Nettoyer Logs</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => runSystemAction('Redémarrage services')}
            >
              <Zap className="h-6 w-6" />
              <span className="text-sm">Restart Services</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => runSystemAction('Test de performance')}
            >
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">Test Perf</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => runSystemAction('Vérification intégrité')}
            >
              <CheckCircle className="h-6 w-6" />
              <span className="text-sm">Check Intégrité</span>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};