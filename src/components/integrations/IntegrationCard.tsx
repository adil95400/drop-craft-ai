import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Plug, 
  PlugZap, 
  AlertCircle, 
  Clock,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  Users,
  Package,
  ShoppingCart,
  Database
} from 'lucide-react';
import { Integration, useIntegrations } from '@/hooks/useIntegrations';

interface IntegrationCardProps {
  integration: Integration;
  onEdit?: (integration: Integration) => void;
}

export const IntegrationCard = ({ integration, onEdit }: IntegrationCardProps) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState(integration);
  const { updateIntegration, deleteIntegration, testConnection, syncData } = useIntegrations();

  const statusConfig = {
    connected: { color: 'bg-green-500', text: 'Connecté', icon: PlugZap },
    disconnected: { color: 'bg-gray-500', text: 'Non connecté', icon: Plug },
    error: { color: 'bg-red-500', text: 'Erreur', icon: AlertCircle },
  };

  const platformLogos = {
    shopify: '🛍️',
    woocommerce: '🛒',
    bigcommerce: '🏪',
    amazon: '📦',
    aliexpress: '🛒',
    ebay: '🔨',
    etsy: '🎨',
    facebook: '📘',
    instagram: '📷',
    google: '🔍',
    stripe: '💳',
    paypal: '💰',
  };

  const handleSave = async () => {
    try {
      await updateIntegration(integration.id, config);
      setIsConfigOpen(false);
      onEdit?.(config);
    } catch (error) {
      console.error('Error updating integration:', error);
    }
  };

  const handleTest = async () => {
    await testConnection(integration.id);
  };

  const handleSync = async (syncType: 'products' | 'orders' | 'inventory' | 'customers') => {
    await syncData(integration.id, syncType);
  };

  const handleDelete = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette intégration ?')) {
      await deleteIntegration(integration.id);
    }
  };

  const StatusIcon = statusConfig[integration.connection_status].icon;

  return (
    <Card className="border-border bg-card shadow-card hover:shadow-card-hover transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {platformLogos[integration.platform_name as keyof typeof platformLogos] || '🔗'}
            </div>
            <div>
              <CardTitle className="text-lg capitalize">{integration.platform_name}</CardTitle>
              <CardDescription className="text-sm">
                {integration.platform_type === 'ecommerce' && 'E-commerce'}
                {integration.platform_type === 'marketplace' && 'Marketplace'}
                {integration.platform_type === 'payment' && 'Paiement'}
                {integration.platform_type === 'marketing' && 'Marketing'}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`${statusConfig[integration.connection_status].color} text-white`}
            >
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig[integration.connection_status].text}
            </Badge>
            <Switch
              checked={integration.is_active}
              onCheckedChange={(checked) => updateIntegration(integration.id, { is_active: checked })}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {integration.shop_domain && (
          <div className="text-sm text-muted-foreground">
            Domaine: {integration.shop_domain}
          </div>
        )}
        
        {integration.last_sync_at && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            Dernière sync: {new Date(integration.last_sync_at).toLocaleDateString('fr-FR')}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-1" />
                Configurer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Configuration {integration.platform_name}</DialogTitle>
                <DialogDescription>
                  Configurez les paramètres de connexion pour cette plateforme
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {integration.platform_name === 'shopify' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="shop_domain">Domaine de la boutique</Label>
                      <Input
                        id="shop_domain"
                        placeholder="monshop.myshopify.com"
                        value={config.shop_domain || ''}
                        onChange={(e) => setConfig({...config, shop_domain: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="api_key">Clé API</Label>
                      <Input
                        id="api_key"
                        type="password"
                        value={config.api_key || ''}
                        onChange={(e) => setConfig({...config, api_key: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="access_token">Token d'accès</Label>
                      <Input
                        id="access_token"
                        type="password"
                        value={config.access_token || ''}
                        onChange={(e) => setConfig({...config, access_token: e.target.value})}
                      />
                    </div>
                  </>
                )}

                {integration.platform_name === 'amazon' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="seller_id">Seller ID</Label>
                      <Input
                        id="seller_id"
                        value={config.seller_id || ''}
                        onChange={(e) => setConfig({...config, seller_id: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="api_key">MWS API Key</Label>
                      <Input
                        id="api_key"
                        type="password"
                        value={config.api_key || ''}
                        onChange={(e) => setConfig({...config, api_key: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="api_secret">MWS Secret Key</Label>
                      <Input
                        id="api_secret"
                        type="password"
                        value={config.api_secret || ''}
                        onChange={(e) => setConfig({...config, api_secret: e.target.value})}
                      />
                    </div>
                  </>
                )}

                {(integration.platform_name === 'woocommerce' || integration.platform_name === 'bigcommerce') && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="platform_url">URL de la boutique</Label>
                      <Input
                        id="platform_url"
                        placeholder="https://monshop.com"
                        value={config.platform_url || ''}
                        onChange={(e) => setConfig({...config, platform_url: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="api_key">Clé API</Label>
                      <Input
                        id="api_key"
                        type="password"
                        value={config.api_key || ''}
                        onChange={(e) => setConfig({...config, api_key: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="api_secret">Secret API</Label>
                      <Input
                        id="api_secret"
                        type="password"
                        value={config.api_secret || ''}
                        onChange={(e) => setConfig({...config, api_secret: e.target.value})}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="sync_frequency">Fréquence de synchronisation</Label>
                  <Select 
                    value={config.sync_frequency} 
                    onValueChange={(value) => setConfig({...config, sync_frequency: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manuel</SelectItem>
                      <SelectItem value="hourly">Toutes les heures</SelectItem>
                      <SelectItem value="daily">Quotidien</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave} variant="hero">
                  Sauvegarder
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={handleTest}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Tester
          </Button>

          {integration.connection_status === 'connected' && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleSync('products')}>
                <Package className="w-4 h-4 mr-1" />
                Sync Produits
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleSync('orders')}>
                <ShoppingCart className="w-4 h-4 mr-1" />
                Sync Commandes
              </Button>
            </>
          )}

          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-1" />
            Supprimer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};