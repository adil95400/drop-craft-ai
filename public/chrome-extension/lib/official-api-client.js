/**
 * ShopOpti+ Official API Client v5.7.0
 * Unified interface for official marketplace APIs
 * Supports: AliExpress Open Platform, Amazon PA-API, eBay Browse API, etc.
 */

(function() {
  'use strict';

  const OfficialAPIClient = {
    version: '5.7.0',
    
    // API endpoint base
    BACKEND_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    
    // API configurations
    apis: {
      aliexpress_open_platform: {
        name: 'AliExpress Open Platform',
        status: 'available',
        requiresKey: true,
        secretName: 'ALIEXPRESS_APP_KEY',
        docs: 'https://developers.aliexpress.com/',
        features: ['product', 'categories', 'shipping', 'orders'],
        rateLimit: { requests: 100, windowMs: 60000 }
      },
      amazon_pa_api: {
        name: 'Amazon Product Advertising API',
        status: 'available',
        requiresKey: true,
        secretName: 'AMAZON_ACCESS_KEY',
        docs: 'https://webservices.amazon.com/paapi5/documentation/',
        features: ['product', 'search', 'browse', 'variations'],
        rateLimit: { requests: 1, windowMs: 1000 } // 1 TPS default
      },
      ebay_browse_api: {
        name: 'eBay Browse API',
        status: 'available',
        requiresKey: true,
        secretName: 'EBAY_APP_ID',
        docs: 'https://developer.ebay.com/api-docs/buy/browse/static/overview.html',
        features: ['product', 'search', 'item_summary'],
        rateLimit: { requests: 5000, windowMs: 86400000 }
      },
      tiktok_shop_api: {
        name: 'TikTok Shop API',
        status: 'available',
        requiresKey: true,
        secretName: 'TIKTOK_SHOP_APP_KEY',
        docs: 'https://partner.tiktokshop.com/',
        features: ['product', 'orders', 'inventory', 'shipping'],
        rateLimit: { requests: 600, windowMs: 60000 }
      },
      shopify_storefront_api: {
        name: 'Shopify Storefront API',
        status: 'available',
        requiresKey: true,
        secretName: 'SHOPIFY_STOREFRONT_TOKEN',
        docs: 'https://shopify.dev/api/storefront',
        features: ['product', 'collections', 'variants'],
        rateLimit: { requests: 1000, windowMs: 60000 }
      },
      walmart_affiliate_api: {
        name: 'Walmart Affiliate API',
        status: 'planned',
        requiresKey: true,
        secretName: 'WALMART_API_KEY',
        docs: 'https://affiliates.walmart.com/',
        features: ['product', 'search', 'taxonomy'],
        rateLimit: { requests: 20, windowMs: 1000 }
      },
      cj_open_api: {
        name: 'CJ Dropshipping Open API',
        status: 'available',
        requiresKey: true,
        secretName: 'CJ_API_KEY',
        docs: 'https://developers.cjdropshipping.com/',
        features: ['product', 'inventory', 'orders', 'shipping'],
        rateLimit: { requests: 100, windowMs: 60000 }
      },
      etsy_open_api: {
        name: 'Etsy Open API',
        status: 'planned',
        requiresKey: true,
        secretName: 'ETSY_API_KEY',
        docs: 'https://developers.etsy.com/documentation/',
        features: ['product', 'shop', 'reviews'],
        rateLimit: { requests: 5000, windowMs: 86400000 }
      }
    },
    
    // Request queue for rate limiting
    requestQueues: {},

    /**
     * Check if an API is configured and available
     */
    async isConfigured(apiType) {
      const config = this.apis[apiType];
      if (!config) return false;
      if (config.status !== 'available') return false;
      
      // Check if credentials are available via backend
      try {
        const response = await this.callBackend('check-api-credentials', {
          apiType
        });
        return response?.configured === true;
      } catch (e) {
        console.warn(`[OfficialAPIClient] Failed to check ${apiType} credentials:`, e);
        return false;
      }
    },

    /**
     * Extract product using official API
     */
    async extract(apiType, url, options = {}) {
      const config = this.apis[apiType];
      if (!config) {
        throw new Error(`Unknown API type: ${apiType}`);
      }
      
      if (config.status !== 'available') {
        throw new Error(`API ${apiType} is not yet available (status: ${config.status})`);
      }

      // Rate limiting
      await this.waitForRateLimit(apiType);

      // Delegate to specific API handler
      switch (apiType) {
        case 'aliexpress_open_platform':
          return this.extractAliExpress(url, options);
        case 'amazon_pa_api':
          return this.extractAmazon(url, options);
        case 'ebay_browse_api':
          return this.extractEbay(url, options);
        case 'tiktok_shop_api':
          return this.extractTikTokShop(url, options);
        case 'shopify_storefront_api':
          return this.extractShopify(url, options);
        case 'cj_open_api':
          return this.extractCJDropshipping(url, options);
        default:
          throw new Error(`No extraction handler for: ${apiType}`);
      }
    },

    /**
     * AliExpress Open Platform extraction
     */
    async extractAliExpress(url, options = {}) {
      const productId = this.extractAliExpressProductId(url);
      if (!productId) {
        throw new Error('Could not extract AliExpress product ID from URL');
      }

      const response = await this.callBackend('aliexpress-api', {
        action: 'get_product',
        product_id: productId,
        include_reviews: options.includeReviews !== false,
        include_shipping: options.includeShipping !== false
      });

      return this.normalizeAliExpressProduct(response);
    },

    extractAliExpressProductId(url) {
      const patterns = [
        /\/item\/(\d+)\.html/,
        /\/i\/(\d+)\.html/,
        /\/_p\/(\d+)/,
        /productId=(\d+)/,
        /\/(\d{10,})\.html/
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    },

    normalizeAliExpressProduct(apiResponse) {
      const product = apiResponse.aliexpress_ds_product_get_response?.result || apiResponse;
      
      return {
        external_id: product.product_id?.toString(),
        platform: 'aliexpress',
        source: 'official_api',
        title: product.subject || product.product_title,
        description: product.detail || '',
        brand: product.store_name || '',
        price: parseFloat(product.target_sale_price || product.sale_price || 0),
        originalPrice: parseFloat(product.target_original_price || product.original_price || 0),
        currency: product.target_sale_price_currency || 'USD',
        images: (product.product_main_image_url ? [product.product_main_image_url] : [])
          .concat(product.product_small_image_urls?.split(';') || []),
        videos: product.product_video_url ? [{ url: product.product_video_url, type: 'mp4' }] : [],
        variants: this.normalizeAliExpressVariants(product.sku_properties || product.ae_sku_info),
        specifications: product.product_property || {},
        shipping: {
          freeShipping: product.is_free_shipping === 'true',
          deliveryTime: product.delivery_time || ''
        }
      };
    },

    normalizeAliExpressVariants(skuData) {
      if (!skuData) return [];
      
      const variants = [];
      const skuList = Array.isArray(skuData) ? skuData : [skuData];
      
      skuList.forEach(sku => {
        if (sku.aeop_ae_sku_propertys) {
          sku.aeop_ae_sku_propertys.forEach(prop => {
            variants.push({
              id: prop.sku_property_id?.toString(),
              title: prop.sku_property_value,
              type: prop.sku_property_name,
              image: prop.sku_image || null,
              available: true
            });
          });
        }
      });
      
      return variants;
    },

    /**
     * Amazon PA-API extraction
     */
    async extractAmazon(url, options = {}) {
      const asin = this.extractAmazonASIN(url);
      if (!asin) {
        throw new Error('Could not extract Amazon ASIN from URL');
      }

      const response = await this.callBackend('amazon-pa-api', {
        action: 'get_items',
        item_ids: [asin],
        resources: [
          'Images.Primary.Large',
          'Images.Variants.Large',
          'ItemInfo.Title',
          'ItemInfo.Features',
          'ItemInfo.ProductInfo',
          'ItemInfo.ManufactureInfo',
          'Offers.Listings.Price',
          'Offers.Listings.SavingBasis',
          'VariationSummary.VariationDimension',
          'VariationSummary.Price'
        ],
        marketplace: this.detectAmazonMarketplace(url)
      });

      return this.normalizeAmazonProduct(response);
    },

    extractAmazonASIN(url) {
      const match = url.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i);
      return match ? match[1] : null;
    },

    detectAmazonMarketplace(url) {
      const marketplaces = {
        'amazon.com': 'www.amazon.com',
        'amazon.fr': 'www.amazon.fr',
        'amazon.de': 'www.amazon.de',
        'amazon.co.uk': 'www.amazon.co.uk',
        'amazon.es': 'www.amazon.es',
        'amazon.it': 'www.amazon.it',
        'amazon.ca': 'www.amazon.ca',
        'amazon.co.jp': 'www.amazon.co.jp'
      };

      for (const [domain, marketplace] of Object.entries(marketplaces)) {
        if (url.includes(domain)) return marketplace;
      }
      return 'www.amazon.com';
    },

    normalizeAmazonProduct(apiResponse) {
      const item = apiResponse.ItemsResult?.Items?.[0] || apiResponse;
      const itemInfo = item.ItemInfo || {};
      const offers = item.Offers?.Listings?.[0] || {};
      
      return {
        external_id: item.ASIN,
        platform: 'amazon',
        source: 'official_api',
        title: itemInfo.Title?.DisplayValue || '',
        description: (itemInfo.Features?.DisplayValues || []).join('\n'),
        brand: itemInfo.ByLineInfo?.Brand?.DisplayValue || itemInfo.ManufactureInfo?.Brand?.DisplayValue || '',
        price: parseFloat(offers.Price?.Amount || 0),
        originalPrice: parseFloat(offers.SavingBasis?.Amount || 0) || null,
        currency: offers.Price?.Currency || 'USD',
        images: this.normalizeAmazonImages(item.Images),
        videos: [],
        variants: this.normalizeAmazonVariants(item.VariationSummary),
        specifications: this.normalizeAmazonSpecs(itemInfo.ProductInfo),
        url: item.DetailPageURL
      };
    },

    normalizeAmazonImages(images) {
      const result = [];
      
      if (images?.Primary?.Large?.URL) {
        result.push(images.Primary.Large.URL);
      }
      
      if (images?.Variants) {
        images.Variants.forEach(variant => {
          if (variant.Large?.URL) {
            result.push(variant.Large.URL);
          }
        });
      }
      
      return result;
    },

    normalizeAmazonVariants(variationSummary) {
      if (!variationSummary) return [];
      
      const variants = [];
      const dimensions = variationSummary.VariationDimension || [];
      
      dimensions.forEach(dim => {
        variants.push({
          id: dim,
          title: dim,
          type: 'variation_dimension',
          available: true
        });
      });
      
      return variants;
    },

    normalizeAmazonSpecs(productInfo) {
      if (!productInfo) return {};
      
      const specs = {};
      
      if (productInfo.ItemDimensions) {
        specs['Dimensions'] = productInfo.ItemDimensions;
      }
      if (productInfo.Color?.DisplayValue) {
        specs['Color'] = productInfo.Color.DisplayValue;
      }
      if (productInfo.Size?.DisplayValue) {
        specs['Size'] = productInfo.Size.DisplayValue;
      }
      
      return specs;
    },

    /**
     * eBay Browse API extraction
     */
    async extractEbay(url, options = {}) {
      const itemId = this.extractEbayItemId(url);
      if (!itemId) {
        throw new Error('Could not extract eBay item ID from URL');
      }

      const response = await this.callBackend('ebay-browse-api', {
        action: 'get_item',
        item_id: itemId
      });

      return this.normalizeEbayProduct(response);
    },

    extractEbayItemId(url) {
      const match = url.match(/\/itm\/(\d+)/i);
      return match ? match[1] : null;
    },

    normalizeEbayProduct(apiResponse) {
      const item = apiResponse;
      
      return {
        external_id: item.itemId,
        platform: 'ebay',
        source: 'official_api',
        title: item.title || '',
        description: item.description || item.shortDescription || '',
        brand: item.brand || '',
        price: parseFloat(item.price?.value || 0),
        originalPrice: parseFloat(item.marketingPrice?.originalPrice?.value || 0) || null,
        currency: item.price?.currency || 'USD',
        images: (item.image?.imageUrl ? [item.image.imageUrl] : [])
          .concat((item.additionalImages || []).map(img => img.imageUrl)),
        videos: [],
        variants: (item.itemGroupAdditionalImages || []).map((img, idx) => ({
          id: `var_${idx}`,
          title: img.imageUrl,
          image: img.imageUrl,
          available: true
        })),
        specifications: item.localizedAspects?.reduce((acc, aspect) => {
          acc[aspect.name] = aspect.value;
          return acc;
        }, {}) || {},
        condition: item.condition,
        seller: {
          name: item.seller?.username,
          rating: item.seller?.feedbackPercentage
        }
      };
    },

    /**
     * TikTok Shop API extraction
     */
    async extractTikTokShop(url, options = {}) {
      const productId = this.extractTikTokProductId(url);
      if (!productId) {
        throw new Error('Could not extract TikTok Shop product ID from URL');
      }

      const response = await this.callBackend('tiktok-shop-integration', {
        action: 'get_product_detail',
        product_id: productId
      });

      return response;
    },

    extractTikTokProductId(url) {
      const patterns = [
        /\/product\/(\d+)/i,
        /\/p\/(\d+)/i,
        /product_id=(\d+)/i
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    },

    /**
     * Shopify Storefront API extraction
     */
    async extractShopify(url, options = {}) {
      const { domain, handle } = this.parseShopifyUrl(url);
      if (!handle) {
        throw new Error('Could not extract Shopify product handle from URL');
      }

      const response = await this.callBackend('shopify-storefront-api', {
        action: 'get_product',
        domain: domain,
        handle: handle
      });

      return this.normalizeShopifyProduct(response);
    },

    parseShopifyUrl(url) {
      const urlObj = new URL(url);
      const match = urlObj.pathname.match(/\/products\/([^\/\?]+)/);
      
      return {
        domain: urlObj.hostname,
        handle: match ? match[1] : null
      };
    },

    normalizeShopifyProduct(apiResponse) {
      const product = apiResponse.data?.product || apiResponse;
      
      return {
        external_id: product.id,
        platform: 'shopify',
        source: 'official_api',
        title: product.title || '',
        description: product.description || product.descriptionHtml || '',
        brand: product.vendor || '',
        price: parseFloat(product.priceRange?.minVariantPrice?.amount || 0),
        originalPrice: parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount || 0) || null,
        currency: product.priceRange?.minVariantPrice?.currencyCode || 'USD',
        images: (product.images?.edges || []).map(edge => edge.node.url || edge.node.originalSrc),
        videos: (product.media?.edges || [])
          .filter(edge => edge.node.mediaContentType === 'VIDEO')
          .map(edge => ({ url: edge.node.sources?.[0]?.url, type: 'mp4' })),
        variants: (product.variants?.edges || []).map(edge => ({
          id: edge.node.id,
          title: edge.node.title,
          price: parseFloat(edge.node.price?.amount || 0),
          available: edge.node.availableForSale,
          sku: edge.node.sku,
          image: edge.node.image?.url
        })),
        tags: product.tags || []
      };
    },

    /**
     * CJ Dropshipping API extraction
     */
    async extractCJDropshipping(url, options = {}) {
      const productId = this.extractCJProductId(url);
      if (!productId) {
        throw new Error('Could not extract CJ product ID from URL');
      }

      const response = await this.callBackend('cj-dropshipping-api', {
        action: 'get_product',
        product_id: productId
      });

      return response;
    },

    extractCJProductId(url) {
      const match = url.match(/\/product-detail\/([^\/\?]+)/i);
      return match ? match[1] : null;
    },

    /**
     * Rate limiting
     */
    async waitForRateLimit(apiType) {
      const config = this.apis[apiType];
      if (!config?.rateLimit) return;

      if (!this.requestQueues[apiType]) {
        this.requestQueues[apiType] = {
          timestamps: [],
          limit: config.rateLimit.requests,
          window: config.rateLimit.windowMs
        };
      }

      const queue = this.requestQueues[apiType];
      const now = Date.now();
      
      // Clean old timestamps
      queue.timestamps = queue.timestamps.filter(t => now - t < queue.window);
      
      if (queue.timestamps.length >= queue.limit) {
        const oldestTimestamp = queue.timestamps[0];
        const waitTime = queue.window - (now - oldestTimestamp) + 100;
        
        if (waitTime > 0) {
          console.log(`[OfficialAPIClient] Rate limit reached for ${apiType}, waiting ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      queue.timestamps.push(Date.now());
    },

    /**
     * Call backend API
     */
    async callBackend(endpoint, body) {
      const headers = {
        'Content-Type': 'application/json'
      };

      // Add auth token if available
      if (typeof ShopOptiAuth !== 'undefined' && ShopOptiAuth.token) {
        headers['x-extension-token'] = ShopOptiAuth.token;
      }

      const response = await fetch(`${this.BACKEND_URL}/${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `API call failed: ${response.status}`);
      }

      return response.json();
    },

    /**
     * Get list of available APIs
     */
    listAPIs() {
      return Object.entries(this.apis).map(([key, config]) => ({
        key,
        ...config
      }));
    },

    /**
     * Get API documentation URL
     */
    getDocumentation(apiType) {
      return this.apis[apiType]?.docs || null;
    }
  };

  // Export
  window.OfficialAPIClient = OfficialAPIClient;

})();
