import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAutoFulfillment } from '@/hooks/useAutoFulfillment';
import { Plus, Plug, Check, X, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function SupplierConnectionsManager() {
  const { connections, isLoadingConnections, createConnection, toggleAutoOrder } = useAutoFulfillment();
  const [isAddingConnection, setIsAddingConnection] = useState(false);
  const [newConnection, setNewConnection] = useState({
    supplier_name: '',
    connection_type: 'api',
    api_endpoint: '',
    email_address: '',
    auto_order_enabled: false
  });

  const handleCreateConnection = async () => {
    await createConnection(newConnection);
    setIsAddingConnection(false);
    setNewConnection({
      supplier_name: '',
      connection_type: 'api',
      api_endpoint: '',
      email_address: '',
      auto_order_enabled: false
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Connexions Fournisseurs</CardTitle>
              <CardDescription>
                Configurez vos fournisseurs pour l'auto-fulfillment
              </CardDescription>
            </div>
            <Dialog open={isAddingConnection} onOpenChange={setIsAddingConnection}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter Fournisseur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nouvelle Connexion Fournisseur</DialogTitle>
                  <DialogDescription>
                    Connectez un fournisseur pour automatiser vos commandes
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier-name">Nom du Fournisseur</Label>
                    <Input
                      id="supplier-name"
                      placeholder="AliExpress, CJ Dropshipping, etc."
                      value={newConnection.supplier_name}
                      onChange={(e) => setNewConnection({ ...newConnection, supplier_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="connection-type">Type de Connexion</Label>
                    <Select
                      value={newConnection.connection_type}
                      onValueChange={(value) => setNewConnection({ ...newConnection, connection_type: value })}
                    >
                      <SelectTrigger id="connection-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="api">API (Automatique)</SelectItem>
                        <SelectItem value="dropshipping_platform">Plateforme Dropshipping</SelectItem>
                        <SelectItem value="email">Email (Semi-automatique)</SelectItem>
                        <SelectItem value="manual">Manuel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newConnection.connection_type === 'api' && (
                    <div className="space-y-2">
                      <Label htmlFor="api-endpoint">URL de l'API</Label>
                      <Input
                        id="api-endpoint"
                        placeholder="https://api.supplier.com/orders"
                        value={newConnection.api_endpoint}
                        onChange={(e) => setNewConnection({ ...newConnection, api_endpoint: e.target.value })}
                      />
                    </div>
                  )}

                  {newConnection.connection_type === 'email' && (
                    <div className="space-y-2">
                      <Label htmlFor="email">Email du Fournisseur</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="orders@supplier.com"
                        value={newConnection.email_address}
                        onChange={(e) => setNewConnection({ ...newConnection, email_address: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Auto-commande Activée</Label>
                      <p className="text-sm text-muted-foreground">
                        Les commandes seront envoyées automatiquement
                      </p>
                    </div>
                    <Switch
                      checked={newConnection.auto_order_enabled}
                      onCheckedChange={(checked) => setNewConnection({ ...newConnection, auto_order_enabled: checked })}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setIsAddingConnection(false)}>
                    Annuler
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleCreateConnection}
                    disabled={!newConnection.supplier_name}
                  >
                    <Plug className="w-4 h-4 mr-2" />
                    Connecter
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {connections && connections.length > 0 ? (
          connections.map((connection: any) => (
            <Card key={connection.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{connection.supplier_name}</CardTitle>
                    <CardDescription className="capitalize">
                      {connection.connection_type.replace('_', ' ')}
                    </CardDescription>
                  </div>
                  <Badge variant={connection.status === 'active' ? 'default' : 'secondary'}>
                    {connection.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Commandes</p>
                    <p className="font-bold">{connection.total_orders || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Taux succès</p>
                    <p className="font-bold">{connection.success_rate?.toFixed(1) || 0}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Auto-commande</span>
                  <Switch
                    checked={connection.auto_order_enabled}
                    onCheckedChange={() => toggleAutoOrder(connection.id, !connection.auto_order_enabled)}
                  />
                </div>

                <Button variant="outline" className="w-full" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurer
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Plug className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucun fournisseur connecté</p>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Commencez par ajouter votre premier fournisseur pour automatiser vos commandes
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
