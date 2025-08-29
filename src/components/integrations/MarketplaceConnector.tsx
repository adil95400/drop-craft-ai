import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  ShoppingCart, Settings, Link, Unlink, RotateCcw, AlertCircle, 
  CheckCircle, Clock, Globe, Zap, TrendingUp 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Plateformes basées sur votre capture d'écran
const PLATFORMS = [
  // Marketplaces principales
  { id: 'amazon', name: 'Amazon', type: 'marketplace', icon: '🛒', color: 'bg-orange-500', regions: ['US', 'EU', 'UK', 'CA', 'JP'] },
  { id: 'ebay', name: 'eBay', type: 'marketplace', icon: '🏪', color: 'bg-blue-500', regions: ['US', 'UK', 'DE', 'FR'] },
  { id: 'aliexpress', name: 'AliExpress', type: 'supplier', icon: '🚀', color: 'bg-red-500' },
  { id: 'cdiscount', name: 'CDiscount', type: 'marketplace', icon: '💳', color: 'bg-purple-500', regions: ['FR'] },
  { id: 'fnac', name: 'Fnac', type: 'marketplace', icon: '📚', color: 'bg-yellow-600', regions: ['FR'] },
  { id: 'carrefour', name: 'Carrefour', type: 'marketplace', icon: '🛍️', color: 'bg-blue-600', regions: ['FR'] },
  
  // Retailers européens
  { id: 'rakuten', name: 'Rakuten', type: 'marketplace', icon: '🎯', color: 'bg-red-600', regions: ['FR', 'UK', 'DE'] },
  { id: 'allegro', name: 'Allegro', type: 'marketplace', icon: '🇵🇱', color: 'bg-orange-600', regions: ['PL'] },
  { id: 'kaufland', name: 'Kaufland.de', type: 'marketplace', icon: '🇩🇪', color: 'bg-red-700', regions: ['DE'] },
  { id: 'worten', name: 'Worten', type: 'marketplace', icon: '⚡', color: 'bg-red-800', regions: ['PT'] },
  { id: 'conforama', name: 'Conforama', type: 'marketplace', icon: '🏡', color: 'bg-green-600', regions: ['FR'] },
  
  // E-commerce platforms
  { id: 'shopify', name: 'Shopify', type: 'ecommerce', icon: '🛍️', color: 'bg-green-500' },
  { id: 'woocommerce', name: 'WooCommerce', type: 'ecommerce', icon: '🌐', color: 'bg-purple-600' },
  { id: 'prestashop', name: 'PrestaShop', type: 'ecommerce', icon: '🏪', color: 'bg-pink-500' },
  { id: 'wix', name: 'Wix', type: 'ecommerce', icon: '✨', color: 'bg-blue-400' },
  
  // Social Commerce
  { id: 'instagram', name: 'Instagram', type: 'social', icon: '📷', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { id: 'facebook', name: 'Facebook', type: 'social', icon: '👥', color: 'bg-blue-700' },
  { id: 'tiktok', name: 'TikTok', type: 'social', icon: '🎵', color: 'bg-black' },
  { id: 'pinterest', name: 'Pinterest', type: 'social', icon: '📌', color: 'bg-red-500' },
  { id: 'youtube', name: 'YouTube', type: 'social', icon: '📺', color: 'bg-red-600' }
];

export function MarketplaceConnector() {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [connectionDialog, setConnectionDialog] = useState(false);
  const [syncProgress, setSyncProgress] = useState({});

  const connectPlatform = async (platform, credentials, config = {}) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('marketplace-connector', {
        body: {
          action: 'connect',
          platform: platform.id,
          credentials,
          config
        }
      });

      if (error) throw error;

      toast({
        title: "Plateforme connectée",
        description: `${platform.name} a été connecté avec succès`
      });

      setConnectionDialog(false);
      // Refresh integrations list
      loadIntegrations();

    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const syncPlatform = async (platform) => {
    try {
      setSyncProgress(prev => ({ ...prev, [platform.id]: 0 }));
      
      const { data, error } = await supabase.functions.invoke('marketplace-connector', {
        body: {
          action: 'sync_products',
          platform: platform.id
        }
      });

      if (error) throw error;

      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        setSyncProgress(prev => ({ ...prev, [platform.id]: i }));
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      toast({
        title: "Synchronisation terminée",
        description: `${data.synced_products} produits synchronisés depuis ${platform.name}`
      });

    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSyncProgress(prev => ({ ...prev, [platform.id]: undefined }));
    }
  };

  const loadIntegrations = async () => {
    // Load user integrations from database
    const { data } = await supabase
      .from('platform_integrations')
      .select('*')
      .order('created_at', { ascending: false });
    
    setIntegrations(data || []);
  };

  React.useEffect(() => {
    loadIntegrations();
  }, []);

  const getIntegrationStatus = (platformId) => {
    const integration = integrations.find(i => i.platform_name === platformId);
    return integration?.is_active ? 'connected' : 'disconnected';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Connecteurs Multi-Canaux</h2>
        <p className="text-muted-foreground">
          Connectez-vous à toutes les principales plateformes e-commerce et marketplaces
        </p>
      </div>

      <Tabs defaultValue="marketplaces" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="marketplaces">Marketplaces</TabsTrigger>
          <TabsTrigger value="ecommerce">E-commerce</TabsTrigger>
          <TabsTrigger value="social">Social Commerce</TabsTrigger>
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplaces" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PLATFORMS.filter(p => p.type === 'marketplace').map((platform) => (
              <PlatformCard 
                key={platform.id}
                platform={platform}
                status={getIntegrationStatus(platform.id)}
                onConnect={() => {
                  setSelectedPlatform(platform);
                  setConnectionDialog(true);
                }}
                onSync={() => syncPlatform(platform)}
                syncProgress={syncProgress[platform.id]}
                loading={loading}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ecommerce" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PLATFORMS.filter(p => p.type === 'ecommerce').map((platform) => (
              <PlatformCard 
                key={platform.id}
                platform={platform}
                status={getIntegrationStatus(platform.id)}
                onConnect={() => {
                  setSelectedPlatform(platform);
                  setConnectionDialog(true);
                }}
                onSync={() => syncPlatform(platform)}
                syncProgress={syncProgress[platform.id]}
                loading={loading}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PLATFORMS.filter(p => p.type === 'social').map((platform) => (
              <PlatformCard 
                key={platform.id}
                platform={platform}
                status={getIntegrationStatus(platform.id)}
                onConnect={() => {
                  setSelectedPlatform(platform);
                  setConnectionDialog(true);
                }}
                onSync={() => syncPlatform(platform)}
                syncProgress={syncProgress[platform.id]}
                loading={loading}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PLATFORMS.filter(p => p.type === 'supplier').map((platform) => (
              <PlatformCard 
                key={platform.id}
                platform={platform}
                status={getIntegrationStatus(platform.id)}
                onConnect={() => {
                  setSelectedPlatform(platform);
                  setConnectionDialog(true);
                }}
                onSync={() => syncPlatform(platform)}
                syncProgress={syncProgress[platform.id]}
                loading={loading}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Connection Dialog */}
      <Dialog open={connectionDialog} onOpenChange={setConnectionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connecter {selectedPlatform?.name}</DialogTitle>
            <DialogDescription>
              Configurez vos identifiants pour {selectedPlatform?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedPlatform && (
            <ConnectionForm 
              platform={selectedPlatform}
              onConnect={connectPlatform}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlatformCard({ platform, status, onConnect, onSync, syncProgress, loading }) {
  const isConnected = status === 'connected';
  const isSyncing = syncProgress !== undefined;

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center text-white text-lg`}>
              {platform.icon}
            </div>
            <div>
              <CardTitle className="text-lg">{platform.name}</CardTitle>
              <p className="text-sm text-muted-foreground capitalize">{platform.type}</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? (
              <><CheckCircle className="w-3 h-3 mr-1" /> Connecté</>
            ) : (
              <><Unlink className="w-3 h-3 mr-1" /> Déconnecté</>
            )}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {platform.regions && (
          <div className="flex flex-wrap gap-1">
            {platform.regions.map(region => (
              <Badge key={region} variant="outline" className="text-xs">
                {region}
              </Badge>
            ))}
          </div>
        )}

        {isSyncing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Synchronisation...</span>
              <span>{syncProgress}%</span>
            </div>
            <Progress value={syncProgress} className="h-2" />
          </div>
        )}

        <div className="flex space-x-2">
          {!isConnected ? (
            <Button 
              onClick={onConnect} 
              className="flex-1"
              disabled={loading}
            >
              <Link className="w-4 h-4 mr-2" />
              Connecter
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onSync}
                disabled={isSyncing}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <Button 
                onClick={onSync}
                className="flex-1"
                disabled={isSyncing}
              >
                {isSyncing ? 'Sync...' : 'Synchroniser'}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ConnectionForm({ platform, onConnect, loading }) {
  const [credentials, setCredentials] = useState({});
  const [config, setConfig] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    onConnect(platform, credentials, config);
  };

  const getCredentialFields = () => {
    switch (platform.id) {
      case 'amazon':
        return [
          { key: 'access_key', label: 'Access Key', type: 'text', required: true },
          { key: 'secret_key', label: 'Secret Key', type: 'password', required: true },
          { key: 'marketplace_id', label: 'Marketplace ID', type: 'text', required: true }
        ];
      case 'ebay':
        return [
          { key: 'client_id', label: 'Client ID', type: 'text', required: true },
          { key: 'client_secret', label: 'Client Secret', type: 'password', required: true },
          { key: 'user_token', label: 'User Token', type: 'password', required: false }
        ];
      case 'shopify':
        return [
          { key: 'shop_domain', label: 'Nom de la boutique', type: 'text', required: true, placeholder: 'monshop' },
          { key: 'access_token', label: 'Access Token', type: 'password', required: true }
        ];
      case 'aliexpress':
        return [
          { key: 'api_key', label: 'API Key', type: 'text', required: true },
          { key: 'api_secret', label: 'API Secret', type: 'password', required: true }
        ];
      default:
        return [
          { key: 'api_key', label: 'API Key', type: 'text', required: true },
          { key: 'api_secret', label: 'API Secret', type: 'password', required: false }
        ];
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {getCredentialFields().map((field) => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={field.key}>
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id={field.key}
            type={field.type}
            placeholder={field.placeholder}
            required={field.required}
            value={credentials[field.key] || ''}
            onChange={(e) => setCredentials(prev => ({
              ...prev,
              [field.key]: e.target.value
            }))}
          />
        </div>
      ))}

      {platform.regions && (
        <div className="space-y-2">
          <Label>Région</Label>
          <Select 
            value={config.region} 
            onValueChange={(value) => setConfig((prev: any) => ({ ...prev, region: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une région" />
            </SelectTrigger>
            <SelectContent>
              {platform.regions.map(region => (
                <SelectItem key={region} value={region}>{region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch 
          id="auto-sync"
          checked={config.autoSync || false}
          onCheckedChange={(checked) => setConfig((prev: any) => ({ ...prev, autoSync: checked }))}
        />
        <Label htmlFor="auto-sync">Synchronisation automatique</Label>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Connexion...' : 'Connecter'}
      </Button>
    </form>
  );
}