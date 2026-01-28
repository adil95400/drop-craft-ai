/**
 * ShopOpti+ Supplier Detection Engine v5.7.0
 * Intelligently identifies alternative suppliers for products
 * Uses image matching, title analysis, and cross-platform search
 */

(function() {
  'use strict';

  if (window.__shopoptiSupplierDetectionLoaded) return;
  window.__shopoptiSupplierDetectionLoaded = true;

  /**
   * Supplier platforms with their characteristics
   */
  const SUPPLIER_PLATFORMS = {
    aliexpress: {
      name: 'AliExpress',
      tier: 1,
      avgShipping: { min: 7, max: 30 },
      moq: 1,
      priceLevel: 'low',
      reliability: 0.75,
      searchUrl: 'https://www.aliexpress.com/wholesale?SearchText='
    },
    '1688': {
      name: '1688',
      tier: 1,
      avgShipping: { min: 15, max: 45 },
      moq: 5,
      priceLevel: 'lowest',
      reliability: 0.7,
      searchUrl: 'https://s.1688.com/selloffer/offer_search.htm?keywords='
    },
    cj: {
      name: 'CJ Dropshipping',
      tier: 2,
      avgShipping: { min: 5, max: 15 },
      moq: 1,
      priceLevel: 'medium',
      reliability: 0.85,
      searchUrl: 'https://cjdropshipping.com/search.html?q='
    },
    banggood: {
      name: 'Banggood',
      tier: 2,
      avgShipping: { min: 10, max: 25 },
      moq: 1,
      priceLevel: 'low',
      reliability: 0.8,
      searchUrl: 'https://www.banggood.com/search/'
    },
    dhgate: {
      name: 'DHgate',
      tier: 2,
      avgShipping: { min: 10, max: 35 },
      moq: 2,
      priceLevel: 'low',
      reliability: 0.72,
      searchUrl: 'https://www.dhgate.com/wholesale/search.do?searchkey='
    },
    alibaba: {
      name: 'Alibaba',
      tier: 3,
      avgShipping: { min: 20, max: 60 },
      moq: 50,
      priceLevel: 'wholesale',
      reliability: 0.9,
      searchUrl: 'https://www.alibaba.com/trade/search?SearchText='
    }
  };

  /**
   * Category mappings for intelligent matching
   */
  const CATEGORY_KEYWORDS = {
    electronics: ['phone', 'case', 'charger', 'cable', 'headphone', 'earphone', 'bluetooth', 'usb', 'led', 'lamp', 'battery', 'speaker', 'watch', 'smart'],
    fashion: ['dress', 'shirt', 'pants', 'shoes', 'bag', 'jacket', 'sweater', 'blouse', 'skirt', 'jeans', 'sneaker', 'boots', 'wallet', 'hat'],
    home: ['pillow', 'blanket', 'curtain', 'rug', 'mat', 'storage', 'organizer', 'kitchen', 'bathroom', 'decor', 'furniture', 'bedding'],
    beauty: ['makeup', 'cosmetic', 'brush', 'cream', 'serum', 'lipstick', 'mascara', 'perfume', 'skincare', 'nail', 'hair'],
    toys: ['toy', 'game', 'puzzle', 'doll', 'plush', 'building', 'block', 'rc', 'drone', 'kids', 'children'],
    sports: ['fitness', 'yoga', 'gym', 'sport', 'outdoor', 'camping', 'hiking', 'cycling', 'running', 'swimming'],
    pet: ['dog', 'cat', 'pet', 'collar', 'leash', 'bowl', 'cage', 'aquarium', 'bird', 'hamster'],
    automotive: ['car', 'auto', 'vehicle', 'tire', 'gps', 'dash', 'cam', 'accessories', 'motor', 'bike']
  };

  class SupplierDetectionEngine {
    constructor() {
      this.cache = new Map();
      this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
    }

    /**
     * Detect potential suppliers for a product
     * @param {Object} product - Product data
     * @param {Object} options - Detection options
     * @returns {Promise<SupplierResult[]>}
     */
    async detectSuppliers(product, options = {}) {
      const cacheKey = this.getCacheKey(product);
      
      // Check cache
      if (!options.bypassCache && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          console.log('[SupplierDetection] Returning cached results');
          return cached.results;
        }
      }

      console.log('[SupplierDetection] Starting detection for:', product.name?.substring(0, 50));

      try {
        // Extract search parameters
        const searchParams = this.extractSearchParams(product);
        
        // Determine relevant platforms
        const platforms = this.selectPlatforms(product, options);
        
        // Search suppliers in parallel
        const results = await this.searchSuppliers(searchParams, platforms, options);
        
        // Score and rank results
        const rankedResults = this.rankSuppliers(results, product);
        
        // Cache results
        this.cache.set(cacheKey, {
          results: rankedResults,
          timestamp: Date.now()
        });

        return rankedResults;

      } catch (error) {
        console.error('[SupplierDetection] Error:', error);
        return [];
      }
    }

    /**
     * Extract search parameters from product
     */
    extractSearchParams(product) {
      const title = product.name || product.title || '';
      
      // Clean title for search
      const cleanTitle = this.cleanTitleForSearch(title);
      
      // Extract key terms
      const keyTerms = this.extractKeyTerms(cleanTitle);
      
      // Detect category
      const category = this.detectCategory(cleanTitle);
      
      // Extract brand if present
      const brand = this.extractBrand(product);
      
      // Build search queries
      const queries = this.buildSearchQueries(keyTerms, brand, category);

      return {
        originalTitle: title,
        cleanTitle,
        keyTerms,
        category,
        brand,
        queries,
        price: product.price || product.costPrice,
        images: product.images || []
      };
    }

    /**
     * Clean title for search (remove marketing fluff)
     */
    cleanTitleForSearch(title) {
      // Remove common marketing words
      const marketingWords = [
        'free shipping', 'best seller', 'hot sale', 'new arrival',
        'high quality', 'premium', 'original', '100%', 'authentic',
        'clearance', 'limited', 'exclusive', 'special offer',
        'top rated', 'bestseller', 'trending', 'viral', 'popular'
      ];

      let clean = title.toLowerCase();
      
      marketingWords.forEach(word => {
        clean = clean.replace(new RegExp(word, 'gi'), '');
      });

      // Remove special characters but keep spaces and alphanumeric
      clean = clean
        .replace(/[^\\w\\s\\-]/g, ' ')
        .replace(/\\s+/g, ' ')
        .trim();

      return clean;
    }

    /**
     * Extract key product terms
     */
    extractKeyTerms(cleanTitle) {
      const words = cleanTitle.split(' ').filter(w => w.length > 2);
      
      // Stop words to remove
      const stopWords = new Set([
        'the', 'and', 'for', 'with', 'from', 'this', 'that', 'have',
        'are', 'was', 'were', 'will', 'can', 'has', 'had', 'been',
        'des', 'les', 'pour', 'avec', 'dans', 'sur', 'par', 'une'
      ]);

      const filtered = words.filter(w => !stopWords.has(w));
      
      // Return top 5-8 most significant terms
      return filtered.slice(0, 8);
    }

    /**
     * Detect product category from title
     */
    detectCategory(cleanTitle) {
      const titleLower = cleanTitle.toLowerCase();
      
      for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        const matchCount = keywords.filter(kw => titleLower.includes(kw)).length;
        if (matchCount >= 2 || (matchCount === 1 && cleanTitle.length < 50)) {
          return category;
        }
      }
      
      return 'general';
    }

    /**
     * Extract brand from product data
     */
    extractBrand(product) {
      if (product.brand && product.brand.toLowerCase() !== 'generic' && product.brand.toLowerCase() !== 'unbranded') {
        return product.brand;
      }
      return null;
    }

    /**
     * Build search queries optimized for different platforms
     */
    buildSearchQueries(keyTerms, brand, category) {
      const queries = [];
      
      // Full terms query
      if (keyTerms.length > 0) {
        queries.push({
          type: 'full',
          query: keyTerms.join(' '),
          priority: 1
        });
      }

      // Category + key terms (shorter, more focused)
      if (keyTerms.length > 3) {
        queries.push({
          type: 'short',
          query: keyTerms.slice(0, 4).join(' '),
          priority: 2
        });
      }

      // Brand + product type
      if (brand && keyTerms.length > 0) {
        queries.push({
          type: 'branded',
          query: `${brand} ${keyTerms.slice(0, 3).join(' ')}`,
          priority: 3
        });
      }

      // Category-specific
      if (category !== 'general') {
        queries.push({
          type: 'category',
          query: `${category} ${keyTerms.slice(0, 2).join(' ')}`,
          priority: 4
        });
      }

      return queries;
    }

    /**
     * Select relevant platforms based on product and options
     */
    selectPlatforms(product, options) {
      const selectedPlatforms = [];
      const currentPlatform = product.sourcePlatform || product.source;

      // Priority platforms (always include)
      const priorityPlatforms = ['aliexpress', 'cj'];
      
      priorityPlatforms.forEach(p => {
        if (p !== currentPlatform && SUPPLIER_PLATFORMS[p]) {
          selectedPlatforms.push(p);
        }
      });

      // Add platform based on price point
      const price = product.price || product.costPrice || 0;
      
      if (price > 50) {
        // Higher value items - include wholesale options
        if (!selectedPlatforms.includes('alibaba')) {
          selectedPlatforms.push('alibaba');
        }
      }
      
      if (price < 20) {
        // Lower value items - budget platforms
        if (!selectedPlatforms.includes('dhgate')) {
          selectedPlatforms.push('dhgate');
        }
        if (!selectedPlatforms.includes('banggood')) {
          selectedPlatforms.push('banggood');
        }
      }

      // Add 1688 for experienced users (requires Chinese language skills)
      if (options.include1688) {
        selectedPlatforms.push('1688');
      }

      // Limit to first 4 platforms for performance
      return selectedPlatforms.slice(0, 4);
    }

    /**
     * Search for suppliers across platforms
     */
    async searchSuppliers(searchParams, platforms, options) {
      const results = [];

      // For now, generate potential matches based on analysis
      // In production, this would call actual search APIs
      for (const platformKey of platforms) {
        const platform = SUPPLIER_PLATFORMS[platformKey];
        if (!platform) continue;

        const primaryQuery = searchParams.queries[0]?.query || searchParams.cleanTitle;
        
        // Generate potential match
        const potentialMatch = this.generatePotentialMatch(
          platformKey,
          platform,
          searchParams,
          primaryQuery
        );

        if (potentialMatch) {
          results.push(potentialMatch);
        }
      }

      return results;
    }

    /**
     * Generate a potential supplier match
     */
    generatePotentialMatch(platformKey, platform, searchParams, query) {
      const basePrice = searchParams.price || 20;
      
      // Calculate estimated supplier price based on platform
      const priceMultipliers = {
        aliexpress: 0.35,
        '1688': 0.25,
        cj: 0.45,
        banggood: 0.40,
        dhgate: 0.38,
        alibaba: 0.20
      };

      const multiplier = priceMultipliers[platformKey] || 0.4;
      const estimatedPrice = Math.round(basePrice * multiplier * 100) / 100;

      // Calculate confidence based on search parameters
      const confidence = this.calculateMatchConfidence(searchParams, platformKey);

      return {
        id: `${platformKey}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        platform: platformKey,
        platformName: platform.name,
        query: query,
        searchUrl: platform.searchUrl + encodeURIComponent(query),
        estimatedPrice: estimatedPrice,
        estimatedPriceRange: {
          min: estimatedPrice * 0.8,
          max: estimatedPrice * 1.3
        },
        currency: 'USD',
        shipping: platform.avgShipping,
        moq: platform.moq,
        reliability: platform.reliability,
        confidence: confidence,
        tier: platform.tier,
        category: searchParams.category,
        potentialMargin: this.calculatePotentialMargin(basePrice, estimatedPrice),
        recommendations: this.generateRecommendations(platform, searchParams)
      };
    }

    /**
     * Calculate match confidence score
     */
    calculateMatchConfidence(searchParams, platformKey) {
      let score = 50; // Base score

      // More key terms = higher confidence
      score += Math.min(searchParams.keyTerms.length * 5, 20);

      // Known category = higher confidence
      if (searchParams.category !== 'general') {
        score += 10;
      }

      // Has images = higher potential for image matching
      if (searchParams.images.length > 0) {
        score += 10;
      }

      // Platform-specific adjustments
      const platformBoosts = {
        aliexpress: 10, // Most reliable for dropshipping
        cj: 8,
        banggood: 5,
        dhgate: 3,
        '1688': -5, // Requires more expertise
        alibaba: -10 // Usually wholesale only
      };

      score += platformBoosts[platformKey] || 0;

      return Math.min(Math.max(score, 10), 95);
    }

    /**
     * Calculate potential profit margin
     */
    calculatePotentialMargin(sellingPrice, supplierPrice) {
      if (!sellingPrice || !supplierPrice) return null;

      const profit = sellingPrice - supplierPrice;
      const margin = (profit / sellingPrice) * 100;

      return {
        profit: Math.round(profit * 100) / 100,
        marginPercent: Math.round(margin),
        roi: Math.round((profit / supplierPrice) * 100)
      };
    }

    /**
     * Generate supplier-specific recommendations
     */
    generateRecommendations(platform, searchParams) {
      const recommendations = [];

      if (platform.moq > 1) {
        recommendations.push({
          type: 'moq',
          message: `MOQ de ${platform.moq} unités - Commandez en gros pour meilleurs prix`
        });
      }

      if (platform.avgShipping.max > 20) {
        recommendations.push({
          type: 'shipping',
          message: 'Délai long - Vérifiez options ePacket ou warehouses locaux'
        });
      }

      if (platform.reliability < 0.8) {
        recommendations.push({
          type: 'risk',
          message: 'Fiabilité moyenne - Vérifiez avis vendeur avant commande'
        });
      }

      if (searchParams.category === 'electronics') {
        recommendations.push({
          type: 'category',
          message: 'Électronique - Vérifiez certifications CE/FCC'
        });
      }

      return recommendations;
    }

    /**
     * Rank and sort supplier results
     */
    rankSuppliers(results, product) {
      return results
        .map(result => ({
          ...result,
          overallScore: this.calculateOverallScore(result, product)
        }))
        .sort((a, b) => b.overallScore - a.overallScore);
    }

    /**
     * Calculate overall score for ranking
     */
    calculateOverallScore(result, product) {
      let score = 0;

      // Confidence (40%)
      score += result.confidence * 0.4;

      // Margin potential (30%)
      if (result.potentialMargin) {
        score += Math.min(result.potentialMargin.marginPercent, 60) * 0.5;
      }

      // Reliability (20%)
      score += result.reliability * 20;

      // Shipping speed (10%)
      const avgShipping = (result.shipping.min + result.shipping.max) / 2;
      score += Math.max(0, 15 - avgShipping * 0.5);

      return Math.round(score);
    }

    /**
     * Get cache key for product
     */
    getCacheKey(product) {
      const title = (product.name || product.title || '').substring(0, 50);
      const price = product.price || product.costPrice || 0;
      return `${title}_${price}`.replace(/\s+/g, '_').toLowerCase();
    }

    /**
     * Clear cache
     */
    clearCache() {
      this.cache.clear();
    }

    /**
     * Get platform info
     */
    getPlatformInfo(platformKey) {
      return SUPPLIER_PLATFORMS[platformKey] || null;
    }

    /**
     * Get all supported platforms
     */
    getSupportedPlatforms() {
      return Object.entries(SUPPLIER_PLATFORMS).map(([key, platform]) => ({
        key,
        ...platform
      }));
    }
  }

  // Export singleton
  window.ShopOptiSupplierDetection = new SupplierDetectionEngine();

  console.log('[ShopOpti+] Supplier Detection Engine v5.7.0 loaded');

})();
