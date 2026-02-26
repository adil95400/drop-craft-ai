import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Link, Unlink, RotateCcw, Settings, CheckCircle, 
  AlertCircle, ShoppingCart, Package, Loader2 
} from 'lucide-react';
import { MarketplaceType, MarketplaceCredentials, useMarketplaceConnectors } from '@/hooks/useMarketplaceConnectors';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface MarketplaceConfig {
  id: MarketplaceType;
  name: string;
  icon: string;
  color: string;
  regions?: { code: string; name: string }[];
  credentialFields: {
    key: keyof MarketplaceCredentials;
    label: string;
    type: 'text' | 'password';
    required: boolean;
    placeholder?: string;
  }[];
}

const MARKETPLACE_CONFIGS: MarketplaceConfig[] = [
  {
    id: 'amazon',
    name: 'Amazon Seller',
    icon: '🛒',
    color: 'bg-orange-500',
    regions: [
      { code: 'ATVPDKIKX0DER', name: 'Amazon US' },
      { code: 'A1PA6795UKMFR9', name: 'Amazon DE' },
      { code: 'A13V1IB3VIYBER', name: 'Amazon FR' },
      { code: 'A1F83G8C2ARO7P', name: 'Amazon UK' },
      { code: 'A1RKKUPIHCS9HS', name: 'Amazon ES' },
      { code: 'APJ6JRA9NG5V4', name: 'Amazon IT' },
    ],
    credentialFields: [
      { key: 'accessKey', label: 'Access Key (LWA)', type: 'text', required: true },
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: true },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password', required: true },
    ]
  },
  {
    id: 'ebay',
    name: 'eBay',
    icon: '🏪',
    color: 'bg-blue-500',
    regions: [
      { code: 'EBAY_US', name: 'eBay US' },
      { code: 'EBAY_GB', name: 'eBay UK' },
      { code: 'EBAY_DE', name: 'eBay DE' },
      { code: 'EBAY_FR', name: 'eBay FR' },
    ],
    credentialFields: [
      { key: 'clientId', label: 'Client ID (App ID)', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret (Cert ID)', type: 'password', required: true },
      { key: 'userToken', label: 'User Token', type: 'password', required: true },
    ]
  },
  {
    id: 'aliexpress',
    name: 'AliExpress',
    icon: '🚀',
    color: 'bg-red-500',
    credentialFields: [
      { key: 'appKey', label: 'App Key', type: 'text', required: true },
      { key: 'appSecret', label: 'App Secret', type: 'password', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: false, placeholder: 'Optionnel' },
    ]
  },
  {
    id: 'cdiscount',
    name: 'Cdiscount',
    icon: '💳',
    color: 'bg-purple-500',
    credentialFields: [
      { key: 'apiKey', label: 'API Key', type: 'text', required: true },
      { key: 'sellerId', label: 'Seller ID', type: 'text', required: true },
    ]
  }
];

interface MarketplaceConnectionCardProps {
  platform: MarketplaceType;
}

