/**
 * Hub d'Intégrations moderne - Toutes les plateformes e-commerce
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActionButton } from '@/components/common/ActionButton'
import { Helmet } from 'react-helmet-async'
import { 
  Store, Zap, CheckCircle, AlertCircle, 
  Settings, Plus, RefreshCw, Globe, 
  Smartphone, Monitor, ShoppingBag
} from 'lucide-react'

interface Integration {
  id: string
  name: string
  logo: string
  category: string
  description: string
  status: 'connected' | 'disconnected' | 'error'
  features: string[]
  pricing: string
  setup_difficulty: 'easy' | 'medium' | 'advanced'
  monthly_cost: number
  orders_synced?: number
  last_sync?: string
}

const ModernIntegrationsHub: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    setLoading(true)
    try {
      const mockIntegrations: Integration[] = [
        // E-commerce Platforms
        {
          id: 'shopify',
          name: 'Shopify',
          logo: '🛍️',
          category: 'ecommerce',
          description: 'La plateforme e-commerce #1 mondiale',
          status: 'connected',
          features: ['Sync automatique', 'Gestion stock', 'Webhooks', 'Multi-boutiques'],
          pricing: 'Gratuit',
          setup_difficulty: 'easy',
          monthly_cost: 0,
          orders_synced: 1247,
          last_sync: '2024-01-15T10:30:00Z'
        },
        {
          id: 'woocommerce',
          name: 'WooCommerce',
          logo: '🛒',
          category: 'ecommerce',
          description: 'Plugin WordPress pour e-commerce',
          status: 'connected',
          features: ['API REST', 'Sync produits', 'Gestion commandes', 'Personnalisable'],
          pricing: 'Gratuit',
          setup_difficulty: 'medium',
          monthly_cost: 0,
          orders_synced: 834,
          last_sync: '2024-01-15T09:15:00Z'
        },
        {
          id: 'prestashop',
          name: 'PrestaShop',
          logo: '🏪',
          category: 'ecommerce',
          description: 'Solution e-commerce open source',
          status: 'disconnected',
          features: ['Module natif', 'Multi-langues', 'B2B/B2C', 'Marketplace'],
          pricing: 'Gratuit',
          setup_difficulty: 'medium',
          monthly_cost: 0
        },
        {
          id: 'magento',
          name: 'Magento',
          logo: '🔶',
          category: 'ecommerce',
          description: 'Plateforme enterprise robuste',
          status: 'disconnected',
          features: ['Enterprise', 'Multi-stores', 'B2B avancé', 'Scalable'],
          pricing: 'Premium',
          setup_difficulty: 'advanced',
          monthly_cost: 29
        },

        // Marketplaces
        {
          id: 'amazon',
          name: 'Amazon',
          logo: '📦',
          category: 'marketplace',
          description: 'Marketplace mondiale #1',
          status: 'connected',
          features: ['FBA/FBM', 'Multi-pays', 'Advertising', 'Brand Registry'],
          pricing: 'Commission',
          setup_difficulty: 'medium',
          monthly_cost: 0,
          orders_synced: 567,
          last_sync: '2024-01-15T08:45:00Z'
        },
        {
          id: 'ebay',
          name: 'eBay',
          logo: '🏷️',
          category: 'marketplace',
          description: 'Marketplace internationale',
          status: 'disconnected',
          features: ['Enchères', 'Prix fixe', 'Multi-sites', 'Promoted Listings'],
          pricing: 'Commission',
          setup_difficulty: 'medium',
          monthly_cost: 0
        },
        {
          id: 'cdiscount',
          name: 'Cdiscount',
          logo: '🛍️',
          category: 'marketplace',
          description: 'Marketplace française leader',
          status: 'error',
          features: ['Marketplace FR', 'C-Logistics', 'Publicité', 'Pro'],
          pricing: 'Commission',
          setup_difficulty: 'medium',
          monthly_cost: 0
        },
        {
          id: 'fnac',
          name: 'Fnac Darty',
          logo: '📚',
          category: 'marketplace',
          description: 'Marketplace culture & tech',
          status: 'disconnected',
          features: ['Culture', 'High-tech', 'Click & Collect', 'Premium'],
          pricing: 'Commission',
          setup_difficulty: 'medium',
          monthly_cost: 0
        },

        // Social Commerce
        {
          id: 'facebook',
          name: 'Facebook Shop',
          logo: '📘',
          category: 'social',
          description: 'Vendez sur Facebook et Instagram',
          status: 'connected',
          features: ['Instagram Shopping', 'Catalogs', 'Ads', 'Messenger'],
          pricing: 'Commission',
          setup_difficulty: 'easy',
          monthly_cost: 0,
          orders_synced: 234,
          last_sync: '2024-01-15T11:20:00Z'
        },
        {
          id: 'tiktok',
          name: 'TikTok Shop',
          logo: '📱',
          category: 'social',
          description: 'Commerce sur TikTok',
          status: 'disconnected',
          features: ['Live Shopping', 'Video Commerce', 'Créateurs', 'Ads'],
          pricing: 'Commission',
          setup_difficulty: 'easy',
          monthly_cost: 0
        },
        {
          id: 'pinterest',
          name: 'Pinterest Business',
          logo: '📌',
          category: 'social',
          description: 'Shopping sur Pinterest',
          status: 'disconnected',
          features: ['Product Pins', 'Shopping Ads', 'Catalog', 'Verified'],
          pricing: 'Gratuit',
          setup_difficulty: 'easy',
          monthly_cost: 0
        },

        // Marketing & Analytics
        {
          id: 'google-analytics',
          name: 'Google Analytics',
          logo: '📊',
          category: 'analytics',
          description: 'Analytics et suivi avancé',
          status: 'connected',
          features: ['E-commerce', 'Goals', 'Audiences', 'Attribution'],
          pricing: 'Gratuit',
          setup_difficulty: 'medium',
          monthly_cost: 0
        },
        {
          id: 'mailchimp',
          name: 'Mailchimp',
          logo: '📧',
          category: 'marketing',
          description: 'Email marketing automatisé',
          status: 'connected',
          features: ['Email Campaigns', 'Automation', 'Segmentation', 'A/B Testing'],
          pricing: 'Freemium',
          setup_difficulty: 'easy',
          monthly_cost: 19,
          orders_synced: 156
        },
        {
          id: 'klaviyo',
          name: 'Klaviyo',
          logo: '💌',
          category: 'marketing',
          description: 'Marketing automation avancé',
          status: 'disconnected',
          features: ['SMS Marketing', 'Flows', 'Segmentation', 'Personalization'],
          pricing: 'Premium',
          setup_difficulty: 'medium',
          monthly_cost: 45
        },

        // Business Tools
        {
          id: 'zapier',
          name: 'Zapier',
          logo: '⚡',
          category: 'automation',
          description: 'Automatisation entre 5000+ apps',
          status: 'connected',
          features: ['Zaps', 'Multi-step', 'Webhooks', 'Filters'],
          pricing: 'Freemium',
          setup_difficulty: 'easy',
          monthly_cost: 29
        },
        {
          id: 'slack',
          name: 'Slack',
          logo: '💬',
          category: 'communication',
          description: 'Notifications et collaboration',
          status: 'connected',
          features: ['Notifications', 'Channels', 'Bots', 'Integrations'],
          pricing: 'Freemium',
          setup_difficulty: 'easy',
          monthly_cost: 0
        }
      ]
      setIntegrations(mockIntegrations)
    } catch (error) {
      console.error('Erreur chargement intégrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredIntegrations = integrations.filter(integration =>
    categoryFilter === 'all' || integration.category === categoryFilter
  )

  const categories = [
    { id: 'all', name: 'Toutes', icon: Globe },
    { id: 'ecommerce', name: 'E-commerce', icon: Store },
    { id: 'marketplace', name: 'Marketplaces', icon: ShoppingBag },
    { id: 'social', name: 'Social Commerce', icon: Smartphone },
    { id: 'marketing', name: 'Marketing', icon: Zap },
    { id: 'analytics', name: 'Analytics', icon: Monitor },
    { id: 'automation', name: 'Automation', icon: Settings }
  ]

  const getStatusBadge = (status: string) => {
    const variants = {
      connected: { variant: 'default' as const, icon: <CheckCircle className="h-3 w-3" />, text: 'Connecté' },
      disconnected: { variant: 'secondary' as const, icon: <AlertCircle className="h-3 w-3" />, text: 'Déconnecté' },
      error: { variant: 'destructive' as const, icon: <AlertCircle className="h-3 w-3" />, text: 'Erreur' }
    }
    const config = variants[status as keyof typeof variants] || variants.disconnected
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.text}
      </Badge>
    )
  }

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${colors[difficulty as keyof typeof colors]}`}>
        {difficulty === 'easy' ? 'Facile' : difficulty === 'medium' ? 'Moyen' : 'Avancé'}
      </span>
    )
  }

  const connectedCount = integrations.filter(i => i.status === 'connected').length
  const totalRevenue = integrations
    .filter(i => i.orders_synced)
    .reduce((sum, i) => sum + (i.orders_synced || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Intégrations - Drop Craft AI | Hub des Intégrations</title>
        <meta name="description" content="Connectez votre business à 50+ plateformes. E-commerce, marketplaces, marketing, analytics." />
      </Helmet>

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hub des Intégrations</h1>
            <p className="text-muted-foreground">
              Connectez votre business à {integrations.length} plateformes - {connectedCount} connectées
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Synchroniser tout
            </Button>
            <Button className="btn-gradient">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter intégration
            </Button>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{connectedCount}</div>
              <p className="text-xs text-muted-foreground">Intégrations actives</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Commandes synchronisées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">98.5%</div>
              <p className="text-xs text-muted-foreground">Taux de réussite</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">2min</div>
              <p className="text-xs text-muted-foreground">Délai moyen sync</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList>
            <TabsTrigger value="browse">Parcourir</TabsTrigger>
            <TabsTrigger value="connected">Connectées ({connectedCount})</TabsTrigger>
            <TabsTrigger value="automation">Automatisation</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Filtres par catégories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <Button
                    key={category.id}
                    variant={categoryFilter === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCategoryFilter(category.id)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {category.name}
                  </Button>
                )
              })}
            </div>

            {/* Grille des intégrations */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIntegrations.map((integration) => (
                <Card key={integration.id} className="card-hover">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{integration.logo}</div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(integration.status)}
                            {getDifficultyBadge(integration.setup_difficulty)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-2">
                      {integration.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Features */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Fonctionnalités</h4>
                      <div className="flex flex-wrap gap-1">
                        {integration.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {integration.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{integration.features.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-muted-foreground">Prix:</span>
                        <span className="ml-1 font-medium">
                          {integration.monthly_cost > 0 ? `${integration.monthly_cost}€/mois` : integration.pricing}
                        </span>
                      </div>
                      {integration.orders_synced && (
                        <div>
                          <span className="text-sm text-muted-foreground">Commandes:</span>
                          <span className="ml-1 font-medium">{integration.orders_synced}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {integration.status === 'connected' ? (
                        <Button variant="outline" className="flex-1" size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          Configurer
                        </Button>
                      ) : (
                        <ActionButton 
                          variant="default" 
                          className="flex-1" 
                          size="sm"
                          onClick={async () => {
                            // Simulation de connexion
                            console.log(`Connexion à ${integration.name}`)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Connecter
                        </ActionButton>
                      )}
                      <Button variant="ghost" size="sm">
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="connected" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Intégrations Connectées</CardTitle>
                <CardDescription>
                  Gérez vos {connectedCount} intégrations actives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrations.filter(i => i.status === 'connected').map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-xl">{integration.logo}</div>
                        <div>
                          <h3 className="font-medium">{integration.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {integration.last_sync && `Dernière sync: ${new Date(integration.last_sync).toLocaleString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {integration.orders_synced && (
                          <Badge variant="outline">{integration.orders_synced} commandes</Badge>
                        )}
                        <Switch defaultChecked />
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Règles d'Automatisation</CardTitle>
                <CardDescription>
                  Automatisez la synchronisation entre vos plateformes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Sync automatique des stocks</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Synchronise les stocks entre toutes les plateformes
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="default">Actif</Badge>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Mise à jour des prix</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Synchronise les prix selon vos règles
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="default">Actif</Badge>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

export default ModernIntegrationsHub