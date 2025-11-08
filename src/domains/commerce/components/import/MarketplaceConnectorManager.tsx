import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMarketplaceConnectors } from '../../hooks/useMarketplaceConnectors';
import { Plus, RefreshCw, Trash2, CheckCircle, XCircle } from 'lucide-react';

export const MarketplaceConnectorManager = () => {
  const {
    connectors,
    loading,
    loadConnectors,
    connectMarketplace,
    disconnectMarketplace,
    syncMarketplace
  } = useMarketplaceConnectors();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  useEffect(() => {
    loadConnectors();
  }, [loadConnectors]);

  const getProviderFields = (provider: string) => {
    switch (provider) {
      case 'amazon':
        return [
          { key: 'access_key', label: 'Access Key ID', type: 'text' },
          { key: 'secret_key', label: 'Secret Access Key', type: 'password' },
          { key: 'marketplace_id', label: 'Marketplace ID', type: 'text' }
        ];
      case 'ebay':
        return [
          { key: 'app_id', label: 'App ID', type: 'text' },
          { key: 'cert_id', label: 'Cert ID', type: 'password' },
          { key: 'dev_id', label: 'Dev ID', type: 'text' }
        ];
      case 'shopify':
        return [
          { key: 'shop_url', label: 'Shop URL (xxx.myshopify.com)', type: 'text' },
          { key: 'access_token', label: 'Access Token', type: 'password' }
        ];
      case 'aliexpress':
        return [
          { key: 'app_key', label: 'App Key', type: 'text' },
          { key: 'app_secret', label: 'App Secret', type: 'password' }
        ];
      case 'woocommerce':
        return [
          { key: 'store_url', label: 'Store URL', type: 'text' },
          { key: 'consumer_key', label: 'Consumer Key', type: 'text' },
          { key: 'consumer_secret', label: 'Consumer Secret', type: 'password' }
        ];
      default:
        return [];
    }
  };

  const handleConnect = async () => {
    if (!selectedProvider) return;

    const success = await connectMarketplace({
      provider: selectedProvider as any,
      credentials
    });

    if (success) {
      setIsAddDialogOpen(false);
      setSelectedProvider('');
      setCredentials({});
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Connecteurs Marketplace</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un connecteur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Connecter une marketplace</DialogTitle>
              <DialogDescription>
                Sélectionnez une marketplace et entrez vos identifiants
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Marketplace</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amazon">Amazon</SelectItem>
                    <SelectItem value="ebay">eBay</SelectItem>
                    <SelectItem value="shopify">Shopify</SelectItem>
                    <SelectItem value="aliexpress">AliExpress</SelectItem>
                    <SelectItem value="woocommerce">WooCommerce</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedProvider && getProviderFields(selectedProvider).map(field => (
                <div key={field.key}>
                  <Label>{field.label}</Label>
                  <Input
                    type={field.type}
                    value={credentials[field.key] || ''}
                    onChange={(e) => setCredentials(prev => ({
                      ...prev,
                      [field.key]: e.target.value
                    }))}
                    placeholder={`Entrez ${field.label}`}
                  />
                </div>
              ))}

              <Button onClick={handleConnect} disabled={loading} className="w-full">
                {loading ? 'Connexion...' : 'Connecter'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {connectors.map((connector) => (
          <Card key={connector.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold capitalize">{connector.provider}</h3>
                {getStatusIcon(connector.status)}
              </div>
              <Badge variant={connector.status === 'connected' ? 'default' : 'secondary'}>
                {connector.status}
              </Badge>
            </div>

            {connector.lastSync && (
              <p className="text-xs text-muted-foreground mb-3">
                Dernière sync: {new Date(connector.lastSync).toLocaleString('fr-FR')}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => syncMarketplace(connector.id)}
                disabled={loading || connector.status !== 'connected'}
                className="flex-1"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Sync
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => disconnectMarketplace(connector.id)}
                disabled={loading}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        ))}

        {connectors.length === 0 && !loading && (
          <Card className="p-8 text-center col-span-full">
            <p className="text-muted-foreground">
              Aucun connecteur configuré. Ajoutez-en un pour commencer.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
