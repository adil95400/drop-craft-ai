import { supabase } from '@/integrations/supabase/client';

export interface ScrapedProduct {
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category?: string;
  brand?: string;
  sku?: string;
  specifications?: Record<string, any>;
  variants?: any[];
}

export interface AIOptimizationOptions {
  generateSEO?: boolean;
  optimizePrice?: boolean;
  translate?: boolean;
  targetLanguages?: string[];
  generateTags?: boolean;
}

export interface OptimizedProduct {
  originalData: ScrapedProduct;
  seoTitle?: string;
  seoDescription?: string;
  optimizedDescription?: string;
  suggestedPrice?: number;
  translations?: Record<string, { title: string; description: string }>;
  tags?: string[];
  categoryRecommendations?: string[];
}

class AIScraperService {
  /**
   * Scrape intelligent d'une URL avec IA
   */
  async scrapeWithAI(url: string): Promise<{ success: boolean; products: ScrapedProduct[]; error?: string }> {
    try {
      console.log('[AIScraperService] Starting AI scraping for:', url);

      const { data, error } = await supabase.functions.invoke('ai-scraper', {
        body: { url, useAI: true }
      });

      if (error) {
        console.error('[AIScraperService] Error:', error);
        return { success: false, products: [], error: error.message };
      }

      return {
        success: true,
        products: data.products || []
      };
    } catch (error) {
      console.error('[AIScraperService] Exception:', error);
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Optimisation IA d'un produit
   */
  async optimizeProduct(
    product: ScrapedProduct,
    options: AIOptimizationOptions = {}
  ): Promise<{ success: boolean; optimized?: OptimizedProduct; error?: string }> {
    try {
      console.log('[AIScraperService] Optimizing product:', product.name);

      const { data, error } = await supabase.functions.invoke('ai-product-optimizer', {
        body: {
          product,
          options: {
            generateSEO: options.generateSEO ?? true,
            optimizePrice: options.optimizePrice ?? true,
            translate: options.translate ?? false,
            targetLanguages: options.targetLanguages ?? ['fr', 'en'],
            generateTags: options.generateTags ?? true
          }
        }
      });

      if (error) {
        console.error('[AIScraperService] Optimization error:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        optimized: data
      };
    } catch (error) {
      console.error('[AIScraperService] Optimization exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Détection automatique du type de page
   */
  async detectPageType(url: string): Promise<{
    success: boolean;
    pageType?: 'product' | 'category' | 'search' | 'homepage' | 'unknown';
    confidence?: number;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-page-detector', {
        body: { url }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        pageType: data.pageType,
        confidence: data.confidence
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extraction d'images avec OCR si nécessaire
   */
  async extractImagesWithOCR(url: string): Promise<{
    success: boolean;
    images?: Array<{ url: string; text?: string; alt?: string }>;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-image-extractor', {
        body: { url, enableOCR: true }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        images: data.images
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const aiScraperService = new AIScraperService();
