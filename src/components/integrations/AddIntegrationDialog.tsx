import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Store, ShoppingCart, CreditCard, Megaphone } from 'lucide-react';
import { useIntegrations, Integration, IntegrationTemplate } from '@/hooks/useIntegrations';
import { logError } from '@/utils/consoleCleanup';
const platformCategories = {
  ecommerce: {
    title: 'E-commerce',
    icon: Store,
    platforms: [{
      name: 'shopify',
      label: 'Shopify',
      description: 'Plateforme e-commerce populaire'
    }, {
      name: 'woocommerce',
      label: 'WooCommerce',
      description: 'WordPress e-commerce'
    }, {
      name: 'bigcommerce',
      label: 'BigCommerce',
      description: 'Solution e-commerce entreprise'
    }, {
      name: 'prestashop',
      label: 'PrestaShop',
      description: 'Solution e-commerce française'
    }, {
      name: 'magento',
      label: 'Magento',
      description: 'Plateforme e-commerce avancée'
    }]
  },
  marketplace: {
    title: 'Marketplaces',
    icon: ShoppingCart,
    platforms: [{
      name: 'amazon',
      label: 'Amazon',
      description: 'Marketplace mondial'
    }, {
      name: 'aliexpress',
      label: 'AliExpress',
      description: 'Marketplace chinois'
    }, {
      name: 'ebay',
      label: 'eBay',
      description: 'Marketplace aux enchères'
    }, {
      name: 'etsy',
      label: 'Etsy',
      description: 'Marketplace créatif'
    }, {
      name: 'cdiscount',
      label: 'Cdiscount',
      description: 'Marketplace français'
    }, {
      name: 'fnac',
      label: 'Fnac',
      description: 'Marketplace culture/tech'
    }]
  },
  payment: {
    title: 'Paiements',
    icon: CreditCard,
    platforms: [{
      name: 'stripe',
      label: 'Stripe',
      description: 'Paiements en ligne'
    }, {
      name: 'paypal',
      label: 'PayPal',
      description: 'Paiements globaux'
    }, {
      name: 'klarna',
      label: 'Klarna',
      description: 'Paiement en plusieurs fois'
    }, {
      name: 'adyen',
      label: 'Adyen',
      description: 'Plateforme de paiement'
    }]
  },
  marketing: {
    title: 'Marketing',
    icon: Megaphone,
    platforms: [{
      name: 'facebook',
      label: 'Facebook Ads',
      description: 'Publicité Facebook'
    }, {
      name: 'google',
      label: 'Google Ads',
      description: 'Publicité Google'
    }, {
      name: 'mailchimp',
      label: 'Mailchimp',
      description: 'Email marketing'
    }, {
      name: 'klaviyo',
      label: 'Klaviyo',
      description: 'Marketing automation'
    }]
  }
};
export const AddIntegrationDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof platformCategories>('ecommerce');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [formData, setFormData] = useState({
    platform_url: '',
    shop_domain: '',
    api_key: '',
    api_secret: '',
    access_token: '',
    seller_id: '',
    sync_frequency: 'daily' as const
  });
  const {
    createIntegration
  } = useIntegrations();
  const handleCreate = async () => {
    if (!selectedPlatform) return;
    const platform = platformCategories[selectedCategory].platforms.find(p => p.name === selectedPlatform);
    if (!platform) return;
    try {
      // Separate sensitive credentials from integration metadata
      const credentials: Record<string, string> = {};
      if (formData.api_key) credentials.api_key = formData.api_key;
      if (formData.api_secret) credentials.api_secret = formData.api_secret;
      if (formData.access_token) credentials.access_token = formData.access_token;
      const integration: any = {
        platform: selectedPlatform,
        platform_name: selectedPlatform,
        store_url: formData.platform_url || undefined,
        config: {
          shop_domain: formData.shop_domain,
          seller_id: formData.seller_id,
          store_config: {}
        },
        connection_status: 'disconnected',
        sync_frequency: formData.sync_frequency,
        is_active: false,
        credentials: Object.keys(credentials).length > 0 ? credentials : undefined
      };
      await createIntegration({
        id: selectedPlatform,
        name: selectedPlatform,
        description: `Intégration ${selectedPlatform}`,
        category: selectedCategory,
        logo: '🔗',
        color: 'bg-blue-500',
        features: [],
        setupSteps: [],
        status: 'available'
      } as IntegrationTemplate, integration);
      setIsOpen(false);
      setSelectedPlatform('');
      setFormData({
        platform_url: '',
        shop_domain: '',
        api_key: '',
        api_secret: '',
        access_token: '',
        seller_id: '',
        sync_frequency: 'daily'
      });
    } catch (error) {
      logError(error as Error, 'Failed to create integration');
    }
  };
  const selectedPlatformData = selectedPlatform ? platformCategories[selectedCategory].platforms.find(p => p.name === selectedPlatform) : null;
  return <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" className="bg-violet-500 hover:bg-violet-400">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une intégration
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle intégration</DialogTitle>
          <DialogDescription>
            Connectez une nouvelle plateforme à votre compte
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-3">
            <Label>Catégorie de plateforme</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(platformCategories).map(([key, category]) => {
              const Icon = category.icon;
              return <Card key={key} className={`cursor-pointer transition-all hover:shadow-md ${selectedCategory === key ? 'ring-2 ring-primary bg-primary/5' : ''}`} onClick={() => {
                setSelectedCategory(key as keyof typeof platformCategories);
                setSelectedPlatform('');
              }}>
                    <CardContent className="p-4 text-center">
                      <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <div className="font-medium text-sm">{category.title}</div>
                    </CardContent>
                  </Card>;
            })}
            </div>
          </div>

          {/* Platform Selection */}
          <div className="space-y-3">
            <Label>Plateforme</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {platformCategories[selectedCategory].platforms.map(platform => <Card key={platform.name} className={`cursor-pointer transition-all hover:shadow-md ${selectedPlatform === platform.name ? 'ring-2 ring-primary bg-primary/5' : ''}`} onClick={() => setSelectedPlatform(platform.name)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{platform.label}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {selectedCategory}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {platform.description}
                    </CardDescription>
                  </CardHeader>
                </Card>)}
            </div>
          </div>

          {/* Configuration Form */}
          {selectedPlatformData && <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/20">
              <h4 className="font-semibold">Configuration {selectedPlatformData.label}</h4>
              
              {selectedPlatform === 'shopify' && <>
                  <div className="space-y-2">
                    <Label htmlFor="shop_domain">Domaine de la boutique *</Label>
                    <Input id="shop_domain" placeholder="monshop.myshopify.com" value={formData.shop_domain} onChange={e => setFormData({
                ...formData,
                shop_domain: e.target.value
              })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api_key">Clé API *</Label>
                    <Input id="api_key" type="password" placeholder="Votre clé API Shopify" value={formData.api_key} onChange={e => setFormData({
                ...formData,
                api_key: e.target.value
              })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="access_token">Token d'accès *</Label>
                    <Input id="access_token" type="password" placeholder="Votre token d'accès" value={formData.access_token} onChange={e => setFormData({
                ...formData,
                access_token: e.target.value
              })} />
                  </div>
                </>}

              {selectedPlatform === 'amazon' && <>
                  <div className="space-y-2">
                    <Label htmlFor="seller_id">Seller ID *</Label>
                    <Input id="seller_id" placeholder="Votre Seller ID Amazon" value={formData.seller_id} onChange={e => setFormData({
                ...formData,
                seller_id: e.target.value
              })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api_key">MWS API Key *</Label>
                    <Input id="api_key" type="password" placeholder="Votre clé API MWS" value={formData.api_key} onChange={e => setFormData({
                ...formData,
                api_key: e.target.value
              })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api_secret">MWS Secret Key *</Label>
                    <Input id="api_secret" type="password" placeholder="Votre clé secrète MWS" value={formData.api_secret} onChange={e => setFormData({
                ...formData,
                api_secret: e.target.value
              })} />
                  </div>
                </>}

              {(selectedPlatform === 'woocommerce' || selectedPlatform === 'bigcommerce') && <>
                  <div className="space-y-2">
                    <Label htmlFor="platform_url">URL de la boutique *</Label>
                    <Input id="platform_url" placeholder="https://monshop.com" value={formData.platform_url} onChange={e => setFormData({
                ...formData,
                platform_url: e.target.value
              })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api_key">Clé API *</Label>
                    <Input id="api_key" type="password" placeholder="Votre clé API" value={formData.api_key} onChange={e => setFormData({
                ...formData,
                api_key: e.target.value
              })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api_secret">Secret API *</Label>
                    <Input id="api_secret" type="password" placeholder="Votre secret API" value={formData.api_secret} onChange={e => setFormData({
                ...formData,
                api_secret: e.target.value
              })} />
                  </div>
                </>}

              <div className="space-y-2">
                <Label htmlFor="sync_frequency">Fréquence de synchronisation</Label>
                <Select value={formData.sync_frequency} onValueChange={value => setFormData({
              ...formData,
              sync_frequency: value as any
            })}>
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

              <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                <strong>💡 Astuce:</strong> Vous pourrez tester et configurer cette intégration après l'avoir créée.
              </div>
            </div>}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleCreate} variant="hero" disabled={!selectedPlatform}>
            Créer l'intégration
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
};