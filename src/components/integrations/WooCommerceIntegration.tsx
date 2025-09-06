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
  Globe, 
  Settings, 
  RefreshCw, 
  Check, 
  AlertCircle,
  ExternalLink,
  ShoppingBag,
  Package,
  Download,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

interface WooCommerceConfig {
  siteUrl: string;
  consumerKey: string;
  consumerSecret: string;
  version: 'v3' | 'v2' | 'v1';
  syncProducts: boolean;
  syncOrders: boolean;
  syncCategories: boolean;
  syncStock: boolean;
  syncImages: boolean;
  autoPublish: boolean;
  priceMultiplier: number;
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  productStatus: 'publish' | 'draft' | 'pending';
  taxClass?: string;
  shippingClass?: string;
  manageStock: boolean;
  stockStatus: 'instock' | 'outofstock' | 'onbackorder';
}

interface WooCommerceIntegrationProps {
  integration?: any;
  onSave: (config: WooCommerceConfig) => Promise<void>;
  onSync: () => Promise<void>;
  onTest: () => Promise<boolean>;
  isConnected: boolean;
  stats?: {
    products: number;
    orders: number;
    categories: number;
    lastSync?: string;
  };
}

export const WooCommerceIntegration: React.FC<WooCommerceIntegrationProps> = ({
  integration,
  onSave,
  onSync,
  onTest,
  isConnected,
  stats
}) => {
  const [config, setConfig] = useState<WooCommerceConfig>({
    siteUrl: integration?.platform_url || '',
    consumerKey: integration?.sync_settings?.consumerKey || '',
    consumerSecret: integration?.sync_settings?.consumerSecret || '',
    version: integration?.sync_settings?.version || 'v3',
    syncProducts: integration?.sync_settings?.syncProducts ?? true,
    syncOrders: integration?.sync_settings?.syncOrders ?? true,
    syncCategories: integration?.sync_settings?.syncCategories ?? true,
    syncStock: integration?.sync_settings?.syncStock ?? true,
    syncImages: integration?.sync_settings?.syncImages ?? true,
    autoPublish: integration?.sync_settings?.autoPublish ?? false,
    priceMultiplier: integration?.sync_settings?.priceMultiplier ?? 1.0,
    syncFrequency: integration?.sync_settings?.syncFrequency || 'daily',
    productStatus: integration?.sync_settings?.productStatus || 'draft',
    taxClass: integration?.sync_settings?.taxClass || '',
    shippingClass: integration?.sync_settings?.shippingClass || '',
    manageStock: integration?.sync_settings?.manageStock ?? true,
    stockStatus: integration?.sync_settings?.stockStatus || 'instock'
  });

  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(config);
      toast.success('Configuration WooCommerce sauvegardée');
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
        toast.success('Connexion WooCommerce réussie');
      } else {
        toast.error('Échec de la connexion WooCommerce');
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

  const generatePluginDownloadUrl = () => {
    return 'https://github.com/your-org/woocommerce-plugin/releases/latest';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">WooCommerce Integration</h3>
            <p className="text-sm text-muted-foreground">
              Synchronisez avec votre boutique WordPress WooCommerce
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
                  <p className="text-sm text-muted-foreground">Catégories</p>
                  <p className="text-2xl font-bold">{stats.categories}</p>
                </div>
                <Settings className="w-8 h-8 text-purple-500" />
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
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="plugin">Plugin</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration de l'API WooCommerce</CardTitle>
              <CardDescription>
                Connectez votre boutique WooCommerce avec les clés API REST
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteUrl">URL du site WordPress</Label>
                <Input
                  id="siteUrl"
                  placeholder="https://monsite.com"
                  value={config.siteUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, siteUrl: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  L'URL complète de votre site WordPress avec WooCommerce
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">Version de l'API</Label>
                <Select
                  value={config.version}
                  onValueChange={(value: any) => setConfig(prev => ({ ...prev, version: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="v3">WC REST API v3 (Recommandé)</SelectItem>
                    <SelectItem value="v2">WC REST API v2</SelectItem>
                    <SelectItem value="v1">WC REST API v1 (Legacy)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="consumerKey">Consumer Key</Label>
                <Input
                  id="consumerKey"
                  type="password"
                  placeholder="ck_xxxxxxxxxxxxxxxx"
                  value={config.consumerKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, consumerKey: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="consumerSecret">Consumer Secret</Label>
                <Input
                  id="consumerSecret"
                  type="password"
                  placeholder="cs_xxxxxxxxxxxxxxxx"
                  value={config.consumerSecret}
                  onChange={(e) => setConfig(prev => ({ ...prev, consumerSecret: e.target.value }))}
                />
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900">Générer les clés API</h4>
                    <p className="text-sm text-amber-700 mb-2">
                      Allez dans WooCommerce → Réglages → Avancé → Clés API pour générer vos clés
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`${config.siteUrl}/wp-admin/admin.php?page=wc-settings&tab=advanced&section=keys`, '_blank')}
                      disabled={!config.siteUrl}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ouvrir WooCommerce
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleTest}
                  disabled={testing || !config.siteUrl || !config.consumerKey}
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
                Configurez ce qui doit être synchronisé avec WooCommerce
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
                    <Label>Synchroniser les catégories</Label>
                    <p className="text-xs text-muted-foreground">Créer les catégories automatiquement</p>
                  </div>
                  <Switch
                    checked={config.syncCategories}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, syncCategories: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Synchroniser le stock</Label>
                    <p className="text-xs text-muted-foreground">Mettre à jour les quantités</p>
                  </div>
                  <Switch
                    checked={config.syncStock}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, syncStock: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Synchroniser les images</Label>
                    <p className="text-xs text-muted-foreground">Télécharger les images produits</p>
                  </div>
                  <Switch
                    checked={config.syncImages}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, syncImages: checked }))}
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
                  <Label>Multiplicateur de prix</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={config.priceMultiplier}
                    onChange={(e) => setConfig(prev => ({ ...prev, priceMultiplier: parseFloat(e.target.value) || 1.0 }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des produits</CardTitle>
              <CardDescription>
                Paramètres spécifiques aux produits WooCommerce
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Statut par défaut</Label>
                  <Select
                    value={config.productStatus}
                    onValueChange={(value: any) => setConfig(prev => ({ ...prev, productStatus: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publish">Publié</SelectItem>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Statut du stock</Label>
                  <Select
                    value={config.stockStatus}
                    onValueChange={(value: any) => setConfig(prev => ({ ...prev, stockStatus: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instock">En stock</SelectItem>
                      <SelectItem value="outofstock">Rupture de stock</SelectItem>
                      <SelectItem value="onbackorder">En réassort</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Classe de taxe (optionnel)</Label>
                <Input
                  placeholder="standard, reduced-rate, zero-rate..."
                  value={config.taxClass}
                  onChange={(e) => setConfig(prev => ({ ...prev, taxClass: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Classe de taxe pour tous les produits importés
                </p>
              </div>

              <div className="space-y-2">
                <Label>Classe de livraison (optionnel)</Label>
                <Input
                  placeholder="heavy, light, fragile..."
                  value={config.shippingClass}
                  onChange={(e) => setConfig(prev => ({ ...prev, shippingClass: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Classe de livraison pour calculer les frais de port
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Gérer le stock</Label>
                  <p className="text-xs text-muted-foreground">
                    Activer la gestion de stock WooCommerce
                  </p>
                </div>
                <Switch
                  checked={config.manageStock}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, manageStock: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plugin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plugin WooCommerce</CardTitle>
              <CardDescription>
                Installez notre plugin pour une synchronisation optimale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Download className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Plugin Recommandé</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Notre plugin WordPress améliore les performances et ajoute des fonctionnalités avancées
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Synchronisation temps réel via webhooks</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Gestion avancée des variations</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Optimisation SEO automatique</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Synchronisation des images en arrière-plan</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(generatePluginDownloadUrl(), '_blank')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger le plugin
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open('https://docs.example.com/woocommerce-plugin', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Documentation
                </Button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Installation manuelle</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                  <li>Téléchargez le fichier .zip du plugin</li>
                  <li>Allez dans WordPress Admin → Extensions → Ajouter</li>
                  <li>Cliquez sur "Téléverser une extension"</li>
                  <li>Sélectionnez le fichier .zip et activez le plugin</li>
                  <li>Configurez les paramètres dans WooCommerce → Sync</li>
                </ol>
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

export default WooCommerceIntegration;