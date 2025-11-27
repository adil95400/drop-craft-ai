import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUnifiedProducts } from '@/hooks/useUnifiedProducts'
import { useProductScores } from '@/hooks/useProductScores'
import { ProductCardEnhanced } from '@/components/products/ProductCardEnhanced'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter, 
  Sparkles, 
  TrendingUp, 
  Trophy, 
  DollarSign,
  Copy,
  RefreshCw,
  BarChart3,
  Download
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export default function EnhancedCatalog() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [view, setView] = useState<'all' | 'winners' | 'trending' | 'bestsellers'>('all')

  const { 
    products, 
    isLoading
  } = useUnifiedProducts({ 
    search: search || undefined,
    category: category !== 'all' ? category : undefined
  })

  const {
    calculateScores,
    detectDuplicates,
    optimizeProduct,
    recommendPricing,
    isCalculating,
    isDetecting,
    isOptimizing,
    isRecommending
  } = useProductScores()

  // Extract unique categories from products
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[]

  // Filter products by view
  const filteredProducts = products.filter(p => {
    if (view === 'winners') return p.is_winner
    if (view === 'trending') return p.is_trending
    if (view === 'bestsellers') return p.is_bestseller
    return true
  })

  // Calculate stats
  const stats = {
    total: products.length,
    winners: products.filter(p => p.is_winner).length,
    trending: products.filter(p => p.is_trending).length,
    bestsellers: products.filter(p => p.is_bestseller).length,
    avgAiScore: products.length > 0 
      ? (products.reduce((sum, p) => sum + (p.ai_score || 0), 0) / products.length).toFixed(0)
      : 0,
    avgMargin: products.length > 0
      ? (products.reduce((sum, p) => sum + (p.profit_margin || 0), 0) / products.length).toFixed(1)
      : 0
  }

  const handleBulkCalculateScores = () => {
    if (!user) return
    const ids = Array.from(selectedProducts)
    if (ids.length === 0) {
      toast.error('Sélectionnez au moins un produit')
      return
    }
    calculateScores.mutate({ productIds: ids, userId: user.id })
  }

  const handleDetectDuplicates = () => {
    if (!user) return
    detectDuplicates.mutate({ userId: user.id })
  }

  const handleOptimizeProduct = (productId: string) => {
    if (!user) return
    optimizeProduct.mutate({ 
      productId, 
      userId: user.id,
      optimizations: ['title', 'description', 'price', 'tags']
    })
  }

  const handleRecommendPrice = (productId: string) => {
    if (!user) return
    recommendPricing.mutate({ 
      productId, 
      userId: user.id,
      strategy: 'balanced'
    })
  }

  const toggleSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Catalogue Optimisé</h1>
          <p className="text-muted-foreground">
            Gestion intelligente avec scores IA et optimisation automatique
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleDetectDuplicates}
            variant="outline"
            disabled={isDetecting}
          >
            <Copy className="mr-2 h-4 w-4" />
            {isDetecting ? 'Détection...' : 'Détecter doublons'}
          </Button>
          <Button 
            onClick={handleBulkCalculateScores}
            disabled={isCalculating || selectedProducts.size === 0}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {isCalculating ? 'Calcul...' : `Calculer scores (${selectedProducts.size})`}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Produits</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              Winners
            </CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{stats.winners}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Tendance
            </CardDescription>
            <CardTitle className="text-2xl text-blue-600">{stats.trending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Best-sellers
            </CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.bestsellers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Score IA Moyen</CardDescription>
            <CardTitle className="text-2xl">{stats.avgAiScore}/100</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Marge Moyenne
            </CardDescription>
            <CardTitle className="text-2xl">{stats.avgMargin}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters & Tabs */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, SKU, catégorie..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={view} onValueChange={(v: any) => setView(v)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                Tous ({products.length})
              </TabsTrigger>
              <TabsTrigger value="winners">
                <Trophy className="mr-2 h-4 w-4" />
                Winners ({stats.winners})
              </TabsTrigger>
              <TabsTrigger value="trending">
                <TrendingUp className="mr-2 h-4 w-4" />
                Tendance ({stats.trending})
              </TabsTrigger>
              <TabsTrigger value="bestsellers">
                <BarChart3 className="mr-2 h-4 w-4" />
                Best-sellers ({stats.bestsellers})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Winners Import Banner */}
      {view === 'winners' && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold text-lg">Recherche de Produits Gagnants</h3>
                  <p className="text-sm text-muted-foreground">
                    Découvrez et importez des produits à fort potentiel depuis Winners
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/winners')}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Importer Winners
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Chargement des produits...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Aucun produit trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCardEnhanced
              key={product.id}
              product={product}
              selected={selectedProducts.has(product.id)}
              onSelect={(selected) => toggleSelection(product.id)}
              onOptimize={handleOptimizeProduct}
              onClick={() => handleRecommendPrice(product.id)}
            />
          ))}
        </div>
      )}

      {/* Selection Summary */}
      {selectedProducts.size > 0 && (
        <Card className="fixed bottom-6 right-6 w-80 shadow-lg border-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {selectedProducts.size} produit{selectedProducts.size > 1 ? 's' : ''} sélectionné{selectedProducts.size > 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              className="w-full" 
              onClick={handleBulkCalculateScores}
              disabled={isCalculating}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Calculer les scores IA
            </Button>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => setSelectedProducts(new Set())}
            >
              Désélectionner tout
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
