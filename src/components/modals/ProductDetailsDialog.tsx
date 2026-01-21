import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
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
  Loader2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { OptimizedModal } from '@/components/ui/optimized-modal';
import { StatCard, CompactStat } from '@/components/ui/optimized-stats-grid';

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
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <OptimizedModal
      open={open}
      onOpenChange={onOpenChange}
      title="Détails du produit"
      icon={<Package className="h-5 w-5" />}
      size="xl"
    >
      {isLoading ? (
        <div className="space-y-6">
          <div className="flex gap-6">
            <Skeleton className="w-32 h-32 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
      ) : product ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Header with image and basic info */}
          <div className="flex flex-col sm:flex-row gap-6">
            {product.image_url ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-32 h-32 rounded-xl border overflow-hidden flex-shrink-0 bg-muted"
              >
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ) : (
              <div className="w-32 h-32 rounded-xl border flex items-center justify-center bg-muted flex-shrink-0">
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

              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusColor(product.status)}>
                  {product.status === 'active' ? 'Actif' : product.status === 'draft' ? 'Brouillon' : 'Inactif'}
                </Badge>
                {product.category && (
                  <Badge variant="outline" className="gap-1">
                    <Tag className="h-3 w-3" />
                    {product.category}
                  </Badge>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                {product.shopify_id && (
                  <Button size="sm" variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Shopify
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <CompactStat
              label="Prix de vente"
              value={formatCurrency(product.price)}
              icon={DollarSign}
            />
            <CompactStat
              label="Prix de coût"
              value={formatCurrency(product.cost_price || 0)}
              icon={DollarSign}
            />
            <CompactStat
              label="Stock"
              value={product.stock_quantity || 0}
              icon={Package}
            />
            <CompactStat
              label="Marge"
              value={`${(product.profit_margin || 0).toFixed(1)}%`}
              icon={TrendingUp}
            />
          </div>

          {/* Tabs with detailed information */}
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="pricing">Prix</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                  <p className="text-sm">
                    {product.description || 'Aucune description'}
                  </p>
                </div>

                {product.tags && product.tags.length > 0 && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date de création
                    </p>
                    <p className="text-sm">
                      {format(new Date(product.created_at), 'PPP', { locale: fr })}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Dernière mise à jour</p>
                    <p className="text-sm">
                      {format(new Date(product.updated_at), 'PPP', { locale: fr })}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 p-4 border rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5"
                >
                  <div className="p-3 rounded-xl bg-emerald-500/20">
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prix de vente</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                </motion.div>

                {product.cost_price && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-4 p-4 border rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5"
                  >
                    <div className="p-3 rounded-xl bg-blue-500/20">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Prix de coût</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(product.cost_price)}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {product.weight && (
                <div className="p-4 border rounded-xl">
                  <p className="text-sm font-medium text-muted-foreground">Poids</p>
                  <p className="text-lg font-medium mt-1">{product.weight} kg</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Titre SEO</p>
                  <p className="text-sm">{product.seo_title || 'Non défini'}</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Description SEO</p>
                  <p className="text-sm">{product.seo_description || 'Non définie'}</p>
                </div>

                {product.seo_keywords && product.seo_keywords.length > 0 && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Mots-clés SEO</p>
                    <div className="flex flex-wrap gap-2">
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
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 border rounded-xl text-center"
                >
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Vues</p>
                  <p className="text-2xl font-bold mt-1">-</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="p-4 border rounded-xl text-center"
                >
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Ventes</p>
                  <p className="text-2xl font-bold mt-1">-</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 border rounded-xl text-center"
                >
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Revenus</p>
                  <p className="text-2xl font-bold mt-1">-</p>
                </motion.div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Statistiques détaillées disponibles prochainement
              </p>
            </TabsContent>
          </Tabs>
        </motion.div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Produit non trouvé
        </div>
      )}
    </OptimizedModal>
  );
}
