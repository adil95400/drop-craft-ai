import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Rss, CheckCircle, AlertCircle, RefreshCw, 
  Download, Upload, Settings, TrendingUp, Globe 
} from 'lucide-react';

export default function FeedOptimizationPage() {
  const [selectedChannel, setSelectedChannel] = useState('all');

  const channels = [
    {
      id: 'google',
      name: 'Google Shopping',
      status: 'active',
      products: 1247,
      lastSync: '2 min ago',
      errors: 0,
      performance: 98
    },
    {
      id: 'facebook',
      name: 'Facebook Catalog',
      status: 'active',
      products: 1189,
      lastSync: '5 min ago',
      errors: 3,
      performance: 95
    },
    {
      id: 'amazon',
      name: 'Amazon',
      status: 'syncing',
      products: 856,
      lastSync: 'En cours...',
      errors: 0,
      performance: 100
    },
    {
      id: 'ebay',
      name: 'eBay',
      status: 'active',
      products: 742,
      lastSync: '15 min ago',
      errors: 12,
      performance: 92
    },
    {
      id: 'pinterest',
      name: 'Pinterest',
      status: 'error',
      products: 0,
      lastSync: '2 hours ago',
      errors: 45,
      performance: 0
    }
  ];

  const feedRules = [
    {
      name: 'Title Optimization',
      description: 'Optimise automatiquement les titres pour chaque plateforme',
      channels: ['Google', 'Facebook', 'Amazon'],
      status: 'active'
    },
    {
      name: 'Price Markup by Channel',
      description: 'Applique des marges différentes selon la plateforme',
      channels: ['All'],
      status: 'active'
    },
    {
      name: 'Stock Threshold',
      description: 'Masque les produits avec stock < 5',
      channels: ['Google', 'eBay'],
      status: 'active'
    },
    {
      name: 'Category Mapping',
      description: 'Mappe automatiquement les catégories par marketplace',
      channels: ['Amazon', 'eBay'],
      status: 'paused'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'syncing': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'syncing': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>Feed Management & Optimization - DropCraft AI</title>
        <meta name="description" content="Gérez et optimisez vos flux produits pour tous vos canaux de vente" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Feed Management & Optimization</h1>
            <p className="text-muted-foreground mt-2">
              Flux produits optimisés pour chaque marketplace
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync All
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Canaux Actifs</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">4 actifs, 1 erreur</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Produits Totaux</CardTitle>
              <Rss className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-green-500">+156 ce mois</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taux de Sync</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">96.5%</div>
              <p className="text-xs text-muted-foreground">60 erreurs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">97%</div>
              <p className="text-xs text-green-500">+3% vs mois dernier</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="channels" className="space-y-6">
          <TabsList>
            <TabsTrigger value="channels">Canaux</TabsTrigger>
            <TabsTrigger value="rules">Règles d'Optimisation</TabsTrigger>
            <TabsTrigger value="mapping">Mapping</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tous les canaux" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les canaux</SelectItem>
                  {channels.map(channel => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {channels.map((channel) => (
                <Card key={channel.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center`}>
                            <Rss className="h-6 w-6" />
                          </div>
                          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${getStatusColor(channel.status)} border-2 border-background`} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{channel.name}</h4>
                            {getStatusIcon(channel.status)}
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Produits: </span>
                              <span className="font-medium">{channel.products}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Dernière sync: </span>
                              <span className="font-medium">{channel.lastSync}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Erreurs: </span>
                              <span className={channel.errors > 0 ? 'text-red-500 font-medium' : 'text-green-500 font-medium'}>
                                {channel.errors}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right mr-4">
                          <div className="text-2xl font-bold">{channel.performance}%</div>
                          <div className="text-xs text-muted-foreground">Performance</div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {channel.errors > 0 && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-red-900">
                            <AlertCircle className="h-4 w-4" />
                            {channel.errors} erreurs nécessitent votre attention
                          </div>
                          <Button size="sm" variant="outline">
                            Voir les erreurs
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-semibold mb-2">Ajouter un nouveau canal</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connectez une nouvelle marketplace pour vendre vos produits
                  </p>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Connecter un Canal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Règles d'Optimisation</h3>
                <p className="text-sm text-muted-foreground">
                  Automatisez l'optimisation de vos flux produits
                </p>
              </div>
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Nouvelle Règle
              </Button>
            </div>

            <div className="space-y-4">
              {feedRules.map((rule, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{rule.name}</h4>
                          <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                            {rule.status === 'active' ? 'Actif' : 'Pausé'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {rule.description}
                        </p>
                        <div className="flex gap-2">
                          {rule.channels.map((channel, i) => (
                            <Badge key={i} variant="outline">{channel}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mapping" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mapping des Catégories</CardTitle>
                <CardDescription>
                  Mappez vos catégories vers les catégories des marketplaces
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configurateur de mapping disponible prochainement</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Templates de Flux</CardTitle>
                <CardDescription>
                  Modèles pré-configurés pour chaque marketplace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Rss className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Bibliothèque de templates disponible prochainement</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
