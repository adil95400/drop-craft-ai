import { useMemo } from 'react';
import { useUnifiedProducts } from '@/hooks/useUnifiedProducts';
import { ProductsPageWrapper } from '@/components/products/ProductsPageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Loader2, TrendingUp, AlertCircle, Archive } from 'lucide-react';
import { useModals } from '@/hooks/useModals';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

/**
 * Page principale de gestion des produits
 * Utilise le hook unifié et le wrapper pour toutes les actions
 */
export default function ProductsMainPage() {
  const { products, isLoading } = useUnifiedProducts();
  const { openModal } = useModals();
  const { toast } = useToast();
  const { invalidateQueries } = useQueryClient();

  const handleEdit = (product: any) => {
    openModal('createProduct', { productId: product.id });
  };

  const handleDelete = async (id: string) => {
    // Confirmation de suppression
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    try {
      const { importExportService } = await import('@/services/importExportService');
      await importExportService.bulkDelete([id]);
      
      toast({
        title: 'Produit supprimé',
        description: 'Le produit a été supprimé avec succès'
      });
      
      // Invalider le cache pour recharger les produits
      invalidateQueries({ queryKey: ['unified-products'] });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer le produit',
        variant: 'destructive'
      });
    }
  };

  const handleView = (product: any) => {
    openModal('productDetails', { productId: product.id });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-in fade-in duration-300">
        <div className="text-center space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div className="absolute inset-0 animate-ping">
              <Loader2 className="h-12 w-12 mx-auto text-primary/20" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Chargement des produits...</p>
            <p className="text-xs text-muted-foreground">Préparation de votre catalogue</p>
          </div>
        </div>
      </div>
    );
  }

  // Statistiques mémorisées pour performance
  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    lowStock: products.filter(p => (p.stock_quantity || 0) < 10).length,
    inactive: products.filter(p => p.status === 'inactive').length,
    totalValue: products.reduce((sum, p) => sum + (p.price * (p.stock_quantity || 0)), 0)
  }), [products]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-6 animate-in fade-in duration-500">
        {/* En-tête optimisé */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Catalogue Produits
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez tous vos produits en un seul endroit
            </p>
          </div>
        </div>

        {/* Statistiques rapides optimisées */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Produits
                </CardTitle>
                <Package className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Valeur totale: {stats.totalValue.toFixed(2)} €
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Produits Actifs
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}% du total
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Stock Faible
                </CardTitle>
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-3xl font-bold",
                stats.lowStock > 0 ? "text-orange-600" : "text-muted-foreground"
              )}>
                {stats.lowStock}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Produits nécessitant un réassort
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Produits Inactifs
                </CardTitle>
                <Archive className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">{stats.inactive}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Non disponibles à la vente
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Table/Grid produits optimisée */}
        <Card className="border-border/50 bg-card/50 backdrop-blur shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tous les produits</span>
              <span className="text-sm font-normal text-muted-foreground">
                {stats.total} produit(s)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductsPageWrapper
              products={products}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              onRefresh={() => invalidateQueries({ queryKey: ['unified-products'] })}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
