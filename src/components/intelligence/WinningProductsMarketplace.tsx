import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, Star, DollarSign, Target, Zap, Heart, 
  Filter, Search, RefreshCw, Download, Eye, ShoppingCart,
  BarChart3, TrendingDown, AlertTriangle, CheckCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { winningProductsIntelligenceService, type WinningProductIntelligence } from '@/services/WinningProductsIntelligenceService'
import { socialMediaAnalysisService } from '@/services/SocialMediaAnalysisService'

export function WinningProductsMarketplace() {
  const [products, setProducts] = useState<WinningProductIntelligence[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [minScore, setMinScore] = useState([70])
  const [sortBy, setSortBy] = useState('ai_score')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { toast } = useToast()

  const categories = [
    'Tech & Electronics', 'Fashion & Beauty', 'Home & Garden', 
    'Sports & Fitness', 'Automotive', 'Baby & Kids', 'Pets',
    'Health & Wellness', 'Kitchen & Dining'
  ]

  useEffect(() => {
    loadWinningProducts()
  }, [selectedCategory, minScore])

  const loadWinningProducts = async () => {
    try {
      setLoading(true)
      const filters = {
        category: selectedCategory || undefined,
        minScore: minScore[0],
        priceRange: { min: priceRange[0], max: priceRange[1] },
        socialTrending: true
      }

      const data = await winningProductsIntelligenceService.getTopWinningProducts(filters)
      setProducts(data)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits gagnants",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProductImport = async (product: WinningProductIntelligence) => {
    try {
      // Import logic here
      toast({
        title: "Produit importé",
        description: `${product.name} a été ajouté à votre catalogue`,
      })
    } catch (error) {
      toast({
        title: "Erreur d'importation",
        description: "Impossible d'importer le produit",
        variant: "destructive"
      })
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    product.price >= priceRange[0] && product.price <= priceRange[1]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Marketplace Produits Gagnants</h2>
          <p className="text-muted-foreground">
            Découvrez les produits les plus performants validés par l'IA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadWinningProducts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nom du produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Catégorie</label>
              <Select value={selectedCategory || "all"} onValueChange={(v) => setSelectedCategory(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat || `cat_${Math.random()}`}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Score IA minimum</label>
              <div className="px-2">
                <Slider
                  value={minScore}
                  onValueChange={setMinScore}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0</span>
                  <span className="font-medium">{minScore[0]}</span>
                  <span>100</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Prix (€)</label>
              <div className="px-2">
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={1000}
                  min={0}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{priceRange[0]}€</span>
                  <span>{priceRange[1]}€</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Produits Analysés</p>
                <p className="text-2xl font-bold">{filteredProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Score Moyen</p>
                <p className="text-2xl font-bold">
                  {filteredProducts.length > 0 
                    ? Math.round(filteredProducts.reduce((sum, p) => sum + p.ai_score, 0) / filteredProducts.length)
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Produits Viraux</p>
                <p className="text-2xl font-bold">
                  {filteredProducts.filter(p => p.social_proof.viral_potential > 70).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">ROI Moyen</p>
                <p className="text-2xl font-bold">
                  {filteredProducts.length > 0 
                    ? Math.round(filteredProducts.reduce((sum, p) => sum + p.projected_roi, 0) / filteredProducts.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Produits Gagnants Détectés</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Trier par..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai_score">Score IA</SelectItem>
                  <SelectItem value="viral_potential">Potentiel Viral</SelectItem>
                  <SelectItem value="projected_roi">ROI Projeté</SelectItem>
                  <SelectItem value="price">Prix</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-lg h-48 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
              <p className="text-muted-foreground">Essayez d'ajuster vos filtres de recherche</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product, index) => (
                <ProductCard 
                  key={`${product.product_id}-${index}`}
                  product={product}
                  onImport={() => handleProductImport(product)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ProductCard({ product, onImport }: { 
  product: WinningProductIntelligence
  onImport: () => void 
}) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'  
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground">{product.category}</p>
          </div>
          <Badge className={`${getScoreColor(product.ai_score)} text-xs font-bold`}>
            {product.ai_score}/100
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 text-green-600 mr-2" />
            <span className="font-medium">{product.price}€</span>
          </div>
          <div className="flex items-center">
            <TrendingUp className="h-4 w-4 text-blue-600 mr-2" />
            <span>ROI {product.projected_roi}%</span>
          </div>
          <div className="flex items-center">
            <Zap className="h-4 w-4 text-yellow-600 mr-2" />
            <span>Viral {product.social_proof.viral_potential}/100</span>
          </div>
          <div className="flex items-center">
            <Badge className={`${getRiskColor(product.risk_level)} text-xs`}>
              {product.risk_level === 'low' ? 'Faible' : 
               product.risk_level === 'medium' ? 'Moyen' : 'Élevé'} risque
            </Badge>
          </div>
        </div>

        {/* Social Proof */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Preuves sociales</span>
            <span className="font-medium">{product.social_proof.total_mentions} mentions</span>
          </div>
          <div className="flex items-center mt-1">
            <div className="flex-1 bg-background rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(product.social_proof.viral_potential, 100)}%` }}
              />
            </div>
            <span className="ml-2 text-xs font-medium">
              {product.social_proof.viral_potential}/100
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{product.competitor_count} concurrents</span>
          <span>Confiance {product.confidence_level}%</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button size="sm" className="flex-1" onClick={onImport}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}