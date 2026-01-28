import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, TrendingUp, Star, Save, BarChart3, Scan, Upload, GitCompare, Search } from 'lucide-react';
import { useWinnersOptimized } from '@/hooks/useWinnersOptimized';
import { Input } from '@/components/ui/input';
import { WinnersAnalyticsDashboard } from '@/components/winners/WinnersAnalyticsDashboard';
import { WinnersProductGrid } from '@/components/winners/WinnersProductGrid';
import { WinnersAdvancedFilters } from '@/components/winners/WinnersAdvancedFilters';
import { WinnersSavedSearches } from '@/components/winners/WinnersSavedSearches';
import { WinnersComparison } from '@/components/winners/WinnersComparison';
import { WinnersBatchImport } from '@/components/winners/WinnersBatchImport';
import { WinnersExportTools } from '@/components/winners/WinnersExportTools';
import { WinnersAIRecommendations } from '@/components/winners/WinnersAIRecommendations';
import { WinnersTrendChart } from '@/components/winners/WinnersTrendChart';
import { Badge } from '@/components/ui/badge';
import { WinnerProduct } from '@/domains/winners/types';
import { useToast } from '@/hooks/use-toast';

export default function WinnersHub() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const {
    products,
    stats,
    searchParams,
    isLoading,
    isImporting,
    search,
    importProduct,
    setSearchParams
  } = useWinnersOptimized();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      search({ ...searchParams, query: searchQuery });
    }
  };

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    search({ ...searchParams, query });
  };

  const handleImportProduct = async (product: WinnerProduct) => {
    try {
      await importProduct(product);
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const handleBatchImport = async (products: WinnerProduct[]) => {
    for (const product of products) {
      await handleImportProduct(product);
    }
  };

  const handleCompare = (ids: string[]) => {
    setSelectedForComparison(ids);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header Moderne */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Titre et Stats */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm border border-primary/20">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                    Winning Products Hub
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Découvrez et analysez les produits gagnants avec l'IA
                  </p>
                </div>
              </div>

              {/* Stats rapides */}
              <div className="flex flex-wrap gap-4">
                <Card className="px-4 py-2 bg-card/50 backdrop-blur-sm border-border/50">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">Analysés:</span>
                    <span className="font-bold text-foreground">{stats.totalAnalyzed}</span>
                  </div>
                </Card>
                <Card className="px-4 py-2 bg-card/50 backdrop-blur-sm border-border/50">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-muted-foreground">Winners:</span>
                    <span className="font-bold text-foreground">{stats.winnersDetected}</span>
                  </div>
                </Card>
                <Card className="px-4 py-2 bg-card/50 backdrop-blur-sm border-border/50">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Score moyen:</span>
                    <span className="font-bold text-foreground">{stats.averageScore.toFixed(1)}</span>
                  </div>
                </Card>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => search({ query: 'trending products', limit: 30 })}
                variant="outline"
                className="gap-2"
              >
                <Scan className="w-4 h-4" />
                Scanner IA
              </Button>
              <Button
                onClick={() => setShowBatchImport(true)}
                variant="outline"
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Import Masse
              </Button>
              <Button
                onClick={() => {
                  if (selectedForComparison.length < 2) {
                    toast({ title: "Sélectionnez 2-4 produits", description: "Cochez les produits dans la liste pour les comparer" });
                  }
                }}
                variant="outline"
                className="gap-2"
                disabled={selectedForComparison.length >= 2}
              >
                <GitCompare className="w-4 h-4" />
                Comparer ({selectedForComparison.length})
              </Button>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="mt-6 flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des produits gagnants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-background/50 backdrop-blur-sm border-border/50"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              Rechercher
            </Button>
          </div>

          {/* Filtres rapides */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => handleQuickSearch('trending products')}
            >
              Trending
            </Badge>
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => handleQuickSearch('dropshipping winners')}
            >
              Dropshipping
            </Badge>
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => handleQuickSearch('viral products')}
            >
              Viral
            </Badge>
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => handleQuickSearch('high margin products')}
            >
              Haute Marge
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card/50 backdrop-blur-sm border border-border/50 p-1">
            <TabsTrigger value="all" className="gap-2">
              <Trophy className="w-4 h-4" />
              Tous les Winners
            </TabsTrigger>
            <TabsTrigger value="trending" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="top" className="gap-2">
              <Star className="w-4 h-4" />
              Top Scores
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <Save className="w-4 h-4" />
              Sauvegardés
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Onglet Tous les Winners */}
          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar Filtres */}
              {showFilters && (
                <div className="lg:col-span-1 space-y-4">
                  <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
                    <WinnersAdvancedFilters
                      filters={searchParams}
                      onFiltersChange={(filters) => setSearchParams({ ...searchParams, ...filters })}
                    />
                  </Card>
                  <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
                    <WinnersSavedSearches
                      currentParams={searchParams}
                      onLoadSearch={(params) => {
                        setSearchParams(params);
                        search(params);
                      }}
                    />
                  </Card>
                </div>
              )}

              {/* Zone Principale */}
              <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      {showFilters ? 'Masquer' : 'Afficher'} Filtres
                    </Button>
                    <WinnersExportTools products={products} />
                  </div>
                  <WinnersProductGrid
                    products={products}
                    onImportProduct={handleImportProduct}
                    isImporting={isImporting}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Onglet Trending */}
          <TabsContent value="trending" className="space-y-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
              <h2 className="text-2xl font-bold mb-4">Tendances en Temps Réel</h2>
              <WinnersTrendChart products={products} />
            </Card>
            <WinnersProductGrid
              products={products.filter(p => (p.trending_score || 0) > 75)}
              onImportProduct={handleImportProduct}
              isImporting={isImporting}
            />
          </TabsContent>

          {/* Onglet Top Scores */}
          <TabsContent value="top" className="space-y-6">
            <div className="grid gap-4">
              <Card className="p-4 bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Winners Certifiés (Score {'>'} 95)
                </h3>
                <WinnersProductGrid
                  products={products.filter(p => (p.final_score || 0) >= 95)}
                  onImportProduct={handleImportProduct}
                  isImporting={isImporting}
                />
              </Card>
              <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
                <h3 className="font-semibold text-lg mb-2">Excellent Potentiel (90-95)</h3>
                <WinnersProductGrid
                  products={products.filter(p => (p.final_score || 0) >= 90 && (p.final_score || 0) < 95)}
                  onImportProduct={handleImportProduct}
                  isImporting={isImporting}
                />
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Sauvegardés */}
          <TabsContent value="saved" className="space-y-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Save className="w-6 h-6 text-primary" />
                Recherches Sauvegardées
              </h2>
              <p className="text-muted-foreground">
                Utilisez la sidebar pour gérer vos recherches sauvegardées.
              </p>
            </Card>
          </TabsContent>

          {/* Onglet Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <WinnersAnalyticsDashboard stats={stats} isLoading={isLoading} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
                  <h3 className="text-xl font-bold mb-4">Évolution des Scores</h3>
                  <WinnersTrendChart products={products} />
                </Card>
              </div>
              <div>
                <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
                  <WinnersAIRecommendations 
                    products={products.slice(0, 5)} 
                    onSelectProduct={handleImportProduct}
                  />
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modales */}
      {selectedForComparison.length >= 2 && (
        <WinnersComparison
          products={products}
          selectedIds={selectedForComparison}
          onCompare={handleCompare}
        />
      )}

      <WinnersBatchImport
        products={products}
        isOpen={showBatchImport}
        onClose={() => setShowBatchImport(false)}
        onConfirm={handleBatchImport}
      />
    </div>
  );
}
