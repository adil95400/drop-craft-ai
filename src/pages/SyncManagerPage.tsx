import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Check, AlertCircle, Settings, Play } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useToast } from '@/hooks/use-toast';

export default function SyncManagerPage() {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);

  const syncSources = [
    {
      id: 1,
      name: 'WooCommerce',
      status: 'active',
      lastSync: '2025-10-31 10:30',
      products: 234,
      orders: 45
    },
    {
      id: 2,
      name: 'Shopify',
      status: 'active',
      lastSync: '2025-10-31 09:15',
      products: 156,
      orders: 28
    },
    {
      id: 3,
      name: 'PrestaShop',
      status: 'error',
      lastSync: '2025-10-30 16:20',
      products: 89,
      orders: 12
    }
  ];

  const handleSync = async (sourceId: number) => {
    setSyncing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Synchronisation réussie",
        description: "Les données ont été synchronisées avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'error': return 'destructive';
      case 'syncing': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return Check;
      case 'error': return AlertCircle;
      case 'syncing': return RefreshCw;
      default: return RefreshCw;
    }
  };

  return (
    <>
      <Helmet>
        <title>Sync Manager - Synchronisation | Drop Craft AI</title>
        <meta name="description" content="Gérez et synchronisez vos données entre différentes plateformes e-commerce." />
      </Helmet>

      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sync Manager</h1>
            <p className="text-muted-foreground">
              Synchronisez vos données entre plateformes
            </p>
          </div>
          <Button onClick={() => handleSync(0)} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Synchronisation...' : 'Tout synchroniser'}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sources actives</CardTitle>
              <Check className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {syncSources.filter(s => s.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Sur {syncSources.length} sources
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits synchronisés</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {syncSources.reduce((sum, s) => sum + s.products, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total de tous les magasins
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes sync</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {syncSources.reduce((sum, s) => sum + s.orders, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Dernières 24h
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sources de synchronisation */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Sources de synchronisation</h2>
          
          {syncSources.map((source) => {
            const StatusIcon = getStatusIcon(source.status);
            return (
              <Card key={source.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <StatusIcon className={`h-6 w-6 ${source.status === 'active' ? 'text-green-600' : source.status === 'error' ? 'text-red-600' : 'text-primary'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{source.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Dernière sync: {source.lastSync}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{source.products}</div>
                        <div className="text-xs text-muted-foreground">Produits</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{source.orders}</div>
                        <div className="text-xs text-muted-foreground">Commandes</div>
                      </div>
                      <Badge variant={getStatusColor(source.status)}>
                        {source.status}
                      </Badge>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSync(source.id)}
                          disabled={syncing}
                        >
                          <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                          Sync
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ajouter une nouvelle source</CardTitle>
            <CardDescription>
              Connectez une nouvelle plateforme e-commerce
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>
              <Play className="mr-2 h-4 w-4" />
              Ajouter une source
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
