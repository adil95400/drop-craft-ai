import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Store, 
  Star, 
  Download, 
  TrendingUp, 
  Award, 
  Search, 
  Filter, 
  Heart,
  ExternalLink,
  Check,
  Users,
  Calendar,
  Code,
  Zap,
  Brain,
  ShoppingCart,
  Image as ImageIcon,
  BarChart3,
  Settings,
  Crown,
  Sparkles
} from 'lucide-react'
import { useExtensions } from '@/hooks/useExtensions'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

// Extensions marketplace avec vraies données simulées
const MARKETPLACE_EXTENSIONS = [
  {
    id: 'shopify-sync-pro',
    name: 'shopify_sync_pro',
    display_name: 'Shopify Sync Pro',
    description: 'Synchronisation bidirectionnelle complète avec Shopify, gestion des variants et des collections.',
    detailed_description: 'Extension professionnelle pour une synchronisation temps réel avec Shopify. Gère les variants, collections, clients et commandes. Interface dédiée et webhook automatique.',
    category: 'integration',
    developer: 'ShopifyLabs',
    developer_verified: true,
    price: 29.99,
    pricing_model: 'monthly',
    icon: ShoppingCart,
    color: 'from-green-500 to-emerald-600',
    rating: 4.9,
    reviews_count: 847,
    downloads: 15420,
    last_updated: '2024-01-15',
    version: '2.3.1',
    compatibility: ['shopify', 'woocommerce'],
    features: ['Sync bidirectionnel', 'Gestion variants', 'Webhooks temps réel', 'Analytics intégrées'],
    screenshots: ['/api/placeholder/600/400', '/api/placeholder/600/400'],
    verified: true,
    trending: true,
    ai_enhanced: false,
    enterprise: true
  },
  {
    id: 'ai-content-wizard',
    name: 'ai_content_wizard',
    display_name: 'AI Content Wizard',
    description: 'Génération automatique de contenu marketing avec GPT-4, traductions et A/B testing.',
    detailed_description: 'Extension IA avancée utilisant GPT-4 pour générer descriptions produits, emails marketing, posts réseaux sociaux. Inclut traduction automatique et tests A/B.',
    category: 'ai_enhancement',
    developer: 'AIMarketingCorp',
    developer_verified: true,
    price: 0,
    pricing_model: 'freemium',
    icon: Brain,
    color: 'from-purple-500 to-pink-600',
    rating: 4.8,
    reviews_count: 1203,
    downloads: 28941,
    last_updated: '2024-01-20',
    version: '1.8.2',
    compatibility: ['all'],
    features: ['GPT-4 intégré', 'Traduction auto', 'A/B Testing', 'Templates marketing'],
    screenshots: ['/api/placeholder/600/400', '/api/placeholder/600/400'],
    verified: true,
    trending: true,
    ai_enhanced: true,
    enterprise: false
  },
  {
    id: 'amazon-fba-optimizer',
    name: 'amazon_fba_optimizer',
    display_name: 'Amazon FBA Optimizer',
    description: 'Optimisation automatique des listings Amazon FBA avec analyse concurrentielle.',
    detailed_description: 'Optimise vos listings Amazon FBA avec analyse de mots-clés, surveillance concurrence, ajustement prix automatique et gestion des avis.',
    category: 'optimization',
    developer: 'AmazonTools Pro',
    developer_verified: false,
    price: 49.99,
    pricing_model: 'monthly',
    icon: TrendingUp,
    color: 'from-orange-500 to-red-600',
    rating: 4.6,
    reviews_count: 592,
    downloads: 8734,
    last_updated: '2024-01-10',
    version: '3.1.0',
    compatibility: ['amazon'],
    features: ['Analyse mots-clés', 'Surveillance prix', 'Gestion avis', 'Rapports détaillés'],
    screenshots: ['/api/placeholder/600/400'],
    verified: false,
    trending: false,
    ai_enhanced: true,
    enterprise: true
  },
  {
    id: 'image-ai-enhancer',
    name: 'image_ai_enhancer',
    display_name: 'Image AI Enhancer',
    description: 'Amélioration d\'images produits avec IA, suppression d\'arrière-plan et génération variants.',
    detailed_description: 'IA avancée pour traitement d\'images : amélioration qualité, suppression arrière-plan, génération de variants couleur, redimensionnement intelligent.',
    category: 'media_optimization',
    developer: 'PixelPerfect AI',
    developer_verified: true,
    price: 19.99,
    pricing_model: 'monthly',
    icon: ImageIcon,
    color: 'from-blue-500 to-cyan-600',
    rating: 4.7,
    reviews_count: 734,
    downloads: 12456,
    last_updated: '2024-01-18',
    version: '2.0.5',
    compatibility: ['all'],
    features: ['IA amélioration', 'Suppression fond', 'Variants couleur', 'Batch processing'],
    screenshots: ['/api/placeholder/600/400', '/api/placeholder/600/400'],
    verified: true,
    trending: false,
    ai_enhanced: true,
    enterprise: false
  },
  {
    id: 'advanced-analytics-suite',
    name: 'advanced_analytics_suite',
    display_name: 'Advanced Analytics Suite',
    description: 'Suite d\'analytics avancées avec prédictions IA et tableaux de bord personnalisables.',
    detailed_description: 'Analytics professionnelles avec machine learning pour prédictions de ventes, analyse comportementale clients, ROI campagnes et tableaux de bord temps réel.',
    category: 'analytics',
    developer: 'DataInsights Pro',
    developer_verified: true,
    price: 79.99,
    pricing_model: 'monthly',
    icon: BarChart3,
    color: 'from-indigo-500 to-purple-600',
    rating: 4.9,
    reviews_count: 1567,
    downloads: 6789,
    last_updated: '2024-01-22',
    version: '4.2.1',
    compatibility: ['all'],
    features: ['Prédictions ML', 'Dashboards custom', 'API complète', 'Exports avancés'],
    screenshots: ['/api/placeholder/600/400', '/api/placeholder/600/400'],
    verified: true,
    trending: true,
    ai_enhanced: true,
    enterprise: true
  },
  {
    id: 'multi-channel-inventory',
    name: 'multi_channel_inventory',
    display_name: 'Multi-Channel Inventory',
    description: 'Gestion centralisée des stocks multi-plateformes avec sync temps réel.',
    detailed_description: 'Solution enterprise pour gestion stocks multi-canaux. Synchronisation temps réel, alertes automatiques, prévisions de stock et intégrations ERP.',
    category: 'inventory',
    developer: 'InventoryMaster',
    developer_verified: true,
    price: 149.99,
    pricing_model: 'monthly',
    icon: Settings,
    color: 'from-green-600 to-teal-600',
    rating: 4.8,
    reviews_count: 423,
    downloads: 3421,
    last_updated: '2024-01-19',
    version: '5.1.3',
    compatibility: ['shopify', 'woocommerce', 'amazon', 'ebay'],
    features: ['Sync multi-canal', 'Prévisions stock', 'Alertes auto', 'Intégrations ERP'],
    screenshots: ['/api/placeholder/600/400'],
    verified: true,
    trending: false,
    ai_enhanced: false,
    enterprise: true
  }
]

