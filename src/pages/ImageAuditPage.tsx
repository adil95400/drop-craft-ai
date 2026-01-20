import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Image, ImagePlus, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { ImageEnrichmentModal } from '@/components/products/ImageEnrichmentModal';

interface ProductWithImageCount {
  id: string;
  title: string;
  image_url: string | null;
  images: string[];
  supplier_url: string | null;
  imageCount: number;
}

interface ImageStats {
  total: number;
  noImages: number;
  oneImage: number;
  twoImages: number;
  threeOrMore: number;
}

export default function ImageAuditPage() {
  const { user } = useUnifiedAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductWithImageCount[]>([]);
  const [stats, setStats] = useState<ImageStats>({ total: 0, noImages: 0, oneImage: 0, twoImages: 0, threeOrMore: 0 });
  const [filter, setFilter] = useState<'all' | '0' | '1' | '2' | '3+'>('1');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [enrichmentModal, setEnrichmentModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });

  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user]);

  const loadProducts = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Fetch all products with image data
      const { data: productsData, error } = await supabase
        .from('products')
        .select('id, title, image_url, images, supplier_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Also fetch imported_products (using correct column names)
      const { data: importedData } = await supabase
        .from('imported_products')
        .select('id, name, image_urls, source_url')
        .eq('user_id', user.id);

      // Combine and calculate image counts
      const allProducts: ProductWithImageCount[] = [];
      
      // Process main products
      (productsData || []).forEach(p => {
        const rawImages = p.images as unknown;
        const imagesArray = Array.isArray(rawImages) 
          ? (rawImages as string[]).filter((img): img is string => typeof img === 'string' && Boolean(img)) 
          : [];
        const hasMainImage = p.image_url ? 1 : 0;
        const imageCount = hasMainImage + imagesArray.length;
        
        allProducts.push({
          id: p.id,
          title: p.title || 'Sans titre',
          image_url: p.image_url,
          images: imagesArray,
          supplier_url: p.supplier_url,
          imageCount
        });
      });

      // Process imported products
      (importedData || []).forEach(p => {
        const rawImages = p.image_urls as unknown;
        const imagesArray = Array.isArray(rawImages) 
          ? (rawImages as string[]).filter((img): img is string => typeof img === 'string' && Boolean(img)) 
          : [];
        const imageCount = imagesArray.length;
        
        allProducts.push({
          id: p.id,
          title: p.name || 'Sans titre',
          image_url: imagesArray[0] || null,
          images: imagesArray.slice(1),
          supplier_url: p.source_url,
          imageCount
        });
      });

      // Calculate stats
      const newStats: ImageStats = {
        total: allProducts.length,
        noImages: allProducts.filter(p => p.imageCount === 0).length,
        oneImage: allProducts.filter(p => p.imageCount === 1).length,
        twoImages: allProducts.filter(p => p.imageCount === 2).length,
        threeOrMore: allProducts.filter(p => p.imageCount >= 3).length
      };

      setProducts(allProducts);
      setStats(newStats);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les produits',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    switch (filter) {
      case '0': return p.imageCount === 0;
      case '1': return p.imageCount === 1;
      case '2': return p.imageCount === 2;
      case '3+': return p.imageCount >= 3;
      default: return true;
    }
  });

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleEnrichment = async (method: 'scrape' | 'ai' | 'search') => {
    if (selectedProducts.length === 0) return;
    
    setProcessing(true);
    setProcessProgress({ current: 0, total: selectedProducts.length, success: 0, failed: 0 });
    setEnrichmentModal(false);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < selectedProducts.length; i++) {
      const productId = selectedProducts[i];
      const product = products.find(p => p.id === productId);
      
      try {
        const { data, error } = await supabase.functions.invoke('enrich-product-images', {
          body: { 
            productId, 
            method,
            sourceUrl: product?.supplier_url,
            existingImageUrl: product?.image_url,
            productTitle: product?.title
          }
        });

        if (error) throw error;
        success++;
      } catch (error) {
        console.error(`Failed to enrich product ${productId}:`, error);
        failed++;
      }

      setProcessProgress({ current: i + 1, total: selectedProducts.length, success, failed });
    }

    toast({
      title: 'Enrichissement terminé',
      description: `${success} produits enrichis, ${failed} échecs`,
      variant: success > 0 ? 'default' : 'destructive'
    });

    setProcessing(false);
    setSelectedProducts([]);
    loadProducts();
  };

  const getImageBadge = (count: number) => {
    if (count === 0) return <Badge variant="destructive">0 image</Badge>;
    if (count === 1) return <Badge variant="secondary" className="bg-orange-500/20 text-orange-600">1 image</Badge>;
    if (count === 2) return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">2 images</Badge>;
    return <Badge variant="secondary" className="bg-green-500/20 text-green-600">{count} images</Badge>;
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/products')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Audit des Images</h1>
          <p className="text-muted-foreground">Identifiez et enrichissez les produits avec peu d'images</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:border-primary" onClick={() => setFilter('all')}>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary border-destructive/50" onClick={() => setFilter('0')}>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-destructive">{stats.noImages}</div>
            <div className="text-sm text-muted-foreground">0 image</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary border-orange-500/50" onClick={() => setFilter('1')}>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-500">{stats.oneImage}</div>
            <div className="text-sm text-muted-foreground">1 image</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary border-yellow-500/50" onClick={() => setFilter('2')}>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-yellow-500">{stats.twoImages}</div>
            <div className="text-sm text-muted-foreground">2 images</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary border-green-500/50" onClick={() => setFilter('3+')}>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-500">{stats.threeOrMore}</div>
            <div className="text-sm text-muted-foreground">3+ images</div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Progress */}
      {processing && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4 mb-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Enrichissement en cours... {processProgress.current}/{processProgress.total}</span>
            </div>
            <Progress value={(processProgress.current / processProgress.total) * 100} />
            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-green-500 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" /> {processProgress.success} réussis
              </span>
              <span className="text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> {processProgress.failed} échecs
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-4">
        <Button 
          onClick={() => setEnrichmentModal(true)} 
          disabled={selectedProducts.length === 0 || processing}
        >
          <ImagePlus className="h-4 w-4 mr-2" />
          Enrichir {selectedProducts.length > 0 ? `(${selectedProducts.length})` : ''}
        </Button>
        <Button variant="outline" onClick={loadProducts} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
        {filteredProducts.length > 0 && (
          <Button variant="ghost" onClick={toggleSelectAll}>
            {selectedProducts.length === filteredProducts.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </Button>
        )}
      </div>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Produits ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Aucun produit dans cette catégorie</div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredProducts.slice(0, 100).map(product => (
                <div 
                  key={product.id}
                  className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleProduct(product.id)}
                >
                  <Checkbox 
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={() => toggleProduct(product.id)}
                  />
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{product.title}</div>
                    {product.supplier_url && (
                      <div className="text-xs text-muted-foreground truncate">{product.supplier_url}</div>
                    )}
                  </div>
                  {getImageBadge(product.imageCount)}
                </div>
              ))}
              {filteredProducts.length > 100 && (
                <div className="text-center py-4 text-muted-foreground">
                  + {filteredProducts.length - 100} autres produits
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrichment Modal */}
      <ImageEnrichmentModal
        open={enrichmentModal}
        onClose={() => setEnrichmentModal(false)}
        onEnrich={handleEnrichment}
        selectedCount={selectedProducts.length}
        hasSourceUrls={products.filter(p => selectedProducts.includes(p.id) && p.supplier_url).length}
      />
    </div>
  );
}
