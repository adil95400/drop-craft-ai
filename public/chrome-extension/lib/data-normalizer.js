/**
 * ShopOpti+ Data Normalizer v5.7.0
 * Normalizes product data from any platform into unified ShopOpti format
 * Ensures consistent data structure regardless of source
 */

(function() {
  'use strict';

  // Unified product schema
  const UNIFIED_SCHEMA = {
    // Identifiers
    external_id: { type: 'string', required: true },
    url: { type: 'string', required: true },
    platform: { type: 'string', required: true },
    
    // Core product info
    title: { type: 'string', required: true, maxLength: 500 },
    description: { type: 'string', required: false, maxLength: 50000 },
    short_description: { type: 'string', required: false, maxLength: 500 },
    
    // Pricing
    price: { type: 'number', required: true, min: 0 },
    original_price: { type: 'number', required: false, min: 0 },
    currency: { type: 'string', required: false, default: 'EUR' },
    
    // Inventory
    sku: { type: 'string', required: false },
    barcode: { type: 'string', required: false },
    stock: { type: 'number', required: false, min: 0 },
    in_stock: { type: 'boolean', required: false, default: true },
    
    // Classification
    brand: { type: 'string', required: false },
    category: { type: 'string', required: false },
    subcategory: { type: 'string', required: false },
    tags: { type: 'array', required: false, default: [] },
    
    // Media
    images: { type: 'array', required: false, default: [] },
    videos: { type: 'array', required: false, default: [] },
    
    // Variants
    variants: { type: 'array', required: false, default: [] },
    options: { type: 'array', required: false, default: [] },
    
    // Reviews
    reviews: { type: 'array', required: false, default: [] },
    rating: { type: 'number', required: false, min: 0, max: 5 },
    reviews_count: { type: 'number', required: false, min: 0 },
    
    // Shipping
    shipping_info: { type: 'object', required: false },
    weight: { type: 'number', required: false },
    dimensions: { type: 'object', required: false },
    
    // Specifications
    specifications: { type: 'object', required: false, default: {} },
    
    // Metadata
    extracted_at: { type: 'string', required: true },
    extractor_version: { type: 'string', required: false }
  };

  // Field mapping by platform
  const PLATFORM_MAPPINGS = {
    aliexpress: {
      title: ['title', 'subject', 'name'],
      description: ['description', 'detail', 'body'],
      price: ['price', 'currentPrice', 'salePrice', 'promotionPrice'],
      original_price: ['originalPrice', 'regularPrice', 'retailPrice'],
      images: ['images', 'imageUrls', 'gallery', 'imagePathList'],
      videos: ['videos', 'videoUrl', 'videoUrls'],
      brand: ['brand', 'storeName', 'seller'],
      category: ['category', 'categoryName', 'categoryPath'],
      sku: ['sku', 'productId', 'itemId'],
      stock: ['stock', 'quantity', 'availableStock'],
      variants: ['variants', 'skuList', 'skuModule'],
      reviews: ['reviews', 'feedback', 'ratings'],
      rating: ['rating', 'averageRating', 'starRating'],
      reviews_count: ['reviewsCount', 'feedbackCount', 'totalReviews'],
      shipping_info: ['shipping', 'shippingInfo', 'deliveryInfo']
    },
    amazon: {
      title: ['title', 'productTitle', 'name'],
      description: ['description', 'productDescription', 'feature_bullets'],
      price: ['price', 'currentPrice', 'priceAmount'],
      original_price: ['originalPrice', 'listPrice', 'wasPrice'],
      images: ['images', 'imageUrls', 'gallery', 'mainImages'],
      videos: ['videos', 'videoUrls'],
      brand: ['brand', 'manufacturer', 'byLineInfo'],
      category: ['category', 'categoryPath', 'breadcrumbs'],
      sku: ['asin', 'sku', 'productId'],
      stock: ['stock', 'availability', 'inventoryQuantity'],
      variants: ['variants', 'variations', 'twisterSlotData'],
      reviews: ['reviews', 'customerReviews'],
      rating: ['rating', 'averageCustomerRating'],
      reviews_count: ['reviewsCount', 'totalReviewCount'],
      specifications: ['specifications', 'technicalDetails', 'productDetails']
    },
    shopify: {
      title: ['title', 'name'],
      description: ['body_html', 'description', 'body'],
      price: ['price', 'variants.0.price'],
      original_price: ['compare_at_price', 'variants.0.compare_at_price'],
      images: ['images', 'image.src'],
      brand: ['vendor', 'brand'],
      category: ['product_type', 'category'],
      sku: ['variants.0.sku', 'sku', 'handle'],
      stock: ['variants.0.inventory_quantity', 'inventory_quantity'],
      variants: ['variants', 'options'],
      tags: ['tags']
    },
    temu: {
      title: ['title', 'goods_name', 'name'],
      description: ['description', 'goods_desc'],
      price: ['price', 'sale_price', 'min_price'],
      original_price: ['original_price', 'market_price'],
      images: ['images', 'gallery', 'goods_gallery_url_list'],
      videos: ['videos', 'video_url'],
      brand: ['brand', 'shop_name'],
      category: ['category', 'cat_name'],
      variants: ['variants', 'sku_list'],
      reviews: ['reviews', 'goods_reviews'],
      rating: ['rating', 'goods_rating']
    },
    ebay: {
      title: ['title', 'itemTitle'],
      description: ['description', 'itemDescription'],
      price: ['price', 'currentPrice', 'buyItNowPrice'],
      original_price: ['originalPrice', 'listingPrice'],
      images: ['images', 'imageUrls', 'galleryImages'],
      brand: ['brand', 'manufacturer'],
      category: ['category', 'primaryCategory', 'categoryPath'],
      sku: ['itemId', 'sku', 'epid'],
      stock: ['quantity', 'quantityAvailable'],
      variants: ['variations', 'itemVariations'],
      shipping_info: ['shippingInfo', 'shippingDetails']
    }
  };

  class DataNormalizer {
    constructor() {
      this.schema = UNIFIED_SCHEMA;
      this.platformMappings = PLATFORM_MAPPINGS;
    }

    /**
     * Normalize product data to unified format
     * @param {Object} rawData - Raw data from extractor
     * @param {string} platform - Source platform
     * @returns {Object} Normalized product data
     */
    normalize(rawData, platform) {
      const normalized = {};
      const mapping = this.platformMappings[platform] || {};

      // Process each schema field
      Object.entries(this.schema).forEach(([fieldName, fieldConfig]) => {
        let value = this.extractValue(rawData, fieldName, mapping[fieldName] || []);

        // Apply type coercion and validation
        value = this.coerceType(value, fieldConfig);

        // Apply constraints
        value = this.applyConstraints(value, fieldConfig);

        // Set default if undefined
        if (value === undefined && fieldConfig.default !== undefined) {
          value = fieldConfig.default;
        }

        if (value !== undefined) {
          normalized[fieldName] = value;
        }
      });

      // Add required metadata
      normalized.platform = platform;
      normalized.url = rawData.url || rawData.source_url || '';
      normalized.external_id = normalized.sku || this.generateExternalId(rawData, platform);
      normalized.extracted_at = rawData.extractedAt || new Date().toISOString();
      normalized.extractor_version = '5.7.0';

      // Normalize specific fields
      normalized.images = this.normalizeImages(normalized.images || rawData.images || []);
      normalized.videos = this.normalizeVideos(normalized.videos || rawData.videos || []);
      normalized.variants = this.normalizeVariants(normalized.variants || rawData.variants || []);
      normalized.reviews = this.normalizeReviews(normalized.reviews || rawData.reviews || []);

      // Clean up
      normalized.title = this.cleanTitle(normalized.title || '');
      normalized.description = this.cleanDescription(normalized.description || '');

      return normalized;
    }

    /**
     * Extract value using field mapping
     */
    extractValue(data, fieldName, aliases) {
      // Direct match
      if (data[fieldName] !== undefined) {
        return data[fieldName];
      }

      // Try aliases
      const allAliases = [...(aliases || []), fieldName];
      for (const alias of allAliases) {
        // Handle nested paths like 'variants.0.price'
        if (alias.includes('.')) {
          const value = this.getNestedValue(data, alias);
          if (value !== undefined) return value;
        } else if (data[alias] !== undefined) {
          return data[alias];
        }
      }

      // Try case-insensitive match
      const lowerFieldName = fieldName.toLowerCase();
      for (const key of Object.keys(data)) {
        if (key.toLowerCase() === lowerFieldName) {
          return data[key];
        }
      }

      return undefined;
    }

    /**
     * Get nested value from path
     */
    getNestedValue(obj, path) {
      return path.split('.').reduce((acc, part) => {
        if (acc === undefined || acc === null) return undefined;
        return acc[part];
      }, obj);
    }

    /**
     * Coerce value to expected type
     */
    coerceType(value, config) {
      if (value === undefined || value === null) return undefined;

      switch (config.type) {
        case 'string':
          return String(value).trim();
        case 'number':
          const num = this.parseNumber(value);
          return isNaN(num) ? undefined : num;
        case 'boolean':
          return Boolean(value);
        case 'array':
          return Array.isArray(value) ? value : (value ? [value] : []);
        case 'object':
          return typeof value === 'object' ? value : {};
        default:
          return value;
      }
    }

    /**
     * Parse number from various formats
     */
    parseNumber(value) {
      if (typeof value === 'number') return value;
      if (typeof value !== 'string') return NaN;

      // Remove currency symbols and spaces
      let clean = value.replace(/[€$£¥₹\s]/g, '');
      
      // Handle European format (1.234,56)
      if (clean.match(/^\d{1,3}(\.\d{3})*,\d{2}$/)) {
        clean = clean.replace(/\./g, '').replace(',', '.');
      }
      // Handle standard format with comma as thousands (1,234.56)
      else if (clean.match(/^\d{1,3}(,\d{3})*(\.\d{2})?$/)) {
        clean = clean.replace(/,/g, '');
      }
      // Handle simple comma decimal (12,50)
      else if (clean.match(/^\d+,\d+$/)) {
        clean = clean.replace(',', '.');
      }

      return parseFloat(clean);
    }

    /**
     * Apply constraints to value
     */
    applyConstraints(value, config) {
      if (value === undefined) return undefined;

      if (config.type === 'string' && config.maxLength) {
        value = value.substring(0, config.maxLength);
      }

      if (config.type === 'number') {
        if (config.min !== undefined && value < config.min) value = config.min;
        if (config.max !== undefined && value > config.max) value = config.max;
      }

      return value;
    }

    /**
     * Normalize images array
     */
    normalizeImages(images) {
      if (!Array.isArray(images)) {
        images = images ? [images] : [];
      }

      return images
        .map(img => {
          if (typeof img === 'string') return img;
          if (typeof img === 'object') return img.src || img.url || img.image;
          return null;
        })
        .filter(url => url && typeof url === 'string')
        .map(url => this.normalizeUrl(url))
        .filter((url, index, self) => url && self.indexOf(url) === index) // Remove duplicates
        .slice(0, 50); // Limit to 50 images
    }

    /**
     * Normalize videos array
     */
    normalizeVideos(videos) {
      if (!Array.isArray(videos)) {
        videos = videos ? [videos] : [];
      }

      return videos
        .map(vid => {
          if (typeof vid === 'string') return { url: vid, type: 'video' };
          if (typeof vid === 'object') return {
            url: vid.url || vid.src || vid.video_url,
            type: vid.type || 'video',
            thumbnail: vid.thumbnail || vid.poster
          };
          return null;
        })
        .filter(vid => vid && vid.url)
        .slice(0, 10); // Limit to 10 videos
    }

    /**
     * Normalize variants array using VariantMapper if available
     */
    normalizeVariants(variants, platform) {
      // Use the new VariantMapper if available
      if (window.ShopOptiVariantMapper) {
        return window.ShopOptiVariantMapper.map(variants, platform || 'generic', {});
      }

      // Fallback to legacy normalization
      if (!Array.isArray(variants)) return [];

      return variants.map((variant, index) => ({
        id: variant.id || variant.sku || `variant_${index}`,
        title: variant.title || variant.name || this.buildVariantTitle(variant),
        price: this.parseNumber(variant.price) || 0,
        compare_at_price: this.parseNumber(variant.compare_at_price || variant.originalPrice),
        sku: variant.sku || '',
        barcode: variant.barcode || variant.gtin || '',
        inventory_quantity: variant.inventory_quantity || variant.stock || 0,
        available: variant.available !== false && variant.in_stock !== false,
        options: variant.options || this.extractVariantOptions(variant),
        image_url: variant.image_url || variant.image || null,
        weight: variant.weight || null
      })).slice(0, 100); // Limit to 100 variants
    }

    /**
     * Build variant title from options
     */
    buildVariantTitle(variant) {
      const options = [];
      ['option1', 'option2', 'option3', 'size', 'color', 'style'].forEach(key => {
        if (variant[key]) options.push(variant[key]);
      });
      return options.join(' / ') || 'Default';
    }

    /**
     * Extract variant options
     */
    extractVariantOptions(variant) {
      const options = {};
      const optionKeys = ['size', 'color', 'style', 'material', 'option1', 'option2', 'option3'];
      
      optionKeys.forEach(key => {
        if (variant[key]) {
          const normalizedKey = key.replace(/option\d/, match => {
            const num = match.replace('option', '');
            return ['Size', 'Color', 'Style'][parseInt(num) - 1] || match;
          });
          options[normalizedKey] = variant[key];
        }
      });

      return options;
    }

    /**
     * Normalize reviews array
     */
    normalizeReviews(reviews) {
      if (!Array.isArray(reviews)) return [];

      return reviews
        .filter(review => review && (review.content || review.text || review.body))
        .map((review, index) => ({
          id: review.id || `review_${index}`,
          author: review.author || review.reviewer || review.name || 'Anonymous',
          rating: Math.min(5, Math.max(0, this.parseNumber(review.rating) || 5)),
          content: (review.content || review.text || review.body || '').substring(0, 5000),
          date: review.date || review.created_at || null,
          verified: review.verified !== false,
          helpful_count: review.helpful_count || review.likes || 0,
          images: this.normalizeImages(review.images || []),
          country: review.country || null
        }))
        .slice(0, 100); // Limit to 100 reviews
    }

    /**
     * Normalize URL
     */
    normalizeUrl(url) {
      if (!url) return null;
      if (url.startsWith('//')) return 'https:' + url;
      if (!url.startsWith('http')) return null;
      return url;
    }

    /**
     * Clean title
     */
    cleanTitle(title) {
      return title
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s\-'&àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ]/gi, '')
        .trim()
        .substring(0, 500);
    }

    /**
     * Clean description
     */
    cleanDescription(description) {
      // Remove script/style tags
      let clean = description.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      clean = clean.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      
      // Normalize whitespace
      clean = clean.replace(/\s+/g, ' ').trim();
      
      return clean.substring(0, 50000);
    }

    /**
     * Generate external ID
     */
    generateExternalId(data, platform) {
      const url = data.url || data.source_url || '';
      
      // Try to extract ID from URL
      const patterns = {
        aliexpress: /\/item\/(\d+)/,
        amazon: /\/dp\/([A-Z0-9]{10})/,
        ebay: /\/itm\/(\d+)/,
        shopify: /\/products\/([^/?]+)/,
        temu: /\/goods\/(\d+)/
      };

      const pattern = patterns[platform];
      if (pattern) {
        const match = url.match(pattern);
        if (match) return match[1];
      }

      // Fallback: hash of URL
      return this.hashString(url);
    }

    /**
     * Simple string hash
     */
    hashString(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(36);
    }

    /**
     * Validate normalized data against schema
     */
    validateNormalized(data) {
      const errors = [];
      
      Object.entries(this.schema).forEach(([fieldName, config]) => {
        if (config.required && (data[fieldName] === undefined || data[fieldName] === null)) {
          errors.push(`Missing required field: ${fieldName}`);
        }
      });

      return {
        isValid: errors.length === 0,
        errors
      };
    }
  }

  // Singleton instance
  const normalizer = new DataNormalizer();

  // Export
  if (typeof window !== 'undefined') {
    window.ShopOptiNormalizer = normalizer;
    window.DataNormalizer = DataNormalizer;
  }

  console.log('[ShopOpti+] DataNormalizer v5.7.0 loaded');
})();
