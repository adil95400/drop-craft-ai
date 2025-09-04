import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useExtensions } from '@/hooks/useExtensions'
import { 
  ShoppingCart, 
  Star, 
  Zap, 
  Search, 
  Settings, 
  Download,
  CheckCircle,
  Play,
  Pause,
  Trash2
} from 'lucide-react'

const AVAILABLE_EXTENSIONS = [
  {
    id: 'amazon-product-importer',
    name: 'amazon-product-importer',
    display_name: 'Amazon Product Importer',
    description: 'Import products directly from Amazon with AI-powered optimization',
    category: 'product_import' as const,
    provider: 'amazon',
    version: '1.0.0',
    configuration: {},
    permissions: ['products:import', 'ai:enhance'],
    metadata: {
      features: ['AI Product Enhancement', 'Bulk Import', 'Real-time Sync', 'Price Tracking'],
      pricing: 'Freemium',
      rating: 4.8,
      downloads: 12450
    },
    api_endpoints: {
      import: '/api/amazon/import',
      sync: '/api/amazon/sync'
    },
    rate_limits: {
      requests_per_minute: 60,
      products_per_hour: 1000
    }
  },
  {
    id: 'ebay-smart-import',
    name: 'ebay-smart-import',
    display_name: 'eBay Smart Import',
    description: 'Advanced eBay product import with competitive analysis',
    category: 'product_import' as const,
    provider: 'ebay',
    version: '1.2.0',
    configuration: {},
    permissions: ['products:import', 'analytics:read'],
    metadata: {
      features: ['Smart Categorization', 'Price Analysis', 'Seller Insights'],
      pricing: 'Premium',
      rating: 4.6,
      downloads: 8920
    },
    api_endpoints: {
      import: '/api/ebay/import'
    },
    rate_limits: {
      requests_per_minute: 30
    }
  },
  {
    id: 'social-reviews-aggregator',
    name: 'social-reviews-aggregator',
    display_name: 'Social Reviews Aggregator',
    description: 'Collect reviews from social media platforms automatically',
    category: 'review_import' as const,
    provider: 'social_media',
    version: '1.0.0',
    configuration: {},
    permissions: ['reviews:import', 'social:read'],
    metadata: {
      features: ['Multi-Platform Support', 'AI Sentiment Analysis', 'Auto Translation'],
      pricing: 'Free',
      rating: 4.7,
      downloads: 15600
    },
    api_endpoints: {
      import: '/api/social/reviews'
    },
    rate_limits: {
      requests_per_hour: 500
    }
  },
  {
    id: 'shopify-bridge',
    name: 'shopify-bridge',
    display_name: 'Shopify Bridge',
    description: 'Seamless Shopify integration for products and orders',
    category: 'product_import' as const,
    provider: 'shopify',
    version: '2.1.0',
    configuration: {},
    permissions: ['products:import', 'orders:sync'],
    metadata: {
      features: ['Real-time Sync', 'Inventory Management', 'Order Processing'],
      pricing: 'Premium',
      rating: 4.9,
      downloads: 22100
    },
    api_endpoints: {
      sync: '/api/shopify/sync'
    },
    rate_limits: {
      requests_per_minute: 100
    }
  },
  {
    id: 'automation-suite',
    name: 'automation-suite',
    display_name: 'Automation Suite',
    description: 'Advanced automation workflows for all your import needs',
    category: 'automation' as const,
    provider: 'internal',
    version: '1.5.0',
    configuration: {},
    permissions: ['automation:create', 'workflows:execute'],
    metadata: {
      features: ['Custom Workflows', 'Scheduled Tasks', 'Error Handling', 'Notifications'],
      pricing: 'Premium',
      rating: 4.8,
      downloads: 7800
    },
    api_endpoints: {
      workflows: '/api/automation/workflows'
    },
    rate_limits: {
      workflows_per_day: 100
    }
  }
]

export const ExtensionStore = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExtension, setSelectedExtension] = useState(null)
  
  const { 
    extensions: installedExtensions, 
    installExtension, 
    toggleExtension,
    uninstallExtension,
    isInstallingExtension,
    isTogglingExtension,
    isUninstallingExtension
  } = useExtensions()

  const filteredExtensions = AVAILABLE_EXTENSIONS.filter(ext => {
    const matchesCategory = activeTab === 'all' || ext.category === activeTab
    const matchesSearch = ext.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ext.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const isInstalled = (extensionId: string) => {
    return installedExtensions.some(ext => ext.name === extensionId)
  }

  const getInstalledExtension = (extensionId: string) => {
    return installedExtensions.find(ext => ext.name === extensionId)
  }

  const handleInstall = (extension: typeof AVAILABLE_EXTENSIONS[0]) => {
    installExtension({
      name: extension.name,
      display_name: extension.display_name,
      description: extension.description || '',
      category: extension.category,
      provider: extension.provider,
      configuration: extension.configuration,
      permissions: extension.permissions,
      metadata: extension.metadata,
      api_endpoints: extension.api_endpoints,
      rate_limits: extension.rate_limits
    })
  }

  const handleToggle = (extensionId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    toggleExtension({ id: extensionId, status: newStatus })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Store d'Extensions</h1>
            <p className="text-muted-foreground">
              Découvrez et installez des extensions pour améliorer vos imports
            </p>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher une extension..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="product_import">Import Produits</TabsTrigger>
          <TabsTrigger value="review_import">Import Avis</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExtensions.map((extension) => {
              const installed = isInstalled(extension.id)
              const installedExt = getInstalledExtension(extension.id)
              
              return (
                <Card key={extension.id} className="relative group hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {extension.category === 'product_import' && <ShoppingCart className="h-5 w-5" />}
                          {extension.category === 'review_import' && <Star className="h-5 w-5" />}
                          {extension.category === 'automation' && <Zap className="h-5 w-5" />}
                          {extension.display_name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {extension.description}
                        </p>
                      </div>
                      {installed && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={extension.metadata.pricing === 'Free' ? 'default' : 'secondary'}>
                        {extension.metadata.pricing}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{extension.metadata.rating}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {extension.metadata.downloads.toLocaleString()} téléchargements
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {extension.metadata.features.slice(0, 3).map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {extension.metadata.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{extension.metadata.features.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {!installed ? (
                          <Button 
                            onClick={() => handleInstall(extension)}
                            disabled={isInstallingExtension}
                            className="flex-1"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Installer
                          </Button>
                        ) : (
                          <>
                            <Button
                              onClick={() => handleToggle(installedExt!.id, installedExt!.status)}
                              disabled={isTogglingExtension}
                              variant={installedExt?.status === 'active' ? 'default' : 'outline'}
                              size="sm"
                            >
                              {installedExt?.status === 'active' ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              onClick={() => uninstallExtension(installedExt!.id)}
                              disabled={isUninstallingExtension}
                              variant="outline"
                              size="sm"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="flex-1">
                                  <Settings className="h-4 w-4 mr-2" />
                                  Configurer
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Configuration - {extension.display_name}</DialogTitle>
                                  <DialogDescription>
                                    Configurez les paramètres de l'extension
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <p className="text-sm text-muted-foreground">
                                    Interface de configuration disponible prochainement
                                  </p>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}