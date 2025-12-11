import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';

export default function StockManagement() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const stockAlerts = [
    { product: "iPhone 14 Pro", stock: 2, status: "critical", supplier: "TechDist" },
    { product: "Samsung Galaxy S23", stock: 8, status: "low", supplier: "MobilePlus" },
    { product: "MacBook Air M2", stock: 15, status: "normal", supplier: "AppleDist" },
  ];

  const statsCards = [
    { label: 'Stock Total', value: '1,247', icon: Package, color: 'text-muted-foreground', bgColor: 'bg-muted', trend: '+12% vs mois dernier', link: '/stock' },
    { label: 'En Rupture', value: '23', icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-500/10', trend: 'Action requise', link: '/stock/alerts' },
    { label: 'Valeur Stock', value: '€89,432', icon: TrendingUp, color: 'text-green-500', bgColor: 'bg-green-500/10', trend: '+8.2% ce mois', link: '/analytics' },
    { label: 'Rotation', value: '4.2x', icon: RefreshCw, color: 'text-blue-500', bgColor: 'bg-blue-500/10', trend: 'Rotation annuelle', link: '/stock' },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.loading('Synchronisation des stocks...');
    await new Promise(resolve => setTimeout(resolve, 1200));
    setIsRefreshing(false);
    toast.dismiss();
    toast.success('Stocks synchronisés avec succès');
  };

  const handleConfigure = (feature: string) => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 800)),
      { loading: `Configuration de ${feature}...`, success: `${feature} configuré`, error: 'Erreur' }
    );
  };

  const handleReorder = (product: string) => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1000)),
      { loading: `Réapprovisionnement de ${product}...`, success: `Commande passée pour ${product}`, error: 'Erreur' }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-purple-50 dark:from-background dark:via-background dark:to-background">
      <PageHeader
        title="Gestion des Stocks"
        description="Surveillez et gérez vos niveaux de stock en temps réel"
        badge="Smart Inventory"
      />

      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-24 md:pb-8">
        {/* Header Actions */}
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Synchroniser
          </Button>
        </div>

        {/* Stats Cards - Clickable */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-3 sm:p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </Card>
            ))
          ) : (
            statsCards.map((stat, idx) => (
              <Card 
                key={idx} 
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
                onClick={() => navigate(stat.link)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
                  <CardTitle className="text-[10px] sm:text-sm font-medium">{stat.label}</CardTitle>
                  <div className={cn("p-1.5 rounded-lg", stat.bgColor)}>
                    <stat.icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", stat.color)} />
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-lg sm:text-2xl font-bold">{stat.value}</div>
                  <p className="text-[9px] sm:text-xs text-muted-foreground">{stat.trend}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Alertes de Stock</CardTitle>
              <CardDescription>Produits nécessitant une attention immédiate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockAlerts.map((alert, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleReorder(alert.product)}
                  >
                    <div className="flex items-center space-x-3">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm sm:text-base">{alert.product}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{alert.supplier}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm">{alert.stock}</span>
                      <Badge 
                        variant={
                          alert.status === 'critical' ? 'destructive' : 
                          alert.status === 'low' ? 'secondary' : 'default'
                        }
                        className="text-xs"
                      >
                        {alert.status === 'critical' ? 'Critique' : 
                         alert.status === 'low' ? 'Faible' : 'Normal'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions Automatisées</CardTitle>
              <CardDescription>Règles de réapprovisionnement intelligent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { icon: CheckCircle, color: 'text-green-500', title: 'Réapprovisionnement Auto', desc: 'Actif pour 156 produits', action: 'Configurer' },
                { icon: AlertTriangle, color: 'text-yellow-500', title: 'Alertes par Email', desc: 'Seuil critique atteint', action: 'Modifier' },
                { icon: TrendingUp, color: 'text-blue-500', title: 'Prédiction IA', desc: 'Analyse des tendances', action: 'Voir Détails' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <item.icon className={cn("h-5 w-5", item.color)} />
                    <div>
                      <p className="font-medium text-sm sm:text-base">{item.title}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleConfigure(item.title)}>
                    {item.action}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
