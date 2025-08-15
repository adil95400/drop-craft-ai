import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Star, Users, ShoppingCart, Target, BarChart3, Zap, ArrowRight } from 'lucide-react'
import { WinnersSearchInterface } from '@/components/winners/WinnersSearchInterface'
import { WinnersProductGrid } from '@/components/winners/WinnersProductGrid'
import { useRealWinnersAPI } from '@/hooks/useRealWinnersAPI'

const Winners = () => {
  const { 
    winners, 
    winnersData, 
    isLoading,
    importProduct,
    isImporting,
    analyzeTrends 
  } = useRealWinnersAPI()

  const trendingNiches = [
    {
      id: 1,
      name: "Gaming Accessories",
      growth: "+156%",
      avgPrice: "€35",
      competition: "Moyenne",
      opportunity: "Élevée"
    },
    {
      id: 2,
      name: "Home Fitness",
      growth: "+134%",
      avgPrice: "€67",
      competition: "Faible",
      opportunity: "Très Élevée"
    },
    {
      id: 3,
      name: "Smart Home",
      growth: "+98%",
      avgPrice: "€45",
      competition: "Élevée",
      opportunity: "Moyenne"
    }
  ]

  const stats = winnersData ? {
    totalAnalyzed: winnersData.meta.total,
    winnersDetected: winners.filter(p => (p.final_score || 0) > 70).length,
    averageScore: winnersData.stats?.avg_score || 0,
    successRate: 94.2
  } : {
    totalAnalyzed: 0,
    winnersDetected: 0,
    averageScore: 0,
    successRate: 94.2
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Produits Gagnants</h1>
          <p className="text-muted-foreground">
            Découvrez les produits les plus performants en temps réel
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => analyzeTrends('trending products 2024')}
          >
            <Target className="h-4 w-4 mr-2" />
            Analyser Tendances
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits Analysés</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAnalyzed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {winnersData?.stats?.total_sources || 0} sources actives
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Winners Détectés</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winnersDetected}</div>
            <p className="text-xs text-muted-foreground">Score &gt; 70</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Moyen</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.averageScore)}</div>
            <p className="text-xs text-muted-foreground">Sur 100 points</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Précision IA</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">Taux de succès</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Interface */}
      <WinnersSearchInterface />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Winning Products Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Produits Gagnants Détectés
                {isLoading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WinnersProductGrid
                products={winners}
                onImportProduct={importProduct}
                isImporting={isImporting}
              />
            </CardContent>
          </Card>
        </div>

        {/* Trending Niches */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Niches Tendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendingNiches.map((niche) => (
                  <div key={niche.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold">{niche.name}</h3>
                      <Badge variant="outline" className="text-green-600">
                        {niche.growth}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Prix moyen:</span>
                        <div className="font-medium">{niche.avgPrice}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Concurrence:</span>
                        <div className="font-medium">{niche.competition}</div>
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Opportunité:</span>
                        <Badge 
                          variant={niche.opportunity === "Très Élevée" ? "default" : "secondary"}
                        >
                          {niche.opportunity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Winners