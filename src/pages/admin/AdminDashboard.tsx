import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { useRealAdminStats } from '@/hooks/useRealAdminStats';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  Upload,
  TrendingUp,
  TrendingDown,
  Activity,
  Database,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Zap,
  Globe
} from 'lucide-react';

export const AdminDashboard = () => {
  const { toast } = useToast();
  const { isAdmin, profile } = useEnhancedAuth();
  const { stats: systemStats, isLoading: loading, refetch, getRecentActivities } = useRealAdminStats();
  const [recentActivitiesData, setRecentActivitiesData] = useState<any[]>([]);

  useEffect(() => {
    if (isAdmin) {
      loadRecentActivities();
    }
  }, [isAdmin]);

  const loadRecentActivities = async () => {
    try {
      const activities = await getRecentActivities();
      setRecentActivitiesData(activities);
    } catch (error) {
      console.error('Error loading recent activities:', error);
    }
  };

  const dashboardCards = [
    {
      title: "Utilisateurs Total",
      value: systemStats.totalUsers,
      icon: Users,
      description: "Comptes enregistrés",
      trend: "+8.2%",
      trendUp: true
    },
    {
      title: "Utilisateurs Actifs",
      value: systemStats.activeUsers,
      icon: Activity,
      description: "Dernières 24h",
      trend: "+12.5%",
      trendUp: true
    },
    {
      title: "Commandes Total",
      value: systemStats.totalOrders,
      icon: ShoppingCart,
      description: "Toutes commandes",
      trend: "+5.1%",
      trendUp: true
    },
    {
      title: "Chiffre d'Affaires",
      value: `${(systemStats.revenue / 1000).toFixed(0)}k€`,
      icon: TrendingUp,
      description: "Ce mois",
      trend: "+15.3%",
      trendUp: true
    },
    {
      title: "Produits Catalogue",
      value: systemStats.productsCount,
      icon: Package,
      description: "Produits actifs",
      trend: "+2.8%",
      trendUp: true
    },
    {
      title: "Fournisseurs",
      value: systemStats.suppliersCount,
      icon: Users,
      description: "Connectés",
      trend: "+1.2%",
      trendUp: true
    },
    {
      title: "Jobs d'Import",
      value: systemStats.importJobs,
      icon: Upload,
      description: "Aujourd'hui",
      trend: "+8 aujourd'hui",
      trendUp: true
    },
    {
      title: "Santé Système",
      value: `${systemStats.systemHealth}%`,
      icon: CheckCircle,
      description: "Uptime",
      trend: "99.9%",
      trendUp: true
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup': return Users;
      case 'order_placed': return ShoppingCart;
      case 'import_completed': return Upload;
      case 'security_alert': return Shield;
      case 'system_backup': return Database;
      default: return Activity;
    }
  };

  const recentActivities = recentActivitiesData.length > 0 ? recentActivitiesData : [
    {
      type: "user_signup",
      message: "Nouvel utilisateur inscrit",
      user: "Utilisateur",
      time: "Il y a 2 min",
      icon: Users,
      color: "text-green-600"
    },
    {
      type: "order_placed",
      message: "Nouvelle commande",
      user: "Client",
      time: "Il y a 5 min",
      icon: ShoppingCart,
      color: "text-blue-600"
    }
  ];

  const quickActions = [
    {
      title: "Import Produits",
      description: "Lancer un nouvel import",
      icon: Upload,
      href: "/admin/import",
      color: "bg-blue-500"
    },
    {
      title: "Gérer Fournisseurs",
      description: "Ajouter ou modifier",
      icon: Users,
      href: "/admin/suppliers",
      color: "bg-green-500"
    },
    {
      title: "Analytics",
      description: "Voir les performances",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "bg-purple-500"
    },
    {
      title: "Sécurité",
      description: "Contrôles système",
      icon: Shield,
      href: "/admin/security",
      color: "bg-red-500"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                  <span>{card.description}</span>
                  <div className="flex items-center gap-1">
                    {card.trendUp ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                    <span className={card.trendUp ? 'text-green-600' : 'text-red-600'}>
                      {card.trend}
                    </span>
                  </div>
                </div>
              </CardContent>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activité Récente
              </CardTitle>
              <CardDescription>
                Dernières actions système et utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`p-1.5 rounded-full bg-muted ${activity.color}`}>
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
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Actions Rapides
              </CardTitle>
              <CardDescription>
                Accès direct aux fonctions principales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start gap-3 h-auto p-4"
                      onClick={() => window.location.href = action.href}
                    >
                      <div className={`p-2 rounded ${action.color} text-white`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{action.title}</div>
                        <div className="text-xs text-muted-foreground">{action.description}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                État Système
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Status</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Opérationnel
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Base de données</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connectée
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cache Redis</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Actif
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Dernière sauvegarde</span>
                <Badge variant="outline" className="gap-1">
                  <Clock className="w-3 h-3" />
                  Il y a 2h
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};