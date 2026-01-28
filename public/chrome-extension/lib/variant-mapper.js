/**
 * ShopOpti+ Universal Variant Mapper v5.7.0
 * Unified SKU/Options mapping across all platforms
 * Ensures 100% variant coverage with consistent structure
 */

(function() {
  'use strict';

  if (window.__shopoptiVariantMapperLoaded) return;
  window.__shopoptiVariantMapperLoaded = true;

  /**
   * Standard variant schema for all platforms
   */
  const VARIANT_SCHEMA = {
    id: { type: 'string', required: true },
    sku: { type: 'string', required: false },
    title: { type: 'string', required: true },
    price: { type: 'number', required: true },
    compare_at_price: { type: 'number', required: false },
    inventory_quantity: { type: 'number', required: false, default: 0 },
    available: { type: 'boolean', required: false, default: true },
    weight: { type: 'number', required: false },
    weight_unit: { type: 'string', required: false, default: 'kg' },
    barcode: { type: 'string', required: false },
    image_url: { type: 'string', required: false },
    position: { type: 'number', required: false },
    options: { type: 'object', required: true }
  };

  /**
   * Option type definitions for normalization
   */
  const OPTION_TYPES = {
    size: {
      aliases: ['size', 'taille', 'größe', 'tamaño', 'dimensione', 'サイズ', 'option1', 'ships_from'],
      normalize: (value) => value?.toString().toUpperCase().trim()
    },
    color: {
      aliases: ['color', 'colour', 'couleur', 'farbe', 'colore', 'カラー', 'option2'],
      normalize: (value) => {
        if (!value) return null;
        // Capitalize first letter of each word
        return value.toString().trim()
          .split(/\s+/)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      }
    },
    style: {
      aliases: ['style', 'type', 'material', 'matière', 'option3', 'pattern'],
      normalize: (value) => value?.toString().trim()
    },
    quantity: {
      aliases: ['quantity', 'pack', 'lot', 'bundle', 'quantité', 'pcs', 'pieces'],
      normalize: (value) => {
        const num = parseInt(value);
        return isNaN(num) ? value?.toString().trim() : `${num} pcs`;
      }
    }
  };

  /**
   * Platform-specific variant parsing strategies
   */
  const PLATFORM_PARSERS = {
    aliexpress: {
      /**
       * Parse AliExpress SKU module format
       */
      parse(rawVariants, productData) {
        const variants = [];
        
        // Handle skuModule format
        if (rawVariants?.skuPriceList || rawVariants?.productSKUPropertyList) {
          const skuPrices = rawVariants.skuPriceList || [];
          const properties = rawVariants.productSKUPropertyList || [];
          
          // Build option lookup map
          const optionMap = new Map();
          properties.forEach(prop => {
            const propName = prop.skuPropertyName;
            prop.skuPropertyValues?.forEach(val => {
              optionMap.set(val.propertyValueId || val.propertyValueIdLong, {
                type: this.detectOptionType(propName),
                name: propName,
                value: val.propertyValueDisplayName || val.propertyValueName,
                image: val.skuPropertyImagePath
              });
            });
          });

          // Build variants from price list
          skuPrices.forEach((sku, index) => {
            const propIds = (sku.skuPropIds || '').split(',').filter(Boolean);
            const options = {};
            let variantImage = null;

            propIds.forEach(id => {
              const opt = optionMap.get(parseInt(id)) || optionMap.get(id);
              if (opt) {
                options[opt.type] = opt.value;
                if (opt.image && !variantImage) variantImage = opt.image;
              }
            });

            variants.push({
              id: sku.skuId || `ali_${index}`,
              sku: sku.skuId || sku.skuCode || '',
              title: Object.values(options).join(' / ') || 'Default',
              price: parseFloat(sku.skuVal?.actSkuCalPrice || sku.skuVal?.skuCalPrice || productData?.price || 0),
              compare_at_price: parseFloat(sku.skuVal?.skuCalPrice) || null,
              inventory_quantity: parseInt(sku.skuVal?.availQuantity) || 0,
              available: parseInt(sku.skuVal?.availQuantity) > 0,
              image_url: variantImage ? this.normalizeImage(variantImage) : null,
              position: index + 1,
              options
            });
          });
        }
        
        // Handle legacy array format
        if (Array.isArray(rawVariants) && rawVariants.length > 0) {
          rawVariants.forEach((v, i) => {
            if (!variants.some(existing => existing.id === (v.skuId || v.id))) {
              variants.push(this.normalizeVariant(v, i, productData));
            }
          });
        }

        return variants;
      },

      detectOptionType(propName) {
        const lower = propName?.toLowerCase() || '';
        for (const [type, config] of Object.entries(OPTION_TYPES)) {
          if (config.aliases.some(alias => lower.includes(alias))) {
            return type;
          }
        }
        return 'option1';
      },

      normalizeImage(url) {
        if (!url) return null;
        if (url.startsWith('//')) return 'https:' + url;
        // Force 800x800 resolution
        return url.replace(/_\d+x\d+\.(jpg|png|webp)/gi, '_800x800.$1');
      },

      normalizeVariant(v, index, productData) {
        return {
          id: v.skuId || v.id || `variant_${index}`,
          sku: v.sku || v.skuCode || '',
          title: v.title || v.name || 'Default',
          price: parseFloat(v.price || v.skuPrice || productData?.price || 0),
          compare_at_price: parseFloat(v.originalPrice) || null,
          inventory_quantity: parseInt(v.stock || v.quantity) || 0,
          available: (v.available !== false) && (parseInt(v.stock) !== 0),
          image_url: this.normalizeImage(v.image || v.imageUrl),
          position: index + 1,
          options: v.options || this.extractOptions(v)
        };
      },

      extractOptions(v) {
        const options = {};
        ['size', 'color', 'style', 'option1', 'option2', 'option3'].forEach(key => {
          if (v[key]) options[key] = v[key];
        });
        return options;
      }
    },

    amazon: {
      /**
       * Parse Amazon twister/variation data
       */
      parse(rawVariants, productData) {
        const variants = [];

        // Handle twisterSlotData format
        if (rawVariants?.variationValues || rawVariants?.asinToDimensionIndexMap) {
          const dimensions = rawVariants.dimensionToAsinMap || {};
          const values = rawVariants.variationValues || {};
          const asinMap = rawVariants.asinVariationValues || {};

          Object.entries(asinMap).forEach(([asin, dims], index) => {
            const options = {};
            Object.entries(dims || {}).forEach(([dimName, dimValue]) => {
              const type = this.detectOptionType(dimName);
              options[type] = dimValue;
            });

            variants.push({
              id: asin,
              sku: asin,
              title: Object.values(options).join(' / ') || 'Default',
              price: parseFloat(productData?.price || 0),
              compare_at_price: parseFloat(productData?.originalPrice) || null,
              inventory_quantity: 0, // Amazon doesn't expose this
              available: true,
              position: index + 1,
              options
            });
          });
        }

        // Handle standard variations array
        if (Array.isArray(rawVariants)) {
          rawVariants.forEach((v, i) => {
            const existing = variants.find(ex => ex.id === (v.asin || v.id));
            if (!existing) {
              variants.push(this.normalizeVariant(v, i, productData));
            }
          });
        }

        return variants;
      },

      detectOptionType(dimName) {
        const lower = dimName?.toLowerCase() || '';
        if (lower.includes('size') || lower.includes('taille')) return 'size';
        if (lower.includes('color') || lower.includes('colour') || lower.includes('couleur')) return 'color';
        if (lower.includes('style') || lower.includes('pattern')) return 'style';
        return 'option1';
      },

      normalizeVariant(v, index, productData) {
        return {
          id: v.asin || v.id || `variant_${index}`,
          sku: v.asin || v.sku || '',
          title: v.title || v.name || 'Default',
          price: parseFloat(v.price || productData?.price || 0),
          compare_at_price: parseFloat(v.listPrice || v.originalPrice) || null,
          inventory_quantity: parseInt(v.stock) || 0,
          available: v.available !== false,
          image_url: v.image || v.imageUrl || null,
          position: index + 1,
          options: v.options || {}
        };
      }
    },

    shopify: {
      /**
       * Parse Shopify product.variants format
       */
      parse(rawVariants, productData) {
        if (!Array.isArray(rawVariants)) {
          rawVariants = rawVariants?.variants || [];
        }

        return rawVariants.map((v, index) => ({
          id: String(v.id),
          sku: v.sku || '',
          title: v.title || this.buildTitle(v),
          price: parseFloat(v.price || 0),
          compare_at_price: parseFloat(v.compare_at_price) || null,
          inventory_quantity: parseInt(v.inventory_quantity) || 0,
          available: v.available !== false,
          weight: parseFloat(v.weight) || null,
          weight_unit: v.weight_unit || 'kg',
          barcode: v.barcode || '',
          image_url: v.featured_image?.src || v.image?.src || null,
          position: v.position || index + 1,
          options: {
            option1: v.option1,
            option2: v.option2,
            option3: v.option3
          }
        })).filter(v => v.title && v.title !== 'Default Title' || rawVariants.length === 1);
      },

      buildTitle(v) {
        return [v.option1, v.option2, v.option3].filter(Boolean).join(' / ') || 'Default';
      }
    },

    temu: {
      /**
       * Parse Temu sku_list format
       */
      parse(rawVariants, productData) {
        const variants = [];

        if (Array.isArray(rawVariants)) {
          rawVariants.forEach((v, index) => {
            const options = {};
            
            // Parse spec array
            if (Array.isArray(v.spec)) {
              v.spec.forEach(spec => {
                const type = this.detectOptionType(spec.spec_key || spec.name);
                options[type] = spec.spec_value || spec.value;
              });
            }

            variants.push({
              id: String(v.sku_id || v.id || index),
              sku: v.sku_id || v.sku || '',
              title: Object.values(options).join(' / ') || v.title || 'Default',
              price: parseFloat(v.price || v.sale_price || productData?.price || 0) / 100, // Temu prices in cents
              compare_at_price: v.market_price ? parseFloat(v.market_price) / 100 : null,
              inventory_quantity: parseInt(v.stock || v.quantity) || 0,
              available: parseInt(v.stock) > 0,
              image_url: v.thumb_url || v.image || null,
              position: index + 1,
              options
            });
          });
        }

        return variants;
      },

      detectOptionType(key) {
        const lower = key?.toLowerCase() || '';
        if (lower.includes('size') || lower.includes('尺码')) return 'size';
        if (lower.includes('color') || lower.includes('颜色')) return 'color';
        return 'option1';
      }
    },

    ebay: {
      /**
       * Parse eBay item variations
       */
      parse(rawVariants, productData) {
        const variants = [];

        if (rawVariants?.variationSpecificsSet || rawVariants?.variationValues) {
          const specifics = rawVariants.variationSpecificsSet || {};
          const values = rawVariants.variationValues || {};

          Object.entries(values).forEach(([combo, data], index) => {
            const options = {};
            const parts = combo.split('|');
            
            parts.forEach((part, i) => {
              const [name, value] = part.split(':');
              if (name && value) {
                options[this.detectOptionType(name)] = value;
              }
            });

            variants.push({
              id: data?.variationId || `ebay_${index}`,
              sku: data?.sku || '',
              title: Object.values(options).join(' / ') || 'Default',
              price: parseFloat(data?.price || productData?.price || 0),
              compare_at_price: null,
              inventory_quantity: parseInt(data?.quantity || data?.quantityAvailable) || 0,
              available: parseInt(data?.quantity) > 0,
              image_url: data?.imageUrl || null,
              position: index + 1,
              options
            });
          });
        }

        // Fallback to array format
        if (Array.isArray(rawVariants) && variants.length === 0) {
          rawVariants.forEach((v, i) => {
            variants.push({
              id: v.variationId || v.id || `variant_${i}`,
              sku: v.sku || '',
              title: v.title || v.name || 'Default',
              price: parseFloat(v.price || productData?.price || 0),
              compare_at_price: null,
              inventory_quantity: parseInt(v.quantity) || 0,
              available: v.available !== false,
              position: i + 1,
              options: v.specifics || v.options || {}
            });
          });
        }

        return variants;
      },

      detectOptionType(name) {
        const lower = name?.toLowerCase() || '';
        if (lower.includes('size')) return 'size';
        if (lower.includes('color') || lower.includes('colour')) return 'color';
        return 'style';
      }
    },

    // Default parser for unknown platforms
    generic: {
      parse(rawVariants, productData) {
        if (!Array.isArray(rawVariants)) {
          rawVariants = rawVariants?.variants || rawVariants?.options || [];
        }

        return rawVariants.map((v, index) => ({
          id: String(v.id || v.sku || `variant_${index}`),
          sku: v.sku || '',
          title: v.title || v.name || this.buildGenericTitle(v) || 'Default',
          price: parseFloat(v.price || productData?.price || 0),
          compare_at_price: parseFloat(v.compare_at_price || v.originalPrice) || null,
          inventory_quantity: parseInt(v.stock || v.inventory_quantity || v.quantity) || 0,
          available: v.available !== false && v.in_stock !== false,
          image_url: v.image || v.image_url || v.imageUrl || null,
          position: index + 1,
          options: this.extractGenericOptions(v)
        }));
      },

      buildGenericTitle(v) {
        const parts = [];
        ['option1', 'option2', 'option3', 'size', 'color', 'style'].forEach(key => {
          if (v[key]) parts.push(v[key]);
        });
        return parts.join(' / ');
      },

      extractGenericOptions(v) {
        const options = {};
        Object.entries(v).forEach(([key, value]) => {
          if (typeof value === 'string' && ['size', 'color', 'style', 'option1', 'option2', 'option3'].includes(key.toLowerCase())) {
            options[key] = value;
          }
        });
        return options;
      }
    }
  };

  /**
   * Main VariantMapper class
   */
  class VariantMapper {
    constructor() {
      this.version = '5.7.0';
      this.parsers = PLATFORM_PARSERS;
      this.optionTypes = OPTION_TYPES;
    }

    /**
     * Map variants from any platform to unified format
     * @param {any} rawVariants - Raw variant data from extractor
     * @param {string} platform - Source platform
     * @param {object} productData - Parent product data for fallback values
     * @returns {Array} Normalized variant array
     */
    map(rawVariants, platform, productData = {}) {
      console.log(`[VariantMapper] Mapping variants for ${platform}:`, {
        rawCount: Array.isArray(rawVariants) ? rawVariants.length : 'object',
        hasProductData: !!productData.price
      });

      // Get platform-specific parser
      const parser = this.parsers[platform] || this.parsers.generic;
      
      // Parse variants
      let variants = [];
      try {
        variants = parser.parse(rawVariants, productData);
      } catch (error) {
        console.error(`[VariantMapper] Parsing error for ${platform}:`, error);
        variants = this.parsers.generic.parse(rawVariants, productData);
      }

      // Validate and normalize each variant
      variants = variants
        .map((v, i) => this.validateVariant(v, i, productData))
        .filter(v => v !== null);

      // Deduplicate by ID
      const seen = new Set();
      variants = variants.filter(v => {
        if (seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
      });

      // Sort by position
      variants.sort((a, b) => (a.position || 0) - (b.position || 0));

      console.log(`[VariantMapper] Mapped ${variants.length} variants`);
      return variants;
    }

    /**
     * Validate and fill missing fields
     */
    validateVariant(variant, index, productData) {
      if (!variant) return null;

      // Ensure required fields
      return {
        id: String(variant.id || `variant_${index}`),
        sku: variant.sku || '',
        title: variant.title || 'Default',
        price: this.ensurePositiveNumber(variant.price, productData.price || 0),
        compare_at_price: variant.compare_at_price > variant.price ? variant.compare_at_price : null,
        inventory_quantity: Math.max(0, parseInt(variant.inventory_quantity) || 0),
        available: variant.available !== false,
        weight: variant.weight || null,
        weight_unit: variant.weight_unit || 'kg',
        barcode: variant.barcode || '',
        image_url: variant.image_url || null,
        position: variant.position || index + 1,
        options: this.normalizeOptions(variant.options || {})
      };
    }

    /**
     * Ensure value is a positive number
     */
    ensurePositiveNumber(value, fallback = 0) {
      const num = parseFloat(value);
      return isNaN(num) || num < 0 ? fallback : num;
    }

    /**
     * Normalize option keys and values
     */
    normalizeOptions(options) {
      const normalized = {};
      
      Object.entries(options).forEach(([key, value]) => {
        if (!value) return;
        
        // Find matching option type
        const lowerKey = key.toLowerCase();
        let normalizedKey = key;
        let normalizer = (v) => v?.toString().trim();

        for (const [type, config] of Object.entries(this.optionTypes)) {
          if (config.aliases.some(alias => lowerKey.includes(alias))) {
            normalizedKey = type.charAt(0).toUpperCase() + type.slice(1); // Capitalize
            normalizer = config.normalize;
            break;
          }
        }

        const normalizedValue = normalizer(value);
        if (normalizedValue) {
          normalized[normalizedKey] = normalizedValue;
        }
      });

      return normalized;
    }

    /**
     * Get all unique option names from variants
     */
    getOptionNames(variants) {
      const names = new Set();
      variants.forEach(v => {
        Object.keys(v.options || {}).forEach(name => names.add(name));
      });
      return Array.from(names);
    }

    /**
     * Get all unique option values for a given option name
     */
    getOptionValues(variants, optionName) {
      const values = new Set();
      variants.forEach(v => {
        const value = v.options?.[optionName];
        if (value) values.add(value);
      });
      return Array.from(values);
    }

    /**
     * Build option definitions (for Shopify-like systems)
     */
    buildOptionDefinitions(variants) {
      const options = [];
      const names = this.getOptionNames(variants);

      names.forEach((name, index) => {
        options.push({
          name: name,
          position: index + 1,
          values: this.getOptionValues(variants, name)
        });
      });

      return options;
    }

    /**
     * Calculate variant coverage score
     */
    calculateCoverage(variants, expectedFields = ['price', 'sku', 'image_url', 'inventory_quantity']) {
      if (!variants.length) return { score: 0, details: {} };

      const coverage = {};
      expectedFields.forEach(field => {
        const filled = variants.filter(v => {
          const value = v[field];
          if (field === 'price') return value > 0;
          if (field === 'inventory_quantity') return value >= 0;
          return value !== null && value !== undefined && value !== '';
        }).length;
        
        coverage[field] = Math.round((filled / variants.length) * 100);
      });

      const avgScore = Object.values(coverage).reduce((a, b) => a + b, 0) / Object.keys(coverage).length;

      return {
        score: Math.round(avgScore),
        details: coverage,
        totalVariants: variants.length
      };
    }
  }

  // Singleton instance
  const variantMapper = new VariantMapper();

  // Export
  if (typeof window !== 'undefined') {
    window.ShopOptiVariantMapper = variantMapper;
    window.VariantMapper = VariantMapper;
  }

  console.log('[ShopOpti+] VariantMapper v5.7.0 loaded');

})();
