import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useIntelligentSourcing, DiscoveredProduct, NicheAnalysis, TrendData } from '@/hooks/useIntelligentSourcing'
import {
  Search, TrendingUp, Target, Zap, Star, ShoppingCart, Plus,
  BarChart3, Globe, Activity, DollarSign, Users, Flame, ArrowUpRight,
  Lightbulb, Package, AlertCircle, CheckCircle, Eye
} from 'lucide-react'

export function IntelligentSourcingHub() {
  const {
    isLoading,
    products,
    nicheAnalysis,
    trends,
    competitorData,
    discoverWinningProducts,
    analyzeNiche,
    spyCompetitor,
    detectTrends,
    calculateProductScore
  } = useIntelligentSourcing()

  const [searchQuery, setSearchQuery] = useState('')
  const [nicheQuery, setNicheQuery] = useState('')
  const [competitorUrl, setCompetitorUrl] = useState('')
  const [trendCategory, setTrendCategory] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [activeTab, setActiveTab] = useState('discover')

  const handleDiscoverProducts = async () => {
    if (!searchQuery.trim()) return
    await discoverWinningProducts({
      query: searchQuery,
      filters: {
        minPrice: priceRange.min ? parseFloat(priceRange.min) : undefined,
        maxPrice: priceRange.max ? parseFloat(priceRange.max) : undefined
      }
    })
  }

  const handleAnalyzeNiche = async () => {
    if (!nicheQuery.trim()) return
    await analyzeNiche(nicheQuery)
  }

  const handleSpyCompetitor = async () => {
    if (!competitorUrl.trim()) return
    await spyCompetitor(competitorUrl)
  }

  const handleDetectTrends = async () => {
    if (!trendCategory.trim()) return
    await detectTrends(trendCategory)
  }

  const handleScoreProduct = async () => {
    if (!productUrl.trim()) return
    await calculateProductScore(productUrl)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            Sourcing Intelligent
          </h1>
          <p className="text-muted-foreground mt-1">
            Découvrez des produits gagnants, analysez les niches et espionnez la concurrence
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Historique
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-primary to-primary/80">
            <Flame className="h-4 w-4 mr-2" />
            Scan IA Avancé
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Package className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-xs text-muted-foreground">Produits découverts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Globe className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">50+</p>
                <p className="text-xs text-muted-foreground">Niches analysées</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Target className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{competitorData?.ads_detected || 0}</p>
                <p className="text-xs text-muted-foreground">Pubs espionnées</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{trends?.trend_score || 0}%</p>
                <p className="text-xs text-muted-foreground">Score tendance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1">
          <TabsTrigger value="discover" className="flex items-center gap-2 py-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Découvrir</span>
          </TabsTrigger>
          <TabsTrigger value="niches" className="flex items-center gap-2 py-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Niches</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2 py-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Tendances</span>
          </TabsTrigger>
          <TabsTrigger value="competitor" className="flex items-center gap-2 py-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Espionner</span>
          </TabsTrigger>
          <TabsTrigger value="score" className="flex items-center gap-2 py-2">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Scorer</span>
          </TabsTrigger>
        </TabsList>

        {/* Discover Products Tab */}
        <TabsContent value="discover" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Découvrir des Produits Gagnants
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Ex: LED lights, fitness tracker, kitchen gadget..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDiscoverProducts()}
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Prix min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-24"
                  />
                  <Input
                    type="number"
                    placeholder="Prix max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-24"
                  />
                </div>
                <Button onClick={handleDiscoverProducts} disabled={isLoading}>
                  {isLoading ? 'Recherche...' : 'Rechercher'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          {products.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product, index) => (
                <ProductCard key={`${product.url}-${index}`} product={product} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Niche Analysis Tab */}
        <TabsContent value="niches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Analyse de Niche
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Ex: home decor, pet accessories, eco-friendly..."
                  value={nicheQuery}
                  onChange={(e) => setNicheQuery(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeNiche()}
                />
                <Button onClick={handleAnalyzeNiche} disabled={isLoading}>
                  {isLoading ? 'Analyse...' : 'Analyser'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {nicheAnalysis && <NicheAnalysisCard analysis={nicheAnalysis} />}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Détection de Tendances
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Ex: beauty, tech, fashion..."
                  value={trendCategory}
                  onChange={(e) => setTrendCategory(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleDetectTrends()}
                />
                <Button onClick={handleDetectTrends} disabled={isLoading}>
                  {isLoading ? 'Détection...' : 'Détecter'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {trends && <TrendsCard trends={trends} />}
        </TabsContent>

        {/* Competitor Spy Tab */}
        <TabsContent value="competitor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Espionner la Concurrence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="URL ou domaine du concurrent..."
                  value={competitorUrl}
                  onChange={(e) => setCompetitorUrl(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleSpyCompetitor()}
                />
                <Button onClick={handleSpyCompetitor} disabled={isLoading}>
                  {isLoading ? 'Espionnage...' : 'Espionner'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {competitorData && <CompetitorCard data={competitorData} />}
        </TabsContent>

        {/* Product Score Tab */}
        <TabsContent value="score" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Scorer un Produit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="URL du produit (AliExpress, Amazon, etc.)..."
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleScoreProduct()}
                />
                <Button onClick={handleScoreProduct} disabled={isLoading}>
                  {isLoading ? 'Calcul...' : 'Calculer Score'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProductCard({ product }: { product: DiscoveredProduct }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all group">
      <div className="relative aspect-square bg-muted">
        <img
          src={product.image || '/placeholder.svg'}
          alt={product.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            🔥 {product.trending_score || 0}
          </Badge>
        </div>
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="text-xs">
            {product.source}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <h3 className="font-semibold line-clamp-2 text-sm">{product.title}</h3>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary">${product.price?.toFixed(2)}</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {product.rating?.toFixed(1) || 'N/A'}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <ShoppingCart className="h-3 w-3" />
            <span>{product.orders?.toLocaleString() || 0} ventes</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{product.reviews?.toLocaleString() || 0} avis</span>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button size="sm" className="flex-1">
            <Plus className="h-3 w-3 mr-1" />
            Importer
          </Button>
          <Button size="sm" variant="outline">
            <BarChart3 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function NicheAnalysisCard({ analysis }: { analysis: NicheAnalysis }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Vue d'ensemble</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Taille du marché</span>
            <Badge>{analysis.market_size}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Saturation</span>
            <Badge variant={analysis.saturation_level === 'low' ? 'default' : 'secondary'}>
              {analysis.saturation_level}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Croissance</span>
            <span className="text-green-500 font-bold">+{analysis.growth_rate}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Difficulté d'entrée</span>
            <Badge variant="outline">{analysis.entry_difficulty}</Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Potentiel de profit</span>
              <span className="font-bold">{analysis.profit_potential}%</span>
            </div>
            <Progress value={analysis.profit_potential} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Mots-clés tendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysis.trending_keywords.map(keyword => (
              <Badge key={keyword} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                {keyword}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Opportunités</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysis.market_gaps.map((gap, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function TrendsCard({ trends }: { trends: TrendData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendance globale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-primary">{trends.trend_score}%</p>
            <p className="text-sm text-muted-foreground mt-1">Score de tendance</p>
          </div>
          <div className="flex items-center justify-between">
            <span>Direction</span>
            <Badge className="bg-green-500">{trends.overall_trend}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Momentum</span>
            <Badge variant="outline">{trends.momentum}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Top Produits Tendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trends.top_trending_products.slice(0, 5).map((product, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-muted-foreground">#{i + 1}</span>
                  <span className="text-sm truncate max-w-[150px]">{product.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-sm font-medium">{product.growth}</span>
                  <Badge variant="secondary">{product.score}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Signaux Sociaux</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="text-lg">🎵</span> TikTok
            </span>
            <span className="font-bold">{(trends.social_signals.tiktok_mentions / 1000).toFixed(0)}K</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="text-lg">📷</span> Instagram
            </span>
            <span className="font-bold">{(trends.social_signals.instagram_posts / 1000).toFixed(0)}K</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="text-lg">📌</span> Pinterest
            </span>
            <span className="font-bold">{(trends.social_signals.pinterest_pins / 1000).toFixed(0)}K</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="text-lg">🎬</span> YouTube
            </span>
            <span className="font-bold">{(trends.social_signals.youtube_videos / 1000).toFixed(0)}K</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CompetitorCard({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Activité Publicitaire</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Publicités détectées</span>
            <span className="text-2xl font-bold text-primary">{data.ads_detected}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Budget estimé</span>
            <span className="font-bold">${data.estimated_ad_spend?.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center p-2 bg-muted rounded">
              <p className="text-lg font-bold">{data.ad_creatives?.video_ads}</p>
              <p className="text-xs text-muted-foreground">Vidéos</p>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <p className="text-lg font-bold">{data.ad_creatives?.image_ads}</p>
              <p className="text-xs text-muted-foreground">Images</p>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <p className="text-lg font-bold">{data.ad_creatives?.carousel_ads}</p>
              <p className="text-xs text-muted-foreground">Carrousels</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Ciblage Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Audience principale</p>
            <Badge variant="secondary">{data.targeting_insights?.primary_audience}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Intérêts</p>
            <div className="flex flex-wrap gap-1">
              {data.targeting_insights?.interests?.map((interest: string) => (
                <Badge key={interest} variant="outline" className="text-xs">{interest}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>CTR moyen</span>
            <span className="font-bold text-green-500">{data.performance_metrics?.avg_ctr}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span>CPM moyen</span>
            <span className="font-bold">${data.performance_metrics?.avg_cpm}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Conversions estimées</span>
            <span className="font-bold">{data.performance_metrics?.estimated_conversions?.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
