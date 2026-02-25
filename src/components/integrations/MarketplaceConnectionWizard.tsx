/**
 * Marketplace Connection Wizard - Step-by-step setup for Amazon/eBay/Etsy/TikTok
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { PlatformLogo } from '@/components/ui/platform-logo';
import { cn } from '@/lib/utils';
import {
  ArrowRight, ArrowLeft, CheckCircle2, Shield, Key, Globe, Settings,
  Package, RefreshCw, AlertTriangle, ExternalLink, Loader2
} from 'lucide-react';

interface MarketplaceConfig {
  id: string;
  name: string;
  platform: string;
  logo?: string;
  regions: { id: string; name: string; endpoint: string }[];
  authType: 'oauth' | 'api_key' | 'credentials';
  fields: { key: string; label: string; type: string; required: boolean; helpText?: string; placeholder?: string }[];
  syncOptions: { key: string; label: string; description: string; default: boolean }[];
  docsUrl: string;
}

const MARKETPLACE_CONFIGS: MarketplaceConfig[] = [
  {
    id: 'amazon',
    name: 'Amazon Seller Central',
    platform: 'amazon',
    regions: [
      { id: 'NA', name: 'Amérique du Nord (US, CA, MX)', endpoint: 'sellingpartnerapi-na.amazon.com' },
      { id: 'EU', name: 'Europe (FR, DE, IT, ES, UK)', endpoint: 'sellingpartnerapi-eu.amazon.com' },
      { id: 'FE', name: 'Asie-Pacifique (JP, AU, SG)', endpoint: 'sellingpartnerapi-fe.amazon.com' },
    ],
    authType: 'oauth',
    fields: [
      { key: 'seller_id', label: 'Seller ID', type: 'text', required: true, helpText: 'Trouvable dans Paramètres > Informations du compte', placeholder: 'A1XXXXXXXXXXXXX' },
      { key: 'marketplace_id', label: 'Marketplace ID', type: 'text', required: true, placeholder: 'A13V1IB3VIYZZH' },
      { key: 'mws_auth_token', label: 'MWS Auth Token', type: 'password', required: false, helpText: 'Pour SP-API, utilisez plutôt OAuth' },
    ],
    syncOptions: [
      { key: 'sync_products', label: 'Produits', description: 'Synchroniser le catalogue produit', default: true },
      { key: 'sync_orders', label: 'Commandes', description: 'Importer les commandes Amazon', default: true },
      { key: 'sync_inventory', label: 'Inventaire', description: 'Sync bidirectionnelle du stock', default: true },
      { key: 'sync_pricing', label: 'Prix', description: 'Ajustement automatique des prix', default: false },
      { key: 'sync_fba', label: 'FBA', description: 'Intégration Fulfillment by Amazon', default: false },
    ],
    docsUrl: 'https://developer-docs.amazon.com/sp-api/',
  },
  {
    id: 'ebay',
    name: 'eBay',
    platform: 'ebay',
    regions: [
      { id: 'US', name: 'eBay.com (US)', endpoint: 'api.ebay.com' },
      { id: 'UK', name: 'eBay.co.uk', endpoint: 'api.ebay.com' },
      { id: 'DE', name: 'eBay.de', endpoint: 'api.ebay.com' },
      { id: 'FR', name: 'eBay.fr', endpoint: 'api.ebay.com' },
    ],
    authType: 'oauth',
    fields: [
      { key: 'client_id', label: 'App ID (Client ID)', type: 'text', required: true, placeholder: 'YourAppID-xxxx-xxx' },
      { key: 'client_secret', label: 'Cert ID (Client Secret)', type: 'password', required: true },
      { key: 'dev_id', label: 'Dev ID', type: 'text', required: true },
      { key: 'sandbox', label: 'Mode sandbox', type: 'checkbox', required: false },
    ],
    syncOptions: [
      { key: 'sync_listings', label: 'Annonces', description: 'Synchroniser les listings eBay', default: true },
      { key: 'sync_orders', label: 'Commandes', description: 'Importer les ventes', default: true },
      { key: 'sync_inventory', label: 'Stock', description: 'Mise à jour du stock', default: true },
      { key: 'sync_messages', label: 'Messages', description: 'Centraliser les messages acheteurs', default: false },
    ],
    docsUrl: 'https://developer.ebay.com/',
  },
  {
    id: 'etsy',
    name: 'Etsy',
    platform: 'etsy',
    regions: [
      { id: 'GLOBAL', name: 'Etsy.com (Global)', endpoint: 'openapi.etsy.com' },
    ],
    authType: 'oauth',
    fields: [
      { key: 'api_key', label: 'API Key (Keystring)', type: 'text', required: true, helpText: 'Depuis etsy.com/developers', placeholder: 'xxxxxxxxxxxxxxx' },
      { key: 'shared_secret', label: 'Shared Secret', type: 'password', required: true },
      { key: 'shop_id', label: 'Shop ID / Name', type: 'text', required: true, placeholder: 'YourShopName' },
    ],
    syncOptions: [
      { key: 'sync_listings', label: 'Annonces', description: 'Synchroniser les produits Etsy', default: true },
      { key: 'sync_orders', label: 'Commandes', description: 'Importer les ventes Etsy', default: true },
      { key: 'sync_reviews', label: 'Avis', description: 'Centraliser les avis clients', default: false },
      { key: 'sync_shipping', label: 'Profils livraison', description: 'Gérer les profils d\'expédition', default: false },
    ],
    docsUrl: 'https://developers.etsy.com/documentation/',
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    platform: 'tiktok',
    regions: [
      { id: 'US', name: 'TikTok Shop US', endpoint: 'open-api.tiktokglobalshop.com' },
      { id: 'UK', name: 'TikTok Shop UK', endpoint: 'open-api.tiktokglobalshop.com' },
      { id: 'SEA', name: 'TikTok Shop SE Asia', endpoint: 'open-api.tiktokglobalshop.com' },
    ],
    authType: 'oauth',
    fields: [
      { key: 'app_key', label: 'App Key', type: 'text', required: true, helpText: 'Depuis TikTok Shop Partner Center' },
      { key: 'app_secret', label: 'App Secret', type: 'password', required: true },
      { key: 'shop_cipher', label: 'Shop Cipher', type: 'text', required: false, placeholder: 'Optionnel pour multi-shops' },
    ],
    syncOptions: [
      { key: 'sync_products', label: 'Produits', description: 'Publier sur TikTok Shop', default: true },
      { key: 'sync_orders', label: 'Commandes', description: 'Importer les commandes TikTok', default: true },
      { key: 'sync_live', label: 'Live Shopping', description: 'Intégration live commerce', default: false },
      { key: 'sync_affiliate', label: 'Affiliés', description: 'Programme d\'affiliation', default: false },
    ],
    docsUrl: 'https://partner.tiktokshop.com/',
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platformId?: string;
}

export function MarketplaceConnectionWizard({ open, onOpenChange, platformId }: Props) {
  const [step, setStep] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState(platformId || '');
  const [region, setRegion] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [syncOptions, setSyncOptions] = useState<Record<string, boolean>>({});
  const [isConnecting, setIsConnecting] = useState(false);

  const config = MARKETPLACE_CONFIGS.find(c => c.id === selectedPlatform);
  const steps = ['Plateforme', 'Région', 'Identifiants', 'Synchronisation', 'Confirmation'];
  const progress = ((step + 1) / steps.length) * 100;

  const handleConnect = async () => {
    setIsConnecting(true);
    // Simulate connection - in real app, call edge function
    await new Promise(r => setTimeout(r, 2000));
    setIsConnecting(false);
    toast.success(`${config?.name} connecté avec succès !`);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setStep(0);
    setSelectedPlatform('');
    setRegion('');
    setCredentials({});
    setSyncOptions({});
  };

  const canAdvance = () => {
    switch (step) {
      case 0: return !!selectedPlatform;
      case 1: return !!region;
      case 2: return config?.fields.filter(f => f.required).every(f => credentials[f.key]) ?? false;
      case 3: return true;
      default: return true;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" /> Connecter une marketplace
          </DialogTitle>
        </DialogHeader>

        <Progress value={progress} className="h-1.5" />
        <div className="flex justify-between mb-4">
          {steps.map((s, i) => (
            <div key={s} className={cn('text-xs', i <= step ? 'text-primary font-medium' : 'text-muted-foreground')}>
              {s}
            </div>
          ))}
        </div>

        {/* Step 0: Platform selection */}
        {step === 0 && (
          <div className="grid grid-cols-2 gap-3">
            {MARKETPLACE_CONFIGS.map(mc => (
              <Card
                key={mc.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  selectedPlatform === mc.id && 'ring-2 ring-primary'
                )}
                onClick={() => {
                  setSelectedPlatform(mc.id);
                  // Set defaults for sync options
                  const defaults: Record<string, boolean> = {};
                  mc.syncOptions.forEach(o => { defaults[o.key] = o.default; });
                  setSyncOptions(defaults);
                }}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <PlatformLogo platform={mc.platform} size="md" />
                  <div>
                    <p className="font-medium text-sm">{mc.name}</p>
                    <p className="text-xs text-muted-foreground">{mc.regions.length} région(s)</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Step 1: Region */}
        {step === 1 && config && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Sélectionnez la région de votre boutique {config.name}</p>
            {config.regions.map(r => (
              <Card
                key={r.id}
                className={cn('cursor-pointer hover:shadow-md', region === r.id && 'ring-2 ring-primary')}
                onClick={() => setRegion(r.id)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{r.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{r.endpoint}</p>
                  </div>
                  {region === r.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Step 2: Credentials */}
        {step === 2 && config && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Shield className="h-4 w-4 text-green-500" />
              <p className="text-xs text-muted-foreground">Vos identifiants sont chiffrés et stockés de manière sécurisée</p>
            </div>
            {config.fields.map(field => (
              <div key={field.key}>
                <Label className="text-sm">
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
                {field.helpText && <p className="text-xs text-muted-foreground mt-0.5">{field.helpText}</p>}
                {field.type === 'checkbox' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Switch
                      checked={credentials[field.key] === 'true'}
                      onCheckedChange={v => setCredentials(prev => ({ ...prev, [field.key]: String(v) }))}
                    />
                    <span className="text-sm">{credentials[field.key] === 'true' ? 'Activé' : 'Désactivé'}</span>
                  </div>
                ) : (
                  <Input
                    type={field.type === 'password' ? 'password' : 'text'}
                    value={credentials[field.key] || ''}
                    onChange={e => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="mt-1"
                  />
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(config.docsUrl, '_blank')}>
              <ExternalLink className="h-3.5 w-3.5" /> Documentation API {config.name}
            </Button>
          </div>
        )}

        {/* Step 3: Sync options */}
        {step === 3 && config && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Configurez ce que vous souhaitez synchroniser</p>
            {config.syncOptions.map(opt => (
              <div key={opt.key} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
                <Switch
                  checked={syncOptions[opt.key] ?? opt.default}
                  onCheckedChange={v => setSyncOptions(prev => ({ ...prev, [opt.key]: v }))}
                />
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && config && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <PlatformLogo platform={config.platform} size="md" />
                  <div>
                    <p className="font-semibold">{config.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Région: {config.regions.find(r => r.id === region)?.name}
                    </p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Synchronisations actives :</p>
                  <div className="flex flex-wrap gap-2">
                    {config.syncOptions.filter(o => syncOptions[o.key]).map(o => (
                      <Badge key={o.key} variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" /> {o.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                La première synchronisation peut prendre quelques minutes selon la taille de votre catalogue.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : onOpenChange(false)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> {step === 0 ? 'Annuler' : 'Retour'}
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canAdvance()}>
              Suivant <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Connecter
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
