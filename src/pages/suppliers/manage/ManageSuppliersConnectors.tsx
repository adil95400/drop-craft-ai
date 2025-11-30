import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useSupplierSync } from '@/hooks/useSupplierSync';
import { useSupplierConnection } from '@/hooks/useSupplierConnection';
import { useRealSuppliers } from '@/hooks/useRealSuppliers';
import { toast } from 'sonner';
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
  Clock,
  Activity,
  Unplug
} from 'lucide-react';

export default function ManageSuppliersConnectors() {
  const navigate = useNavigate();
  const { syncSupplier, syncAllSuppliers, isSyncing, syncProgress } = useSupplierSync();
  const { connectedSuppliers, isLoading: isLoadingConnections, disconnectSupplier, isDisconnecting } = useSupplierConnection();
  const { suppliers, isLoading: isLoadingSuppliers } = useRealSuppliers();
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const handleSync = async (supplierId: string) => {
    await syncSupplier(supplierId);
  };

  const handleSyncAll = async () => {
    await syncAllSuppliers();
  };

  const handleDisconnect = async (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (confirm(`Êtes-vous sûr de vouloir déconnecter ${supplier?.name || 'ce fournisseur'} ?`)) {
      await disconnectSupplier(supplierId);
    }
  };

  const handleConnect = () => {
    navigate('/suppliers/marketplace');
  };

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
  const selectedConnection = connectedSuppliers.find(c => c.supplierId === selectedSupplierId);
  
  const isLoading = isLoadingConnections || isLoadingSuppliers;

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
                  <p className="text-3xl font-bold">{suppliers.length}</p>
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
                    {connectedSuppliers.length}
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
                  <p className="text-sm font-medium text-muted-foreground">Disponibles</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {suppliers.length - connectedSuppliers.length}
                  </p>
                </div>
                <Database className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">En sync</p>
                  <p className="text-3xl font-bold">
                    {isSyncing ? '1' : '0'}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Connectors List */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-muted-foreground">Chargement des fournisseurs...</p>
                </CardContent>
              </Card>
            ) : connectedSuppliers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Plug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun fournisseur connecté</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connectez votre premier fournisseur pour commencer
                  </p>
                  <Button onClick={handleConnect}>
                    <Plug className="h-4 w-4 mr-2" />
                    Parcourir les fournisseurs
                  </Button>
                </CardContent>
              </Card>
            ) : (
              connectedSuppliers.map(connection => {
                const supplier = suppliers.find(s => s.id === connection.supplierId);
                if (!supplier) return null;
                
                const isSelected = selectedSupplierId === supplier.id;
                const isSyncingThis = syncProgress?.supplierId === supplier.id;
                
                return (
                  <Card 
                    key={supplier.id}
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedSupplierId(supplier.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-lg ${
                            connection.connectionStatus === 'active' 
                              ? 'bg-green-100 dark:bg-green-900' 
                              : 'bg-red-100 dark:bg-red-900'
                          }`}>
                            <Zap className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{supplier.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{supplier.country || 'International'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {connection.connectionStatus === 'active' ? (
                            <>
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Connecté</Badge>
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </>
                          ) : (
                            <>
                              <Badge variant="destructive">Erreur</Badge>
                              <XCircle className="h-5 w-5 text-red-600" />
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-medium uppercase">API</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Dernière sync</p>
                          <p className="font-medium">{formatLastSync(connection.lastSyncAt)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Statut</p>
                          <p className="font-medium capitalize">{connection.connectionStatus}</p>
                        </div>
                      </div>
                      
                      {isSyncingThis && syncProgress && (
                        <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                            <span className="font-medium">
                              Synchronisation en cours... {syncProgress.productsImported} produits importés
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSync(supplier.id);
                          }}
                          disabled={isSyncing}
                        >
                          <RefreshCw className={`h-4 w-4 ${isSyncingThis ? 'animate-spin' : ''}`} />
                          Synchroniser
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDisconnect(supplier.id);
                          }}
                          disabled={isDisconnecting}
                        >
                          <Unplug className="h-4 w-4" />
                          Déconnecter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}

            {/* Add New Connector */}
            <Card 
              className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={handleConnect}
            >
              <CardContent className="p-8 text-center">
                <Plug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Connecter un nouveau fournisseur</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Parcourez notre marketplace de fournisseurs et connectez-vous en quelques clics
                </p>
                <Button onClick={(e) => {
                  e.stopPropagation();
                  handleConnect();
                }}>
                  <Plug className="h-4 w-4 mr-2" />
                  Parcourir les fournisseurs
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
                  {selectedSupplier 
                    ? `Paramètres de ${selectedSupplier.name}`
                    : 'Sélectionnez un fournisseur'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedSupplier && selectedConnection ? (
                  <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="general">Général</TabsTrigger>
                      <TabsTrigger value="sync">Synchronisation</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="general" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nom du fournisseur</Label>
                        <Input value={selectedSupplier.name} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Pays</Label>
                        <Input value={selectedSupplier.country || 'International'} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Statut de connexion</Label>
                        <div className="flex items-center gap-2">
                          {selectedConnection.connectionStatus === 'active' ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600 font-medium">Connecté</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span className="text-sm text-red-600 font-medium">Erreur</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button 
                        className="w-full gap-2"
                        variant="destructive"
                        onClick={() => handleDisconnect(selectedSupplier.id)}
                        disabled={isDisconnecting}
                      >
                        <Unplug className="h-4 w-4" />
                        Déconnecter ce fournisseur
                      </Button>
                    </TabsContent>
                    
                    <TabsContent value="sync" className="space-y-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Dernière synchronisation
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {formatLastSync(selectedConnection.lastSyncAt)}
                        </p>
                      </div>
                      {syncProgress?.supplierId === selectedSupplier.id && (
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <div className="flex items-center gap-2 text-sm mb-2">
                            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                            <span className="font-medium">Synchronisation en cours...</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {syncProgress.productsImported} produits importés
                          </p>
                        </div>
                      )}
                      <Button 
                        className="w-full gap-2"
                        onClick={() => handleSync(selectedSupplier.id)}
                        disabled={isSyncing}
                      >
                        <RefreshCw className={`h-4 w-4 ${syncProgress?.supplierId === selectedSupplier.id ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
                      </Button>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Sélectionnez un fournisseur pour voir sa configuration</p>
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
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={handleSyncAll}
                  disabled={isSyncing}
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  Synchroniser tous les connecteurs
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

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
