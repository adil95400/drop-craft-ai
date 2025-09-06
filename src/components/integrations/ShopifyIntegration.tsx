import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, 
  Settings, 
  RefreshCw, 
  Check, 
  AlertCircle,
  ExternalLink,
  ShoppingBag,
  DollarSign,
  Package,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

interface ShopifyConfig {
  shopDomain: string;
  apiKey: string;
  apiSecret: string;
  accessToken?: string;
  webhookSecret?: string;
  syncProducts: boolean;
  syncOrders: boolean;
  syncCustomers: boolean;
  syncInventory: boolean;
  autoPublish: boolean;
  priceMultiplier: number;
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  productStatus: 'active' | 'draft';
  locationId?: string;
}

interface ShopifyIntegrationProps {
  integration?: any;
  onSave: (config: ShopifyConfig) => Promise<void>;
  onSync: () => Promise<void>;
  onTest: () => Promise<boolean>;
  isConnected: boolean;
  stats?: {
    products: number;
    orders: number;
    customers: number;
    lastSync?: string;
  };
}

export const ShopifyIntegration: React.FC<ShopifyIntegrationProps> = ({
  integration,
  onSave,
  onSync,
  onTest,
  isConnected,
  stats
}) => {
  const [config, setConfig] = useState<ShopifyConfig>({
    shopDomain: integration?.shop_domain || '',
    apiKey: integration?.sync_settings?.apiKey || '',
    apiSecret: integration?.sync_settings?.apiSecret || '',
    accessToken: integration?.sync_settings?.accessToken || '',
    webhookSecret: integration?.sync_settings?.webhookSecret || '',
    syncProducts: integration?.sync_settings?.syncProducts ?? true,
    syncOrders: integration?.sync_settings?.syncOrders ?? true,
    syncCustomers: integration?.sync_settings?.syncCustomers ?? false,
    syncInventory: integration?.sync_settings?.syncInventory ?? true,
    autoPublish: integration?.sync_settings?.autoPublish ?? false,
    priceMultiplier: integration?.sync_settings?.priceMultiplier ?? 1.0,
    syncFrequency: integration?.sync_settings?.syncFrequency || 'daily',
    productStatus: integration?.sync_settings?.productStatus || 'draft',
    locationId: integration?.sync_settings?.locationId || ''
  });

  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(config);
      toast.success('Configuration Shopify sauvegardée');
    } catch (error: any) {
      toast.error('Erreur lors de la sauvegarde: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      const success = await onTest();
      if (success) {
        toast.success('Connexion Shopify réussie');
      } else {
        toast.error('Échec de la connexion Shopify');
      }
    } catch (error: any) {
      toast.error('Erreur de test: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await onSync();
      toast.success('Synchronisation lancée');
    } catch (error: any) {
      toast.error('Erreur de synchronisation: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const generateWebhookUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/webhooks/shopify`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Store className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Shopify Integration</h3>
            <p className="text-sm text-muted-foreground">
              Synchronisez vos produits avec votre boutique Shopify
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? 'Connecté' : 'Déconnecté'}
          </Badge>
          {isConnected && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Synchroniser
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {isConnected && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Produits</p>
                  <p className="text-2xl font-bold">{stats.products}</p>
                </div>
                <ShoppingBag className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Commandes</p>
                  <p className="text-2xl font-bold">{stats.orders}</p>
                </div>
                <Package className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Clients</p>
                  <p className="text-2xl font-bold">{stats.customers}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dernière sync</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.lastSync ? new Date(stats.lastSync).toLocaleDateString() : 'Jamais'}
                  </p>
                </div>
                <RefreshCw className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Configuration Tabs */}
      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connection">Connexion</TabsTrigger>
          <TabsTrigger value="sync">Synchronisation</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="advanced">Avancé</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration de la boutique</CardTitle>
              <CardDescription>
                Connectez votre boutique Shopify avec vos identifiants API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shopDomain">Domaine de la boutique</Label>
                <Input
                  id="shopDomain"
                  placeholder="monshop.myshopify.com"
                  value={config.shopDomain}
                  onChange={(e) => setConfig(prev => ({ ...prev, shopDomain: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Votre domaine Shopify complet (ex: monshop.myshopify.com)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">Clé API</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Entrez votre clé API Shopify"
                  value={config.apiKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiSecret">Secret API</Label>
                <Input
                  id="apiSecret"
                  type="password"
                  placeholder="Entrez votre secret API Shopify"
                  value={config.apiSecret}
                  onChange={(e) => setConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessToken">Token d'accès (optionnel)</Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="Token d'accès pour l'API Admin"
                  value={config.accessToken}
                  onChange={(e) => setConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleTest}
                  disabled={testing || !config.shopDomain || !config.apiKey}
                >
                  {testing ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Tester la connexion
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de synchronisation</CardTitle>
              <CardDescription>
                Configurez ce qui doit être synchronisé avec Shopify
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Synchroniser les produits</Label>
                    <p className="text-xs text-muted-foreground">Importer/exporter les produits</p>
                  </div>
                  <Switch
                    checked={config.syncProducts}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, syncProducts: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Synchroniser les commandes</Label>
                    <p className="text-xs text-muted-foreground">Récupérer les commandes</p>
                  </div>
                  <Switch
                    checked={config.syncOrders}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, syncOrders: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Synchroniser l'inventaire</Label>
                    <p className="text-xs text-muted-foreground">Mettre à jour le stock</p>
                  </div>
                  <Switch
                    checked={config.syncInventory}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, syncInventory: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Publication automatique</Label>
                    <p className="text-xs text-muted-foreground">Publier les nouveaux produits</p>
                  </div>
                  <Switch
                    checked={config.autoPublish}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoPublish: checked }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fréquence de synchronisation</Label>
                  <Select
                    value={config.syncFrequency}
                    onValueChange={(value: any) => setConfig(prev => ({ ...prev, syncFrequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Temps réel</SelectItem>
                      <SelectItem value="hourly">Toutes les heures</SelectItem>
                      <SelectItem value="daily">Quotidiennement</SelectItem>
                      <SelectItem value="weekly">Hebdomadairement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Statut des nouveaux produits</Label>
                  <Select
                    value={config.productStatus}
                    onValueChange={(value: any) => setConfig(prev => ({ ...prev, productStatus: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="draft">Brouillon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Multiplicateur de prix</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={config.priceMultiplier}
                  onChange={(e) => setConfig(prev => ({ ...prev, priceMultiplier: parseFloat(e.target.value) || 1.0 }))}
                />
                <p className="text-xs text-muted-foreground">
                  Multiplier les prix par ce facteur (1.0 = prix original, 1.2 = +20%)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des Webhooks</CardTitle>
              <CardDescription>
                Configurez les webhooks pour la synchronisation temps réel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">URL de Webhook</h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Ajoutez cette URL dans votre admin Shopify pour activer la sync temps réel
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="bg-white px-2 py-1 rounded text-xs">
                        {generateWebhookUrl()}
                      </code>
                      <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(generateWebhookUrl())}>
                        Copier
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookSecret">Secret Webhook (optionnel)</Label>
                <Input
                  id="webhookSecret"
                  type="password"
                  placeholder="Secret pour valider les webhooks"
                  value={config.webhookSecret}
                  onChange={(e) => setConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
                />
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open('https://admin.shopify.com/settings/notifications', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ouvrir les paramètres Shopify
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres avancés</CardTitle>
              <CardDescription>
                Configuration avancée pour les utilisateurs experts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>ID de l'emplacement (Location ID)</Label>
                <Input
                  placeholder="ID de l'emplacement Shopify"
                  value={config.locationId}
                  onChange={(e) => setConfig(prev => ({ ...prev, locationId: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  ID de l'emplacement pour la gestion du stock (optionnel)
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Synchroniser les clients</Label>
                  <p className="text-xs text-muted-foreground">
                    Importer les données clients (RGPD compliant)
                  </p>
                </div>
                <Switch
                  checked={config.syncCustomers}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, syncCustomers: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
        </Button>
      </div>
    </div>
  );
};

export default ShopifyIntegration;