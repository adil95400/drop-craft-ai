import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAdSpy } from '@/hooks/useAdSpy'
import { 
  Eye, TrendingUp, Users, Search, Flame, Target,
  BarChart3, Globe, Zap, Download, Star, Activity
} from 'lucide-react'
import { AdLibrary } from './AdLibrary'
import { WinningProducts } from './WinningProducts'
import { CompetitorTracker } from './CompetitorTracker'
import { InfluencerFinder } from './InfluencerFinder'
import { MarketAnalyzer } from './MarketAnalyzer'
import { NicheExplorer } from './NicheExplorer'

export function AdSpyDashboard() {
  const { stats, isLoading } = useAdSpy()
  const [activeTab, setActiveTab] = useState('ads')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
              <Eye className="h-8 w-8 text-primary" />
            </div>
            Ad Intelligence Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyse des publicités, produits gagnants et veille concurrentielle style Minea
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-primary to-primary/80">
            <Zap className="h-4 w-4 mr-2" />
            Scan IA Avancé
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(stats.totalAdsAnalyzed / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground">Pubs analysées</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(stats.totalProducts / 1000).toFixed(1)}K</p>
                <p className="text-xs text-muted-foreground">Produits détectés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.averageWinnerScore}%</p>
                <p className="text-xs text-muted-foreground">Score moyen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(stats.totalCompetitors / 1000).toFixed(1)}K</p>
                <p className="text-xs text-muted-foreground">Concurrents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Target className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.topPlatform}</p>
                <p className="text-xs text-muted-foreground">Top plateforme</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 border-pink-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/20">
                <Star className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.topCategory}</p>
                <p className="text-xs text-muted-foreground">Top catégorie</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trending Niches */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Niches en Croissance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {stats.trendingNiches.map((niche, i) => (
              <Badge 
                key={niche.name} 
                variant="secondary"
                className="px-3 py-1.5 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <span className="font-medium">{niche.name}</span>
                <span className="ml-2 text-green-500 font-bold">+{niche.growth}%</span>
                <span className="ml-1 text-muted-foreground">({niche.count})</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto p-1">
          <TabsTrigger value="ads" className="flex items-center gap-2 py-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Ad Library</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2 py-2">
            <Flame className="h-4 w-4" />
            <span className="hidden sm:inline">Winners</span>
          </TabsTrigger>
          <TabsTrigger value="competitors" className="flex items-center gap-2 py-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Concurrents</span>
          </TabsTrigger>
          <TabsTrigger value="influencers" className="flex items-center gap-2 py-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Influenceurs</span>
          </TabsTrigger>
          <TabsTrigger value="market" className="flex items-center gap-2 py-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Marché</span>
          </TabsTrigger>
          <TabsTrigger value="niches" className="flex items-center gap-2 py-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Niches</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ads">
          <AdLibrary />
        </TabsContent>

        <TabsContent value="products">
          <WinningProducts />
        </TabsContent>

        <TabsContent value="competitors">
          <CompetitorTracker />
        </TabsContent>

        <TabsContent value="influencers">
          <InfluencerFinder />
        </TabsContent>

        <TabsContent value="market">
          <MarketAnalyzer />
        </TabsContent>

        <TabsContent value="niches">
          <NicheExplorer />
        </TabsContent>
      </Tabs>
    </div>
  )
}
