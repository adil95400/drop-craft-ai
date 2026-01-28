/**
 * ShopOpti+ Extractor Interface v5.7.0
 * Base class defining the contract for all platform extractors
 * All extractors MUST implement this interface for pipeline compatibility
 */

(function() {
  'use strict';

  if (window.__shopoptiExtractorInterfaceLoaded) return;
  window.__shopoptiExtractorInterfaceLoaded = true;

  /**
   * Required fields for a valid product extraction
   */
  const REQUIRED_FIELDS = ['title', 'price'];

  /**
   * Optional fields that improve product quality score
   */
  const OPTIONAL_FIELDS = [
    'description', 'brand', 'sku', 'images', 'videos', 
    'variants', 'reviews', 'specifications', 'category',
    'stock', 'shipping', 'originalPrice', 'currency'
  ];

  /**
   * Base Extractor Interface
   * All platform-specific extractors should extend this class
   */
  class BaseExtractor {
    constructor() {
      this.platform = 'generic';
      this.version = '5.7.0';
      this.extractionStartTime = null;
    }

    /**
     * Main extraction method - MUST be implemented
     * @returns {Promise<ProductData>}
     */
    async extractComplete() {
      this.extractionStartTime = Date.now();
      
      // Parallel extraction of all data points
      const [
        basicInfo,
        pricing,
        images,
        videos,
        variants,
        reviews,
        specifications,
        stockInfo,
        shippingInfo
      ] = await Promise.allSettled([
        this.extractBasicInfo(),
        this.extractPricing(),
        this.extractImages(),
        this.extractVideos(),
        this.extractVariants(),
        this.extractReviews(),
        this.extractSpecifications(),
        this.extractStock(),
        this.extractShipping()
      ]);

      // Build product data with settled results
      const productData = {
        // Metadata
        external_id: this.extractProductId(),
        url: window.location.href,
        platform: this.platform,
        extractedAt: new Date().toISOString(),
        extractionTime: Date.now() - this.extractionStartTime,
        
        // Basic info
        ...(basicInfo.status === 'fulfilled' ? basicInfo.value : {}),
        
        // Pricing
        ...(pricing.status === 'fulfilled' ? pricing.value : { price: 0, currency: 'EUR' }),
        
        // Media
        images: images.status === 'fulfilled' ? images.value : [],
        videos: videos.status === 'fulfilled' ? videos.value : [],
        
        // Product details
        variants: variants.status === 'fulfilled' ? variants.value : [],
        reviews: reviews.status === 'fulfilled' ? reviews.value : [],
        specifications: specifications.status === 'fulfilled' ? specifications.value : {},
        
        // Availability
        ...(stockInfo.status === 'fulfilled' ? stockInfo.value : {}),
        ...(shippingInfo.status === 'fulfilled' ? shippingInfo.value : {}),
        
        // Extraction metadata
        _extractionMeta: {
          platform: this.platform,
          version: this.version,
          errors: this.collectErrors([
            basicInfo, pricing, images, videos, 
            variants, reviews, specifications, stockInfo, shippingInfo
          ])
        }
      };

      // Log extraction summary
      console.log(`[${this.platform} Extractor] Extraction complete:`, {
        title: productData.title?.substring(0, 50),
        price: productData.price,
        images: productData.images?.length || 0,
        videos: productData.videos?.length || 0,
        variants: productData.variants?.length || 0,
        reviews: productData.reviews?.length || 0,
        errors: productData._extractionMeta.errors.length
      });

      return productData;
    }

    /**
     * Collect errors from settled promises
     */
    collectErrors(results) {
      const errors = [];
      const fieldNames = ['basicInfo', 'pricing', 'images', 'videos', 'variants', 'reviews', 'specifications', 'stock', 'shipping'];
      
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          errors.push({
            field: fieldNames[index],
            error: result.reason?.message || 'Unknown error'
          });
        }
      });
      
      return errors;
    }

    // ==================== Methods to implement ====================

    /**
     * Extract product ID from URL or page
     * @returns {string|null}
     */
    extractProductId() {
      throw new Error('extractProductId() must be implemented');
    }

    /**
     * Extract basic product info (title, description, brand, sku)
     * @returns {Promise<{title: string, description?: string, brand?: string, sku?: string}>}
     */
    async extractBasicInfo() {
      throw new Error('extractBasicInfo() must be implemented');
    }

    /**
     * Extract pricing information
     * @returns {Promise<{price: number, originalPrice?: number, currency: string}>}
     */
    async extractPricing() {
      throw new Error('extractPricing() must be implemented');
    }

    /**
     * Extract product images
     * @returns {Promise<string[]>}
     */
    async extractImages() {
      return [];
    }

    /**
     * Extract product videos
     * @returns {Promise<Array<{url: string, type: string}>>}
     */
    async extractVideos() {
      return [];
    }

    /**
     * Extract product variants
     * @returns {Promise<Array<{id: string, title: string, price?: number, available?: boolean}>>}
     */
    async extractVariants() {
      return [];
    }

    /**
     * Extract product reviews
     * @returns {Promise<Array<{author?: string, rating: number, content: string, date?: string}>>}
     */
    async extractReviews() {
      return [];
    }

    /**
     * Extract product specifications
     * @returns {Promise<Record<string, string>>}
     */
    async extractSpecifications() {
      return {};
    }

    /**
     * Extract stock information
     * @returns {Promise<{inStock?: boolean, stockQuantity?: number, stockStatus?: string}>}
     */
    async extractStock() {
      return { inStock: true };
    }

    /**
     * Extract shipping information
     * @returns {Promise<{freeShipping?: boolean, shippingCost?: number, deliveryTime?: string}>}
     */
    async extractShipping() {
      return {};
    }

    // ==================== Utility methods ====================

    /**
     * Clean text by removing extra whitespace
     */
    cleanText(text) {
      if (!text) return '';
      return text.replace(/\s+/g, ' ').trim();
    }

    /**
     * Parse price from string
     */
    parsePrice(priceStr) {
      if (!priceStr || typeof priceStr !== 'string') return 0;
      
      let clean = priceStr
        .replace(/[€$£¥₹₽CHF\s]/gi, '')
        .replace(/EUR|USD|GBP/gi, '')
        .trim();
      
      // European format: 1.234,56 -> 1234.56
      if (/^\d{1,3}([\s.]\d{3})*,\d{2}$/.test(clean)) {
        clean = clean.replace(/[\s.]/g, '').replace(',', '.');
      } else if (clean.includes(',') && !clean.includes('.')) {
        clean = clean.replace(',', '.');
      } else if (clean.includes(',') && clean.includes('.')) {
        clean = clean.replace(/\./g, '').replace(',', '.');
      }
      
      return parseFloat(clean) || 0;
    }

    /**
     * Detect currency from page
     */
    detectCurrency() {
      const currencyEl = document.querySelector('[itemprop="priceCurrency"], [data-currency]');
      if (currencyEl) {
        return currencyEl.getAttribute('content') || currencyEl.getAttribute('data-currency') || 'EUR';
      }
      
      // Domain-based detection
      const hostname = window.location.hostname;
      if (hostname.includes('.com') && !hostname.includes('.co.')) return 'USD';
      if (hostname.includes('.co.uk')) return 'GBP';
      if (hostname.includes('.fr') || hostname.includes('.de') || hostname.includes('.es') || hostname.includes('.it')) return 'EUR';
      
      return 'EUR';
    }

    /**
     * Extract data from JSON-LD scripts
     */
    extractFromJsonLD() {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          const items = Array.isArray(data) ? data : [data];
          
          for (const item of items) {
            if (item['@type'] === 'Product') {
              return item;
            }
          }
        } catch (e) {}
      }
      
      return null;
    }

    /**
     * Normalize image URL
     */
    normalizeImageUrl(src) {
      if (!src) return null;
      
      // Ensure HTTPS
      if (src.startsWith('//')) src = 'https:' + src;
      
      // Remove query params for deduplication
      src = src.split('?')[0];
      
      return src;
    }

    /**
     * Filter and deduplicate images
     */
    filterImages(images, options = {}) {
      const minWidth = options.minWidth || 100;
      const maxCount = options.maxCount || 30;
      const seen = new Set();
      
      return images
        .filter(img => {
          if (!img || !img.includes('http')) return false;
          if (img.includes('placeholder') || img.includes('loading') || img.includes('icon')) return false;
          if (img.includes('1x1') || img.includes('pixel')) return false;
          
          // Deduplicate
          const key = this.getImageKey(img);
          if (seen.has(key)) return false;
          seen.add(key);
          
          return true;
        })
        .slice(0, maxCount);
    }

    /**
     * Get unique key for image deduplication
     */
    getImageKey(url) {
      // Extract the main identifier from URL
      const match = url.match(/\/([^\/]+)\.(jpg|png|webp|gif)/i);
      return match ? match[1] : url;
    }
  }

  // Export
  window.BaseExtractor = BaseExtractor;
  window.EXTRACTOR_REQUIRED_FIELDS = REQUIRED_FIELDS;
  window.EXTRACTOR_OPTIONAL_FIELDS = OPTIONAL_FIELDS;

  console.log('[ShopOpti+] BaseExtractor interface v5.7.0 loaded');

})();
