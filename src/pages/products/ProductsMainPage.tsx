import { useUnifiedProducts } from '@/hooks/useUnifiedProducts';
import { ProductsPageWrapper } from '@/components/products/ProductsPageWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Loader2 } from 'lucide-react';
import { useModals } from '@/hooks/useModals';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Catalogue Produits</h1>
        <p className="text-muted-foreground">
          Gérez tous vos produits en un seul endroit
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Total Produits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {products.filter(p => p.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stock faible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {products.filter(p => (p.stock_quantity || 0) < 10).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inactifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {products.filter(p => p.status === 'inactive').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table/Grid produits avec toutes les actions */}
      <Card>
        <CardHeader>
          <CardTitle>Tous les produits</CardTitle>
          <CardDescription>
            {products.length} produit(s) au total
          </CardDescription>
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
  );
}
