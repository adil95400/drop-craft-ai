import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAutoFulfillment } from '@/hooks/useAutoFulfillment';
import { Plus, Plug, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function SupplierConnectionsManager() {
  const { connections, isLoadingConnections, toggleAutoOrder } = useAutoFulfillment();
  const [isAddingConnection, setIsAddingConnection] = useState(false);
  const [newConnection, setNewConnection] = useState({
    supplier_name: '',
    connection_type: 'api',
    api_endpoint: '',
    email_address: '',
    auto_order_enabled: false
  });

  const handleCreateConnection = async () => {
    // Connection creation is handled via supplier credentials vault
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
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base md:text-lg">Connexions Fournisseurs</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Configurez vos fournisseurs pour l'auto-fulfillment
              </CardDescription>
            </div>
            <Dialog open={isAddingConnection} onOpenChange={setIsAddingConnection}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full xs:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden xs:inline">Ajouter </span>Fournisseur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-base md:text-lg">Nouvelle Connexion Fournisseur</DialogTitle>
                  <DialogDescription className="text-xs md:text-sm">
                    Connectez un fournisseur pour automatiser vos commandes
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier-name" className="text-sm">Nom du Fournisseur</Label>
                    <Input
                      id="supplier-name"
                      placeholder="AliExpress, CJ Dropshipping, etc."
                      value={newConnection.supplier_name}
                      onChange={(e) => setNewConnection({ ...newConnection, supplier_name: e.target.value })}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="connection-type" className="text-sm">Type de Connexion</Label>
                    <Select
                      value={newConnection.connection_type}
                      onValueChange={(value) => setNewConnection({ ...newConnection, connection_type: value })}
                    >
                      <SelectTrigger id="connection-type" className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="api">API (Automatique)</SelectItem>
                        <SelectItem value="dropshipping_platform">Plateforme Dropshipping</SelectItem>
                        <SelectItem value="email">Email (Semi-auto)</SelectItem>
                        <SelectItem value="manual">Manuel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newConnection.connection_type === 'api' && (
                    <div className="space-y-2">
                      <Label htmlFor="api-endpoint" className="text-sm">URL de l'API</Label>
                      <Input
                        id="api-endpoint"
                        placeholder="https://api.supplier.com/orders"
                        value={newConnection.api_endpoint}
                        onChange={(e) => setNewConnection({ ...newConnection, api_endpoint: e.target.value })}
                        className="h-10"
                      />
                    </div>
                  )}

                  {newConnection.connection_type === 'email' && (
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm">Email du Fournisseur</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="orders@supplier.com"
                        value={newConnection.email_address}
                        onChange={(e) => setNewConnection({ ...newConnection, email_address: e.target.value })}
                        className="h-10"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 md:p-4 bg-muted rounded-lg">
                    <div className="space-y-0.5 pr-4">
                      <Label className="text-sm">Auto-commande</Label>
                      <p className="text-xs text-muted-foreground">
                        Envoi automatique des commandes
                      </p>
                    </div>
                    <Switch
                      checked={newConnection.auto_order_enabled}
                      onCheckedChange={(checked) => setNewConnection({ ...newConnection, auto_order_enabled: checked })}
                    />
                  </div>
                </div>

                <div className="flex flex-col xs:flex-row gap-2">
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

      <div className="grid gap-3 md:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3">
        {connections && connections.length > 0 ? (
          connections.map((connection: any) => (
            <Card key={connection.id}>
              <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base md:text-lg truncate">{connection.supplier_name}</CardTitle>
                    <CardDescription className="capitalize text-xs md:text-sm">
                      {connection.connection_type.replace('_', ' ')}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={connection.status === 'active' ? 'default' : 'secondary'}
                    className="text-[10px] md:text-xs shrink-0"
                  >
                    {connection.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 space-y-3 md:space-y-4">
                <div className="grid grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                  <div>
                    <p className="text-muted-foreground">Commandes</p>
                    <p className="font-bold">{connection.total_orders || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Taux succès</p>
                    <p className="font-bold">{connection.success_rate?.toFixed(1) || 0}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 md:p-3 bg-muted rounded-lg">
                  <span className="text-xs md:text-sm font-medium">Auto-commande</span>
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
            <CardContent className="flex flex-col items-center justify-center py-8 md:py-12 px-4">
              <Plug className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mb-4" />
              <p className="text-base md:text-lg font-medium text-center">Aucun fournisseur connecté</p>
              <p className="text-xs md:text-sm text-muted-foreground text-center mt-2">
                Ajoutez votre premier fournisseur pour automatiser vos commandes
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
