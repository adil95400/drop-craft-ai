import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ShoppingCart, 
  Package, 
  BarChart3, 
  CreditCard, 
  Mail, 
  Zap,
  CheckCircle,
  ExternalLink
} from 'lucide-react'
import { useRealIntegrations } from '@/hooks/useRealIntegrations'
import { useToast } from '@/hooks/use-toast'

const integrationTypes = {
  'ecommerce': {
    label: 'E-commerce',
    icon: ShoppingCart,
    platforms: [
      { id: 'shopify', name: 'Shopify', description: 'Boutique en ligne Shopify' },
      { id: 'woocommerce', name: 'WooCommerce', description: 'WordPress WooCommerce' },
      { id: 'prestashop', name: 'PrestaShop', description: 'Boutique PrestaShop' },
      { id: 'magento', name: 'Magento', description: 'Commerce Magento' }
    ]
  },
  'suppliers': {
    label: 'Fournisseurs',
    icon: Package,
    platforms: [
      { id: 'aliexpress', name: 'AliExpress', description: 'Import de produits AliExpress' },
      { id: 'amazon', name: 'Amazon', description: 'Marketplace Amazon' },
      { id: 'bigbuy', name: 'BigBuy', description: 'Fournisseur européen BigBuy' },
      { id: 'ebay', name: 'eBay', description: 'Marketplace eBay' }
    ]
  },
  'marketing': {
    label: 'Marketing',
    icon: BarChart3,
    platforms: [
      { id: 'google_ads', name: 'Google Ads', description: 'Publicités Google' },
      { id: 'facebook_ads', name: 'Facebook Ads', description: 'Publicités Facebook/Instagram' },
      { id: 'mailchimp', name: 'Mailchimp', description: 'Email marketing' },
      { id: 'klaviyo', name: 'Klaviyo', description: 'Email marketing avancé' }
    ]
  },
  'payment': {
    label: 'Paiement',
    icon: CreditCard,
    platforms: [
      { id: 'stripe', name: 'Stripe', description: 'Processeur de paiement Stripe' },
      { id: 'paypal', name: 'PayPal', description: 'Paiements PayPal' },
      { id: 'klarna', name: 'Klarna', description: 'Paiement en plusieurs fois' }
    ]
  }
}

