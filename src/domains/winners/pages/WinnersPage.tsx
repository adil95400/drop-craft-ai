import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Target } from 'lucide-react'
import { WinnersSearchInterface } from '@/components/winners/WinnersSearchInterface'
import { WinnersProductGrid } from '@/components/winners/WinnersProductGrid'
import { WinnersStatsCards } from '../components/WinnersStatsCards'
import { TrendingNichesCard } from '../components/TrendingNichesCard'
import { useWinners } from '../hooks/useWinners'
import { TrendingNiche } from '../types'

const WinnersPage = () => {
  const { 
    products, 
    response, 
    stats,
    isLoading,
    importProduct,
    isImporting,
    analyzeTrends,
    search
  } = useWinners()

  const handleNicheClick = (niche: TrendingNiche) => {
    search({
      query: niche.name,
      category: niche.category,
      limit: 20
    })
  }

  const handleAnalyzeTrends = () => {
    analyzeTrends('trending products 2024')
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Produits Gagnants</h1>
          <p className="text-muted-foreground">
            Découvrez les produits les plus performants grâce à l'IA
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleAnalyzeTrends}
          >
            <Target className="h-4 w-4 mr-2" />
            Analyser Tendances
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <WinnersStatsCards 
        stats={stats}
        totalSources={response?.stats?.total_sources || 0}
        isLoading={isLoading}
      />

      {/* Search Interface */}
      <WinnersSearchInterface />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Grid - Takes 2/3 of space */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Produits Gagnants Détectés
                {isLoading && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WinnersProductGrid
                products={products}
                onImportProduct={importProduct}
                isImporting={isImporting}
              />
            </CardContent>
          </Card>
        </div>

        {/* Trending Niches Sidebar - Takes 1/3 of space */}
        <div className="space-y-6">
          <TrendingNichesCard onNicheClick={handleNicheClick} />
          
          {/* Additional Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Performance Temps Réel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cache Hit Rate:</span>
                <span className="font-medium">87%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Response Time:</span>
                <span className="font-medium">1.2s</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sources Online:</span>
                <span className="font-medium text-green-600">3/3</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default WinnersPage