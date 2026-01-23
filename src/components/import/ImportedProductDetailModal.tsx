import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Package, 
  Image, 
  Palette, 
  Star, 
  ExternalLink, 
  Edit, 
  Trash2, 
  Upload,
  RefreshCw,
  Copy
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImportedProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
}

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price?: number | null;
  sku?: string | null;
  status: string | null;
  source_url?: string | null;
  source_platform?: string | null;
  image_urls?: string[] | null;
  created_at: string;
}

interface Variant {
  id: string;
  name: string;
  price: number;
  sku?: string | null;
  stock_quantity: number;
  option1_value?: string | null;
  option2_value?: string | null;
  option3_value?: string | null;
}

interface Review {
  id: string;
  author_name: string | null;
  rating: number;
  content: string | null;
  review_date: string | null;
  is_verified: boolean | null;
  images?: string[] | null;
}

export function ImportedProductDetailModal({ 
  isOpen, 
  onClose, 
  productId 
}: ImportedProductDetailModalProps) {
  const [activeTab, setActiveTab] = useState("info");

  // Fetch product details
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['imported-product-detail', productId],
    queryFn: async () => {
      if (!productId) return null;
      
      const { data, error } = await supabase
        .from('imported_products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (error) throw error;
      return data as unknown as ProductData;
    },
    enabled: !!productId && isOpen
  });

  // Fetch variants
  const { data: variants = [] } = useQuery({
    queryKey: ['product-variants-detail', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return (data || []) as unknown as Variant[];
    },
    enabled: !!productId && isOpen
  });

  // Fetch reviews - using products table reference if product_reviews doesn't exist
  const { data: reviews = [] } = useQuery({
    queryKey: ['product-reviews-detail', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      try {
        // Try to fetch from product_reviews table
        const { data, error } = await supabase
          .from('products')
          .select('id')
          .eq('id', productId)
          .limit(1);
        
        // For now, return empty array if reviews table doesn't exist
        // The actual reviews would need proper table setup
        return [] as Review[];
      } catch {
        return [] as Review[];
      }
    },
    enabled: !!productId && isOpen
  });

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papiers");
  };

  const handlePublish = async () => {
    toast.info("Publication en cours...");
    // TODO: Implement publish to store
  };

  const handleSync = async () => {
    toast.info("Synchronisation en cours...");
    // TODO: Implement re-sync from source
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      const rating = Math.round(review.rating);
      if (rating >= 1 && rating <= 5) {
        distribution[rating as keyof typeof distribution]++;
      }
    });
    return distribution;
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  if (productLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!product) return null;

  const images = product.image_urls || [];
  const productTitle = product.name || 'Produit sans nom';
  const productPrice = product.price || 0;
  const productDescription = product.description || '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold truncate">
                {productTitle}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={product.status === 'published' ? 'default' : 'secondary'}>
                  {product.status === 'published' ? 'Publié' : product.status === 'draft' ? 'Brouillon' : product.status || 'Brouillon'}
                </Badge>
                {product.source_platform && (
                  <Badge variant="outline">{product.source_platform}</Badge>
                )}
                {variants.length > 0 && (
                  <Badge variant="outline">{variants.length} variantes</Badge>
                )}
                {reviews.length > 0 && (
                  <Badge variant="outline">{reviews.length} avis</Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={handleSync}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Sync
              </Button>
              <Button size="sm" onClick={handlePublish}>
                <Upload className="h-4 w-4 mr-1" />
                Publier
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-4 w-full flex-shrink-0">
            <TabsTrigger value="info" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Infos</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Médias</span>
              {images.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{images.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="variants" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Variantes</span>
              {variants.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{variants.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Avis</span>
              {reviews.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{reviews.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            {/* Info Tab */}
            <TabsContent value="info" className="mt-0 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Prix</label>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold">{productPrice.toFixed(2)} €</span>
                      {product.compare_at_price && product.compare_at_price > productPrice && (
                        <span className="text-lg text-muted-foreground line-through">
                          {product.compare_at_price.toFixed(2)} €
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {product.sku && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">SKU</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-muted px-2 py-1 rounded text-sm">{product.sku}</code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => handleCopyToClipboard(product.sku!)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {product.source_url && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Source</label>
                      <div className="mt-1">
                        <a 
                          href={product.source_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm flex items-center gap-1"
                        >
                          Voir la source
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date d'import</label>
                    <p className="mt-1 text-sm">
                      {new Date(product.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <div 
                    className="mt-2 prose prose-sm max-w-none text-muted-foreground max-h-48 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: productDescription || '<em>Aucune description</em>' }}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="mt-0">
              {images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((img, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-square rounded-lg overflow-hidden border bg-muted group"
                    >
                      <img 
                        src={img} 
                        alt={`Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {index === 0 && (
                        <Badge className="absolute top-2 left-2" variant="default">
                          Principale
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune image importée</p>
                </div>
              )}
            </TabsContent>

            {/* Variants Tab */}
            <TabsContent value="variants" className="mt-0">
              {variants.length > 0 ? (
                <div className="space-y-3">
                  {variants.map((variant) => (
                    <div 
                      key={variant.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-card"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{variant.name}</p>
                          <div className="flex gap-2 mt-1">
                            {variant.option1_value && (
                              <Badge variant="outline" className="text-xs">{variant.option1_value}</Badge>
                            )}
                            {variant.option2_value && (
                              <Badge variant="outline" className="text-xs">{variant.option2_value}</Badge>
                            )}
                            {variant.option3_value && (
                              <Badge variant="outline" className="text-xs">{variant.option3_value}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-right">
                          <p className="font-medium">{variant.price?.toFixed(2)} €</p>
                          {variant.sku && (
                            <p className="text-muted-foreground text-xs">SKU: {variant.sku}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={variant.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                            {variant.stock_quantity} en stock
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune variante importée</p>
                </div>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="mt-0">
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {/* Rating summary */}
                  <div className="flex items-center gap-6 p-4 border rounded-lg bg-card">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
                      <div className="flex mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`h-4 w-4 ${star <= Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{reviews.length} avis</p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = getRatingDistribution()[rating as keyof ReturnType<typeof getRatingDistribution>];
                        const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={rating} className="flex items-center gap-2">
                            <span className="text-xs w-3">{rating}</span>
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-yellow-400 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-8">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Reviews list */}
                  <div className="space-y-4">
                    {reviews.slice(0, 10).map((review) => (
                      <div key={review.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">{review.author_name || 'Anonyme'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star}
                                    className={`h-3 w-3 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                                  />
                                ))}
                              </div>
                              {review.is_verified && (
                                <Badge variant="secondary" className="text-xs">Vérifié</Badge>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {review.review_date ? new Date(review.review_date).toLocaleDateString('fr-FR') : '-'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.content}</p>
                        {review.images && review.images.length > 0 && (
                          <div className="flex gap-2 mt-3">
                            {review.images.slice(0, 4).map((img, i) => (
                              <img 
                                key={i}
                                src={img}
                                alt={`Review image ${i + 1}`}
                                className="w-16 h-16 object-cover rounded border"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {reviews.length > 10 && (
                    <p className="text-center text-sm text-muted-foreground">
                      + {reviews.length - 10} autres avis
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun avis importé</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
