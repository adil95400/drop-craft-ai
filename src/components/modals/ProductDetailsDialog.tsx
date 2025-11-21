import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApi } from '@/hooks/useApi';
import { toast } from 'sonner';
import {
  Package,
  DollarSign,
  BarChart3,
  Tag,
  Image as ImageIcon,
  Edit,
  ExternalLink,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProductDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
}

export function ProductDetailsDialog({ open, onOpenChange, productId }: ProductDetailsDialogProps) {
  const { supabaseQuery } = useApi();
  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    if (open && productId) {
      loadProductDetails();
    }
  }, [open, productId]);

  const loadProductDetails = async () => {
    if (!productId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabaseQuery(
        async () => {
          const { data, error } = await (await import('@/integrations/supabase/client')).supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
          return { data, error };
        },
        { showToast: false }
      );

      if (error) throw new Error(error);
      setProduct(data);
    } catch (error) {
      toast.error('Erreur lors du chargement du produit');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500';
      case 'inactive':
        return 'bg-gray-500/10 text-gray-500';
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Détails du produit
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : product ? (
          <div className="space-y-6">
            {/* Header with image and basic info */}
            <div className="flex gap-6">
              {product.image_url ? (
                <div className="w-32 h-32 rounded-lg border overflow-hidden flex-shrink-0">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-lg border flex items-center justify-center bg-muted flex-shrink-0">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-xl font-semibold">{product.name}</h3>
                  {product.sku && (
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Badge className={getStatusColor(product.status)}>
                    {product.status}
                  </Badge>
                  {product.category && (
                    <Badge variant="outline">
                      <Tag className="h-3 w-3 mr-1" />
                      {product.category}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  {product.shopify_id && (
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Voir sur Shopify
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs with detailed information */}
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">Général</TabsTrigger>
                <TabsTrigger value="pricing">Prix & Stock</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
                <TabsTrigger value="stats">Statistiques</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {product.description || 'Aucune description'}
                    </p>
                  </div>

                  {product.tags && product.tags.length > 0 && (
                    <div>
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {product.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.supplier && (
                    <div>
                      <Label>Fournisseur</Label>
                      <p className="text-sm mt-1">{product.supplier}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date de création
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(product.created_at), 'PPP', { locale: fr })}
                      </p>
                    </div>
                    <div>
                      <Label>Dernière mise à jour</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(product.updated_at), 'PPP', { locale: fr })}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 border rounded-lg">
                      <DollarSign className="h-8 w-8 text-green-500" />
                      <div>
                        <Label>Prix de vente</Label>
                        <p className="text-2xl font-bold">
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                    </div>

                    {product.cost_price && (
                      <div className="flex items-center gap-3 p-4 border rounded-lg">
                        <DollarSign className="h-8 w-8 text-blue-500" />
                        <div>
                          <Label>Prix de coût</Label>
                          <p className="text-2xl font-bold">
                            {formatCurrency(product.cost_price)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 border rounded-lg">
                      <Package className="h-8 w-8 text-primary" />
                      <div>
                        <Label>Stock disponible</Label>
                        <p className="text-2xl font-bold">
                          {product.stock_quantity || 0}
                        </p>
                      </div>
                    </div>

                    {product.profit_margin && (
                      <div className="flex items-center gap-3 p-4 border rounded-lg">
                        <TrendingUp className="h-8 w-8 text-amber-500" />
                        <div>
                          <Label>Marge bénéficiaire</Label>
                          <p className="text-2xl font-bold">
                            {product.profit_margin.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {product.weight && (
                  <div className="p-4 border rounded-lg">
                    <Label>Poids</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {product.weight} kg
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="seo" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <Label>Titre SEO</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {product.seo_title || 'Non défini'}
                    </p>
                  </div>

                  <div>
                    <Label>Description SEO</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {product.seo_description || 'Non définie'}
                    </p>
                  </div>

                  {product.seo_keywords && product.seo_keywords.length > 0 && (
                    <div>
                      <Label>Mots-clés SEO</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {product.seo_keywords.map((keyword: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="stats" className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <Label>Vues</Label>
                    <p className="text-2xl font-bold mt-1">-</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <Label>Ventes</Label>
                    <p className="text-2xl font-bold mt-1">-</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <Label>Revenus</Label>
                    <p className="text-2xl font-bold mt-1">-</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Statistiques détaillées disponibles prochainement
                </p>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Produit non trouvé
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>
      {children}
    </label>
  );
}
