import { supabase } from '@/integrations/supabase/client';

interface FirecrawlScrapeResult {
  success: boolean;
  data?: {
    markdown: string;
    html: string;
    metadata: {
      title: string;
      description: string;
      sourceURL: string;
    };
    linksOnPage: string[];
    screenshot: string;
  };
  error?: string;
}

interface CrawlStatusResponse {
  success: true;
  status: string;
  completed: number;
  total: number;
  creditsUsed: number;
  expiresAt: string;
  data: any[];
}

interface ErrorResponse {
  success: false;
  error: string;
}

type CrawlResponse = CrawlStatusResponse | ErrorResponse;

export class FirecrawlService {
  
  static async scrapeUrl(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      console.log('Starting Firecrawl scraping for URL:', url);
      
      const { data, error } = await supabase.functions.invoke('url-scraper', {
        body: { 
          url, 
          config: {
            extract_images: true,
            analyze_seo: true,
            generate_variants: true,
            price_tracking: true
          }
        }
      });

      if (error) {
        console.error('Firecrawl scraping error:', error);
        return { success: false, error: error.message || 'Failed to scrape URL' };
      }

      console.log('Firecrawl scraping successful:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error during Firecrawl scraping:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to scraping service' 
      };
    }
  }

  static async crawlWebsite(baseUrl: string, options?: {
    limit?: number;
    allowBackwardCrawling?: boolean;
    allowExternalContentLinks?: boolean;
    excludePaths?: string[];
    includePaths?: string[];
  }): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      console.log('Starting website crawl for:', baseUrl, options);
      
      // For now, we'll use the single URL scraper and simulate crawling
      // In a real implementation, you'd use Firecrawl's crawl endpoint
      const result = await this.scrapeUrl(baseUrl);
      
      if (!result.success) {
        return result;
      }

      // Simulate crawling multiple pages
      const crawlData = {
        status: 'completed',
        completed: 1,
        total: 1,
        creditsUsed: 1,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        data: [result.data]
      };

      return { success: true, data: crawlData };
    } catch (error) {
      console.error('Error during website crawl:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to crawl website' 
      };
    }
  }

  static async extractProductsFromUrl(url: string): Promise<{ success: boolean; products?: any[]; error?: string }> {
    try {
      const result = await this.scrapeUrl(url);
      
      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Extract products from the scraped data
      const products = result.data?.products || [];
      
      return {
        success: true,
        products: products.map((product: any) => ({
          name: product.name || 'Produit extrait',
          description: product.description || '',
          price: product.price || 0,
          currency: product.currency || 'EUR',
          image_urls: product.image_urls || [],
          category: product.category || 'Divers',
          sku: product.sku || `SCRAPED-${Date.now()}`,
          supplier_name: product.supplier_name || new URL(url).hostname.replace('www.', ''),
          supplier_url: url,
          tags: [...(product.tags || []), 'firecrawl', 'scraped']
        }))
      };
    } catch (error) {
      console.error('Error extracting products:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to extract products' 
      };
    }
  }
}