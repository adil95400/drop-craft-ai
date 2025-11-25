import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Target, GitCompare, Grid, Sparkles, Bell, Calculator, Megaphone, Download, Trophy } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

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
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-8 shadow-xl"
      >
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Produits Gagnants</h1>
                <p className="text-white/90 text-lg">
                  Découvrez les meilleures opportunités avec l'IA
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Propulsé par l'IA
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm border-0">
                {products.length} produits analysés
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm border-0">
                Taux de succès {stats.successRate.toFixed(0)}%
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <WinnersExportTools products={products} />
            <Button 
              variant="secondary" 
              className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border-0 shadow-lg"
              onClick={() => setShowBatchImport(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              Import Masse
            </Button>
            <Button 
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border-0 shadow-lg"
              onClick={handleAnalyzeTrends}
            >
              <Target className="h-4 w-4 mr-2" />
              Analyser
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Analytics Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <WinnersAnalyticsDashboard stats={stats} isLoading={isLoading} />
      </motion.div>

      {/* Search Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <WinnersSearchInterface />
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-7 lg:w-auto bg-muted p-1 rounded-xl">
                <TabsTrigger value="auto-detect" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Sparkles className="w-4 h-4 lg:mr-2" />
                  <span className="hidden lg:inline">Auto</span>
                </TabsTrigger>
                <TabsTrigger value="grid" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Grid className="w-4 h-4 lg:mr-2" />
                  <span className="hidden lg:inline">Grille</span>
                </TabsTrigger>
                <TabsTrigger value="comparison" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <GitCompare className="w-4 h-4 lg:mr-2" />
                  <span className="hidden lg:inline">Comparateur</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <TrendingUp className="w-4 h-4 lg:mr-2" />
                  <span className="hidden lg:inline">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="market" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Target className="w-4 h-4 lg:mr-2" />
                  <span className="hidden lg:inline">Marché</span>
                </TabsTrigger>
                <TabsTrigger value="alerts" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Bell className="w-4 h-4 lg:mr-2" />
                  <span className="hidden lg:inline">Alertes</span>
                </TabsTrigger>
                <TabsTrigger value="ai" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Sparkles className="w-4 h-4 lg:mr-2" />
                  <span className="hidden lg:inline">IA</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="auto-detect" className="mt-6">
                <AutoDetectionDashboard />
              </TabsContent>

              <TabsContent value="grid" className="mt-6">
                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="border-b border-border/50 bg-muted/30">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-lg">Produits Détectés</div>
                          <div className="text-sm font-normal text-muted-foreground">
                            {products.length} opportunité{products.length > 1 ? 's' : ''} trouvée{products.length > 1 ? 's' : ''}
                          </div>
                        </div>
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
                  <CardContent className="p-6">
                    <WinnersProductGrid
                      products={products}
                      onImportProduct={handleImportClick}
                      isImporting={isImporting}
                      isLoading={isLoading}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comparison" className="mt-6">
                <WinnersComparison 
                  products={products}
                  selectedIds={selectedProducts.map(p => p.id)}
                  onCompare={(ids) => setSelectedProducts(products.filter(p => ids.includes(p.id)))}
                />
              </TabsContent>

              <TabsContent value="analytics" className="mt-6 space-y-4">
                <WinnersTrendChart products={products} />
              </TabsContent>

              <TabsContent value="market" className="mt-6 space-y-4">
                <WinnersMarketIntelligence />
              </TabsContent>

              <TabsContent value="alerts" className="mt-6 space-y-4">
                <WinnersAlertSystem />
              </TabsContent>

              <TabsContent value="ai" className="mt-6 space-y-4">
                <WinnersAIRecommendations products={products} onSelectProduct={handleImportClick} />
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>

        {/* Sidebar */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <WinnersAdvancedFilters 
            filters={searchParams}
            onFiltersChange={setSearchParams}
          />

          <WinnersSavedSearches
            currentParams={searchParams}
            onLoadSearch={(params) => search(params)}
          />
          
          <TrendingNichesCard onNicheClick={handleNicheClick} />
          
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded bg-green-500/10">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                Performance Temps Réel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm p-2 rounded-lg bg-muted/50">
                <span className="text-muted-foreground font-medium">Cache Hit:</span>
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20">
                  87%
                </Badge>
              </div>
              <div className="flex justify-between items-center text-sm p-2 rounded-lg bg-muted/50">
                <span className="text-muted-foreground font-medium">Response:</span>
                <Badge variant="secondary">1.2s</Badge>
              </div>
              <div className="flex justify-between items-center text-sm p-2 rounded-lg bg-muted/50">
                <span className="text-muted-foreground font-medium">Sources:</span>
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20">
                  3/3
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
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