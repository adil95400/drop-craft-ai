/**
 * Catalogue Optimisé - Style Channable Premium
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUnifiedProducts, UnifiedProduct } from '@/hooks/useUnifiedProducts';
import { useProductScores } from '@/hooks/useProductScores';
import { ProductCardEnhanced } from '@/components/products/ProductCardEnhanced';
import { ProductViewModal } from '@/components/modals/ProductViewModal';
import { ProductEditModal } from '@/components/modals/ProductEditModal';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Sparkles, TrendingUp, Trophy, DollarSign,
  Copy, RefreshCw, BarChart3, Download, Package, Target,
  CheckCircle, Filter, Layers
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color = 'primary'
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  color?: string;
}) => {
  const colorClasses = {
    primary: 'from-primary/20 to-primary/5 text-primary',
    yellow: 'from-yellow-500/20 to-yellow-500/5 text-yellow-600',
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-600',
    green: 'from-emerald-500/20 to-emerald-500/5 text-emerald-600',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="relative overflow-hidden border-border/50 hover:shadow-lg transition-all">
        <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary} opacity-50`} />
        <CardContent className="relative p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary} flex items-center justify-center`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function EnhancedCatalog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'all' | 'winners' | 'trending' | 'bestsellers'>('all');
  
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<UnifiedProduct | null>(null);

  const { 
    products, 
    isLoading,
    deleteProduct,
  } = useUnifiedProducts({ 
    search: search || undefined,
    category: category !== 'all' ? category : undefined
  });

  const {
    calculateScores,
    detectDuplicates,
    optimizeProduct,
    isCalculating,
    isDetecting,
  } = useProductScores();

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];

  const filteredProducts = products.filter(p => {
    if (view === 'winners') return p.is_winner;
    if (view === 'trending') return p.is_trending;
    if (view === 'bestsellers') return p.is_bestseller;
    return true;
  });

  const stats = {
    total: products.length,
    winners: products.filter(p => p.is_winner).length,
    trending: products.filter(p => p.is_trending).length,
    bestsellers: products.filter(p => p.is_bestseller).length,
    avgAiScore: products.length > 0 
      ? (products.reduce((sum, p) => sum + (p.ai_score || 0), 0) / products.length).toFixed(0)
      : 0,
    avgMargin: products.length > 0
      ? (products.reduce((sum, p) => sum + (p.profit_margin || 0), 0) / products.length).toFixed(1)
      : 0
  };

  const handleBulkCalculateScores = () => {
    if (!user) return;
    const ids = Array.from(selectedProducts);
    if (ids.length === 0) {
      toast.error('Sélectionnez au moins un produit');
      return;
    }
    calculateScores.mutate({ productIds: ids, userId: user.id });
  };

  const handleDetectDuplicates = () => {
    if (!user) return;
    detectDuplicates.mutate({ userId: user.id });
  };

  const handleOptimizeProduct = (productId: string) => {
    if (!user) return;
    optimizeProduct.mutate({ 
      productId, 
      userId: user.id,
      optimizations: ['title', 'description', 'price', 'tags']
    });
  };

  const toggleSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleViewProduct = (product: UnifiedProduct) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  };

  const handleEditProduct = (product: UnifiedProduct) => {
    setSelectedProduct(product);
    setEditModalOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    deleteProduct(productId);
  };

  const handleDuplicateProduct = (product: UnifiedProduct) => {
    toast.info(`Duplication de "${product.name}" - En développement`);
  };

  return (
    <ChannablePageWrapper
      title="Catalogue Optimisé"
      subtitle="Gestion IA"
      description="Gestion intelligente avec scores IA et optimisation automatique de vos produits"
      heroImage="products"
      badge={{ label: 'Smart', icon: Sparkles }}
      actions={
        <div className="flex gap-2">
          <Button 
            onClick={handleDetectDuplicates}
            variant="outline"
            disabled={isDetecting}
            className="gap-2 bg-background/80 backdrop-blur-sm"
          >
            <Copy className="h-4 w-4" />
            {isDetecting ? 'Détection...' : 'Doublons'}
          </Button>
          <Button 
            onClick={handleBulkCalculateScores}
            disabled={isCalculating || selectedProducts.size === 0}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {isCalculating ? 'Calcul...' : `Scores (${selectedProducts.size})`}
          </Button>
        </div>
      }
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatCard icon={Package} label="Total Produits" value={stats.total} color="primary" />
        <StatCard icon={Trophy} label="Winners" value={stats.winners} color="yellow" />
        <StatCard icon={TrendingUp} label="Tendance" value={stats.trending} color="blue" />
        <StatCard icon={BarChart3} label="Best-sellers" value={stats.bestsellers} color="green" />
        <StatCard icon={Target} label="Score IA" value={`${stats.avgAiScore}/100`} color="purple" />
        <StatCard icon={DollarSign} label="Marge Moy." value={`${stats.avgMargin}%`} color="green" />
      </div>

      {/* Filters & Tabs */}
      <Card className="border-border/50">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, SKU, catégorie..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={view} onValueChange={(v: any) => setView(v)}>
            <TabsList className="grid w-full grid-cols-4 bg-muted/50">
              <TabsTrigger value="all" className="gap-2">
                <Layers className="h-4 w-4 hidden sm:block" />
                Tous ({products.length})
              </TabsTrigger>
              <TabsTrigger value="winners" className="gap-2">
                <Trophy className="h-4 w-4 hidden sm:block" />
                Winners ({stats.winners})
              </TabsTrigger>
              <TabsTrigger value="trending" className="gap-2">
                <TrendingUp className="h-4 w-4 hidden sm:block" />
                Tendance ({stats.trending})
              </TabsTrigger>
              <TabsTrigger value="bestsellers" className="gap-2">
                <BarChart3 className="h-4 w-4 hidden sm:block" />
                Best ({stats.bestsellers})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Winners Import Banner */}
      <AnimatePresence>
        {view === 'winners' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Recherche de Produits Gagnants</h3>
                      <p className="text-sm text-muted-foreground">
                        Découvrez et importez des produits à fort potentiel
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => navigate('/winners')} className="gap-2">
                    <Download className="h-4 w-4" />
                    Importer Winners
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement des produits...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="text-center py-16">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Aucun produit trouvé</p>
            <p className="text-muted-foreground text-sm">
              Essayez de modifier vos filtres ou d'ajouter des produits
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.05 }}
        >
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <ProductCardEnhanced
                product={product}
                selected={selectedProducts.has(product.id)}
                onSelect={() => toggleSelection(product.id)}
                onOptimize={handleOptimizeProduct}
                onView={handleViewProduct}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                onDuplicate={handleDuplicateProduct}
                onClick={() => handleViewProduct(product)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Selection Summary */}
      <AnimatePresence>
        {selectedProducts.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Card className="w-80 shadow-2xl border-primary/20 bg-background/95 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  {selectedProducts.size} produit{selectedProducts.size > 1 ? 's' : ''} sélectionné{selectedProducts.size > 1 ? 's' : ''}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full gap-2" 
                  onClick={handleBulkCalculateScores}
                  disabled={isCalculating}
                >
                  <Sparkles className="h-4 w-4" />
                  Calculer les scores IA
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setSelectedProducts(new Set())}
                >
                  Désélectionner tout
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {selectedProduct && (
        <ProductViewModal
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          product={selectedProduct}
          onEdit={() => {
            setViewModalOpen(false);
            setEditModalOpen(true);
          }}
          onDelete={() => {
            if (window.confirm(`Supprimer "${selectedProduct.name}" ?`)) {
              deleteProduct(selectedProduct.id);
              setViewModalOpen(false);
              setSelectedProduct(null);
            }
          }}
          onDuplicate={() => handleDuplicateProduct(selectedProduct)}
        />
      )}

      {selectedProduct && (
        <ProductEditModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          product={selectedProduct as any}
        />
      )}
    </ChannablePageWrapper>
  );
}
