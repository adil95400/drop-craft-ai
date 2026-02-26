import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApi } from '@/hooks/useApi';
import { supabase } from '@/integrations/supabase/client';
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
  Star,
  MessageSquare,
  User,
  ThumbsUp,
  ImageIcon as ImagePlus,
  Images,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { OptimizedModal } from '@/components/ui/optimized-modal';
import { StatCard, CompactStat } from '@/components/ui/optimized-stats-grid';
import { MediaGalleryManager } from '@/components/products/MediaGalleryManager';

interface ProductDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
}

interface Review {
  id: string;
  rating: number;
  content: string;
  author_name?: string;
  created_at: string;
  is_verified?: boolean;
  has_images?: boolean;
  helpful_count?: number;
}

export function ProductDetailsDialog({ open, onOpenChange, productId }: ProductDetailsDialogProps) {
  const { supabaseQuery } = useApi();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (open && productId) {
      loadProductDetails();
      loadProductReviews();
    }
  }, [open, productId]);

  const loadProductDetails = async () => {
    if (!productId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabaseQuery(
        async () => {
          const { data, error } = await supabase
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
      // Parse images from product data
      const images: string[] = [];
      if (data?.image_url) images.push(data.image_url);
      if (data?.images && Array.isArray(data.images)) {
        images.push(...data.images.filter((img: unknown): img is string => typeof img === 'string' && img !== '' && !images.includes(img as string)));
      }
      setProductImages(images);
    } catch (error) {
      toast.error('Erreur lors du chargement du produit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagesChange = useCallback(async (newImages: string[]) => {
    if (!productId || !product) return;
    
    setIsSaving(true);
    try {
      const [primaryImage, ...additionalImages] = newImages;
      
      const { error } = await (supabase as any)
        .from('products')
        .update({
          image_url: primaryImage || null,
          images: additionalImages.length > 0 ? additionalImages : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);
      
      if (error) throw error;
      
      setProductImages(newImages);
      setProduct({ ...product, image_url: primaryImage, images: additionalImages });
      toast.success('Images mises à jour');
    } catch (error) {
      console.error('Error updating images:', error);
      toast.error('Erreur lors de la mise à jour des images');
    } finally {
      setIsSaving(false);
    }
  }, [productId, product]);

  const loadProductReviews = async () => {
    if (!productId) return;

    setReviewsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setReviews(data);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const getAverageRating = (): number => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
    return parseFloat((sum / reviews.length).toFixed(1));
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      const rating = Math.round(review.rating || 0);
      if (rating >= 1 && rating <= 5) {
        distribution[rating as keyof typeof distribution]++;
      }
    });
    return distribution;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-muted text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
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
            <TabsList className="w-full grid grid-cols-6">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="media" className="gap-1">
                <Images className="h-3.5 w-3.5" />
                Médias
                {productImages.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {productImages.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pricing">Prix</TabsTrigger>
              <TabsTrigger value="reviews" className="gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                Avis
                {reviews.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {reviews.length}
                  </Badge>
                )}
              </TabsTrigger>
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
                      {format(new Date(product.created_at), 'PPP', { locale: getDateFnsLocale() })}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Dernière mise à jour</p>
                    <p className="text-sm">
                      {format(new Date(product.updated_at), 'PPP', { locale: getDateFnsLocale() })}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-4 mt-4">
              <MediaGalleryManager
                images={productImages}
                onImagesChange={handleImagesChange}
                isLoading={isSaving}
              />
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

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-4 mt-4">
              {reviewsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-lg" />
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun avis pour ce produit</p>
                </div>
              ) : (
                <>
                  {/* Rating Summary */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-yellow-600">{getAverageRating().toFixed(1)}</p>
                        <div className="flex justify-center mt-1">
                          {renderStars(getAverageRating())}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{reviews.length} avis</p>
                      </div>
                      <div className="flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map((rating) => {
                          const distribution = getRatingDistribution();
                          const count = distribution[rating as keyof typeof distribution];
                          const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                          return (
                            <div key={rating} className="flex items-center gap-2 text-sm">
                              <span className="w-3">{rating}</span>
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  className="h-full bg-yellow-400 rounded-full"
                                />
                              </div>
                              <span className="text-muted-foreground w-8 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Reviews List */}
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3 pr-4">
                      {reviews.map((review, index) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 border rounded-xl bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {renderStars(review.rating)}
                                {review.is_verified && (
                                  <Badge variant="secondary" className="text-xs gap-1">
                                    <ThumbsUp className="h-3 w-3" />
                                    Vérifié
                                  </Badge>
                                )}
                                {review.has_images && (
                                  <Badge variant="outline" className="text-xs gap-1">
                                    <ImagePlus className="h-3 w-3" />
                                    Photos
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-foreground line-clamp-3">
                                {review.content || 'Aucun commentaire'}
                              </p>
                              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {review.author_name || 'Anonyme'}
                                </span>
                                <span>
                                  {format(new Date(review.created_at), 'dd MMM yyyy', { locale: getDateFnsLocale() })}
                                </span>
                                {review.helpful_count && review.helpful_count > 0 && (
                                  <span className="flex items-center gap-1">
                                    <ThumbsUp className="h-3 w-3" />
                                    {review.helpful_count} utile{review.helpful_count > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
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
