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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
  Database,
  Activity,
  BarChart3,
  Globe,
  Key,
  Webhook,
  Timer,
  CheckCircle,
  XCircle,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Integration, useIntegrations } from '@/hooks/useIntegrations';

interface IntegrationCardProps {
  integration: Integration;
  onEdit?: (integration: Integration) => void;
}

export const IntegrationCard = ({ integration, onEdit }: IntegrationCardProps) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [config, setConfig] = useState(integration);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string>('');
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
    setIsTesting(true);
    setTestResult(null);
    try {
      const success = await testConnection(integration.id);
      setTestResult({ success, timestamp: Date.now() });
    } catch (error) {
      setTestResult({ success: false, error: error.message, timestamp: Date.now() });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSync = async (syncType: 'products' | 'orders' | 'inventory' | 'customers') => {
    setIsSyncing(syncType);
    try {
      await syncData(integration.id, syncType);
    } catch (error) {
      console.error(`Error syncing ${syncType}:`, error);
    } finally {
      setIsSyncing('');
    }
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

        {testResult && (
          <div className={`p-3 rounded-lg border ${testResult.success ? 'bg-green-50 border-green-200 dark:bg-green-950/20' : 'bg-red-50 border-red-200 dark:bg-red-950/20'}`}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {testResult.success ? 'Connexion réussie' : 'Connexion échouée'}
              </span>
            </div>
            {testResult.error && (
              <p className="text-sm text-red-600 mt-1">{testResult.error}</p>
            )}
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Configuration {integration.platform_name}</DialogTitle>
                <DialogDescription>
                  Configurez les paramètres de connexion et options avancées
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="connection" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="connection">Connexion</TabsTrigger>
                  <TabsTrigger value="sync">Synchronisation</TabsTrigger>
                  <TabsTrigger value="advanced">Avancé</TabsTrigger>
                </TabsList>

                <TabsContent value="connection" className="space-y-4 py-4">
                  {integration.platform_name === 'shopify' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="shop_domain">Domaine de la boutique *</Label>
                        <Input
                          id="shop_domain"
                          placeholder="monshop.myshopify.com"
                          value={config.shop_domain || ''}
                          onChange={(e) => setConfig({...config, shop_domain: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="api_key">Clé API *</Label>
                        <Input
                          id="api_key"
                          type="password"
                          value={config.api_key || ''}
                          onChange={(e) => setConfig({...config, api_key: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="access_token">Token d'accès *</Label>
                        <Input
                          id="access_token"
                          type="password"
                          value={config.access_token || ''}
                          onChange={(e) => setConfig({...config, access_token: e.target.value})}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                        <strong>📋 Instructions Shopify :</strong><br/>
                        1. Allez dans Paramètres → Applications et ventes → Développer des applications<br/>
                        2. Créez une application privée<br/>
                        3. Activez Admin API et sélectionnez les autorisations nécessaires<br/>
                        4. Copiez la clé API et le token d'accès ici
                      </div>
                    </>
                  )}

                  {integration.platform_name === 'amazon' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="seller_id">Seller ID *</Label>
                        <Input
                          id="seller_id"
                          value={config.seller_id || ''}
                          onChange={(e) => setConfig({...config, seller_id: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="api_key">MWS API Key *</Label>
                        <Input
                          id="api_key"
                          type="password"
                          value={config.api_key || ''}
                          onChange={(e) => setConfig({...config, api_key: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="api_secret">MWS Secret Key *</Label>
                        <Input
                          id="api_secret"
                          type="password"
                          value={config.api_secret || ''}
                          onChange={(e) => setConfig({...config, api_secret: e.target.value})}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                        <strong>📋 Instructions Amazon :</strong><br/>
                        1. Connectez-vous à Seller Central<br/>
                        2. Paramètres → Paramètres du compte → API Marketplace Web Service<br/>
                        3. Générez vos clés MWS<br/>
                        4. Trouvez votre Seller ID dans Paramètres → Informations sur le compte
                      </div>
                    </>
                  )}

                  {(integration.platform_name === 'woocommerce' || integration.platform_name === 'bigcommerce') && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="platform_url">URL de la boutique *</Label>
                        <Input
                          id="platform_url"
                          placeholder="https://monshop.com"
                          value={config.platform_url || ''}
                          onChange={(e) => setConfig({...config, platform_url: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="api_key">Clé API *</Label>
                        <Input
                          id="api_key"
                          type="password"
                          value={config.api_key || ''}
                          onChange={(e) => setConfig({...config, api_key: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="api_secret">Secret API *</Label>
                        <Input
                          id="api_secret"
                          type="password"
                          value={config.api_secret || ''}
                          onChange={(e) => setConfig({...config, api_secret: e.target.value})}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                        <strong>📋 Instructions {integration.platform_name === 'woocommerce' ? 'WooCommerce' : 'BigCommerce'} :</strong><br/>
                        {integration.platform_name === 'woocommerce' ? (
                          <>1. WordPress Admin → WooCommerce → Paramètres → Avancé → API REST<br/>2. Créez une nouvelle clé API<br/>3. Autorisations : Lecture/Écriture</>
                        ) : (
                          <>1. Admin Panel → Paramètres avancés → API Accounts<br/>2. Créez un nouveau token<br/>3. Sélectionnez les autorisations requises</>
                        )}
                      </div>
                    </>
                  )}

                  <Button 
                    onClick={handleTest} 
                    variant="outline" 
                    className="w-full"
                    disabled={isTesting}
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${isTesting ? 'animate-spin' : ''}`} />
                    {isTesting ? 'Test en cours...' : 'Tester la connexion'}
                  </Button>
                </TabsContent>

                <TabsContent value="sync" className="space-y-4 py-4">
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

                  <div className="space-y-3">
                    <Label>Types de données à synchroniser</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col"
                        onClick={() => handleSync('products')}
                        disabled={isSyncing === 'products' || integration.connection_status !== 'connected'}
                      >
                        <Package className={`w-6 h-6 mb-1 ${isSyncing === 'products' ? 'animate-pulse' : ''}`} />
                        <span className="text-sm">Produits</span>
                        {isSyncing === 'products' && <span className="text-xs text-muted-foreground">En cours...</span>}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col"
                        onClick={() => handleSync('orders')}
                        disabled={isSyncing === 'orders' || integration.connection_status !== 'connected'}
                      >
                        <ShoppingCart className={`w-6 h-6 mb-1 ${isSyncing === 'orders' ? 'animate-pulse' : ''}`} />
                        <span className="text-sm">Commandes</span>
                        {isSyncing === 'orders' && <span className="text-xs text-muted-foreground">En cours...</span>}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col"
                        onClick={() => handleSync('customers')}
                        disabled={isSyncing === 'customers' || integration.connection_status !== 'connected'}
                      >
                        <Users className={`w-6 h-6 mb-1 ${isSyncing === 'customers' ? 'animate-pulse' : ''}`} />
                        <span className="text-sm">Clients</span>
                        {isSyncing === 'customers' && <span className="text-xs text-muted-foreground">En cours...</span>}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col"
                        onClick={() => handleSync('inventory')}
                        disabled={isSyncing === 'inventory' || integration.connection_status !== 'connected'}
                      >
                        <Database className={`w-6 h-6 mb-1 ${isSyncing === 'inventory' ? 'animate-pulse' : ''}`} />
                        <span className="text-sm">Stock</span>
                        {isSyncing === 'inventory' && <span className="text-xs text-muted-foreground">En cours...</span>}
                      </Button>
                    </div>
                  </div>

                  {integration.connection_status !== 'connected' && (
                    <div className="text-sm text-muted-foreground bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg">
                      <AlertCircle className="w-4 h-4 inline mr-2" />
                      Vous devez d'abord établir une connexion réussie pour pouvoir synchroniser les données.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4 py-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="webhooks">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Webhook className="w-4 h-4" />
                          Webhooks
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <div className="space-y-2">
                          <Label>URL de webhook</Label>
                          <Input 
                            placeholder="https://votre-domaine.com/webhook"
                            value={config.store_config?.webhook_url || ''}
                            onChange={(e) => setConfig({
                              ...config, 
                              store_config: { ...config.store_config, webhook_url: e.target.value }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Secret webhook</Label>
                          <Input 
                            type="password"
                            placeholder="Secret pour vérifier l'authenticité"
                            value={config.store_config?.webhook_secret || ''}
                            onChange={(e) => setConfig({
                              ...config, 
                              store_config: { ...config.store_config, webhook_secret: e.target.value }
                            })}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="limits">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4" />
                          Limites et quotas
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Limite par minute</Label>
                            <Input 
                              type="number"
                              placeholder="40"
                              value={config.store_config?.rate_limit || ''}
                              onChange={(e) => setConfig({
                                ...config, 
                                store_config: { ...config.store_config, rate_limit: e.target.value }
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Timeout (s)</Label>
                            <Input 
                              type="number"
                              placeholder="30"
                              value={config.store_config?.timeout || ''}
                              onChange={(e) => setConfig({
                                ...config, 
                                store_config: { ...config.store_config, timeout: e.target.value }
                              })}
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="mapping">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Mapping des champs
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <div className="space-y-2">
                          <Label>Configuration personnalisée</Label>
                          <Textarea 
                            placeholder='{"price_field": "price", "title_field": "name"}'
                            value={JSON.stringify(config.store_config?.field_mapping || {}, null, 2)}
                            onChange={(e) => {
                              try {
                                const mapping = JSON.parse(e.target.value);
                                setConfig({
                                  ...config, 
                                  store_config: { ...config.store_config, field_mapping: mapping }
                                });
                              } catch (error) {
                                // Invalid JSON, ignore
                              }
                            }}
                            rows={4}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>
              </Tabs>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave} variant="hero">
                  Sauvegarder
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={handleTest} disabled={isTesting}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'Test...' : 'Tester'}
          </Button>

          {integration.connection_status === 'connected' && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSync('products')}
                disabled={isSyncing === 'products'}
              >
                <Package className={`w-4 h-4 mr-1 ${isSyncing === 'products' ? 'animate-pulse' : ''}`} />
                {isSyncing === 'products' ? 'Sync...' : 'Produits'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSync('orders')}
                disabled={isSyncing === 'orders'}
              >
                <ShoppingCart className={`w-4 h-4 mr-1 ${isSyncing === 'orders' ? 'animate-pulse' : ''}`} />
                {isSyncing === 'orders' ? 'Sync...' : 'Commandes'}
              </Button>
            </>
          )}

          <Dialog open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Zap className="w-4 h-4 mr-1" />
                Actions
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Actions avancées</DialogTitle>
                <DialogDescription>
                  Gérez votre intégration {integration.platform_name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-3 py-4">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter la configuration
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Upload className="w-4 h-4 mr-2" />
                  Importer la configuration
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="w-4 h-4 mr-2" />
                  Voir les logs détaillés
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Statistiques de performance
                </Button>
                <Button variant="destructive" className="w-full justify-start" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer l'intégration
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};