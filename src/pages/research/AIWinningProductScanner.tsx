import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { 
  Search, Sparkles, TrendingUp, Target, Zap, ShoppingBag, 
  ArrowUpRight, ArrowDownRight, Minus, Loader2, Play, Star,
  BarChart3, Eye, DollarSign, RefreshCw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ScannedProduct {
  id: string
  name: string
  category: string
  description?: string
  supplier_price_min: number
  supplier_price_max: number
  selling_price_suggested: number
  margin_percent: number
  demand_score: number
  competition_score: number
  trend_score: number
  viral_potential: number
  overall_score: number
  estimated_daily_orders?: number
  estimated_monthly_revenue?: number
  target_audience?: string
  ad_creative_tips?: string
  best_selling_variants?: string
  source_platform?: string
  trend_direction: 'rising' | 'stable' | 'declining'
  scanned_at: string
}

const CATEGORIES = [
  { value: 'all', label: 'Toutes catégories' },
  { value: 'fashion', label: 'Mode & Accessoires' },
  { value: 'beauty', label: 'Beauté & Soin' },
  { value: 'home', label: 'Maison & Déco' },
  { value: 'electronics', label: 'Électronique' },
  { value: 'sports', label: 'Sports & Plein air' },
  { value: 'toys', label: 'Jouets & Loisirs' },
  { value: 'health', label: 'Santé & Bien-être' },
]

const REGIONS = [
  { value: 'US', label: '🇺🇸 États-Unis' },
  { value: 'UK', label: '🇬🇧 Royaume-Uni' },
  { value: 'EU', label: '🇪🇺 Europe' },
  { value: 'FR', label: '🇫🇷 France' },
]

export default function AIWinningProductScanner() {
  const { toast } = useToast()
  const [products, setProducts] = useState<ScannedProduct[]>([])
  const [trending, setTrending] = useState<ScannedProduct[]>([])
  const [scanning, setScanning] = useState(false)
  const [loadingTrending, setLoadingTrending] = useState(false)
  const [keywords, setKeywords] = useState('')
  const [category, setCategory] = useState('all')
  const [region, setRegion] = useState('FR')
  const [activeTab, setActiveTab] = useState('scanner')

  useEffect(() => {
    loadTrending()
  }, [])

  const loadTrending = async () => {
    setLoadingTrending(true)
    try {
      const { data, error } = await supabase.functions.invoke('product-research-scanner', {
        body: { action: 'scan_trends', keyword: 'trending', category: 'all' },
      })
      const rawTrends = data?.trends || []
      setTrending(rawTrends.map((t: any, i: number) => ({
        id: `trend-${i}`,
        name: t.product_name,
        category: t.category || 'General',
        supplier_price_min: 5,
        supplier_price_max: 30,
        selling_price_suggested: 40,
        margin_percent: 65,
        demand_score: t.search_volume ? Math.min(Math.round(t.search_volume / 1000), 100) : 70,
        competition_score: t.saturation_level === 'high' ? 30 : t.saturation_level === 'medium' ? 60 : 85,
        trend_score: t.trend_score || 50,
        viral_potential: t.growth_rate ? Math.min(t.growth_rate, 100) : 50,
        overall_score: t.trend_score || 50,
        trend_direction: (t.growth_rate > 50 ? 'rising' : t.growth_rate > 10 ? 'stable' : 'declining') as 'rising' | 'stable' | 'declining',
        scanned_at: new Date().toISOString(),
      })))
    } catch (e: any) {
      console.error('Failed to load trending:', e)
    } finally {
      setLoadingTrending(false)
    }
  }

  const handleScan = async () => {
    setScanning(true)
    setProducts([])
    try {
      const { data, error } = await supabase.functions.invoke('product-research-scanner', {
        body: {
          action: 'scan_trends',
          keyword: keywords || 'trending products',
          category: category !== 'all' ? category : 'all',
        },
      })

      const rawTrends = data?.trends || []
      const mapped = rawTrends.map((t: any, i: number) => ({
        id: `scan-${i}`,
        name: t.product_name,
        category: t.category || 'General',
        supplier_price_min: 5,
        supplier_price_max: 30,
        selling_price_suggested: 45,
        margin_percent: 65,
        demand_score: t.search_volume ? Math.min(Math.round(t.search_volume / 1000), 100) : 70,
        competition_score: t.saturation_level === 'high' ? 30 : t.saturation_level === 'medium' ? 60 : 85,
        trend_score: t.trend_score || 50,
        viral_potential: t.growth_rate ? Math.min(t.growth_rate, 100) : 50,
        overall_score: t.trend_score || 50,
        estimated_monthly_revenue: t.search_volume ? Math.round(t.search_volume * 0.02 * 40) : undefined,
        ad_creative_tips: t.platforms ? `Présent sur ${t.platforms.join(', ')}` : undefined,
        trend_direction: (t.growth_rate > 50 ? 'rising' : t.growth_rate > 10 ? 'stable' : 'declining') as 'rising' | 'stable' | 'declining',
        scanned_at: new Date().toISOString(),
      }))
      setProducts(mapped)
      toast({
        title: 'Scan terminé',
        description: `${mapped.length} produits gagnants identifiés`,
      })
    } catch (e: any) {
      toast({
        title: 'Erreur de scan',
        description: e.message || 'Impossible de scanner les tendances TikTok',
        variant: 'destructive',
      })
    } finally {
      setScanning(false)
    }
  }

  const trendIcon = (dir: string) => {
    if (dir === 'rising') return <ArrowUpRight className="h-4 w-4 text-green-500" />
    if (dir === 'declining') return <ArrowDownRight className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const scoreBadge = (score: number) => {
    if (score >= 85) return 'bg-green-500/10 text-green-500 border-green-500/30'
    if (score >= 70) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
    return 'bg-red-500/10 text-red-500 border-red-500/30'
  }

  const displayProducts = activeTab === 'scanner' ? products : trending

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-violet-500/20 border border-pink-500/30">
            <Sparkles className="h-8 w-8 text-pink-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI Winning Product Scanner</h1>
            <p className="text-muted-foreground">Détectez les produits viraux TikTok avec l'IA</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="scanner" className="flex items-center gap-2">
            <Search className="h-4 w-4" /> Scanner IA
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Tendances
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-6">
          {/* Search Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <Input
                    placeholder="Mots-clés (ex: LED, gadget...)"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    disabled={scanning}
                  />
                </div>
                <Select value={category} onValueChange={setCategory} disabled={scanning}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={region} onValueChange={setRegion} disabled={scanning}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REGIONS.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleScan}
                  disabled={scanning}
                  className="bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700"
                >
                  {scanning ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyse IA...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> Lancer le scan</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {scanning && (
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-pink-500" />
                  <span className="text-sm font-medium">Analyse IA des tendances TikTok en cours...</span>
                </div>
                <Progress value={65} className="h-2" />
                <p className="text-xs text-muted-foreground">Scraping des ads viraux • Scoring par l'IA • Classification des niches</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          <div className="flex justify-end">
            <Button variant="outline" onClick={loadTrending} disabled={loadingTrending}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingTrending ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Results */}
      {displayProducts.length > 0 && (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Target className="h-3 w-3" /> Produits trouvés
                </div>
                <p className="text-2xl font-bold">{displayProducts.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Star className="h-3 w-3" /> Score moyen
                </div>
                <p className="text-2xl font-bold">
                  {Math.round(displayProducts.reduce((s, p) => s + p.overall_score, 0) / displayProducts.length)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <TrendingUp className="h-3 w-3" /> En hausse
                </div>
                <p className="text-2xl font-bold text-green-500">
                  {displayProducts.filter(p => p.trend_direction === 'rising').length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <DollarSign className="h-3 w-3" /> Marge moy.
                </div>
                <p className="text-2xl font-bold">
                  {Math.round(displayProducts.reduce((s, p) => s + p.margin_percent, 0) / displayProducts.length)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {displayProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="h-full hover:border-pink-500/30 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm leading-tight line-clamp-2">{product.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{product.category}</Badge>
                            {trendIcon(product.trend_direction)}
                          </div>
                        </div>
                        <Badge variant="outline" className={`ml-2 shrink-0 font-bold ${scoreBadge(product.overall_score)}`}>
                          {product.overall_score}/100
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Price & Margin */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-muted/50">
                          <span className="text-muted-foreground">Coût fournisseur</span>
                          <p className="font-semibold">${product.supplier_price_min} - ${product.supplier_price_max}</p>
                        </div>
                        <div className="p-2 rounded bg-muted/50">
                          <span className="text-muted-foreground">Prix de vente</span>
                          <p className="font-semibold text-green-500">${product.selling_price_suggested}</p>
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" /> Demande</span>
                          <span className={`font-medium ${scoreColor(product.demand_score)}`}>{product.demand_score}/100</span>
                        </div>
                        <Progress value={product.demand_score} className="h-1.5" />

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" /> Viralité</span>
                          <span className={`font-medium ${scoreColor(product.viral_potential)}`}>{product.viral_potential}/100</span>
                        </div>
                        <Progress value={product.viral_potential} className="h-1.5" />

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Tendance</span>
                          <span className={`font-medium ${scoreColor(product.trend_score)}`}>{product.trend_score}/100</span>
                        </div>
                        <Progress value={product.trend_score} className="h-1.5" />
                      </div>

                      {/* Margin badge */}
                      <div className="flex items-center justify-between pt-1">
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 text-xs">
                          Marge {product.margin_percent}%
                        </Badge>
                        {product.estimated_monthly_revenue && (
                          <span className="text-xs text-muted-foreground">
                            ~${product.estimated_monthly_revenue?.toLocaleString()}/mois
                          </span>
                        )}
                      </div>

                      {/* Tips */}
                      {product.ad_creative_tips && (
                        <p className="text-xs text-muted-foreground border-t pt-2 line-clamp-2">
                          💡 {product.ad_creative_tips}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      {!scanning && displayProducts.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-pink-500/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {activeTab === 'scanner' ? 'Lancez votre premier scan' : 'Aucune tendance enregistrée'}
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {activeTab === 'scanner'
                ? "L'IA analysera les publicités TikTok virales pour identifier les produits à fort potentiel de vente."
                : 'Lancez un scan pour commencer à suivre les tendances.'}
            </p>
            {activeTab === 'scanner' && (
              <Button onClick={handleScan} className="mt-4 bg-gradient-to-r from-pink-500 to-violet-600">
                <Sparkles className="h-4 w-4 mr-2" /> Scanner maintenant
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
