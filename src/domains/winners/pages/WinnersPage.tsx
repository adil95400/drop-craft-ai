import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Target, GitCompare, BarChart3, Package } from 'lucide-react'
import { WinnersSearchInterface } from '@/components/winners/WinnersSearchInterface'
import { WinnersProductGrid } from '@/components/winners/WinnersProductGrid'
import { WinnersAnalyticsDashboard } from '@/components/winners/WinnersAnalyticsDashboard'
import { WinnersImportFlow } from '@/components/winners/WinnersImportFlow'
import { WinnersAdvancedFilters } from '@/components/winners/WinnersAdvancedFilters'
import { WinnersTrendChart } from '@/components/winners/WinnersTrendChart'
import { WinnersComparison } from '@/components/winners/WinnersComparison'
import { WinnersExportTools } from '@/components/winners/WinnersExportTools'
import { WinnersSavedSearches } from '@/components/winners/WinnersSavedSearches'
import { WinnersBatchImport } from '@/components/winners/WinnersBatchImport'
import { WinnersAIRecommendations } from '@/components/winners/WinnersAIRecommendations'
import { TrendingNichesCard } from '../components/TrendingNichesCard'
import { useWinnersOptimized } from '@/hooks/useWinnersOptimized'
import { useWinnersNotifications } from '../hooks/useWinnersNotifications'
import { TrendingNiche, WinnerProduct } from '../types'

const WinnersPage = () => {
  const { 
    products, 
    stats,
    searchParams,
    isLoading,
    importProduct,
    isImporting,
    analyzeTrends,
    search,
    setSearchParams,
    toggleFavorite,
    favorites
  } = useWinnersOptimized()

  // Enable smart notifications
  useWinnersNotifications(products)

  const [selectedProduct, setSelectedProduct] = useState<WinnerProduct | null>(null)
  const [showImportFlow, setShowImportFlow] = useState(false)
  const [showBatchImport, setShowBatchImport] = useState(false)
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([])

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

  const handleImportClick = (product: WinnerProduct) => {
    setSelectedProduct(product)
    setShowImportFlow(true)
  }

  const handleConfirmImport = async (product: WinnerProduct, customData: any) => {
    await importProduct(product)
    setShowImportFlow(false)
  }

  const handleBatchImport = async (products: WinnerProduct[]) => {
    for (const product of products) {
      await importProduct(product)
    }
  }

  const handleFilterChange = (filters: any) => {
    setSearchParams((prev: any) => ({
      ...prev,
      minScore: filters.minScore,
      maxPrice: filters.maxPrice,
      sources: filters.sources
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">🏆 Produits Gagnants</h1>
          <p className="text-muted-foreground">
            Découvrez les produits les plus performants avec l'IA
          </p>
        </div>
        <div className="flex gap-2">
          <WinnersExportTools products={products} />
          <Button variant="outline" onClick={() => setShowBatchImport(true)}>
            <Package className="h-4 w-4 mr-2" />
            Import Masse
          </Button>
          <Button variant="outline" onClick={handleAnalyzeTrends}>
            <Target className="h-4 w-4 mr-2" />
            Analyser
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <WinnersAnalyticsDashboard stats={stats} isLoading={isLoading} />

      {/* Trend Charts */}
      <WinnersTrendChart products={products} />

      {/* Search Interface */}
      <WinnersSearchInterface />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="grid" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="grid">
                <Target className="h-4 w-4 mr-2" />
                Grille ({products.length})
              </TabsTrigger>
              <TabsTrigger value="comparison">
                <GitCompare className="h-4 w-4 mr-2" />
                Comparer ({selectedForComparison.length})
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="grid">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Winners Détectés
                    </span>
                    {selectedForComparison.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedForComparison([])}
                      >
                        Effacer sélection
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WinnersProductGrid
                    products={products}
                    onImportProduct={handleImportClick}
                    isImporting={isImporting}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparison">
              <WinnersComparison
                products={products}
                selectedIds={selectedForComparison}
                onCompare={setSelectedForComparison}
              />
            </TabsContent>

            <TabsContent value="analytics">
              <WinnersTrendChart products={products} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <WinnersAdvancedFilters 
            onFilterChange={handleFilterChange}
            isOpen={false}
          />

          <WinnersAIRecommendations
            products={products}
            onSelectProduct={handleImportClick}
          />

          <WinnersSavedSearches
            currentParams={searchParams}
            onLoadSearch={(params) => search(params)}
          />
          
          <TrendingNichesCard onNicheClick={handleNicheClick} />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Performance Temps Réel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cache Hit:</span>
                <span className="font-medium text-green-600">87%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Response:</span>
                <span className="font-medium">1.2s</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sources:</span>
                <span className="font-medium text-green-600">3/3</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Import Flow */}
      <WinnersImportFlow
        product={selectedProduct}
        isOpen={showImportFlow}
        onClose={() => setShowImportFlow(false)}
        onConfirm={handleConfirmImport}
      />

      {/* Batch Import */}
      <WinnersBatchImport
        products={products}
        isOpen={showBatchImport}
        onClose={() => setShowBatchImport(false)}
        onConfirm={handleBatchImport}
      />
    </div>
  )
}

export { WinnersPage }
export default WinnersPage
