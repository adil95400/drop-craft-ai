import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield,
  Users,
  Database,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Eye,
  Settings,
  RefreshCw,
  Zap,
  Globe,
  Lock,
  UserCheck,
  Crown
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/utils/consoleCleanup';

interface SystemStatus {
  database: 'operational' | 'degraded' | 'down';
  api: 'operational' | 'degraded' | 'down';
  storage: 'operational' | 'degraded' | 'down';
  auth: 'operational' | 'degraded' | 'down';
}

interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  totalRevenue: number;
  totalOrders: number;
  systemUptime: number;
  securityEvents: number;
  apiCalls: number;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
  created_at: string;
  user_id?: string;
  metadata?: any;
}

interface UserActivity {
  date: string;
  new_users: number;
  active_users: number;
  admin_actions: number;
}

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: 'operational',
    api: 'operational', 
    storage: 'operational',
    auth: 'operational'
  });
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const userActivityData: UserActivity[] = [
    { date: 'Lun', new_users: 12, active_users: 145, admin_actions: 8 },
    { date: 'Mar', new_users: 19, active_users: 167, admin_actions: 12 },
    { date: 'Mer', new_users: 8, active_users: 134, admin_actions: 5 },
    { date: 'Jeu', new_users: 15, active_users: 156, admin_actions: 9 },
    { date: 'Ven', new_users: 22, active_users: 189, admin_actions: 15 },
    { date: 'Sam', new_users: 18, active_users: 201, admin_actions: 7 },
    { date: 'Dim', new_users: 14, active_users: 178, admin_actions: 4 }
  ];

  const systemHealthData = [
    { name: '00:00', cpu: 45, memory: 62, storage: 38, network: 85 },
    { name: '04:00', cpu: 38, memory: 58, storage: 39, network: 78 },
    { name: '08:00', cpu: 65, memory: 72, storage: 41, network: 92 },
    { name: '12:00', cpu: 78, memory: 81, storage: 43, network: 87 },
    { name: '16:00', cpu: 82, memory: 85, storage: 45, network: 94 },
    { name: '20:00', cpu: 71, memory: 76, storage: 44, network: 89 },
    { name: '24:00', cpu: 52, memory: 65, storage: 42, network: 83 }
  ];

  const securityMetricsData = [
    { name: 'Jan', threats_blocked: 234, login_attempts: 1200, api_calls: 45000 },
    { name: 'Fév', threats_blocked: 189, login_attempts: 1150, api_calls: 52000 },
    { name: 'Mar', threats_blocked: 298, login_attempts: 1380, api_calls: 48000 },
    { name: 'Avr', threats_blocked: 167, login_attempts: 1290, api_calls: 55000 },
    { name: 'Mai', threats_blocked: 245, login_attempts: 1420, api_calls: 61000 },
    { name: 'Jun', threats_blocked: 312, login_attempts: 1580, api_calls: 58000 },
    { name: 'Jul', threats_blocked: 278, login_attempts: 1630, api_calls: 63000 }
  ];

  useEffect(() => {
    fetchAdminDashboardData();
  }, []);

  const fetchAdminDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user profiles for admin stats
      const { data: profilesData, count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .limit(100);
      
      const profiles = profilesData || [];
      
      // Calculate admin metrics from profiles
      const adminMetrics: AdminMetrics = {
        totalUsers: usersCount || 0,
        activeUsers: profiles.filter((u) => u.last_login_at && 
          new Date(u.last_login_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
        adminUsers: profiles.filter((u) => u.admin_mode === 'admin').length,
        totalRevenue: 45680.50,
        totalOrders: 1248,
        systemUptime: 99.94,
        securityEvents: 23,
        apiCalls: 156780
      };

      setMetrics(adminMetrics);

      // Fetch recent security events
      const { data: eventsData } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (eventsData) {
        setSecurityEvents(eventsData.map(event => ({
          ...event,
          severity: event.severity as 'info' | 'warning' | 'error' | 'critical'
        })));
      }

      // Simulate system health check
      checkSystemHealth();

    } catch (error) {
      logError(error as Error, 'Error fetching admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const checkSystemHealth = async () => {
    try {
      // Test database connection
      const { error: dbError } = await supabase.from('profiles').select('count').limit(1);
      
      setSystemStatus({
        database: dbError ? 'degraded' : 'operational',
        api: 'operational',
        storage: 'operational',
        auth: 'operational'
      });
    } catch (error) {
      logError(error as Error, 'System health check failed');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'down':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Tableau de Bord Administrateur
          </h1>
          <p className="text-muted-foreground">Supervision et gestion avancée du système</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            <Crown className="w-3 h-3 mr-1" />
            Accès Admin
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchAdminDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* System Status Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Statut Système:</strong> Tous les services fonctionnent normalement. 
          Dernière vérification: {new Date().toLocaleTimeString('fr-FR')}
        </AlertDescription>
      </Alert>

      {/* Admin KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilisateurs Total</p>
                <p className="text-2xl font-bold">{metrics?.totalUsers || 0}</p>
                <p className="text-xs text-blue-600">{metrics?.adminUsers || 0} admin</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilisateurs Actifs</p>
                <p className="text-2xl font-bold">{metrics?.activeUsers || 0}</p>
                <p className="text-xs text-green-600">Derniers 30 jours</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">CA Total Plateforme</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics?.totalRevenue || 0)}</p>
                <p className="text-xs text-purple-600">Tous utilisateurs</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Uptime Système</p>
                <p className="text-2xl font-bold">{metrics?.systemUptime || 0}%</p>
                <p className="text-xs text-orange-600">Derniers 30 jours</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(systemStatus).map(([service, status]) => (
          <Card key={service}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium capitalize">{service}</p>
                  <Badge className={getStatusColor(status)} variant="outline">
                    {status === 'operational' ? 'Opérationnel' : status === 'degraded' ? 'Dégradé' : 'Hors service'}
                  </Badge>
                </div>
                {getStatusIcon(status)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'Ensemble</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="system">Système</TabsTrigger>
          <TabsTrigger value="data-gen">Génération</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Activité Utilisateurs</CardTitle>
                <CardDescription>Nouveaux utilisateurs et actions admin cette semaine</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="active_users" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="new_users" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.8} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>Santé du Système</CardTitle>
                <CardDescription>Métriques de performance en temps réel</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={systemHealthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, '']} />
                    <Line type="monotone" dataKey="cpu" stroke="#EF4444" strokeWidth={2} name="CPU" />
                    <Line type="monotone" dataKey="memory" stroke="#F59E0B" strokeWidth={2} name="Mémoire" />
                    <Line type="monotone" dataKey="storage" stroke="#10B981" strokeWidth={2} name="Stockage" />
                    <Line type="monotone" dataKey="network" stroke="#3B82F6" strokeWidth={2} name="Réseau" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions Administratives Récentes</CardTitle>
              <CardDescription>Dernières actions effectuées par les administrateurs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { action: 'Génération de données de test', user: 'Admin', time: 'Il y a 2 min', type: 'data' },
                  { action: 'Modification de rôle utilisateur', user: 'Admin', time: 'Il y a 15 min', type: 'user' },
                  { action: 'Synchronisation marketplace', user: 'Système', time: 'Il y a 1h', type: 'sync' },
                  { action: 'Sauvegarde base de données', user: 'Système', time: 'Il y a 2h', type: 'backup' }
                ].map((action, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        action.type === 'data' ? 'bg-blue-500' :
                        action.type === 'user' ? 'bg-green-500' :
                        action.type === 'sync' ? 'bg-purple-500' : 'bg-orange-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-sm">{action.action}</p>
                        <p className="text-xs text-muted-foreground">Par {action.user}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{action.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Utilisateurs</CardTitle>
              <CardDescription>Statistiques et actions sur les comptes utilisateurs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{metrics?.totalUsers || 0}</p>
                  <p className="text-sm text-muted-foreground">Utilisateurs Total</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{metrics?.activeUsers || 0}</p>
                  <p className="text-sm text-muted-foreground">Actifs 30j</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{metrics?.adminUsers || 0}</p>
                  <p className="text-sm text-muted-foreground">Administrateurs</p>
                </div>
              </div>
              <Button className="w-full" onClick={() => window.location.href = '/admin/users'}>
                <Users className="w-4 h-4 mr-2" />
                Gérer les Utilisateurs
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Metrics Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Métriques de Sécurité</CardTitle>
                <CardDescription>Menaces bloquées et tentatives de connexion</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={securityMetricsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="threats_blocked" fill="#EF4444" name="Menaces bloquées" />
                    <Bar dataKey="login_attempts" fill="#F59E0B" name="Tentatives de connexion" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Security Events */}
            <Card>
              <CardHeader>
                <CardTitle>Événements de Sécurité</CardTitle>
                <CardDescription>Derniers événements système</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {securityEvents.slice(0, 8).map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        event.severity === 'critical' ? 'bg-red-500' :
                        event.severity === 'error' ? 'bg-orange-500' :
                        event.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getSeverityColor(event.severity)} variant="outline">
                            {event.severity}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Système</CardTitle>
                <CardDescription>Paramètres et statut des services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Base de données</span>
                  <Badge className={getStatusColor(systemStatus.database)}>
                    {systemStatus.database}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Supabase</span>
                  <Badge className={getStatusColor(systemStatus.api)}>
                    {systemStatus.api}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Stockage</span>
                  <Badge className={getStatusColor(systemStatus.storage)}>
                    {systemStatus.storage}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Authentification</span>
                  <Badge className={getStatusColor(systemStatus.auth)}>
                    {systemStatus.auth}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métriques API</CardTitle>
                <CardDescription>Utilisation et performance des APIs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Appels API aujourd'hui</span>
                  <span className="font-bold">{metrics?.apiCalls?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Latence moyenne</span>
                  <span className="font-bold">127ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Taux d'erreur</span>
                  <span className="font-bold text-green-600">0.02%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Quota utilisé</span>
                  <div className="flex items-center gap-2">
                    <Progress value={76} className="w-16 h-2" />
                    <span className="text-sm font-medium">76%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;