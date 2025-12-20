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

// Extensions marketplace - Exactement comme dans l'image
const MARKETPLACE_EXTENSIONS = [
  {
    id: 'ai-seo-optimizer',
    name: 'ai_seo_optimizer',
    display_name: 'AI SEO Optimizer',
    description: 'Optimise automatiquement les titres, descriptions et mots-clés avec IA',
    detailed_description: 'Extension IA avancée pour optimisation SEO complète de vos produits. Génération automatique de méta-descriptions, titres optimisés, mots-clés pertinents et analyse de performance SEO.',
    category: 'ai_enhancement',
    developer: 'SEO Pro Labs',
    developer_verified: true,
    price: 24.99,
    pricing_model: 'monthly',
    icon: Brain,
    color: 'from-purple-500 to-pink-600',
    rating: 4.9,
    reviews_count: 1847,
    downloads: 25420,
    last_updated: '2024-01-22',
    version: '3.2.1',
    compatibility: ['all'],
    features: ['SEO automatique', 'Mots-clés IA', 'Méta-descriptions', 'Score qualité'],
    screenshots: ['/api/placeholder/600/400', '/api/placeholder/600/400'],
    verified: true,
    trending: true,
    ai_enhanced: true,
    enterprise: false,
    premium: true
  },
  {
    id: 'smart-pricing-ai',
    name: 'smart_pricing_ai',
    display_name: 'Smart Pricing AI',
    description: 'Calcule automatiquement les prix optimaux basés sur la concurrence',
    detailed_description: 'IA de pricing dynamique qui analyse automatiquement la concurrence, calcule les prix optimaux, surveille les marges et ajuste les tarifs pour maximiser les profits.',
    category: 'ai_enhancement',
    developer: 'Pricing Analytics',
    developer_verified: true,
    price: 39.99,
    pricing_model: 'monthly',  
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-600',
    rating: 4.8,
    reviews_count: 923,
    downloads: 18934,
    last_updated: '2024-01-20',
    version: '2.1.5',
    compatibility: ['all'],
    features: ['Prix compétitifs', 'Analyse marché', 'Marges optimales', 'Auto-ajustement'],
    screenshots: ['/api/placeholder/600/400', '/api/placeholder/600/400'],
    verified: true,
    trending: true,
    ai_enhanced: true,
    enterprise: false,
    premium: true
  },
  {
    id: 'quality-check-ai',
    name: 'quality_check_ai',
    display_name: 'Quality Check AI',
    description: 'Vérifie automatiquement la qualité des produits importés avec IA',
    detailed_description: 'IA de contrôle qualité qui analyse automatiquement vos produits importés, détecte les erreurs, vérifie la cohérence des données et suggère des améliorations.',
    category: 'ai_enhancement',
    developer: 'Quality Assurance Co',
    developer_verified: true,
    price: 0,
    pricing_model: 'free',
    icon: Award,
    color: 'from-blue-500 to-cyan-600',
    rating: 4.7,
    reviews_count: 1567,
    downloads: 34521,
    last_updated: '2024-01-18',
    version: '1.9.3',
    compatibility: ['all'],
    features: ['Score qualité', 'Détection erreurs', 'Auto-correction', 'Suggestions IA'],
    screenshots: ['/api/placeholder/600/400', '/api/placeholder/600/400'],
    verified: true,
    trending: false,
    ai_enhanced: true,
    enterprise: false,
    premium: false
  },
  {
    id: 'image-enhancer-ai',
    name: 'image_enhancer_ai',
    display_name: 'Image Enhancer AI',
    description: 'Améliore et optimise automatiquement les images produits',
    detailed_description: 'IA avancée pour traitement d\'images : amélioration automatique de la qualité, redimensionnement intelligent, compression optimisée et génération de variantes.',
    category: 'media_optimization',
    developer: 'PixelPerfect AI',
    developer_verified: true,
    price: 19.99,
    pricing_model: 'monthly',
    icon: ImageIcon,
    color: 'from-orange-500 to-red-600',
    rating: 4.6,
    reviews_count: 734,
    downloads: 12456,
    last_updated: '2024-01-15',
    version: '2.0.5',
    compatibility: ['all'],
    features: ['Amélioration IA', 'Redimensionnement', 'Compression', 'Batch processing'],
    screenshots: ['/api/placeholder/600/400', '/api/placeholder/600/400'],
    verified: true,
    trending: false,
    ai_enhanced: true,
    enterprise: false,
    premium: true
  },
  {
    id: 'auto-categorizer',
    name: 'auto_categorizer',
    display_name: 'Auto Categorizer',
    description: 'Catégorise automatiquement les produits avec IA avancée',
    detailed_description: 'IA de catégorisation automatique qui analyse vos produits, les classe dans les bonnes catégories, génère des tags pertinents et optimise l\'organisation de votre catalogue.',
    category: 'ai_enhancement',
    developer: 'Category Master',
    developer_verified: true,
    price: 0,
    pricing_model: 'free',
    icon: Filter,
    color: 'from-indigo-500 to-purple-600',
    rating: 4.8,
    reviews_count: 2103,
    downloads: 45678,
    last_updated: '2024-01-25',
    version: '3.1.2',
    compatibility: ['all'],
    features: ['Catégories IA', 'Tags automatiques', 'Classification', 'Organisation auto'],
    screenshots: ['/api/placeholder/600/400', '/api/placeholder/600/400'],
    verified: true,
    trending: true,
    ai_enhanced: true,
    enterprise: false,
    premium: false
  }
]

