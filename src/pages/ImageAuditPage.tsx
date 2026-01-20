import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ImagePlus, RefreshCw, Image } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { ImageEnrichmentModal } from '@/components/products/ImageEnrichmentModal';
import { ImageAuditStats, ImageStats } from '@/components/products/ImageAuditStats';
import { ImageAuditProductList, ProductWithImageCount } from '@/components/products/ImageAuditProductList';
import { ImageAuditProgress } from '@/components/products/ImageAuditProgress';
import { AnimatePresence } from 'framer-motion';

export default function ImageAuditPage() {
  const { user } = useUnifiedAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductWithImageCount[]>([]);
  const [stats, setStats] = useState<ImageStats>({ total: 0, noImages: 0, oneImage: 0, twoImages: 0, threeOrMore: 0 });
  const [filter, setFilter] = useState<'all' | '0' | '1' | '2' | '3+'>('1');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [enrichmentModal, setEnrichmentModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  const loadProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Fetch products and imported_products in parallel
      const [productsResult, importedResult] = await Promise.all([
        supabase
          .from('products')
          .select('id, title, image_url, images, supplier_url')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('imported_products')
          .select('id, name, image_urls, source_url')
          .eq('user_id', user.id)
      ]);

      if (productsResult.error) throw productsResult.error;

      const allProducts: ProductWithImageCount[] = [];
      
      // Process main products
      (productsResult.data || []).forEach(p => {
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
      (importedResult.data || []).forEach(p => {
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
  }, [user, toast]);

  useEffect(() => {
    if (user) loadProducts();
  }, [user, loadProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      switch (filter) {
        case '0': return p.imageCount === 0;
        case '1': return p.imageCount === 1;
        case '2': return p.imageCount === 2;
        case '3+': return p.imageCount >= 3;
        default: return true;
      }
    });
  }, [products, filter]);

  const toggleSelectAll = useCallback(() => {
    const displayedIds = filteredProducts.slice(0, 200).map(p => p.id);
    if (displayedIds.every(id => selectedProducts.includes(id))) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(displayedIds);
    }
  }, [filteredProducts, selectedProducts]);

  const toggleProduct = useCallback((id: string) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }, []);

  const handleEnrichment = async (method: 'scrape' | 'ai' | 'search' | 'multi-search') => {
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
        if (data?.success) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Failed to enrich product ${productId}:`, error);
        failed++;
      }

      setProcessProgress({ current: i + 1, total: selectedProducts.length, success, failed });
      
      // Rate limiting delay
      if (i < selectedProducts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
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

  const selectedWithUrls = useMemo(() => 
    products.filter(p => selectedProducts.includes(p.id) && p.supplier_url).length,
    [products, selectedProducts]
  );

  return (
    <ChannablePageWrapper
      title="Audit des Images"
      subtitle="Qualité Produits"
      description="Identifiez les produits avec peu d'images et enrichissez-les automatiquement via Firecrawl ou génération IA"
      heroImage="products"
      badge={{ label: `${stats.noImages + stats.oneImage} à enrichir`, icon: Image }}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => setEnrichmentModal(true)} 
            disabled={selectedProducts.length === 0 || processing}
            size="lg"
          >
            <ImagePlus className="h-4 w-4 mr-2" />
            Enrichir {selectedProducts.length > 0 ? `(${selectedProducts.length})` : ''}
          </Button>
          <Button variant="outline" onClick={loadProducts} disabled={loading} size="lg">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <ImageAuditStats 
          stats={stats} 
          activeFilter={filter} 
          onFilterChange={setFilter} 
        />

        {/* Processing Progress */}
        <AnimatePresence>
          <ImageAuditProgress progress={processProgress} isProcessing={processing} />
        </AnimatePresence>

        {/* Products List */}
        <ImageAuditProductList
          products={filteredProducts}
          selectedProducts={selectedProducts}
          onToggleProduct={toggleProduct}
          onToggleAll={toggleSelectAll}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          loading={loading}
        />
      </div>

      {/* Enrichment Modal */}
      <ImageEnrichmentModal
        open={enrichmentModal}
        onClose={() => setEnrichmentModal(false)}
        onEnrich={handleEnrichment}
        selectedCount={selectedProducts.length}
        hasSourceUrls={selectedWithUrls}
      />
    </ChannablePageWrapper>
  );
}