const CATEGORIES = [
  { value: 'all', label: 'Toutes les catégories', count: MARKETPLACE_EXTENSIONS.length },
  { value: 'integration', label: 'Intégrations', count: 1 },
  { value: 'ai_enhancement', label: 'IA & Optimisation', count: 3 },
  { value: 'optimization', label: 'Optimisation', count: 1 },
  { value: 'analytics', label: 'Analytics', count: 1 },
  { value: 'inventory', label: 'Gestion Stock', count: 1 }
]

export const MarketplacePublic = () => {
  const [activeTab, setActiveTab] = useState('browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('trending')
  const [priceFilter, setPriceFilter] = useState('all')
  const [selectedExtension, setSelectedExtension] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)

  const { 
    extensions: installedExtensions, 
    installExtension, 
    isInstallingExtension 
  } = useExtensions()

  // Filtrer et trier les extensions
  const filteredExtensions = MARKETPLACE_EXTENSIONS
    .filter(ext => {
      const matchesSearch = searchQuery === '' || 
        ext.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ext.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ext.developer.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = selectedCategory === 'all' || ext.category === selectedCategory
      
      const matchesPrice = priceFilter === 'all' || 
        (priceFilter === 'free' && ext.price === 0) ||
        (priceFilter === 'paid' && ext.price > 0)
      
      return matchesSearch && matchesCategory && matchesPrice
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'trending':
          return (b.trending ? 1 : 0) - (a.trending ? 1 : 0) || b.downloads - a.downloads
        case 'rating':
          return b.rating - a.rating
        case 'downloads':
          return b.downloads - a.downloads
        case 'newest':
          return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
        case 'price_low':
          return a.price - b.price
        case 'price_high':
          return b.price - a.price
        default:
          return 0
      }
    })

  const isInstalled = (extensionName: string) => {
    return installedExtensions.some(ext => ext.name === extensionName)
  }

  const handleInstall = async (extension: any) => {
    try {
      await installExtension({
        name: extension.name,
        display_name: extension.display_name,
        description: extension.description,
        category: extension.category,
        provider: extension.developer,
        version: extension.version,
        configuration: {
          marketplace_install: true,
          price: extension.price,
          pricing_model: extension.pricing_model
        },
        permissions: {
          read_products: true,
          write_products: true,
          api_access: true
        },
        metadata: {
          rating: extension.rating,
          downloads: extension.downloads,
          verified: extension.verified
        }
      })

      // Simuler un achat si payant
      if (extension.price > 0) {
        const { error } = await supabase.functions.invoke('marketplace-connector', {
          body: {
            action: 'purchase_extension',
            extension_id: extension.id,
            price: extension.price,
            pricing_model: extension.pricing_model
          }
        })

        if (error) {
          throw new Error('Erreur lors de l\'achat')
        }
      }

      toast.success(`✅ ${extension.display_name} installée avec succès !`)
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`)
    }
  }

  const ExtensionCard = ({ extension }: { extension: any }) => {
    const Icon = extension.icon
    const installed = isInstalled(extension.name)

    return (
      <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
        <div className={`absolute inset-0 bg-gradient-to-r ${extension.color} opacity-5 rounded-lg`}></div>
        
        <CardHeader className="relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 bg-gradient-to-r ${extension.color} text-white rounded-xl`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-lg">{extension.display_name}</CardTitle>
                  {extension.verified && (
                    <Badge className="bg-blue-100 text-blue-800">
                      <Check className="h-3 w-3 mr-1" />
                      Vérifié
                    </Badge>
                  )}
                  {extension.trending && (
                    <Badge className="bg-orange-100 text-orange-800">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Tendance
                    </Badge>
                  )}
                  {extension.ai_enhanced && (
                    <Badge className="bg-purple-100 text-purple-800">
                      <Brain className="h-3 w-3 mr-1" />
                      IA
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>par {extension.developer}</span>
                  {extension.developer_verified && (
                    <Crown className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              {extension.price === 0 ? (
                <Badge variant="secondary">Gratuit</Badge>
              ) : (
                <div className="text-lg font-bold text-primary">{extension.price}€/{extension.pricing_model === 'monthly' ? 'mois' : 'an'}</div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 relative">
          <CardDescription className="text-sm line-clamp-2">
            {extension.description}
          </CardDescription>

          {/* Metrics */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{extension.rating}</span>
              <span>({extension.reviews_count})</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              <span>{extension.downloads.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>v{extension.version}</span>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-1">
            {extension.features.slice(0, 3).map((feature: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
            {extension.features.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{extension.features.length - 3}
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            {!installed ? (
              <Button
                onClick={() => handleInstall(extension)}
                disabled={isInstallingExtension}
                className="flex-1"
              >
                {isInstallingExtension ? 'Installation...' : 
                 extension.price === 0 ? 'Installer' : `Acheter ${extension.price}€`}
              </Button>
            ) : (
              <Button variant="outline" className="flex-1" disabled>
                <Check className="h-4 w-4 mr-2" />
                Installée
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedExtension(extension)
                setShowDetails(true)
              }}
            >
              Détails
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header du Marketplace */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 rounded-2xl text-white">
        <div className="absolute inset-0 bg-black/20 rounded-2xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <Store className="h-8 w-8" />
                Extension Marketplace
              </h1>
              <p className="text-xl opacity-90 mt-2">
                Découvrez {MARKETPLACE_EXTENSIONS.length} extensions pour booster votre e-commerce
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{filteredExtensions.length}</div>
              <div className="text-sm opacity-80">Extensions disponibles</div>
            </div>
          </div>
          
          {/* Stats rapides */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>50k+ développeurs</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              <span>2M+ téléchargements</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span>Extensions IA natives</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">Parcourir</TabsTrigger>
          <TabsTrigger value="trending">Tendances</TabsTrigger>
          <TabsTrigger value="ai-powered">IA & Innovation</TabsTrigger>
          <TabsTrigger value="enterprise">Enterprise</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Filtres et recherche */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher des extensions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label} ({cat.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trending">Tendances</SelectItem>
                <SelectItem value="rating">Mieux notées</SelectItem>
                <SelectItem value="downloads">Plus téléchargées</SelectItem>
                <SelectItem value="newest">Plus récentes</SelectItem>
                <SelectItem value="price_low">Prix croissant</SelectItem>
                <SelectItem value="price_high">Prix décroissant</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-full lg:w-32">
                <SelectValue placeholder="Prix" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="free">Gratuit</SelectItem>
                <SelectItem value="paid">Payant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grille d'extensions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExtensions.map(extension => (
              <ExtensionCard key={extension.id} extension={extension} />
            ))}
          </div>

          {filteredExtensions.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucune extension trouvée</h3>
              <p className="text-muted-foreground">
                Essayez d'ajuster vos filtres de recherche
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MARKETPLACE_EXTENSIONS
              .filter(ext => ext.trending)
              .map(extension => (
                <ExtensionCard key={extension.id} extension={extension} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="ai-powered">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MARKETPLACE_EXTENSIONS
              .filter(ext => ext.ai_enhanced)
              .map(extension => (
                <ExtensionCard key={extension.id} extension={extension} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="enterprise">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MARKETPLACE_EXTENSIONS
              .filter(ext => ext.enterprise)
              .map(extension => (
                <ExtensionCard key={extension.id} extension={extension} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}