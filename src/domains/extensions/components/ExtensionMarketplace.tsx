/**
 * PHASE 4: Extension Marketplace
 * Store d'extensions avec développeurs tiers et système de paiement
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Store, Download, Star, Users, Search, Filter, Heart,
  Zap, Puzzle, TrendingUp, Shield, Package, ExternalLink
} from 'lucide-react'
import { ExtensionCard } from './ExtensionCard'
import { useUnifiedPlan } from '@/lib/unified-plan-system'
import { toast } from 'sonner'

interface Extension {
  id: string
  name: string
  description: string
  category: string
  downloads: string
  rating: number
  price: string
  verified: boolean
  developer: string
  version: string
  lastUpdated: string
  featured?: boolean
  minPlan?: 'free' | 'pro' | 'ultra_pro'
}

const SAMPLE_EXTENSIONS: Extension[] = [
  {
    id: '1',
    name: "Shopify Sync Pro",
    description: "Synchronisation bidirectionnelle complète avec Shopify, gestion des webhooks et mapping avancé",
    category: "Intégrations",
    downloads: "3.2K",
    rating: 4.9,
    price: "Gratuit",
    verified: true,
    developer: "Drop Craft Team",
    version: "2.1.4",
    lastUpdated: "2024-01-15",
    featured: true,
    minPlan: "free"
  },
  {
    id: '2',
    name: "AI Product Optimizer",
    description: "IA avancée pour optimiser automatiquement vos descriptions produits, prix et SEO",
    category: "Automatisation",
    downloads: "2.1K",
    rating: 4.9,
    price: "29€/mois",
    verified: true,
    developer: "AI Labs",
    version: "1.3.2",
    lastUpdated: "2024-01-10",
    featured: true,
    minPlan: "pro"
  },
  {
    id: '3',
    name: "Advanced Analytics Pro",
    description: "Tableaux de bord avancés avec métriques personnalisées et prédictions IA",
    category: "Analytics",
    downloads: "1.8K",
    rating: 4.8,
    price: "39€/mois",
    verified: true,
    developer: "Analytics Plus",
    version: "1.4.7",
    lastUpdated: "2024-01-14",
    featured: true,
    minPlan: "pro"
  },
  {
    id: '4',
    name: "Security & GDPR Suite",
    description: "Outils complets de sécurité et conformité GDPR avec audit automatique",
    category: "Sécurité",
    downloads: "892",
    rating: 4.6,
    price: "39€/mois",
    verified: true,
    developer: "SecureCommerce",
    version: "1.8.0",
    lastUpdated: "2024-01-05",
    minPlan: "ultra_pro"
  },
  {
    id: '5',
    name: "Marketing Automation Suite",
    description: "Automatisation marketing complète avec email campaigns et segmentation client",
    category: "Marketing",
    downloads: "1.5K",
    rating: 4.7,
    price: "19€/mois",
    verified: false,
    developer: "Marketing Pro",
    version: "3.0.1",
    lastUpdated: "2024-01-08",
    minPlan: "pro"
  },
  {
    id: '6',
    name: "WooCommerce Bridge",
    description: "Connecteur avancé pour WooCommerce avec sync temps réel",
    category: "Intégrations",
    downloads: "1.65K",
    rating: 4.5,
    price: "15€/mois",
    verified: false,
    developer: "WooTools",
    version: "2.5.3",
    lastUpdated: "2024-01-12",
    minPlan: "free"
  }
]

const CATEGORIES = [
  { id: 'all', label: 'Toutes', count: 247 },
  { id: 'Intégrations', label: 'Intégrations', count: 89 },
  { id: 'Analytics', label: 'Analytics', count: 56 },
  { id: 'Automatisation', label: 'Automatisation', count: 43 },
  { id: 'Marketing', label: 'Marketing', count: 31 },
  { id: 'Sécurité', label: 'Sécurité', count: 28 }
]

export const ExtensionMarketplace: React.FC = () => {
  const { hasFeature } = useUnifiedPlan()
  const [extensions] = useState<Extension[]>(SAMPLE_EXTENSIONS)
  const [filteredExtensions, setFilteredExtensions] = useState<Extension[]>(SAMPLE_EXTENSIONS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [favorites, setFavorites] = useState<string[]>([])

  // Filtrage des extensions
  useEffect(() => {
    let filtered = extensions

    if (searchQuery) {
      filtered = filtered.filter(ext => 
        ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ext.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(ext => ext.category === selectedCategory)
    }

    setFilteredExtensions(filtered)
  }, [extensions, searchQuery, selectedCategory])

  const handleInstall = (extensionId: string) => {
    const extension = extensions.find(ext => ext.id === extensionId)
    if (!extension) return

    if (extension.minPlan && !hasFeature(`plan_${extension.minPlan}`)) {
      toast.warning(`Cette extension nécessite le plan ${extension.minPlan} ou supérieur`)
      return
    }

    console.log('Installing extension:', extensionId)
    // Logique d'installation
  }

  const handleToggleFavorite = (extensionId: string) => {
    setFavorites(prev => 
      prev.includes(extensionId) 
        ? prev.filter(id => id !== extensionId)
        : [...prev, extensionId]
    )
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <Store className="h-8 w-8 mr-3 text-primary" />
              Extension Marketplace
              <Badge variant="secondary" className="ml-3">
                PHASE 4
              </Badge>
            </h1>
            <p className="text-muted-foreground">
              Découvrez et installez des extensions pour étendre vos fonctionnalités
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Devenir développeur
            </Button>
            <Button>
              <Puzzle className="h-4 w-4 mr-2" />
              Mes extensions
            </Button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher des extensions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Stats du marketplace */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Extensions disponibles</CardTitle>
            <Puzzle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">+12 cette semaine</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Téléchargements</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45.2K</div>
            <p className="text-xs text-muted-foreground">+8% ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Développeurs actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">+5 ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.7</div>
            <p className="text-xs text-muted-foreground">Sur 5 étoiles</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Catégories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Catégories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {CATEGORIES.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <span className="text-sm">{category.label}</span>
                  <Badge variant={selectedCategory === category.id ? "secondary" : "outline"}>
                    {category.count}
                  </Badge>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Extensions favorites */}
          {favorites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  Favorites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {favorites.length} extension{favorites.length > 1 ? 's' : ''} en favoris
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Liste des extensions */}
        <div className="lg:col-span-3 space-y-6">
          {/* Extensions populaires */}
          {selectedCategory === 'all' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Extensions populaires</h2>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredExtensions
                  .filter(ext => ext.featured)
                  .map((extension) => (
                    <ExtensionCard
                      key={extension.id}
                      extension={extension}
                      onInstall={handleInstall}
                      onViewDetails={(id) => console.log('View details:', id)}
                      isFavorite={favorites.includes(extension.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Toutes les extensions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                {selectedCategory === 'all' ? 'Toutes les extensions' : selectedCategory}
              </h2>
              <p className="text-sm text-muted-foreground">
                {filteredExtensions.length} extension{filteredExtensions.length > 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredExtensions.map((extension) => (
                <ExtensionCard
                  key={extension.id}
                  extension={extension}
                  onInstall={handleInstall}
                  onViewDetails={(id) => console.log('View details:', id)}
                  isFavorite={favorites.includes(extension.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>

            {filteredExtensions.length === 0 && (
              <Card className="p-8 text-center">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Aucune extension trouvée</h3>
                <p className="text-muted-foreground mb-4">
                  Essayez de modifier votre recherche ou sélectionnez une autre catégorie
                </p>
                <Button onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}>
                  Réinitialiser
                </Button>
              </Card>
            )}
          </div>

          {/* Développement */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Développer une Extension</h3>
                  <p className="text-muted-foreground mb-4">
                    Créez et partagez vos propres extensions avec la communauté
                  </p>
                  <div className="flex gap-2">
                    <Button>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Guide développeur
                    </Button>
                    <Button variant="outline">API Docs</Button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">89</div>
                  <div className="text-xs text-muted-foreground">Développeurs actifs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}