import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Search, Filter, Star, Download, TrendingUp, Clock, Award, Eye,
  Heart, Share2, MessageSquare, CheckCircle, Zap, Crown, Flame,
  Grid, List, SlidersHorizontal, ArrowUpDown, Calendar, DollarSign
} from 'lucide-react'
import { toast } from 'sonner'

interface MarketplaceExtension {
  id: string
  name: string
  description: string
  short_description: string
  author: string
  author_avatar: string
  author_verified: boolean
  category: string
  subcategory: string
  price: number
  currency: string
  rating: number
  reviews_count: number
  downloads: number
  featured: boolean
  trending: boolean
  new_release: boolean
  premium: boolean
  tags: string[]
  screenshots: string[]
  last_updated: string
  version: string
  compatibility: string[]
  file_size: string
  support_level: 'basic' | 'premium' | 'enterprise'
  demo_available: boolean
  trial_days: number
}

const SAMPLE_EXTENSIONS: MarketplaceExtension[] = [
  {
    id: '1',
    name: 'AI Product Optimizer Pro',
    description: 'Extension avancée utilisant l\'IA pour optimiser automatiquement vos descriptions produits, prix et référencement SEO.',
    short_description: 'Optimisation automatique des produits par IA',
    author: 'TechCorp Solutions',
    author_avatar: '/api/placeholder/32/32',
    author_verified: true,
    category: 'AI & Machine Learning',
    subcategory: 'Product Optimization',
    price: 49.99,
    currency: 'EUR',
    rating: 4.8,
    reviews_count: 234,
    downloads: 15420,
    featured: true,
    trending: true,
    new_release: false,
    premium: true,
    tags: ['ai', 'seo', 'optimization', 'automation'],
    screenshots: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
    last_updated: '2024-01-15',
    version: '2.3.1',
    compatibility: ['Drop Craft AI v3.0+'],
    file_size: '2.4 MB',
    support_level: 'premium',
    demo_available: true,
    trial_days: 14
  },
  {
    id: '2',
    name: 'Smart Inventory Manager',
    description: 'Solution complète de gestion d\'inventaire avec prédictions de stock, alertes automatiques et intégration multi-canaux.',
    short_description: 'Gestion intelligente des stocks',
    author: 'LogiFlow',
    author_avatar: '/api/placeholder/32/32',
    author_verified: true,
    category: 'Inventory Management',
    subcategory: 'Stock Control',
    price: 29.99,
    currency: 'EUR',
    rating: 4.7,
    reviews_count: 156,
    downloads: 8900,
    featured: false,
    trending: true,
    new_release: true,
    premium: false,
    tags: ['inventory', 'stock', 'automation', 'alerts'],
    screenshots: ['/api/placeholder/400/300'],
    last_updated: '2024-01-18',
    version: '1.2.0',
    compatibility: ['Drop Craft AI v2.8+'],
    file_size: '1.8 MB',
    support_level: 'basic',
    demo_available: true,
    trial_days: 7
  },
  {
    id: '3',
    name: 'Advanced Analytics Dashboard',
    description: 'Tableau de bord analytique complet avec plus de 50 métriques, rapports personnalisés et visualisations interactives.',
    short_description: 'Analytics avancées et rapports',
    author: 'DataViz Pro',
    author_avatar: '/api/placeholder/32/32',
    author_verified: false,
    category: 'Analytics & Reporting',
    subcategory: 'Business Intelligence',
    price: 39.99,
    currency: 'EUR',
    rating: 4.5,
    reviews_count: 89,
    downloads: 4560,
    featured: false,
    trending: false,
    new_release: false,
    premium: true,
    tags: ['analytics', 'reports', 'dashboard', 'metrics'],
    screenshots: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
    last_updated: '2024-01-10',
    version: '3.1.2',
    compatibility: ['Drop Craft AI v3.0+'],
    file_size: '3.2 MB',
    support_level: 'enterprise',
    demo_available: false,
    trial_days: 0
  }
]

