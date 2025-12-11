import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAdSpy } from '@/hooks/useAdSpy'
import {
  Search, BarChart3, TrendingUp, TrendingDown, DollarSign,
  Target, PieChart, Activity, Loader2, AlertTriangle, CheckCircle
} from 'lucide-react'

const CATEGORIES = [
  'Décoration', 'Électronique', 'Beauté', 'Mode', 'Sport', 
  'Cuisine', 'Animaux', 'Enfants', 'Jardin', 'Auto'
]

interface MarketData {
  category: string
  totalAds: number
  averageEngagement: number
  saturationLevel: 'low' | 'medium' | 'high' | 'saturated'
  growthRate: number
  avgPrice: number
  profitMargin: number
  topPlatform: string
  competitorCount: number
  opportunity: 'excellent' | 'good' | 'moderate' | 'risky'
}

const DEMO_MARKET_DATA: MarketData[] = [
  {
    category: 'Décoration',
    totalAds: 23450,
    averageEngagement: 4.2,
    saturationLevel: 'medium',
    growthRate: 156,
    avgPrice: 24.99,
    profitMargin: 68,
    topPlatform: 'TikTok',
    competitorCount: 1234,
    opportunity: 'good'
  },
  {
    category: 'Électronique',
    totalAds: 45670,
    averageEngagement: 3.8,
    saturationLevel: 'high',
    growthRate: 89,
    avgPrice: 34.99,
    profitMargin: 45,
    topPlatform: 'Facebook',
    competitorCount: 2890,
    opportunity: 'moderate'
  },
  {
    category: 'Beauté',
    totalAds: 34560,
    averageEngagement: 5.1,
    saturationLevel: 'medium',
    growthRate: 234,
    avgPrice: 19.99,
    profitMargin: 72,
    topPlatform: 'Instagram',
    competitorCount: 1567,
    opportunity: 'excellent'
  },
  {
    category: 'Mode',
    totalAds: 56780,
    averageEngagement: 3.2,
    saturationLevel: 'saturated',
    growthRate: 34,
    avgPrice: 29.99,
    profitMargin: 55,
    topPlatform: 'Instagram',
    competitorCount: 4567,
    opportunity: 'risky'
  },
  {
    category: 'Sport',
    totalAds: 18900,
    averageEngagement: 4.5,
    saturationLevel: 'low',
    growthRate: 178,
    avgPrice: 39.99,
    profitMargin: 62,
    topPlatform: 'TikTok',
    competitorCount: 890,
    opportunity: 'excellent'
  }
]

export function MarketAnalyzer() {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [marketData] = useState<MarketData[]>(DEMO_MARKET_DATA)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    // Simulate analysis
    await new Promise(r => setTimeout(r, 1500))
    setIsAnalyzing(false)
  }

  const getSaturationColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'high': return 'bg-orange-500'
      case 'saturated': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getOpportunityBadge = (opportunity: string) => {
    switch (opportunity) {
      case 'excellent':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Excellent</Badge>
      case 'good':
        return <Badge className="bg-blue-500"><TrendingUp className="h-3 w-3 mr-1" /> Bon</Badge>
      case 'moderate':
        return <Badge className="bg-yellow-500"><Activity className="h-3 w-3 mr-1" /> Modéré</Badge>
      case 'risky':
        return <Badge className="bg-red-500"><AlertTriangle className="h-3 w-3 mr-1" /> Risqué</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Analysis Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analyseur de Marché
          </CardTitle>
          <CardDescription>
            Analysez la saturation, l'opportunité et les tendances d'une catégorie de produits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ou rechercher une niche spécifique..."
                className="pl-10"
              />
            </div>
            <Button onClick={handleAnalyze} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyse...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analyser
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Market Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <PieChart className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{CATEGORIES.length}</p>
                <p className="text-xs text-muted-foreground">Catégories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">+138%</p>
                <p className="text-xs text-muted-foreground">Croissance moy.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <DollarSign className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">60%</p>
                <p className="text-xs text-muted-foreground">Marge moyenne</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Target className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">11K</p>
                <p className="text-xs text-muted-foreground">Concurrents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Analysis */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Analyse par Catégorie</h3>
        
        {marketData.map(data => (
          <Card key={data.category} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Category Info */}
                <div className="min-w-[180px]">
                  <h4 className="text-lg font-semibold">{data.category}</h4>
                  <div className="flex gap-2 mt-2">
                    <Badge className={getSaturationColor(data.saturationLevel)}>
                      {data.saturationLevel}
                    </Badge>
                    {getOpportunityBadge(data.opportunity)}
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold">{(data.totalAds / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-muted-foreground">Publicités</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold">{data.averageEngagement}%</p>
                    <p className="text-xs text-muted-foreground">Engagement</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className={`text-lg font-bold ${data.growthRate > 100 ? 'text-green-500' : 'text-orange-500'}`}>
                      +{data.growthRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">Croissance</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold">{data.avgPrice}€</p>
                    <p className="text-xs text-muted-foreground">Prix moyen</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold text-green-500">{data.profitMargin}%</p>
                    <p className="text-xs text-muted-foreground">Marge</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold">{data.competitorCount}</p>
                    <p className="text-xs text-muted-foreground">Concurrents</p>
                  </div>
                </div>

                {/* Platform Badge */}
                <div className="min-w-[100px] text-center">
                  <Badge variant="outline" className="mb-1">{data.topPlatform}</Badge>
                  <p className="text-xs text-muted-foreground">Top plateforme</p>
                </div>

                {/* Action */}
                <Button variant="outline" className="min-w-[120px]">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Détails
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
