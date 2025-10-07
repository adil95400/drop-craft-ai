import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendingUp, TrendingDown, Hash, Video, Heart, MessageCircle,
  Share, Eye, Users, Globe, Zap, Target, Star, ArrowRight
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { socialMediaAnalysisService, type SocialMediaTrend } from '@/services/SocialMediaAnalysisService'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

const PLATFORM_ICONS = {
  tiktok: '🎵',
  instagram: '📷', 
  facebook: '👥',
  youtube: '📺'
}

const PLATFORM_COLORS = {
  tiktok: '#000000',
  instagram: '#E4405F',
  facebook: '#1877F2', 
  youtube: '#FF0000'
}

export function SocialTrendsAnalyzer() {
  const [trends, setTrends] = useState<SocialMediaTrend[]>([])
  const [viralProducts, setViralProducts] = useState([])
  const [influencerInsights, setInfluencerInsights] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [timeframe, setTimeframe] = useState<string>('7d')
  const { toast } = useToast()

  useEffect(() => {
    loadSocialTrends()
  }, [selectedPlatform, timeframe])

  const loadSocialTrends = async () => {
    try {
      setLoading(true)
      const platforms = selectedPlatform === 'all' 
        ? ['tiktok', 'instagram', 'facebook', 'youtube']
        : [selectedPlatform]

      const [trendsData, viralData, influencersData] = await Promise.all([
        socialMediaAnalysisService.analyzeTrendingProducts(platforms),
        socialMediaAnalysisService.detectViralProducts(70),
        selectedPlatform !== 'all' 
          ? socialMediaAnalysisService.getInfluencerInsights('ecommerce')
          : Promise.resolve([])
      ])

      setTrends(trendsData)
      setViralProducts(viralData)
      setInfluencerInsights(influencersData)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les tendances sociales",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <TrendingUp className="h-4 w-4 text-yellow-600" />
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const topHashtags = trends.flatMap(t => t.hashtags).slice(0, 10)
  const platformDistribution = trends.reduce((acc, trend) => {
    acc[trend.platform] = (acc[trend.platform] || 0) + trend.volume
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Analyse Tendances Sociales</h2>
          <p className="text-muted-foreground">
            Détection automatique des produits viraux et tendances émergentes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes plateformes</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadSocialTrends} disabled={loading}>
            <Zap className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Tendances Actives</p>
                <p className="text-2xl font-bold">{trends.length}</p>
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
                <p className="text-2xl font-bold">{viralProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Volume Total</p>
                <p className="text-2xl font-bold">
                  {formatNumber(trends.reduce((sum, t) => sum + t.volume, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-pink-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Engagement Moyen</p>
                <p className="text-2xl font-bold">
                  {trends.length > 0 
                    ? Math.round(trends.reduce((sum, t) => sum + t.engagement_rate, 0) / trends.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Tendances</TabsTrigger>
          <TabsTrigger value="viral">Produits Viraux</TabsTrigger>
          <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {trends.map((trend, index) => (
              <TrendCard key={`${trend.platform}-${trend.keyword}-${index}`} trend={trend} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="viral" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {viralProducts.map((product, index) => (
              <ViralProductCard key={index} product={product} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="hashtags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Hash className="h-5 w-5 mr-2" />
                Hashtags Tendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {topHashtags.map((hashtag, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 border rounded-lg">
                    <Hash className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">{hashtag}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Platform Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribution par Plateforme</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(platformDistribution).map(([platform, value]) => ({
                        name: platform,
                        value,
                        fill: PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS]
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => `${props.name} ${((props.percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Engagement Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution de l'Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="keyword" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="engagement_rate" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TrendCard({ trend }: { trend: SocialMediaTrend }) {
  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <TrendingUp className="h-4 w-4 text-yellow-600" />
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{PLATFORM_ICONS[trend.platform]}</span>
            <div>
              <h3 className="font-semibold">{trend.keyword}</h3>
              <p className="text-sm text-muted-foreground capitalize">{trend.platform}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {getTrendIcon(trend.trend_direction)}
            <Badge variant="outline">
              {trend.trend_direction === 'up' ? '+' : trend.trend_direction === 'down' ? '-' : ''}
              {Math.round(trend.engagement_rate)}%
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Volume & Engagement */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Volume</div>
            <div className="font-bold text-lg">{formatNumber(trend.volume)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Engagement</div>
            <div className="font-bold text-lg">{trend.engagement_rate}%</div>
          </div>
        </div>

        {/* Viral Content Stats */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-sm text-muted-foreground mb-2">Contenu Viral</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <Video className="h-4 w-4 mx-auto mb-1 text-purple-600" />
              <div className="font-medium">{trend.viral_content.videos}</div>
              <div className="text-muted-foreground">Vidéos</div>
            </div>
            <div className="text-center">
              <Eye className="h-4 w-4 mx-auto mb-1 text-blue-600" />
              <div className="font-medium">{formatNumber(trend.viral_content.avg_views)}</div>
              <div className="text-muted-foreground">Vues moy.</div>
            </div>
            <div className="text-center">
              <Share className="h-4 w-4 mx-auto mb-1 text-green-600" />
              <div className="font-medium">{trend.viral_content.posts}</div>
              <div className="text-muted-foreground">Posts</div>
            </div>
          </div>
        </div>

        {/* Top Hashtags */}
        <div>
          <div className="text-sm text-muted-foreground mb-2">Hashtags Populaires</div>
          <div className="flex flex-wrap gap-1">
            {trend.hashtags.slice(0, 4).map((hashtag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                #{hashtag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Demographics */}
        {trend.demographics && (
          <div>
            <div className="text-sm text-muted-foreground mb-2">Démographie Principale</div>
            <div className="flex items-center justify-between text-xs">
              <span>
                {Object.entries(trend.demographics.age_groups)[0]?.[0]} ans
              </span>
              <span>
                {Object.entries(trend.demographics.countries)[0]?.[0]}
              </span>
            </div>
          </div>
        )}

        <Button size="sm" className="w-full" variant="outline">
          <Target className="h-4 w-4 mr-2" />
          Analyser en détail
        </Button>
      </CardContent>
    </Card>
  )
}

function ViralProductCard({ product }: { product: any }) {
  return (
    <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold line-clamp-2">{product.name}</h3>
          <Badge className="bg-yellow-100 text-yellow-800">
            <Zap className="h-3 w-3 mr-1" />
            Viral
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Score Viral</span>
            <span className="font-bold">{product.viral_score}/100</span>
          </div>
          
          <Progress value={product.viral_score} className="h-2" />

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 bg-muted/50 rounded">
              <Eye className="h-4 w-4 mx-auto mb-1" />
              <div className="font-medium">{formatNumber(product.views)}</div>
              <div className="text-muted-foreground">Vues</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded">
              <Heart className="h-4 w-4 mx-auto mb-1" />
              <div className="font-medium">{formatNumber(product.engagement)}</div>
              <div className="text-muted-foreground">Likes</div>
            </div>
          </div>

          <Button size="sm" className="w-full">
            <ArrowRight className="h-4 w-4 mr-2" />
            Analyser Produit
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }
}