import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plug,
  Settings,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Key,
  Database,
  Webhook,
  Clock,
  Activity
} from 'lucide-react';

interface Connector {
  id: string;
  name: string;
  type: 'api' | 'xml' | 'csv' | 'webhook';
  status: 'connected' | 'disconnected' | 'error';
  provider: string;
  lastSync?: string;
  syncInterval?: number;
  itemsSynced?: number;
  hasCredentials: boolean;
}

const CONNECTORS: Connector[] = [
  {
    id: '1',
    name: 'AliExpress API',
    type: 'api',
    status: 'connected',
    provider: 'AliExpress',
    lastSync: '2024-01-15T10:30:00',
    syncInterval: 3600,
    itemsSynced: 1250,
    hasCredentials: true
  },
  {
    id: '2',
    name: 'BigBuy API',
    type: 'api',
    status: 'connected',
    provider: 'BigBuy',
    lastSync: '2024-01-15T09:15:00',
    syncInterval: 7200,
    itemsSynced: 450,
    hasCredentials: true
  },
  {
    id: '3',
    name: 'Spocket Webhook',
    type: 'webhook',
    status: 'error',
    provider: 'Spocket',
    hasCredentials: true
  },
  {
    id: '4',
    name: 'Custom XML Feed',
    type: 'xml',
    status: 'disconnected',
    provider: 'Custom',
    hasCredentials: false
  }
];

export default function ManageSuppliersConnectors() {
  const [connectors, setConnectors] = useState(CONNECTORS);
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <XCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Connecté</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return <Badge variant="secondary">Déconnecté</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'api':
        return <Zap className="h-5 w-5" />;
      case 'webhook':
        return <Webhook className="h-5 w-5" />;
      case 'xml':
        return <Database className="h-5 w-5" />;
      default:
        return <Plug className="h-5 w-5" />;
    }
  };

  const formatLastSync = (dateString?: string) => {
    if (!dateString) return 'Jamais';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)} h`;
    return `Il y a ${Math.floor(diffMins / 1440)} j`;
  };

  return (
    <>
      <Helmet>
        <title>Connecteurs Fournisseurs - Configuration des intégrations</title>
        <meta name="description" content="Gérez vos connecteurs API, XML, CSV et webhooks pour synchroniser automatiquement vos fournisseurs" />
      </Helmet>

      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Plug className="h-10 w-10 text-primary" />
            Connecteurs Fournisseurs
          </h1>
          <p className="text-muted-foreground mt-2">
            Configurez et gérez vos intégrations avec les fournisseurs
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-3xl font-bold">{connectors.length}</p>
                </div>
                <Plug className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Connectés</p>
                  <p className="text-3xl font-bold text-green-600">
                    {connectors.filter(c => c.status === 'connected').length}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">En erreur</p>
                  <p className="text-3xl font-bold text-red-600">
                    {connectors.filter(c => c.status === 'error').length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Produits sync</p>
                  <p className="text-3xl font-bold">
                    {connectors.reduce((acc, c) => acc + (c.itemsSynced || 0), 0)}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Connectors List */}
          <div className="lg:col-span-2 space-y-4">
            {connectors.map(connector => (
              <Card 
                key={connector.id}
                className={`cursor-pointer transition-all ${
                  selectedConnector?.id === connector.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedConnector(connector)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${
                        connector.status === 'connected' 
                          ? 'bg-green-100 dark:bg-green-900' 
                          : connector.status === 'error'
                          ? 'bg-red-100 dark:bg-red-900'
                          : 'bg-muted'
                      }`}>
                        {getTypeIcon(connector.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{connector.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{connector.provider}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(connector.status)}
                      {getStatusIcon(connector.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium uppercase">{connector.type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Dernière sync</p>
                      <p className="font-medium">{formatLastSync(connector.lastSync)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Produits</p>
                      <p className="font-medium">{connector.itemsSynced || 0}</p>
                    </div>
                  </div>
                  
                  {connector.status === 'connected' && (
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Synchroniser
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Configurer
                      </Button>
                    </div>
                  )}
                  
                  {connector.status === 'disconnected' && (
                    <Button size="sm" className="mt-4 gap-2">
                      <Plug className="h-4 w-4" />
                      Connecter
                    </Button>
                  )}
                  
                  {connector.status === 'error' && (
                    <div className="mt-4">
                      <div className="text-sm text-red-600 dark:text-red-400 mb-2">
                        Erreur de connexion - Vérifiez vos identifiants
                      </div>
                      <Button size="sm" variant="destructive" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Réparer
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Add New Connector */}
            <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-8 text-center">
                <Plug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ajouter un nouveau connecteur</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connectez un nouveau fournisseur via API, XML, CSV ou Webhook
                </p>
                <Button>
                  <Plug className="h-4 w-4 mr-2" />
                  Nouveau connecteur
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Configuration Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuration
                </CardTitle>
                <CardDescription>
                  {selectedConnector 
                    ? `Paramètres de ${selectedConnector.name}`
                    : 'Sélectionnez un connecteur'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedConnector ? (
                  <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="general">Général</TabsTrigger>
                      <TabsTrigger value="sync">Sync</TabsTrigger>
                      <TabsTrigger value="security">Sécurité</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="general" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nom du connecteur</Label>
                        <Input value={selectedConnector.name} />
                      </div>
                      <div className="space-y-2">
                        <Label>Provider</Label>
                        <Input value={selectedConnector.provider} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Actif</Label>
                        <Switch checked={selectedConnector.status === 'connected'} />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="sync" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Intervalle de synchronisation (secondes)</Label>
                        <Input 
                          type="number" 
                          value={selectedConnector.syncInterval || 3600} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Dernière synchronisation
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {formatLastSync(selectedConnector.lastSync)}
                        </p>
                      </div>
                      <Button className="w-full gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Synchroniser maintenant
                      </Button>
                    </TabsContent>
                    
                    <TabsContent value="security" className="space-y-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          Clé API
                        </Label>
                        <Input 
                          type="password" 
                          placeholder="••••••••••••••••" 
                          disabled={!selectedConnector.hasCredentials}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Secret</Label>
                        <Input 
                          type="password" 
                          placeholder="••••••••••••••••" 
                          disabled={!selectedConnector.hasCredentials}
                        />
                      </div>
                      <Button variant="outline" className="w-full">
                        Tester la connexion
                      </Button>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Sélectionnez un connecteur pour voir sa configuration</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Synchroniser tous les connecteurs
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Activity className="h-4 w-4" />
                  Voir les logs
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Settings className="h-4 w-4" />
                  Paramètres globaux
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