export function MarketplaceConnectionCard({ platform }: MarketplaceConnectionCardProps) {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [syncProgress, setSyncProgress] = useState<number | null>(null);
  const [credentials, setCredentials] = useState<MarketplaceCredentials>({});
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [autoSync, setAutoSync] = useState(false);

  const {
    getConnectionByPlatform,
    connectMarketplace,
    disconnectMarketplace,
    syncProducts,
    syncOrders,
    isConnecting,
    isSyncingProducts,
    isSyncingOrders,
    validateCredentials
  } = useMarketplaceConnectors();

  const config = MARKETPLACE_CONFIGS.find(c => c.id === platform);
  const connection = getConnectionByPlatform(platform);
  const isConnected = connection?.status === 'connected';

  if (!config) return null;

  const handleConnect = async () => {
    // Validate first
    try {
      const result = await validateCredentials({ platform, credentials });
      if (!result.valid) {
        return; // Error is handled in the hook
      }
    } catch {
      return;
    }

    connectMarketplace({
      platform,
      credentials,
      config: {
        region: selectedRegion,
        autoSync
      }
    });
    setShowConnectDialog(false);
    setCredentials({});
  };

  const handleSync = async () => {
    setSyncProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev === null || prev >= 90) return prev;
        return prev + 10;
      });
    }, 300);

    syncProducts({ platform });
    
    setTimeout(() => {
      clearInterval(interval);
      setSyncProgress(100);
      setTimeout(() => setSyncProgress(null), 1000);
    }, 3000);
  };

  return (
    <>
      <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center text-white text-2xl shadow-lg`}>
                {config.icon}
              </div>
              <div>
                <CardTitle className="text-lg">{config.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isConnected && connection?.lastSync ? (
                    `Sync: ${formatDistanceToNow(new Date(connection.lastSync), { addSuffix: true, locale: getDateFnsLocale() })}`
                  ) : (
                    'Non connecté'
                  )}
                </p>
              </div>
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'} className="gap-1">
              {isConnected ? (
                <><CheckCircle className="w-3 h-3" /> Actif</>
              ) : (
                <><AlertCircle className="w-3 h-3" /> Inactif</>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Stats */}
          {isConnected && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <Package className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-semibold">{connection?.productCount || 0}</p>
                <p className="text-xs text-muted-foreground">Produits</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <ShoppingCart className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-semibold">{connection?.orderCount || 0}</p>
                <p className="text-xs text-muted-foreground">Commandes</p>
              </div>
            </div>
          )}

          {/* Sync Progress */}
          {syncProgress !== null && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Synchronisation...
                </span>
                <span>{syncProgress}%</span>
              </div>
              <Progress value={syncProgress} className="h-2" />
            </div>
          )}

          {/* Error Message */}
          {connection?.errorMessage && (
            <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md">
              {connection.errorMessage}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {!isConnected ? (
              <Button 
                onClick={() => setShowConnectDialog(true)} 
                className="flex-1"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Link className="w-4 h-4 mr-2" />
                )}
                Connecter
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleSync}
                  disabled={isSyncingProducts || syncProgress !== null}
                >
                  <RotateCcw className={`w-4 h-4 ${isSyncingProducts ? 'animate-spin' : ''}`} />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setShowSettingsDialog(true)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={handleSync}
                  className="flex-1"
                  disabled={isSyncingProducts || syncProgress !== null}
                >
                  Synchroniser
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connect Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{config.icon}</span>
              Connecter {config.name}
            </DialogTitle>
            <DialogDescription>
              Entrez vos identifiants API pour connecter votre compte {config.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {config.credentialFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id={field.key}
                  type={field.type}
                  placeholder={field.placeholder}
                  required={field.required}
                  value={(credentials[field.key] as string) || ''}
                  onChange={(e) => setCredentials(prev => ({
                    ...prev,
                    [field.key]: e.target.value
                  }))}
                />
              </div>
            ))}

            {config.regions && (
              <div className="space-y-2">
                <Label>Région / Marketplace</Label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une région" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.regions.map(region => (
                      <SelectItem key={region.code} value={region.code}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-sync">Synchronisation automatique</Label>
                <p className="text-xs text-muted-foreground">Sync toutes les heures</p>
              </div>
              <Switch 
                id="auto-sync"
                checked={autoSync}
                onCheckedChange={setAutoSync}
              />
            </div>

            <Button 
              onClick={handleConnect} 
              className="w-full"
              disabled={isConnecting}
            >
              {isConnecting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connexion...</>
              ) : (
                'Connecter'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Paramètres {config.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Synchronisation automatique</p>
                <p className="text-sm text-muted-foreground">Sync produits et commandes</p>
              </div>
              <Switch checked={autoSync} onCheckedChange={setAutoSync} />
            </div>

            <div className="border-t pt-4">
              <Button 
                variant="outline" 
                className="w-full mb-2"
                onClick={() => syncOrders({ platform })}
                disabled={isSyncingOrders}
              >
                {isSyncingOrders ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4 mr-2" />
                )}
                Synchroniser les commandes
              </Button>
              
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => {
                  if (connection) {
                    disconnectMarketplace(connection.id);
                    setShowSettingsDialog(false);
                  }
                }}
              >
                <Unlink className="w-4 h-4 mr-2" />
                Déconnecter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { MARKETPLACE_CONFIGS };