export const AdvancedMarketplace = () => {
  const [extensions, setExtensions] = useState<MarketplaceExtension[]>(SAMPLE_EXTENSIONS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [sortBy, setSortBy] = useState('featured')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [wishlist, setWishlist] = useState<string[]>([])

  const categories = [
    'Toutes les catégories',
    'AI & Machine Learning',
    'Analytics & Reporting',
    'Marketing & SEO',
    'Inventory Management',
    'Customer Service',
    'Payment & Billing',
    'Shipping & Logistics',
    'Design & UX',
    'Development Tools',
    'Security & Compliance'
  ]

  const sortOptions = [
    { value: 'featured', label: 'Mis en avant' },
    { value: 'popular', label: 'Plus populaires' },
    { value: 'newest', label: 'Plus récents' },
    { value: 'rating', label: 'Mieux notés' },
    { value: 'price_low', label: 'Prix croissant' },
    { value: 'price_high', label: 'Prix décroissant' }
  ]

  const priceRanges = [
    { value: '', label: 'Tous les prix' },
    { value: 'free', label: 'Gratuit' },
    { value: '0-20', label: '0€ - 20€' },
    { value: '20-50', label: '20€ - 50€' },
    { value: '50+', label: '50€+' }
  ]

  const filteredExtensions = extensions.filter(ext => {
    const matchesSearch = ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ext.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ext.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = !selectedCategory || selectedCategory === 'Toutes les catégories' || 
                           ext.category === selectedCategory
    
    const matchesPrice = !priceRange || 
                        (priceRange === 'free' && ext.price === 0) ||
                        (priceRange === '0-20' && ext.price >= 0 && ext.price <= 20) ||
                        (priceRange === '20-50' && ext.price > 20 && ext.price <= 50) ||
                        (priceRange === '50+' && ext.price > 50)
    
    return matchesSearch && matchesCategory && matchesPrice
  })

  const sortedExtensions = [...filteredExtensions].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.downloads - a.downloads
      case 'newest':
        return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
      case 'rating':
        return b.rating - a.rating
      case 'price_low':
        return a.price - b.price
      case 'price_high':
        return b.price - a.price
      case 'featured':
      default:
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
    }
  })

  const toggleWishlist = (extensionId: string) => {
    setWishlist(prev => 
      prev.includes(extensionId) 
        ? prev.filter(id => id !== extensionId)
        : [...prev, extensionId]
    )
    toast.success(
      wishlist.includes(extensionId) 
        ? 'Retiré de la wishlist' 
        : 'Ajouté à la wishlist'
    )
  }

  const handleInstall = (extension: MarketplaceExtension) => {
    toast.success(`Installation de ${extension.name} en cours...`)
  }

  const renderExtensionCard = (extension: MarketplaceExtension) => {
    const isInWishlist = wishlist.includes(extension.id)
    
    return (
      <Card key={extension.id} className="group hover:shadow-lg transition-all duration-300 relative overflow-hidden">
        {extension.featured && (
          <div className="absolute top-2 left-2 z-10">
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
              <Crown className="w-3 h-3 mr-1" />
              Mis en avant
            </Badge>
          </div>
        )}
        
        {extension.trending && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white">
              <Flame className="w-3 h-3 mr-1" />
              Tendance
            </Badge>
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={extension.author_avatar} />
                <AvatarFallback>{extension.author.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">{extension.author}</span>
                  {extension.author_verified && (
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{extension.category}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleWishlist(extension.id)}
              className="p-1"
            >
              <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          </div>
          
          <CardTitle className="text-lg leading-tight">{extension.name}</CardTitle>
          <CardDescription className="line-clamp-2">
            {extension.short_description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {extension.screenshots.length > 0 && (
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <img 
                src={extension.screenshots[0]} 
                alt={extension.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{extension.rating}</span>
              <span className="text-muted-foreground">({extension.reviews_count})</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Download className="w-4 h-4" />
              <span>{extension.downloads.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {extension.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {extension.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{extension.tags.length - 3}
              </Badge>
            )}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">
                {extension.price === 0 ? 'Gratuit' : `${extension.price}€`}
              </span>
              {extension.trial_days > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {extension.trial_days}j gratuit
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              {extension.demo_available && (
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-1" />
                  Demo
                </Button>
              )}
              <Button size="sm" onClick={() => handleInstall(extension)}>
                <Download className="w-4 h-4 mr-1" />
                Installer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderExtensionList = (extension: MarketplaceExtension) => {
    const isInWishlist = wishlist.includes(extension.id)
    
    return (
      <Card key={extension.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {extension.screenshots.length > 0 && (
              <div className="w-24 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={extension.screenshots[0]} 
                  alt={extension.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg truncate">{extension.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{extension.author}</span>
                    {extension.author_verified && (
                      <CheckCircle className="w-3 h-3 text-blue-500" />
                    )}
                    <span>•</span>
                    <span>{extension.category}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleWishlist(extension.id)}
                >
                  <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {extension.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{extension.rating}</span>
                    <span className="text-muted-foreground">({extension.reviews_count})</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Download className="w-4 h-4" />
                    <span>{extension.downloads.toLocaleString()}</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {extension.price === 0 ? 'Gratuit' : `${extension.price}€`}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  {extension.demo_available && (
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      Demo
                    </Button>
                  )}
                  <Button size="sm" onClick={() => handleInstall(extension)}>
                    <Download className="w-4 h-4 mr-1" />
                    Installer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketplace Extensions</h1>
          <p className="text-muted-foreground">
            Découvrez plus de {extensions.length} extensions pour votre e-commerce
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des extensions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-[150px]">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Prix" />
                </SelectTrigger>
                <SelectContent>
                  {priceRanges.map(range => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Featured Extensions */}
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Crown className="w-6 h-6 text-yellow-500" />
          Extensions mises en avant
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedExtensions.filter(ext => ext.featured).slice(0, 3).map(renderExtensionCard)}
        </div>
      </section>

      {/* Results */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {filteredExtensions.length} extension{filteredExtensions.length > 1 ? 's' : ''} trouvée{filteredExtensions.length > 1 ? 's' : ''}
          </h2>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedExtensions.map(renderExtensionCard)}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedExtensions.map(renderExtensionList)}
          </div>
        )}

        {sortedExtensions.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Aucune extension trouvée</h3>
              <p className="text-muted-foreground mb-4">
                Essayez de modifier vos critères de recherche
              </p>
              <Button onClick={() => {
                setSearchQuery('')
                setSelectedCategory('')
                setPriceRange('')
              }}>
                Réinitialiser les filtres
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}

export default AdvancedMarketplace