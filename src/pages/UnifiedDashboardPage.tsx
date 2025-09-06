import React from 'react';
import { UnifiedHeader } from '@/components/unified/UnifiedHeader';
import { SuppliersHub } from '@/components/suppliers/SuppliersHub';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  Globe,
  Zap,
  Settings,
  Plus,
  Activity
} from 'lucide-react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useNavigate } from 'react-router-dom';

const UnifiedDashboardPage: React.FC = () => {
  const { profile, effectivePlan, isAdmin, canAccess } = useUnifiedAuth();
  const navigate = useNavigate();

  const stats = {
    suppliers: 5,
    products: 1247,
    orders: 89,
    customers: 234,
    revenue: 15420,
    growth: 12.5
  };

  const quickActions = [
    {
      title: "Connecter un fournisseur",
      description: "Ajouter une nouvelle source de produits",
      icon: Plus,
      action: () => navigate('/suppliers'),
      color: "bg-blue-500"
    },
    {
      title: "Importer des produits",
      description: "Synchroniser votre catalogue",
      icon: Package,
      action: () => navigate('/import'),
      color: "bg-green-500"
    },
    {
      title: "Voir les commandes",
      description: "Gérer les commandes clients",
      icon: ShoppingCart,
      action: () => navigate('/orders'),
      color: "bg-orange-500"
    },
    {
      title: "Analytics",
      description: "Analyser les performances",
      icon: BarChart3,
      action: () => navigate('/analytics'),
      color: "bg-purple-500"
    }
  ];

  const getStatIcon = (type: string) => {
    switch (type) {
      case 'suppliers': return Globe;
      case 'products': return Package;
      case 'orders': return ShoppingCart;
      case 'customers': return Users;
      case 'revenue': return TrendingUp;
      default: return Activity;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <UnifiedHeader />
      
      <main className="container mx-auto py-6 space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Bonjour, {profile?.full_name || 'Utilisateur'} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Voici un aperçu de votre activité commerce aujourd'hui
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="capitalize">
              {profile?.role}
            </Badge>
            <Badge variant="default" className="capitalize">
              Plan {effectivePlan.replace('_', ' ')}
            </Badge>
            {isAdmin && (
              <Badge variant="secondary">
                Administrateur
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {Object.entries(stats).map(([key, value]) => {
            const Icon = getStatIcon(key);
            return (
              <Card key={key}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {key === 'revenue' ? 'Revenus' : key}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {key === 'revenue' ? `${value.toLocaleString()}€` : 
                     key === 'growth' ? `+${value}%` : 
                     value.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {key === 'growth' ? 'vs mois dernier' : 'Total'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Actions rapides
            </CardTitle>
            <CardDescription>
              Accédez rapidement aux fonctions les plus utilisées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" onClick={action.action}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${action.color} text-white`}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{action.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="suppliers" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers" className="mt-6">
            <SuppliersHub />
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des produits</CardTitle>
                <CardDescription>
                  Gérez votre catalogue de produits importés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">Module Produits</p>
                  <p className="text-muted-foreground mt-2">
                    Cette section sera développée prochainement
                  </p>
                  <Button className="mt-4" onClick={() => navigate('/products')}>
                    Voir les produits
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des commandes</CardTitle>
                <CardDescription>
                  Suivez et gérez toutes vos commandes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">Module Commandes</p>
                  <p className="text-muted-foreground mt-2">
                    Cette section sera développée prochainement
                  </p>
                  <Button className="mt-4" onClick={() => navigate('/orders')}>
                    Voir les commandes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Rapports</CardTitle>
                <CardDescription>
                  Analysez vos performances et tendances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">Module Analytics</p>
                  <p className="text-muted-foreground mt-2">
                    Cette section sera développée prochainement
                  </p>
                  <Button className="mt-4" onClick={() => navigate('/analytics')}>
                    Voir les analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default UnifiedDashboardPage;