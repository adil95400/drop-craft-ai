import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProductImports } from '@/hooks/useProductImports';
import { useToast } from '@/hooks/use-toast';
import { 
  Store, 
  Globe, 
  ShoppingCart, 
  Package, 
  Settings,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

export default function ImportMarketplacePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { importedProducts, loading } = useProductImports();
  const [syncEnabled, setSyncEnabled] = useState({
    amazon: false,
    ebay: false,
    cdiscount: false,
    google: false,
  });

  const publishedProducts = importedProducts.filter(p => p.status === 'published');

  const marketplaces = [
    {
      id: 'amazon',
      name: 'Amazon',
      description: 'Marketplace mondiale avec millions de visiteurs',
      icon: Store,
      color: 'orange',
      status: 'available',
      connected: false,
      stats: {
        published: 0,
        pending: 0,
        rejected: 0,
      }
    },
    {
      id: 'ebay',
      name: 'eBay',
      description: 'Plateforme d\'enchères et vente directe',
      icon: ShoppingCart,
      color: 'blue',
      status: 'available',
      connected: false,
      stats: {
        published: 0,
        pending: 0,
        rejected: 0,
      }
    },
    {
      id: 'cdiscount',
      name: 'Cdiscount',
      description: 'Leader français du e-commerce',
      icon: Package,
      color: 'red',
      status: 'available',
      connected: false,
      stats: {
        published: 0,
        pending: 0,
        rejected: 0,
      }
    },
    {
      id: 'google',
      name: 'Google Shopping',
      description: 'Plateforme publicitaire de Google',
      icon: Globe,
      color: 'green',
      status: 'available',
      connected: false,
      stats: {
        published: 0,
        pending: 0,
        rejected: 0,
      }
    },
  ];

  const handleConnectMarketplace = async (marketplaceId: string) => {
    toast({
      title: 'Connexion marketplace',
      description: `Configuration de la connexion à ${marketplaces.find(m => m.id === marketplaceId)?.name}...`,
    });

    // TODO: Implement actual marketplace connection
    setTimeout(() => {
      toast({
        title: 'Fonctionnalité en développement',
        description: 'La connexion aux marketplaces sera disponible prochainement.',
      });
    }, 1000);
  };

  const handleSyncProducts = async (marketplaceId: string) => {
    if (publishedProducts.length === 0) {
      toast({
        title: 'Aucun produit à synchroniser',
        description: 'Publiez d\'abord des produits avant de synchroniser.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Synchronisation lancée',
      description: `${publishedProducts.length} produits en cours de synchronisation...`,
    });

    // TODO: Implement actual sync logic
    setTimeout(() => {
      toast({
        title: 'Synchronisation terminée',
        description: 'Les produits ont été synchronisés avec succès.',
      });
    }, 2000);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Marketplaces</h1>
            <p className="text-muted-foreground">
              Synchronisez vos produits avec les principales plateformes de vente
            </p>
          </div>
        </div>
        <Button variant="outline" size="icon">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits Disponibles</p>
                <p className="text-2xl font-bold">{publishedProducts.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Marketplaces Connectées</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Store className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits Synchronisés</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de Succès</p>
                <p className="text-2xl font-bold">--%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marketplaces Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {marketplaces.map((marketplace) => {
          const Icon = marketplace.icon;
          return (
            <Card key={marketplace.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-${marketplace.color}-500/10 rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 text-${marketplace.color}-600`} />
                    </div>
                    <div>
                      <CardTitle>{marketplace.name}</CardTitle>
                      <CardDescription>{marketplace.description}</CardDescription>
                    </div>
                  </div>
                  {marketplace.connected ? (
                    <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connecté
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <XCircle className="w-3 h-3 mr-1" />
                      Non connecté
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{marketplace.stats.published}</p>
                    <p className="text-xs text-muted-foreground">Publiés</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{marketplace.stats.pending}</p>
                    <p className="text-xs text-muted-foreground">En attente</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{marketplace.stats.rejected}</p>
                    <p className="text-xs text-muted-foreground">Rejetés</p>
                  </div>
                </div>

                {/* Sync Toggle */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Synchronisation automatique</span>
                  </div>
                  <Switch
                    checked={syncEnabled[marketplace.id as keyof typeof syncEnabled]}
                    onCheckedChange={(checked) =>
                      setSyncEnabled({ ...syncEnabled, [marketplace.id]: checked })
                    }
                    disabled={!marketplace.connected}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {marketplace.connected ? (
                    <>
                      <Button 
                        className="flex-1"
                        onClick={() => handleSyncProducts(marketplace.id)}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Synchroniser
                      </Button>
                      <Button variant="outline" size="icon">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="flex-1"
                      variant="outline"
                      onClick={() => handleConnectMarketplace(marketplace.id)}
                    >
                      Connecter
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Fonctionnalité en développement</p>
              <p className="text-sm text-blue-700 mt-1">
                La connexion et la synchronisation avec les marketplaces externes sera disponible prochainement. 
                En attendant, vous pouvez utiliser la publication vers Shopify et les exports manuels.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