export const CreateIntegrationForm = () => {
  const [selectedType, setSelectedType] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [formData, setFormData] = useState({
    platform_name: '',
    platform_url: '',
    shop_domain: '',
    seller_id: '',
    is_active: true,
    sync_frequency: 'daily',
    credentials: {
      apiKey: '',
      apiSecret: '',
      accessToken: '',
      shopDomain: ''
    }
  })

  const { addIntegration, isAdding } = useRealIntegrations()
  const { toast } = useToast()

  const handleTypeSelect = (type: string) => {
    setSelectedType(type)
    setSelectedPlatform('')
    setFormData({
      ...formData,
      platform_name: '',
      credentials: { apiKey: '', apiSecret: '', accessToken: '', shopDomain: '' }
    })
  }

  const handlePlatformSelect = (platform: any) => {
    setSelectedPlatform(platform.id)
    setFormData({
      ...formData,
      platform_name: platform.name
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedType || !selectedPlatform) {
      toast({
        title: "Sélection incomplète",
        description: "Veuillez sélectionner un type et une plateforme.",
        variant: "destructive"
      })
      return
    }

    try {
      const integrationData = {
        platform_type: selectedPlatform,
        platform_name: formData.platform_name,
        platform_url: formData.platform_url,
        shop_domain: formData.shop_domain,
        seller_id: formData.seller_id,
        connection_status: 'disconnected' as const,
        is_active: formData.is_active,
        sync_frequency: formData.sync_frequency,
        credentials: Object.fromEntries(
          Object.entries(formData.credentials).filter(([_, value]) => value.trim() !== '')
        )
      }

      await addIntegration(integrationData)
      
      // Reset form
      setSelectedType('')
      setSelectedPlatform('')
      setFormData({
        platform_name: '',
        platform_url: '',
        shop_domain: '',
        seller_id: '',
        is_active: true,
        sync_frequency: 'daily',
        credentials: { apiKey: '', apiSecret: '', accessToken: '', shopDomain: '' }
      })

      toast({
        title: "Intégration créée",
        description: "L'intégration a été configurée avec succès."
      })
    } catch (error) {
      toast({
        title: "Erreur de création",
        description: "Impossible de créer l'intégration.",
        variant: "destructive"
      })
    }
  }

  const renderCredentialFields = () => {
    switch (selectedPlatform) {
      case 'shopify':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="shopDomain">Domaine de la boutique</Label>
              <Input
                id="shopDomain"
                placeholder="ma-boutique.myshopify.com"
                value={formData.credentials.shopDomain}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: { ...formData.credentials, shopDomain: e.target.value }
                })}
              />
            </div>
            <div>
              <Label htmlFor="accessToken">Token d'accès privé</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="shpat_xxxxxxxxxxxxx"
                value={formData.credentials.accessToken}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: { ...formData.credentials, accessToken: e.target.value }
                })}
              />
            </div>
          </div>
        )

      case 'aliexpress':
      case 'amazon':
      case 'ebay':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey">Clé API</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Votre clé API"
                value={formData.credentials.apiKey}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: { ...formData.credentials, apiKey: e.target.value }
                })}
              />
            </div>
            <div>
              <Label htmlFor="apiSecret">Clé secrète</Label>
              <Input
                id="apiSecret"
                type="password"
                placeholder="Votre clé secrète"
                value={formData.credentials.apiSecret}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: { ...formData.credentials, apiSecret: e.target.value }
                })}
              />
            </div>
          </div>
        )

      case 'bigbuy':
      case 'google_ads':
      case 'facebook_ads':
      case 'mailchimp':
      case 'klaviyo':
      case 'stripe':
      case 'paypal':
      case 'klarna':
        return (
          <div>
            <Label htmlFor="apiKey">Clé API / Token</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder={`Votre clé API ${formData.platform_name}`}
              value={formData.credentials.apiKey}
              onChange={(e) => setFormData({
                ...formData,
                credentials: { ...formData.credentials, apiKey: e.target.value }
              })}
            />
          </div>
        )

      default:
        return (
          <div className="text-center p-6">
            <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Sélectionnez une plateforme pour configurer les identifiants
            </p>
          </div>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouvelle Intégration</CardTitle>
        <CardDescription>
          Connectez une nouvelle plateforme à votre système
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="select" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="select">
              <Package className="w-4 h-4 mr-2" />
              Sélection
            </TabsTrigger>
            <TabsTrigger value="configure" disabled={!selectedPlatform}>
              <Zap className="w-4 h-4 mr-2" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="test" disabled={!selectedPlatform}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Finalisation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Choisir le type d'intégration</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(integrationTypes).map(([type, config]) => {
                  const Icon = config.icon
                  return (
                    <Card
                      key={type}
                      className={`cursor-pointer transition-all ${
                        selectedType === type ? 'ring-2 ring-primary border-primary' : 'hover:shadow-md'
                      }`}
                      onClick={() => handleTypeSelect(type)}
                    >
                      <CardContent className="p-4 text-center">
                        <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <p className="font-medium">{config.label}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {selectedType && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Choisir la plateforme</h3>
                <div className="grid gap-3">
                  {integrationTypes[selectedType as keyof typeof integrationTypes].platforms.map((platform) => (
                    <Card
                      key={platform.id}
                      className={`cursor-pointer transition-all ${
                        selectedPlatform === platform.id ? 'ring-2 ring-primary border-primary' : 'hover:shadow-sm'
                      }`}
                      onClick={() => handlePlatformSelect(platform)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{platform.name}</h4>
                            <p className="text-sm text-muted-foreground">{platform.description}</p>
                          </div>
                          {selectedPlatform === platform.id && (
                            <CheckCircle className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="configure" className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Configuration de base</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="platform_url">URL de la plateforme (optionnel)</Label>
                    <Input
                      id="platform_url"
                      type="url"
                      placeholder="https://example.com"
                      value={formData.platform_url}
                      onChange={(e) => setFormData({ ...formData, platform_url: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sync_frequency">Fréquence de synchronisation</Label>
                    <Select 
                      value={formData.sync_frequency} 
                      onValueChange={(value) => setFormData({ ...formData, sync_frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manuel</SelectItem>
                        <SelectItem value="hourly">Toutes les heures</SelectItem>
                        <SelectItem value="daily">Quotidienne</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(selectedPlatform === 'aliexpress' || selectedPlatform === 'amazon' || selectedPlatform === 'ebay') && (
                  <div>
                    <Label htmlFor="seller_id">ID du vendeur (optionnel)</Label>
                    <Input
                      id="seller_id"
                      placeholder="Votre ID vendeur"
                      value={formData.seller_id}
                      onChange={(e) => setFormData({ ...formData, seller_id: e.target.value })}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Activer l'intégration après création</Label>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Identifiants d'accès</h3>
                {renderCredentialFields()}
              </div>

              <Button 
                type="submit" 
                disabled={isAdding || !selectedPlatform}
                className="w-full"
              >
                {isAdding ? 'Création en cours...' : 'Créer l\'intégration'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="test" className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Intégration prête</h3>
              <p className="text-muted-foreground mb-6">
                Votre intégration {formData.platform_name} a été configurée avec succès.
              </p>
              
              <div className="space-y-4">
                <Button variant="outline" asChild>
                  <a 
                    href={`https://docs.dropcraft.ai/integrations/${formData.platform_name?.toLowerCase()}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Documentation {formData.platform_name}
                  </a>
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}