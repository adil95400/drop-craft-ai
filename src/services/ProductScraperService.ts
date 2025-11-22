/**
 * Product Scraper Service
 * Handles product data extraction from URLs using Firecrawl
 */

import { supabase } from '@/integrations/supabase/client';

export interface ScrapedProduct {
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  variants?: ProductVariant[];
  brand?: string;
  category?: string;
  sku?: string;
  supplier_name: string;
  supplier_url: string;
  stock_status?: 'in_stock' | 'out_of_stock' | 'limited_stock';
  rating?: number;
  reviews_count?: number;
  shipping_info?: string;
  specifications?: Record<string, string>;
}

export interface ProductVariant {
  name: string;
  options: Record<string, string>; // { "Color": "Red", "Size": "M" }
  price?: number;
  sku?: string;
  stock?: number;
  image?: string;
}

export interface ScrapeResult {
  success: boolean;
  product?: ScrapedProduct;
  error?: string;
  rawData?: any;
}

class ProductScraperService {
  /**
   * Detect supplier from URL
   */
  private detectSupplier(url: string): string {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('aliexpress.com')) return 'AliExpress';
    if (urlLower.includes('amazon.')) return 'Amazon';
    if (urlLower.includes('temu.com')) return 'Temu';
    if (urlLower.includes('ebay.')) return 'eBay';
    if (urlLower.includes('walmart.com')) return 'Walmart';
    if (urlLower.includes('etsy.com')) return 'Etsy';
    
    return 'Unknown Supplier';
  }

  /**
   * Validate URL format
   */
  validateUrl(url: string): { valid: boolean; error?: string } {
    try {
      const urlObj = new URL(url);
      
      // Check if it's a product URL from supported suppliers
      const supplier = this.detectSupplier(url);
      
      if (supplier === 'Unknown Supplier') {
        return {
          valid: false,
          error: 'URL non supportée. Veuillez utiliser AliExpress, Amazon, Temu, eBay, Walmart ou Etsy'
        };
      }
      
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Format d\'URL invalide'
      };
    }
  }

  /**
   * Scrape product from URL using edge function
   */
  async scrapeProductFromUrl(url: string): Promise<ScrapeResult> {
    try {
      console.log('🔍 Scraping product from URL:', url);
      
      // Validate URL first
      const validation = this.validateUrl(url);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Call edge function to scrape product
      const { data, error } = await supabase.functions.invoke('product-url-scraper', {
        body: { url }
      });

      if (error) {
        console.error('❌ Scraping error:', error);
        return {
          success: false,
          error: error.message || 'Erreur lors du scraping du produit'
        };
      }

      if (data?.success && data?.product) {
        console.log('✅ Product scraped successfully:', data.product);
        return {
          success: true,
          product: data.product,
          rawData: data.rawData
        };
      }

      return {
        success: false,
        error: data?.error || 'Impossible d\'extraire les données du produit'
      };
    } catch (error) {
      console.error('❌ Unexpected error during scraping:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inattendue'
      };
    }
  }

  /**
   * Import scraped product to catalog
   */
  async importProductToCatalog(
    product: ScrapedProduct,
    userId: string,
    customizations?: Partial<ScrapedProduct>
  ): Promise<{ success: boolean; productId?: string; error?: string }> {
    try {
      // Merge customizations
      const finalProduct = {
        ...product,
        ...customizations
      };

      // Prepare product data for database
      const productData = {
        user_id: userId,
        name: finalProduct.name,
        description: finalProduct.description,
        price: finalProduct.price,
        currency: finalProduct.currency,
        sku: finalProduct.sku || `URL-${Date.now()}`,
        category: finalProduct.category || 'Import URL',
        brand: finalProduct.brand || '',
        images: finalProduct.images || [],
        image_url: finalProduct.images?.[0] || '',
        stock_quantity: 0, // Will be synced with supplier
        status: 'draft' as const,
        review_status: 'pending' as const,
        source_url: finalProduct.supplier_url,
        supplier_name: finalProduct.supplier_name,
        supplier_info: {
          supplier_name: finalProduct.supplier_name,
          supplier_url: finalProduct.supplier_url,
          stock_status: finalProduct.stock_status,
          rating: finalProduct.rating,
          reviews_count: finalProduct.reviews_count,
          shipping_info: finalProduct.shipping_info,
          specifications: finalProduct.specifications,
          scraped_at: new Date().toISOString()
        },
        variants: finalProduct.variants || [],
        metadata: {
          import_method: 'url',
          import_date: new Date().toISOString(),
          original_data: product
        }
      };

      // Insert into database
      const { data, error } = await supabase
        .from('imported_products')
        .insert(productData)
        .select()
        .single();

      if (error) {
        console.error('❌ Database insertion error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Product imported to catalog:', data.id);

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'product_import_url',
        description: `Produit importé depuis URL: ${finalProduct.name}`,
        metadata: {
          product_id: data.id,
          supplier: finalProduct.supplier_name,
          source_url: finalProduct.supplier_url
        }
      });

      return {
        success: true,
        productId: data.id
      };
    } catch (error) {
      console.error('❌ Import error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'import'
      };
    }
  }

  /**
   * Batch import multiple URLs
   */
  async importMultipleUrls(
    urls: string[],
    userId: string
  ): Promise<{
    success: number;
    failed: number;
    results: Array<{ url: string; success: boolean; productId?: string; error?: string }>;
  }> {
    const results = [];
    let successCount = 0;
    let failedCount = 0;

    for (const url of urls) {
      try {
        const scrapeResult = await this.scrapeProductFromUrl(url);
        
        if (scrapeResult.success && scrapeResult.product) {
          const importResult = await this.importProductToCatalog(
            scrapeResult.product,
            userId
          );
          
          if (importResult.success) {
            successCount++;
            results.push({
              url,
              success: true,
              productId: importResult.productId
            });
          } else {
            failedCount++;
            results.push({
              url,
              success: false,
              error: importResult.error
            });
          }
        } else {
          failedCount++;
          results.push({
            url,
            success: false,
            error: scrapeResult.error
          });
        }
      } catch (error) {
        failedCount++;
        results.push({
          url,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      results
    };
  }
}

export const productScraperService = new ProductScraperService();