const CATEGORIES = [
  { value: 'all', label: 'Toutes les catégories', count: MARKETPLACE_EXTENSIONS.length },
  { value: 'ai_enhancement', label: 'IA & Optimisation', count: 4 },
  { value: 'media_optimization', label: 'Optimisation Media', count: 1 }
]

export const MarketplacePublic = () => {
  const [activeTab, setActiveTab] = useState('recommended')
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
      <Card className="group hover:shadow-lg transition-all duration-300 border hover:border-primary/20 bg-card/50 backdrop-blur-sm">
        <div className={`absolute inset-0 bg-gradient-to-r ${extension.color} opacity-5 rounded-lg`}></div>
        
        <CardHeader className="relative pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 bg-gradient-to-r ${extension.color} text-white rounded-xl shadow-lg`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-lg font-semibold">{extension.display_name}</CardTitle>
                  {extension.ai_enhanced && (
                    <Badge className="bg-purple-100 text-purple-800 text-xs font-medium">
                      <Brain className="h-3 w-3 mr-1" />
                      IA
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {extension.description}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 relative pt-0">
          {/* Tags des fonctionnalités */}
          <div className="flex flex-wrap gap-1">
            {extension.features.slice(0, 4).map((feature: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs bg-background/50">
                {feature}
              </Badge>
            ))}
          </div>

          {/* Metrics */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{extension.rating}</span>
            </div>
            <div className="text-right">
              {extension.price === 0 ? (
                <Badge className="bg-green-100 text-green-800 font-medium">Free</Badge>
              ) : (
                <Badge className="bg-primary/10 text-primary font-medium">Premium</Badge>
              )}
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2">
            {!installed ? (
              <Button
                onClick={() => handleInstall(extension)}
                disabled={isInstallingExtension}
                className="w-full"
                size="sm"
              >
                {isInstallingExtension ? 'Installation...' : 'Installer'}
              </Button>
            ) : (
              <Button variant="outline" className="w-full" disabled size="sm">
                <Check className="h-4 w-4 mr-2" />
                Installée
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs style marketplace */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6">
          <TabsList className="grid w-fit grid-cols-3 bg-background/50 backdrop-blur-sm">
            <TabsTrigger value="recommended" className="text-sm">Recommandées</TabsTrigger>
            <TabsTrigger value="installed" className="text-sm">
              Installées ({installedExtensions.length})
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="text-sm">Marketplace</TabsTrigger>
          </TabsList>
          
          {activeTab === 'marketplace' && (
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <TabsContent value="recommended" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MARKETPLACE_EXTENSIONS
              .filter(ext => ext.trending || ext.ai_enhanced)
              .slice(0, 6)
              .map(extension => (
                <ExtensionCard key={extension.id} extension={extension} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="installed" className="space-y-6">
          {installedExtensions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {installedExtensions.map(ext => (
                <Card key={ext.id} className="border bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Settings className="h-4 w-4 text-primary" />
                      </div>
                      {ext.name}
                    </CardTitle>
                    <CardDescription>{ext.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant={ext.status === 'active' ? 'default' : 'secondary'}>
                        {ext.status === 'active' ? 'Activée' : 'Désactivée'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">v{ext.version}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucune extension installée</h3>
              <p className="text-muted-foreground mb-4">
                Explorez le marketplace pour découvrir des extensions
              </p>
              <Button onClick={() => setActiveTab('recommended')}>
                Découvrir les extensions
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-6">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des extensions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Grille d'extensions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </Tabs>
    </div>
  )
}