import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Target, GitCompare, Grid, Sparkles, Bell, Calculator, Megaphone } from 'lucide-react';
import { WinnersSearchInterface } from '@/components/winners/WinnersSearchInterface';
import { WinnersProductGrid } from '@/components/winners/WinnersProductGrid';
import { WinnersAnalyticsDashboard } from '@/components/winners/WinnersAnalyticsDashboard';
import { WinnersImportFlow } from '@/components/winners/WinnersImportFlow';
import { WinnersAdvancedFilters } from '@/components/winners/WinnersAdvancedFilters';
import { WinnersTrendChart } from '@/components/winners/WinnersTrendChart';
import { WinnersComparison } from '@/components/winners/WinnersComparison';
import { WinnersExportTools } from '@/components/winners/WinnersExportTools';
import { WinnersSavedSearches } from '@/components/winners/WinnersSavedSearches';
import { WinnersBatchImport } from '@/components/winners/WinnersBatchImport';
import { WinnersAIRecommendations } from '@/components/winners/WinnersAIRecommendations';
import { WinnersProductAnalysis } from '@/components/winners/WinnersProductAnalysis';
import { WinnersProfitCalculator } from '@/components/winners/WinnersProfitCalculator';
import { WinnersPublishOptions } from '@/components/winners/WinnersPublishOptions';
import { WinnersMarketIntelligence } from '@/components/winners/WinnersMarketIntelligence';
import { WinnersAlertSystem } from '@/components/winners/WinnersAlertSystem';
import { AutoDetectionDashboard } from '@/components/winners/AutoDetectionDashboard';
import { TrendingNichesCard } from '../components/TrendingNichesCard';
import { useWinnersOptimized } from '@/hooks/useWinnersOptimized';
import { useWinnersNotifications } from '../hooks/useWinnersNotifications';
import { TrendingNiche, WinnerProduct } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const WinnersPage = () => {
  const [activeTab, setActiveTab] = useState('grid');
  const [selectedProducts, setSelectedProducts] = useState<WinnerProduct[]>([]);
  const [analysisProduct, setAnalysisProduct] = useState<WinnerProduct | null>(null);
  const [calculatorProduct, setCalculatorProduct] = useState<WinnerProduct | null>(null);
  const [publishProduct, setPublishProduct] = useState<WinnerProduct | null>(null);
  
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
  } = useWinnersOptimized();

  useWinnersNotifications(products);

  const [selectedProduct, setSelectedProduct] = useState<WinnerProduct | null>(null);
  const [showImportFlow, setShowImportFlow] = useState(false);
  const [showBatchImport, setShowBatchImport] = useState(false);

  const handleNicheClick = (niche: TrendingNiche) => {
    search({
      query: niche.name,
      category: niche.category,
      limit: 20
    });
  };

  const handleAnalyzeTrends = () => {
    analyzeTrends('trending products 2024');
  };

  const handleImportClick = (product: WinnerProduct) => {
    setSelectedProduct(product);
    setShowImportFlow(true);
  };

  const handleConfirmImport = async (product: WinnerProduct, customData: any) => {
    await importProduct(product);
    setShowImportFlow(false);
  };

  const handleBatchImport = async (products: WinnerProduct[]) => {
    for (const product of products) {
      await importProduct(product);
    }
  };

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

      {/* Search Interface */}
      <WinnersSearchInterface />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-7 lg:w-auto">
              <TabsTrigger value="auto-detect">
                <Sparkles className="w-4 h-4 mr-2" />
                Auto
              </TabsTrigger>
              <TabsTrigger value="grid">
                <Grid className="w-4 h-4 mr-2" />
                Grille
              </TabsTrigger>
              <TabsTrigger value="comparison">
                <GitCompare className="w-4 h-4 mr-2" />
                Comparateur
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="market">
                <Target className="w-4 h-4 mr-2" />
                Marché
              </TabsTrigger>
              <TabsTrigger value="alerts">
                <Bell className="w-4 h-4 mr-2" />
                Alertes
              </TabsTrigger>
              <TabsTrigger value="ai">
                <Sparkles className="w-4 h-4 mr-2" />
                IA
              </TabsTrigger>
            </TabsList>

            {/* Auto Detection Tab */}
            <TabsContent value="auto-detect">
              <AutoDetectionDashboard />
            </TabsContent>

            {/* Grid Tab */}
            <TabsContent value="grid">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Winners Détectés ({products.length})
                    </span>
                    {selectedProducts.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedProducts([])}
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
                    onPublishProduct={(product) => setPublishProduct(product)}
                    isImporting={isImporting}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Comparison Tab */}
            <TabsContent value="comparison">
              <WinnersComparison 
                products={products}
                selectedIds={selectedProducts.map(p => p.id)}
                onCompare={(ids) => setSelectedProducts(products.filter(p => ids.includes(p.id)))}
              />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <WinnersTrendChart products={products} />
            </TabsContent>

            {/* Market Intelligence Tab */}
            <TabsContent value="market" className="space-y-4">
              <WinnersMarketIntelligence />
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts" className="space-y-4">
              <WinnersAlertSystem />
            </TabsContent>

            {/* AI Recommendations Tab */}
            <TabsContent value="ai" className="space-y-4">
              <WinnersAIRecommendations products={products} onSelectProduct={handleImportClick} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <WinnersAdvancedFilters 
            filters={searchParams}
            onFiltersChange={setSearchParams}
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

      {/* Product Analysis Dialog */}
      <Dialog open={!!analysisProduct} onOpenChange={() => setAnalysisProduct(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analyse Complète du Produit</DialogTitle>
          </DialogHeader>
          {analysisProduct && <WinnersProductAnalysis product={analysisProduct} />}
        </DialogContent>
      </Dialog>

      {/* Profit Calculator Dialog */}
      <Dialog open={!!calculatorProduct} onOpenChange={() => setCalculatorProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Calculateur de Rentabilité</DialogTitle>
          </DialogHeader>
          {calculatorProduct && <WinnersProfitCalculator product={calculatorProduct} />}
        </DialogContent>
      </Dialog>

      {/* Publish Options Modal */}
      <WinnersPublishOptions
        product={publishProduct}
        open={!!publishProduct}
        onOpenChange={(open) => !open && setPublishProduct(null)}
      />
    </div>
  );
};

export { WinnersPage };
export default WinnersPage;
