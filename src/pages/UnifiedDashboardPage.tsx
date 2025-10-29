import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Settings, 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShoppingCart,
  Target,
  Zap,
  AlertCircle,
  Package
} from 'lucide-react';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { WidgetSelector } from '@/components/dashboard/WidgetSelector';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useDashboard } from '@/hooks/useDashboard';

export default function UnifiedDashboardPage() {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const { data: stats } = useDashboardStats();
  const { alerts } = useDashboard();

  const salesChange = stats?.ordersChange || 0;
  const stockPercentage = stats?.productsCount ? 98 : 0;
  const alertsCount = alerts?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <LayoutDashboard className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Tableau de Bord Unifié
                </h1>
                <p className="text-muted-foreground">
                  Vue d'ensemble complète de votre activité avec widgets personnalisables
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="gap-1">
                <Zap className="w-3 h-3" />
                Temps réel
              </Badge>
              <Button 
                variant={isCustomizing ? "default" : "outline"}
                onClick={() => setIsCustomizing(!isCustomizing)}
              >
                <Settings className="mr-2 h-4 w-4" />
                {isCustomizing ? 'Terminer' : 'Personnaliser'}
              </Button>
            </div>
          </div>

          {/* Quick Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-muted-foreground">Ventes</p>
                </div>
                <p className="text-2xl font-bold">{salesChange >= 0 ? '+' : ''}{salesChange.toFixed(1)}%</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-muted-foreground">Revenus</p>
                </div>
                <p className="text-2xl font-bold">{((stats?.monthlyRevenue || 0) / 1000).toFixed(1)}K€</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <p className="text-xs text-muted-foreground">Clients</p>
                </div>
                <p className="text-2xl font-bold">{stats?.customersCount || 0}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="h-4 w-4 text-orange-600" />
                  <p className="text-xs text-muted-foreground">Commandes</p>
                </div>
                <p className="text-2xl font-bold">{stats?.ordersCount || 0}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-yellow-600" />
                  <p className="text-xs text-muted-foreground">Produits</p>
                </div>
                <p className="text-2xl font-bold">{stats?.productsCount || 0}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-xs text-muted-foreground">Alertes</p>
                </div>
                <p className="text-2xl font-bold">{alertsCount}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Widget Selector */}
        {isCustomizing && (
          <div className="mb-6">
            <WidgetSelector />
          </div>
        )}

        {/* Dashboard Grid */}
        <DashboardGrid isCustomizing={isCustomizing} />
      </div>
    </div>
  );
}
