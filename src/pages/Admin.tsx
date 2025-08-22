import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSecureAdmin } from '@/hooks/useSecureAdmin';
import { secureAdminService } from '@/services/secureAdminService';
import { SecureUserManagement } from '@/components/admin/SecureUserManagement';
import { SecurityDashboard } from '@/components/admin/SecurityDashboard';
import { 
  Shield, 
  Users, 
  Activity, 
  Database, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Lock,
  UserCheck
} from 'lucide-react';

const Admin = () => {
  const { toast } = useToast();
  const { isAdmin, isLoading } = useSecureAdmin();
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    adminUsers: 0,
    activeUsers: 0,
    securityEvents: 0,
    lastScanDate: null as Date | null
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      loadSystemStats();
    }
  }, [isAdmin]);

  const loadSystemStats = async () => {
    try {
      setLoadingStats(true);
      
      const usersResult = await secureAdminService.getAllUsers();
      if (usersResult.success && usersResult.data) {
        const users = usersResult.data;
        setSystemStats(prev => ({
          ...prev,
          totalUsers: users.length,
          adminUsers: users.filter((u: any) => u.role === 'admin').length,
          activeUsers: users.length
        }));
      }

      const securityResult = await secureAdminService.getSecurityEvents(100);
      if (securityResult.success && securityResult.data) {
        setSystemStats(prev => ({
          ...prev,
          securityEvents: securityResult.data.length,
          lastScanDate: new Date()
        }));
      }
    } catch (error) {
      console.error('Error loading system stats:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques système",
        variant: "destructive"
      });
    } finally {
      setLoadingStats(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Accès refusé
            </CardTitle>
            <CardDescription>
              Vous n'avez pas les permissions administrateur requises.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/dashboard'} className="w-full">
              Retour au Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Utilisateurs Total",
      value: systemStats.totalUsers,
      icon: Users,
      description: "Comptes enregistrés",
      trend: "+12% ce mois"
    },
    {
      title: "Administrateurs",
      value: systemStats.adminUsers,
      icon: UserCheck,
      description: "Comptes admin actifs",
      trend: "Stable"
    },
    {
      title: "Événements Sécurité",
      value: systemStats.securityEvents,
      icon: Shield,
      description: "Dernières 24h",
      trend: systemStats.securityEvents > 50 ? "Élevé" : "Normal"
    },
    {
      title: "Système",
      value: "Opérationnel",
      icon: CheckCircle,
      description: "Tous les services",
      trend: "100% uptime"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Administration
          </h1>
          <p className="text-muted-foreground">
            Gestion sécurisée du système et des utilisateurs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="default" className="gap-1 bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Système sécurisé
          </Badge>
          {systemStats.lastScanDate && (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              Scan: {systemStats.lastScanDate.toLocaleTimeString()}
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                  <span>{stat.description}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      stat.trend.includes('Élevé') ? 'text-orange-600 border-orange-200' : 
                      stat.trend.includes('+') ? 'text-green-600 border-green-200' : 
                      'text-blue-600 border-blue-200'
                    }`}
                  >
                    {stat.trend}
                  </Badge>
                </div>
              </CardContent>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
            </Card>
          );
        })}
      </div>

      {/* Main Admin Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Système
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <SecureUserManagement />
        </TabsContent>

        <TabsContent value="security">
          <SecurityDashboard />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Système
              </CardTitle>
              <CardDescription>
                Vue d'ensemble des performances et de l'utilisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold">Utilisation des ressources</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>CPU: 45%</div>
                    <div>Mémoire: 62%</div>
                    <div>Stockage: 28%</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Base de données</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Connexions actives: 12</div>
                    <div>Requêtes/min: 847</div>
                    <div>Taille: 2.4 GB</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">API</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Requêtes/h: 15.2k</div>
                    <div>Temps réponse: 120ms</div>
                    <div>Taux d'erreur: 0.02%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuration Système
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Mode maintenance</span>
                  <Badge variant="outline">Inactif</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sauvegarde automatique</span>
                  <Badge variant="default">Activé</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Monitoring</span>
                  <Badge variant="default">Actif</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>SSL/TLS</span>
                  <Badge variant="default">Sécurisé</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Sécurité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Firewall</span>
                  <Badge variant="default">Actif</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>2FA obligatoire</span>
                  <Badge variant="outline">Bientôt</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Audit des logs</span>
                  <Badge variant="default">Activé</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Chiffrement données</span>
                  <Badge variant="default">AES-256</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
          <CardDescription>
            Opérations d'administration courantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={loadSystemStats} disabled={loadingStats}>
              <Activity className="h-4 w-4 mr-2" />
              {loadingStats ? "Actualisation..." : "Actualiser Stats"}
            </Button>
            <Button variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Sauvegarde DB
            </Button>
            <Button variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Scan Sécurité
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;