import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Palette, 
  Globe, 
  Settings, 
  Eye, 
  Code, 
  CreditCard,
  Shield,
  Users,
  BarChart3,
  Zap
} from 'lucide-react'

interface MarketplaceConfig {
  name: string
  domain: string
  primaryColor: string
  logo: string
  currency: string
  commissionRate: number
  enablePayments: boolean
  enableSSO: boolean
  customCSS: string
}

export const WhiteLabelMarketplace = () => {
  const [config, setConfig] = useState<MarketplaceConfig>({
    name: 'Mon Marketplace',
    domain: 'marketplace.monentreprise.com',
    primaryColor: '#6366f1',
    logo: '',
    currency: 'EUR',
    commissionRate: 15,
    enablePayments: true,
    enableSSO: false,
    customCSS: ''
  })

  const [previewMode, setPreviewMode] = useState(false)

  const handleConfigChange = (key: keyof MarketplaceConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const marketplaceFeatures = [
    {
      icon: <Palette className="h-5 w-5" />,
      name: 'Branding Complet',
      description: 'Logo, couleurs, CSS personnalisé',
      included: true
    },
    {
      icon: <Globe className="h-5 w-5" />,
      name: 'Domaine Personnalisé',
      description: 'marketplace.votre-domaine.com',
      included: true
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      name: 'Paiements Intégrés',
      description: 'Stripe, PayPal, crypto-monnaies',
      included: true
    },
    {
      icon: <Shield className="h-5 w-5" />,
      name: 'SSO Entreprise',
      description: 'SAML, OAuth, Active Directory',
      included: true
    },
    {
      icon: <Users className="h-5 w-5" />,
      name: 'Gestion Utilisateurs',
      description: 'Rôles, permissions, équipes',
      included: true
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      name: 'Analytics Avancées',
      description: 'Revenus, conversions, performances',
      included: true
    }
  ]

  const pricingTiers = [
    {
      name: 'Starter',
      price: '199€/mois',
      features: [
        'Jusqu\'à 50 extensions',
        'Branding basique',
        'Support email',
        'Analytics standard'
      ]
    },
    {
      name: 'Professional',
      price: '499€/mois',
      features: [
        'Extensions illimitées',
        'Branding complet',
        'SSO entreprise',
        'Support prioritaire',
        'Analytics avancées',
        'API personnalisée'
      ]
    },
    {
      name: 'Enterprise',
      price: 'Sur mesure',
      features: [
        'Tout Professional +',
        'Déploiement on-premise',
        'SLA garanti',
        'Support dédié',
        'Développement sur mesure'
      ]
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Marketplace White-Label</h2>
          <p className="text-muted-foreground">Créez votre propre marketplace d'extensions avec votre marque</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {previewMode ? 'Configuration' : 'Aperçu'}
          </Button>
          <Button>Déployer</Button>
        </div>
      </div>

      {!previewMode ? (
        <Tabs defaultValue="branding" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="payments">Paiements</TabsTrigger>
            <TabsTrigger value="sso">SSO</TabsTrigger>
            <TabsTrigger value="features">Fonctionnalités</TabsTrigger>
            <TabsTrigger value="pricing">Tarification</TabsTrigger>
          </TabsList>

          {/* Branding Configuration */}
          <TabsContent value="branding" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Identité Visuelle</CardTitle>
                  <CardDescription>
                    Personnalisez l'apparence de votre marketplace
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du Marketplace</Label>
                    <Input 
                      id="name"
                      value={config.name}
                      onChange={(e) => handleConfigChange('name', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="domain">Domaine Personnalisé</Label>
                    <Input 
                      id="domain"
                      value={config.domain}
                      onChange={(e) => handleConfigChange('domain', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Couleur Principale</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="color"
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                        className="w-20"
                      />
                      <Input 
                        value={config.primaryColor}
                        onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo">URL du Logo</Label>
                    <Input 
                      id="logo"
                      placeholder="https://votre-domaine.com/logo.png"
                      value={config.logo}
                      onChange={(e) => handleConfigChange('logo', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>CSS Personnalisé</CardTitle>
                  <CardDescription>
                    Ajoutez vos propres styles CSS
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    placeholder=".marketplace-header { background: linear-gradient(...); }"
                    value={config.customCSS}
                    onChange={(e) => handleConfigChange('customCSS', e.target.value)}
                    className="min-h-40 font-mono text-sm"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payments Configuration */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Configuration des Paiements
                </CardTitle>
                <CardDescription>
                  Gérez les méthodes de paiement et commissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Paiements Activés</h4>
                    <p className="text-sm text-muted-foreground">
                      Permettre les achats d'extensions payantes
                    </p>
                  </div>
                  <Switch 
                    checked={config.enablePayments}
                    onCheckedChange={(checked) => handleConfigChange('enablePayments', checked)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Devise Principale</Label>
                    <Input 
                      value={config.currency}
                      onChange={(e) => handleConfigChange('currency', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Taux de Commission (%)</Label>
                    <Input 
                      type="number"
                      value={config.commissionRate}
                      onChange={(e) => handleConfigChange('commissionRate', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Méthodes de Paiement Supportées</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {['Stripe', 'PayPal', 'Apple Pay', 'Google Pay', 'Crypto', 'Virement'].map((method) => (
                      <div key={method} className="flex items-center gap-2">
                        <Switch defaultChecked={method === 'Stripe' || method === 'PayPal'} />
                        <span className="text-sm">{method}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SSO Configuration */}
          <TabsContent value="sso" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Single Sign-On (SSO)
                </CardTitle>
                <CardDescription>
                  Intégration avec vos systèmes d'authentification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">SSO Activé</h4>
                    <p className="text-sm text-muted-foreground">
                      Authentification via votre système existant
                    </p>
                  </div>
                  <Switch 
                    checked={config.enableSSO}
                    onCheckedChange={(checked) => handleConfigChange('enableSSO', checked)}
                  />
                </div>

                {config.enableSSO && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type d'Authentification</Label>
                        <select className="w-full p-2 border rounded">
                          <option>SAML 2.0</option>
                          <option>OAuth 2.0</option>
                          <option>OpenID Connect</option>
                          <option>Active Directory</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>URL de Login</Label>
                        <Input placeholder="https://auth.votre-domaine.com/login" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Certificat Public (PEM)</Label>
                      <Textarea 
                        placeholder="-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoK/heBjcOuMA0GCSqGSIb3DQEBBQUAMEUx...
-----END CERTIFICATE-----"
                        className="min-h-32 font-mono text-xs"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features */}
          <TabsContent value="features" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketplaceFeatures.map((feature, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{feature.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {feature.description}
                        </p>
                        <Badge 
                          className="mt-2" 
                          variant={feature.included ? "default" : "secondary"}
                        >
                          {feature.included ? 'Inclus' : 'Optionnel'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Pricing */}
          <TabsContent value="pricing" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pricingTiers.map((tier, index) => (
                <Card key={index} className={index === 1 ? 'border-primary shadow-lg' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {tier.name}
                      {index === 1 && <Badge>Populaire</Badge>}
                    </CardTitle>
                    <div className="text-2xl font-bold">{tier.price}</div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tier.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button className={`w-full mt-4 ${index === 1 ? '' : 'variant-outline'}`}>
                      {index === 2 ? 'Contactez-nous' : 'Commencer'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        /* Preview Mode */
        <Card className="overflow-hidden">
          <div 
            className="p-6 text-white"
            style={{ backgroundColor: config.primaryColor }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {config.logo && (
                  <img src={config.logo} alt="Logo" className="h-10 w-10 rounded" />
                )}
                <h1 className="text-2xl font-bold">{config.name}</h1>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm">Se connecter</Button>
                <Button variant="outline" size="sm" className="text-white border-white hover:bg-white/10">
                  S'inscrire
                </Button>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Extensions Disponibles</h2>
              <p className="text-muted-foreground">
                Découvrez notre sélection d'extensions premium pour votre e-commerce
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'AI SEO Optimizer', price: '29€/mois', rating: 4.8 },
                { name: 'Smart Inventory', price: '49€/mois', rating: 4.9 },
                { name: 'Advanced Analytics', price: '19€/mois', rating: 4.7 }
              ].map((ext, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium">{ext.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-semibold" style={{ color: config.primaryColor }}>
                      {ext.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ⭐ {ext.rating}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full mt-3"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    Installer
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}