/**
 * ShopOpti+ - Advanced Product Scraper v5.7.0
 * Complete extraction: Title, Description, Brand, Stock, Shipping, Variants, Price, Category, Images, Videos, Reviews
 * With persistent monitoring and stock tracking
 * Supports 45+ platforms with local fallback when API fails
 */

(function() {
  'use strict';

  if (window.__dropCraftAdvancedScraperLoaded) return;
  window.__dropCraftAdvancedScraperLoaded = true;

  const SCRAPER_CONFIG = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    MAX_IMAGES: 20,
    MAX_REVIEWS: 50,
    MAX_VIDEOS: 10
  };

  class AdvancedProductScraper {
    constructor() {
      this.platform = this.detectPlatform();
      this.productData = null;
    }

    detectPlatform() {
      const hostname = window.location.hostname.toLowerCase();
      
      const platforms = {
        'aliexpress': ['aliexpress'],
        'amazon': ['amazon'],
        'ebay': ['ebay'],
        'temu': ['temu'],
        'walmart': ['walmart'],
        'etsy': ['etsy'],
        'cdiscount': ['cdiscount'],
        'fnac': ['fnac'],
        'rakuten': ['rakuten'],
        'darty': ['darty'],
        'boulanger': ['boulanger'],
        'manomano': ['manomano'],
        'leroymerlin': ['leroymerlin', 'leroy-merlin'],
        'homedepot': ['homedepot', 'home depot'],
        'lowes': ['lowes'],
        'costco': ['costco'],
        'shein': ['shein'],
        'alibaba': ['alibaba', '1688'],
        'shopify': ['myshopify'],
        'target': ['target'],
        'bestbuy': ['bestbuy'],
        'newegg': ['newegg'],
        'tiktok': ['tiktok', 'tiktokshop'],
        'wish': ['wish']
      };

      for (const [platform, patterns] of Object.entries(platforms)) {
        if (patterns.some(p => hostname.includes(p))) {
          return platform;
        }
      }
      
      return 'generic';
    }

    /**
     * Main extraction method - returns complete product data
     */
    async extractCompleteProduct() {
      console.log('[AdvancedScraper] Extracting from:', this.platform);

      const baseData = {
        url: window.location.href,
        platform: this.platform,
        scrapedAt: new Date().toISOString()
      };

      // Extract all components in parallel
      const [
        basicInfo,
        brand,
        pricing,
        stock,
        shipping,
        category,
        images,
        videos,
        variants,
        reviews,
        specifications
      ] = await Promise.all([
        this.extractBasicInfo(),
        this.extractBrand(),
        this.extractPricing(),
        this.extractStock(),
        this.extractShipping(),
        this.extractCategory(),
        this.extractImages(),
        this.extractVideos(),
        this.extractVariants(),
        this.extractReviews(),
        this.extractSpecifications()
      ]);

      this.productData = {
        ...baseData,
        ...basicInfo,
        brand,
        ...pricing,
        ...stock,
        ...shipping,
        category,
        images,
        videos,
        variants,
        reviews,
        specifications
      };

      console.log('[AdvancedScraper] Extracted product:', {
        title: this.productData.title?.substring(0, 50),
        brand: this.productData.brand,
        price: this.productData.price,
        stockStatus: this.productData.stockStatus,
        stockQuantity: this.productData.stockQuantity,
        imagesCount: this.productData.images?.length || 0,
        videosCount: this.productData.videos?.length || 0,
        variantsCount: this.productData.variants?.length || 0,
        reviewsCount: this.productData.reviews?.length || 0
      });

      return this.productData;
    }

    // ==================== BASIC INFO ====================
    
    async extractBasicInfo() {
      // Try JSON-LD first
      const jsonLD = this.extractFromJsonLD();
      if (jsonLD.title) {
        return jsonLD;
      }

      // Try OG tags
      const ogData = this.extractFromOpenGraph();
      if (ogData.title) {
        return ogData;
      }

      // DOM fallback
      return this.extractBasicFromDOM();
    }

    extractFromJsonLD() {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          const products = Array.isArray(data) ? data : [data];
          
          for (const item of products) {
            if (item['@type'] === 'Product') {
              return {
                title: item.name || '',
                description: item.description || '',
                sku: item.sku || item.productID || '',
                gtin: item.gtin || item.gtin13 || item.gtin12 || '',
                mpn: item.mpn || ''
              };
            }
          }
        } catch (e) {}
      }
      
      return {};
    }

    extractFromOpenGraph() {
      const getMeta = (property) => {
        const el = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
        return el?.content || '';
      };

      return {
        title: getMeta('og:title') || getMeta('twitter:title'),
        description: getMeta('og:description') || getMeta('twitter:description') || getMeta('description')
      };
    }

    extractBasicFromDOM() {
      const titleSelectors = [
        'h1[data-testid*="title"]', 'h1.product-title', 'h1.pdp-title',
        '#productTitle', '.product-name h1', '[data-hook="product-title"]',
        'h1[itemprop="name"]', '.title-container h1', 'h1'
      ];

      const descSelectors = [
        '[data-testid*="description"]', '#productDescription', '.product-description',
        '[itemprop="description"]', '.description-content', '#feature-bullets'
      ];

      let title = '';
      for (const sel of titleSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          title = this.cleanText(el.textContent);
          break;
        }
      }

      let description = '';
      for (const sel of descSelectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) {
          description = el.textContent.trim().substring(0, 5000);
          break;
        }
      }

      return { title, description };
    }

    // ==================== BRAND ====================
    
    async extractBrand() {
      // JSON-LD brand
      const jsonLDBrand = this.extractBrandFromJsonLD();
      if (jsonLDBrand) return jsonLDBrand;

      // Platform-specific selectors
      const brandSelectors = {
        amazon: ['#bylineInfo', '.po-brand .a-span9', 'a#brand', '#brand'],
        aliexpress: ['.store-name', '[class*="store-name"]', '.shop-name'],
        ebay: ['[data-testid="x-store-info"] a', '.seller-info a', '.ux-seller-section a'],
        walmart: ['[data-testid="brand-link"]', '.brand-link', '[itemprop="brand"]'],
        cdiscount: ['.fpBrandName', '.brand-name', '[itemprop="brand"]'],
        fnac: ['.f-productBrand', '.brand', '[itemprop="brand"]'],
        temu: ['[class*="brand"]', '.shop-name'],
        etsy: ['.shop-name-and-title a', '.wt-text-link'],
        homedepot: ['.brand-link', '[itemprop="brand"]'],
        lowes: ['.brand', '[itemprop="brand"]'],
        costco: ['.product-brand', '.brand-link'],
        generic: ['[itemprop="brand"]', '.brand', '.vendor', '.manufacturer', '[data-brand]']
      };

      const selectors = brandSelectors[this.platform] || brandSelectors.generic;
      
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          const brand = el.textContent?.trim() || el.getAttribute('content') || '';
          if (brand && brand.length > 1 && brand.length < 100) {
            return this.cleanText(brand).replace(/^(par|by|marque|brand|visit|visiter)\s*/i, '');
          }
        }
      }

      return null;
    }

    extractBrandFromJsonLD() {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          const items = Array.isArray(data) ? data : [data];
          
          for (const item of items) {
            if (item['@type'] === 'Product' && item.brand) {
              return typeof item.brand === 'string' ? item.brand : item.brand.name;
            }
          }
        } catch (e) {}
      }
      
      return null;
    }

    // ==================== PRICING ====================
    
    async extractPricing() {
      // JSON-LD pricing
      const jsonLDPrice = this.extractPriceFromJsonLD();
      if (jsonLDPrice.price) return jsonLDPrice;

      // DOM pricing
      return this.extractPriceFromDOM();
    }

    extractPriceFromJsonLD() {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          const items = Array.isArray(data) ? data : [data];
          
          for (const item of items) {
            if (item['@type'] === 'Product' && item.offers) {
              const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              return {
                price: parseFloat(offers.price) || 0,
                originalPrice: parseFloat(offers.highPrice) || null,
                currency: offers.priceCurrency || 'EUR'
              };
            }
          }
        } catch (e) {}
      }
      
      return {};
    }

    extractPriceFromDOM() {
      const priceSelectors = {
        amazon: ['#priceblock_ourprice', '#priceblock_dealprice', '.a-price .a-offscreen', '#corePrice_feature_div .a-offscreen'],
        aliexpress: ['.product-price-current', '[class*="price-current"]', '.uniform-banner-box-price'],
        ebay: ['[data-testid="x-price-primary"] .ux-textspans', '.x-price-primary', '[itemprop="price"]'],
        walmart: ['[data-testid="price"]', '[itemprop="price"]', '.price-characteristic'],
        cdiscount: ['.fpPrice', '.priceContainer .price', '.c-price'],
        fnac: ['.f-priceBox-price', '.userPrice', '.Price-current'],
        temu: ['[class*="price"]', '.goods-price'],
        etsy: ['.wt-text-title-03', '[data-buy-box-region="price"]'],
        homedepot: ['#standard-price', '.price-format__large'],
        lowes: ['.art-pd-price', '[data-price]'],
        costco: ['.price', '.your-price .value'],
        generic: ['[itemprop="price"]', '.price', '[class*="price"]', '[data-price]']
      };

      const originalPriceSelectors = [
        '.a-text-strike', '.originalPrice', '[data-testid="compare-at-price"]',
        '.was-price', '.old-price', '.list-price', 's.price', 'del', '.strikethrough'
      ];

      const selectors = priceSelectors[this.platform] || priceSelectors.generic;
      
      let price = 0;
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          price = this.parsePrice(el.textContent || el.getAttribute('content') || '');
          if (price > 0) break;
        }
      }

      // Original price
      let originalPrice = null;
      for (const sel of originalPriceSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const op = this.parsePrice(el.textContent || '');
          if (op > price) {
            originalPrice = op;
            break;
          }
        }
      }

      return { price, originalPrice, currency: this.detectCurrency() };
    }

    parsePrice(priceStr) {
      if (!priceStr || typeof priceStr !== 'string') return 0;
      
      let clean = priceStr
        .replace(/[€$£¥₹₽CHF\s]/gi, '')
        .replace(/EUR|USD|GBP/gi, '')
        .trim();
      
      // European format: 1.234,56 or 1 234,56
      if (/^\d{1,3}([\s.]\d{3})*,\d{2}$/.test(clean)) {
        clean = clean.replace(/[\s.]/g, '').replace(',', '.');
      } else if (clean.includes(',') && !clean.includes('.')) {
        clean = clean.replace(',', '.');
      } else if (clean.includes(',') && clean.includes('.')) {
        clean = clean.replace(/\./g, '').replace(',', '.');
      }
      
      return parseFloat(clean) || 0;
    }

    detectCurrency() {
      const currencyEl = document.querySelector('[itemprop="priceCurrency"], [data-currency]');
      if (currencyEl) {
        return currencyEl.getAttribute('content') || currencyEl.getAttribute('data-currency') || 'EUR';
      }
      
      const pageText = document.body.innerText.substring(0, 5000);
      if (pageText.includes('$') || pageText.includes('USD')) return 'USD';
      if (pageText.includes('£') || pageText.includes('GBP')) return 'GBP';
      return 'EUR';
    }

    // ==================== STOCK ====================
    
    async extractStock() {
      // JSON-LD availability
      const jsonLDStock = this.extractStockFromJsonLD();
      if (jsonLDStock.stockStatus) return jsonLDStock;

      // DOM extraction
      return this.extractStockFromDOM();
    }

    extractStockFromJsonLD() {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          const items = Array.isArray(data) ? data : [data];
          
          for (const item of items) {
            if (item['@type'] === 'Product' && item.offers) {
              const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              const availability = offers.availability || '';
              
              return {
                stockStatus: this.mapAvailability(availability),
                stockQuantity: null,
                inStock: availability.includes('InStock')
              };
            }
          }
        } catch (e) {}
      }
      
      return {};
    }

    extractStockFromDOM() {
      const stockSelectors = {
        amazon: ['#availability span', '#outOfStock', '.a-color-success'],
        aliexpress: ['[class*="stock"]', '.quantity-available', '[class*="inventory"]'],
        ebay: ['[data-testid="x-quantity"] span', '.qtyInfo', '.available-quantity'],
        walmart: ['[data-testid="add-to-cart-section"]', '.in-stock-message'],
        cdiscount: ['.fpAvailability', '.stockIndicator', '.availability'],
        fnac: ['.f-availabilityStatus', '.availability', '.stock-status'],
        temu: ['[class*="stock"]', '[class*="inventory"]'],
        generic: ['[itemprop="availability"]', '.stock-status', '.availability', '[class*="stock"]', '[class*="inventory"]']
      };

      const quantityPatterns = [
        /(\d+)\s*(en\s+stock|in\s+stock|disponible|available|left|restant)/i,
        /stock[:\s]+(\d+)/i,
        /quantity[:\s]+(\d+)/i,
        /(\d+)\s*disponible/i,
        /only\s*(\d+)\s*left/i,
        /plus que\s*(\d+)/i
      ];

      const selectors = stockSelectors[this.platform] || stockSelectors.generic;
      
      let stockStatus = 'unknown';
      let stockQuantity = null;
      let inStock = null;

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          const text = el.textContent?.toLowerCase() || '';
          const availabilityAttr = el.getAttribute('content') || '';
          
          // Check availability
          if (text.includes('rupture') || text.includes('out of stock') || 
              text.includes('épuisé') || text.includes('unavailable') ||
              availabilityAttr.includes('OutOfStock')) {
            stockStatus = 'out_of_stock';
            inStock = false;
          } else if (text.includes('en stock') || text.includes('in stock') || 
                     text.includes('disponible') || text.includes('available') ||
                     availabilityAttr.includes('InStock')) {
            stockStatus = 'in_stock';
            inStock = true;
          } else if (text.includes('précommande') || text.includes('pre-order') || text.includes('preorder')) {
            stockStatus = 'preorder';
            inStock = true;
          } else if (text.includes('limité') || text.includes('limited') || text.includes('few left')) {
            stockStatus = 'low_stock';
            inStock = true;
          }

          // Try to extract quantity
          for (const pattern of quantityPatterns) {
            const match = text.match(pattern);
            if (match) {
              stockQuantity = parseInt(match[1], 10);
              break;
            }
          }

          if (stockStatus !== 'unknown') break;
        }
      }

      // Check "Add to cart" button as fallback
      if (stockStatus === 'unknown') {
        const addToCartBtn = document.querySelector('#add-to-cart-button, [data-testid="add-to-cart"], .add-to-cart, .btn-add-cart');
        if (addToCartBtn && !addToCartBtn.disabled) {
          stockStatus = 'in_stock';
          inStock = true;
        }
      }

      return { stockStatus, stockQuantity, inStock };
    }

    mapAvailability(availability) {
      const map = {
        'InStock': 'in_stock',
        'OutOfStock': 'out_of_stock',
        'PreOrder': 'preorder',
        'LimitedAvailability': 'low_stock',
        'Discontinued': 'discontinued',
        'SoldOut': 'out_of_stock',
        'BackOrder': 'backorder'
      };

      for (const [key, value] of Object.entries(map)) {
        if (availability?.includes(key)) return value;
      }
      return 'unknown';
    }

    // ==================== SHIPPING ====================
    
    async extractShipping() {
      const shippingSelectors = {
        amazon: ['#deliveryMessageMirId', '#delivery-message', '#mir-layout-DELIVERY_BLOCK', '.shipping-message'],
        aliexpress: ['[class*="shipping"]', '.product-shipping', '[class*="delivery"]'],
        ebay: ['[data-testid="x-shipping"]', '.ux-labels-values--shipping', '#SRPSection'],
        walmart: ['[data-testid="fulfillment-shipping"]', '.fulfillment-option'],
        cdiscount: ['.deliveryInfos', '.fpShippingInfo', '.shipping-info'],
        fnac: ['.f-deliveryInfo', '.delivery-info', '.shipping'],
        temu: ['[class*="shipping"]', '[class*="delivery"]'],
        generic: ['[class*="shipping"]', '[class*="delivery"]', '[class*="fulfillment"]', '[itemprop="shippingDetails"]']
      };

      const freeShippingPatterns = [
        /livraison\s*(gratuite|offerte|incluse)/i,
        /free\s*(shipping|delivery)/i,
        /gratuit/i,
        /free/i
      ];

      const deliveryTimePatterns = [
        /livr[ée]\s*(?:le|sous|en|dans)?\s*(\d+[\s-]*\d*)\s*(jours?|semaines?|days?|weeks?)/i,
        /delivery\s*(?:in|by|within)?\s*(\d+[\s-]*\d*)\s*(days?|weeks?)/i,
        /(\d+[\s-]*\d*)\s*(jours?|semaines?|days?|weeks?)/i,
        /arrives?\s*(\w+\s*\d+)/i
      ];

      const selectors = shippingSelectors[this.platform] || shippingSelectors.generic;
      
      let shippingCost = null;
      let freeShipping = false;
      let deliveryTime = null;
      let shippingInfo = null;

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          const text = el.textContent?.trim() || '';
          shippingInfo = text.substring(0, 500);

          // Check free shipping
          if (freeShippingPatterns.some(p => p.test(text))) {
            freeShipping = true;
            shippingCost = 0;
          } else {
            // Try to extract shipping cost
            const costMatch = text.match(/(\d+[,.]?\d*)\s*(€|\$|£)/);
            if (costMatch) {
              shippingCost = this.parsePrice(costMatch[0]);
            }
          }

          // Extract delivery time
          for (const pattern of deliveryTimePatterns) {
            const match = text.match(pattern);
            if (match) {
              deliveryTime = match[0].trim();
              break;
            }
          }

          if (shippingInfo) break;
        }
      }

      return { shippingCost, freeShipping, deliveryTime, shippingInfo };
    }

    // ==================== CATEGORY ====================
    
    async extractCategory() {
      // Breadcrumbs
      const breadcrumbSelectors = [
        '.breadcrumb', '.breadcrumbs', 'nav[aria-label*="breadcrumb"]',
        '#wayfinding-breadcrumbs_feature_div', '.a-breadcrumb',
        '[data-testid="breadcrumb"]', '.fil-ariane'
      ];

      for (const sel of breadcrumbSelectors) {
        const container = document.querySelector(sel);
        if (container) {
          const links = container.querySelectorAll('a, span:not(.separator)');
          const parts = Array.from(links)
            .map(el => el.textContent?.trim())
            .filter(t => t && t.length > 1 && !['>', '/', '|', 'accueil', 'home'].includes(t.toLowerCase()));
          
          if (parts.length > 0) {
            return parts.slice(-2).join(' > '); // Last 2 categories
          }
        }
      }

      // Meta category
      const categoryMeta = document.querySelector('meta[property="product:category"], meta[name="category"]');
      if (categoryMeta) {
        return categoryMeta.getAttribute('content');
      }

      return null;
    }

    // ==================== IMAGES ====================
    
    async extractImages() {
      const images = new Set();
      console.log('[AdvancedScraper] Starting ENHANCED image extraction for:', this.platform);

      // ===== 0. Click all thumbnails to load full images (critical for galleries) =====
      await this.expandAllGalleryImages();

      // ===== 1. JSON-LD images (highest priority) =====
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) {
            if (item['@type'] === 'Product' && item.image) {
              const imgs = Array.isArray(item.image) ? item.image : [item.image];
              imgs.forEach(img => {
                const url = this.cleanImageUrl(typeof img === 'string' ? img : img.url);
                if (url) images.add(url);
              });
            }
          }
        } catch (e) {}
      }
      console.log('[AdvancedScraper] After JSON-LD:', images.size, 'images');

      // ===== 2. Embedded JSON data (AliExpress, Temu, Shopify) =====
      const allScripts = document.querySelectorAll('script:not([type]), script[type="text/javascript"]');
      for (const script of allScripts) {
        const content = script.textContent || '';
        
        // AliExpress patterns
        const aliPatterns = [
          /"imageUrl"\s*:\s*"([^"]+)"/g,
          /"imagePathList"\s*:\s*\[([^\]]+)\]/,
          /"originalUrl"\s*:\s*"([^"]+)"/g,
          /"imgUrl"\s*:\s*"([^"]+)"/g,
          /"imageSrc"\s*:\s*"([^"]+)"/g
        ];
        
        for (const pattern of aliPatterns) {
          if (pattern.global) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
              const url = this.cleanImageUrl(match[1]);
              if (url) images.add(url);
            }
          } else {
            const match = content.match(pattern);
            if (match && match[1]) {
              // Handle array of paths
              const paths = match[1].match(/"([^"]+)"/g);
              if (paths) {
                paths.forEach(p => {
                  let imgUrl = p.replace(/"/g, '');
                  if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
                  const url = this.cleanImageUrl(imgUrl);
                  if (url) images.add(url);
                });
              }
            }
          }
        }
        
        // Amazon patterns
        if (content.includes('colorImages') || content.includes('ImageBlockATF')) {
          const amazonMatches = content.match(/"hiRes"\s*:\s*"([^"]+)"/g) || [];
          amazonMatches.forEach(m => {
            const urlMatch = m.match(/"hiRes"\s*:\s*"([^"]+)"/);
            if (urlMatch) {
              const url = this.cleanImageUrl(urlMatch[1]);
              if (url) images.add(url);
            }
          });
          
          const largeMatches = content.match(/"large"\s*:\s*"([^"]+)"/g) || [];
          largeMatches.forEach(m => {
            const urlMatch = m.match(/"large"\s*:\s*"([^"]+)"/);
            if (urlMatch) {
              const url = this.cleanImageUrl(urlMatch[1]);
              if (url) images.add(url);
            }
          });
        }
        
        // Shopify patterns
        if (content.includes('Shopify') || content.includes('product.variants')) {
          const shopifyMatches = content.match(/"src"\s*:\s*"(https?:\/\/[^"]+shopify[^"]+)"/g) || [];
          shopifyMatches.forEach(m => {
            const urlMatch = m.match(/"src"\s*:\s*"([^"]+)"/);
            if (urlMatch) {
              const url = this.cleanImageUrl(urlMatch[1]);
              if (url) images.add(url);
            }
          });
        }
      }
      console.log('[AdvancedScraper] After embedded JSON:', images.size, 'images');

      // ===== 3. Platform-specific image selectors =====
      const imageSelectors = {
        aliexpress: [
          '.slider--img--item img', '.slider--slide--K6MIH9z img', '.image-view-magnifier-wrap img',
          '.images-view-wrap img', '.pdp-slide img', 'img[src*="ae0"]', 'img[src*="alicdn"]',
          '.sku--image--jvAmHBF img', '[class*="gallery"] img', '.product-image-view img',
          '.magnifier-image img', '.pdp-module-img img', '.swiper-slide img'
        ],
        amazon: [
          '#imgTagWrapperId img', '#landingImage', '.a-dynamic-image', '#altImages img',
          '#imageBlock img', '.imgTagWrapper img', '[data-old-hires]', '.image-thumb img',
          '#ivLargeImage img', '.mainImageContainer img'
        ],
        ebay: [
          '[data-testid="ux-image-carousel"] img', '.ux-image-carousel img', '#mainImgHldr img',
          '.ux-image-grid img', '.vi-image-gallery img', '.filmstrip img', '.picture-panel img'
        ],
        walmart: [
          '[data-testid="product-image"] img', '.prod-hero-image img', '.zoom-image img',
          '.ProductImageGroup img', '.hover-zoom-hero-image img', '.thumbnail-image img'
        ],
        cdiscount: [
          '.fpMainPicture img', '.fpThumbs img', '.productMedia img', '.product-gallery img',
          '.jsMainProductPicture img', '.product-picture img', '.swiper-slide img'
        ],
        fnac: [
          '.f-productVisual img', '.gallery img', '.product-image img', '.slider img',
          '.carousel-item img', '.thumb-item img', '.picture img'
        ],
        shopify: [
          '.product__media img', '.product-featured-img', '.product-single__photo img',
          '.product-images img', '.ProductGallery img', '[data-product-featured-image]',
          '.product__photos img', '.carousel img', '.swiper-slide img'
        ],
        temu: [
          '[class*="gallery"] img', '[class*="product-image"] img', '.swiper-slide img',
          '[class*="slider"] img', '.goods-gallery img', '[class*="carousel"] img'
        ],
        etsy: [
          '.listing-page-image img', '[data-carousel-image] img', '.carousel-image img',
          '.image-carousel img', '.listing-image img', '.wt-max-width-full img'
        ],
        homedepot: [
          '.mediagallery__mainimage img', '.product-image img', 'img[src*="homedepot"]',
          '.thumbnails img', '.media-gallery img', '.main-image img'
        ],
        lowes: [
          '.product-image img', 'img[src*="lowes"]', '.gallery img', '.main-image img',
          '.carousel img', '.thumbnail img', '.product-hero img'
        ],
        costco: [
          '.product-image img', 'img[src*="costco"]', '.gallery img', '.main-image img',
          '.thumbnail-list img', '.image-carousel img'
        ],
        rakuten: [
          '.productImage', 'img[src*="rakuten"]', '.product-gallery img', '.offer-image img',
          '.gallery-item img', '.main-image img', '.thumbnail img'
        ],
        darty: [
          '.product-image img', 'img[src*="darty"]', '.gallery img', '.carousel img',
          '.product-picture img', '.slider-item img', '.thumbnail img'
        ],
        boulanger: [
          '.product-image img', 'img[src*="boulanger"]', '.gallery img', '.carousel img',
          '.slider img', '.media-gallery img', '.product-gallery img'
        ],
        manomano: [
          '.product-image img', '.ProductImage img', '.gallery img', '.carousel img',
          '.swiper-slide img', '.thumbnail img', '.media-gallery img'
        ],
        leroymerlin: [
          '.product-image img', 'img[src*="leroymerlin"]', '.gallery img', '.carousel img',
          '.media img', '.slider img', '.thumbnail img'
        ],
        shein: [
          '.product-intro__main-image img', '.goods-detail-bigImg img', 'img[src*="shein"]',
          '.product-image-carousel img', '.crop-image-container img', '.swiper-slide img'
        ],
        banggood: [
          '.product-image img', 'img[src*="banggood"]', '.gallery img', '.slide img',
          '.product-gallery img', '.thumbnail img', '.main-image img'
        ],
        dhgate: [
          '.product-image img', 'img[src*="dhgate"]', '.gallery img', '.slide img',
          '.product-gallery img', '.carousel img', '.main-image img'
        ],
        wish: [
          '.product-image img', '.ProductImage img', '.gallery img', '.carousel img',
          '.swiper-slide img', '.main-image img', '.thumbnail img'
        ],
        generic: [
          '[itemprop="image"]', '.product-image img', '.gallery img', 'img[class*="product"]',
          '.carousel img', '.slider img', '.swiper-slide img', '.thumbnail img',
          '[data-testid*="image"] img', 'main img', '.main-image img'
        ]
      };

      const selectors = imageSelectors[this.platform] || imageSelectors.generic;

      for (const sel of selectors) {
        document.querySelectorAll(sel).forEach(img => {
          // Get all possible image sources
          const sources = [
            img.src,
            img.dataset.src,
            img.dataset.original,
            img.dataset.zoom,
            img.dataset.zoomImage,
            img.dataset.large,
            img.dataset.highres,
            img.dataset.lazySrc,
            img.getAttribute('data-lazy-src'),
            img.getAttribute('data-old-hires'),
            img.getAttribute('data-a-dynamic-image') ? Object.keys(JSON.parse(img.getAttribute('data-a-dynamic-image') || '{}'))[0] : null
          ].filter(Boolean);
          
          sources.forEach(src => {
            const url = this.cleanImageUrl(src);
            if (url) images.add(url);
          });
        });

        if (images.size >= SCRAPER_CONFIG.MAX_IMAGES) break;
      }
      console.log('[AdvancedScraper] After DOM selectors:', images.size, 'images');

      // ===== 4. High-res data attributes scan =====
      document.querySelectorAll('img[data-zoom-image], img[data-large], img[data-src], img[data-highres], img[data-original]').forEach(el => {
        const sources = [
          el.dataset.zoomImage, el.dataset.large, el.dataset.src,
          el.dataset.highres, el.dataset.original, el.src
        ].filter(Boolean);
        
        sources.forEach(src => {
          const url = this.cleanImageUrl(src);
          if (url && images.size < SCRAPER_CONFIG.MAX_IMAGES) images.add(url);
        });
      });

      // ===== 5. OG image fallback =====
      const ogImage = document.querySelector('meta[property="og:image"]')?.content;
      if (ogImage && images.size < SCRAPER_CONFIG.MAX_IMAGES) {
        const url = this.cleanImageUrl(ogImage);
        if (url) images.add(url);
      }

      // ===== 6. srcset extraction (high-res images) =====
      document.querySelectorAll('img[srcset]').forEach(img => {
        const srcset = img.getAttribute('srcset');
        if (srcset) {
          // Parse srcset to get highest resolution
          const entries = srcset.split(',').map(s => s.trim().split(' '));
          entries.forEach(entry => {
            if (entry[0]) {
              const url = this.cleanImageUrl(entry[0]);
              if (url && images.size < SCRAPER_CONFIG.MAX_IMAGES) images.add(url);
            }
          });
        }
      });

      // ===== 7. Extract from thumbnail containers (critical for galleries) =====
      const thumbContainerSelectors = [
        '.thumbnails img', '.thumb-list img', '.product-thumbnails img',
        '#altImages img', '.image-thumbs img', '.gallery-thumbs img',
        '[class*="thumbnail"] img', '[class*="thumb-"] img', '.fpThumbs img',
        '.image-gallery-thumbnails img', '.slick-dots img', '.swiper-thumbs img',
        '.MagicToolboxSelectorsContainer img', '.s7thumbCell img', '#ivThumbs img'
      ];
      
      for (const sel of thumbContainerSelectors) {
        document.querySelectorAll(sel).forEach(img => {
          // Get highest res version from thumb
          const sources = [
            img.dataset.zoomImage, img.dataset.large, img.dataset.src,
            img.dataset.highres, img.dataset.original, img.dataset.zoom,
            img.src?.replace(/_\d+x\d+\./, '.').replace(/\/s\d+\//, '/').replace(/_SX\d+_/, '_SL1500_')
          ].filter(Boolean);
          
          sources.forEach(src => {
            const url = this.cleanImageUrl(src);
            if (url && images.size < SCRAPER_CONFIG.MAX_IMAGES) images.add(url);
          });
        });
      }

      // ===== 8. CSS background images =====
      document.querySelectorAll('[style*="background-image"]').forEach(el => {
        const style = el.getAttribute('style');
        const match = style?.match(/background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/i);
        if (match && match[1]) {
          const url = this.cleanImageUrl(match[1]);
          if (url && images.size < SCRAPER_CONFIG.MAX_IMAGES) images.add(url);
        }
      });

      console.log('[AdvancedScraper] Final image count:', images.size);
      return Array.from(images).slice(0, SCRAPER_CONFIG.MAX_IMAGES);
    }

    // Helper to expand gallery images
    async expandAllGalleryImages() {
      try {
        // Click on all thumbnails to load full images
        const thumbSelectors = [
          '#altImages .a-button-thumbnail', // Amazon
          '.thumbnails button', '.thumbnail-item',
          '[class*="thumb"] button', '.image-thumb',
          '.swiper-slide-thumb-active', '.gallery-thumb',
          '.fpThumbs a', '.fpThumbs button', // Cdiscount
          '.slick-slide', '.carousel-indicators button'
        ];
        
        for (const sel of thumbSelectors) {
          const thumbs = document.querySelectorAll(sel);
          for (const thumb of thumbs) {
            if (thumb.click) {
              thumb.click();
              await new Promise(r => setTimeout(r, 100)); // Wait for image load
            }
          }
        }
      } catch (e) {
        console.log('[AdvancedScraper] Gallery expansion warning:', e);
      }
    }

    cleanImageUrl(url) {
      if (!url || typeof url !== 'string') return null;
      
      // Skip invalid images
      const skipPatterns = ['sprite', 'pixel', 'transparent', 'placeholder', 'loading', 'spacer', '1x1', 'blank', 'badge', 'button'];
      if (skipPatterns.some(p => url.toLowerCase().includes(p)) || url.length < 12) {
        return null;
      }
      
      // Skip SVGs and tiny images
      if (url.includes('.svg') || url.includes('data:image/svg')) {
        return null;
      }

      // Clean size parameters for high-res
      let clean = url
        .replace(/\._[A-Z]+\d+_\./g, '.')       // Amazon: ._AC_SX200_.
        .replace(/\._[A-Z]+_\./g, '.')          // Amazon: ._SS40_.
        .replace(/_\d+x\d+\./g, '.')             // AliExpress: _350x350.
        .replace(/_\d+x\d+_/g, '_')              // Variant: _350x350_
        .replace(/[@_]\d+x\d+/g, '')             // @350x350 or _350x350
        .replace(/&w=\d+&h=\d+/g, '')            // Width/height params
        .replace(/\/[a-z]_\d+_\d+\//g, '/')      // CDN size paths
        .replace(/\/s\d+\//g, '/')               // Shopify /s100/
        .replace(/_small|_thumb|_mini/gi, '')   // Size suffixes
        .replace(/\?v=\d+$/, '');                // Version params

      // Keep query params unless it's clearly a direct image file URL.
      try {
        const u = new URL(clean.startsWith('//') ? `https:${clean}` : clean);
        const hasImageExt = /\.(png|jpe?g|webp|gif|avif)(?:$)/i.test(u.pathname);
        if (hasImageExt) {
          u.search = '';
        } else {
          ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','fbclid','gclid','msclkid'].forEach((k) => u.searchParams.delete(k));
        }
        clean = u.toString();
      } catch {
        // ignore
      }

      // Ensure absolute URL
      if (clean.startsWith('//')) {
        clean = 'https:' + clean;
      } else if (clean.startsWith('/')) {
        clean = window.location.origin + clean;
      }

      try {
        new URL(clean);
        return clean;
      } catch {
        return null;
      }
    }

    // ==================== VIDEOS ====================
    
    async extractVideos() {
      const videos = new Set();

      // Platform-specific video selectors
      const videoSelectors = {
        amazon: ['[data-video-url]', '.a-video video', '#vse-vg-video', '.vse-video-overlay'],
        aliexpress: ['[class*="video"] video', '.video-player video', 'video source'],
        ebay: ['[data-testid="video-player"]', '.video-player video'],
        generic: ['video source', 'video[src]', '[data-video-url]', '[data-video]']
      };

      const selectors = videoSelectors[this.platform] || videoSelectors.generic;

      for (const sel of selectors) {
        document.querySelectorAll(sel).forEach(el => {
          const url = el.src || el.dataset.videoUrl || el.dataset.video || el.getAttribute('data-video-url');
          if (url && url.includes('http')) {
            videos.add(url);
          }
        });

        if (videos.size >= SCRAPER_CONFIG.MAX_VIDEOS) break;
      }

      // Check for embedded iframes (YouTube, Vimeo)
      document.querySelectorAll('iframe[src*="youtube"], iframe[src*="vimeo"]').forEach(iframe => {
        if (videos.size < SCRAPER_CONFIG.MAX_VIDEOS) {
          videos.add(iframe.src);
        }
      });

      return Array.from(videos).slice(0, SCRAPER_CONFIG.MAX_VIDEOS);
    }

    // ==================== VARIANTS ====================
    
    async extractVariants() {
      // Use existing variants extractor if available
      if (window.DropCraftVariantsExtractor) {
        const extractor = new window.DropCraftVariantsExtractor();
        const result = await extractor.extractVariants();
        return result.variants || [];
      }

      // Basic variant extraction
      return this.extractBasicVariants();
    }

    extractBasicVariants() {
      const variants = [];
      const variantContainers = document.querySelectorAll(
        'select[name*="size"], select[name*="color"], select[name*="variant"], ' +
        '[data-testid*="variant"], [class*="variant-selector"], [class*="sku-selector"]'
      );

      variantContainers.forEach(container => {
        if (container.tagName === 'SELECT') {
          const options = container.querySelectorAll('option:not([disabled])');
          options.forEach(opt => {
            if (opt.value && opt.textContent?.trim()) {
              variants.push({
                name: opt.textContent.trim(),
                value: opt.value,
                type: container.name || 'option'
              });
            }
          });
        }
      });

      return variants;
    }

    // ==================== REVIEWS ====================
    
    async extractReviews() {
      // Use existing reviews extractor if available
      if (window.DropCraftReviewsExtractor) {
        const extractor = new window.DropCraftReviewsExtractor();
        extractor.extractReviews();
        return extractor.extractedReviews?.slice(0, SCRAPER_CONFIG.MAX_REVIEWS) || [];
      }

      // Basic review extraction
      return this.extractBasicReviews();
    }

    extractBasicReviews() {
      const reviews = [];
      
      const reviewSelectors = {
        amazon: '[data-hook="review"]',
        aliexpress: '.feedback-item, [data-pl="feedback-item"]',
        ebay: '.review-item, .rvw-card',
        walmart: '[data-testid="review-card"]',
        generic: '[class*="review-item"], [class*="review-card"], [itemprop="review"]'
      };

      const selector = reviewSelectors[this.platform] || reviewSelectors.generic;
      const items = document.querySelectorAll(selector);

      items.forEach((item, idx) => {
        if (idx >= SCRAPER_CONFIG.MAX_REVIEWS) return;

        const review = {
          author: item.querySelector('.a-profile-name, [class*="author"], [class*="user-name"]')?.textContent?.trim() || 'Anonymous',
          rating: this.extractReviewRating(item),
          text: item.querySelector('[data-hook="review-body"], [class*="content"], [class*="text"]')?.textContent?.trim()?.substring(0, 2000) || '',
          date: item.querySelector('[class*="date"], [data-hook="review-date"]')?.textContent?.trim() || null,
          images: Array.from(item.querySelectorAll('.review-image img')).map(img => img.src).slice(0, 5)
        };

        if (review.text) {
          reviews.push(review);
        }
      });

      return reviews;
    }

    extractReviewRating(item) {
      // Star rating from class or text
      const starEl = item.querySelector('[class*="star"], [class*="rating"], [data-hook*="star"]');
      if (starEl) {
        const classMatch = starEl.className.match(/(\d)/);
        if (classMatch) return parseInt(classMatch[1], 10);

        const textMatch = starEl.textContent?.match(/(\d+\.?\d*)/);
        if (textMatch) return parseFloat(textMatch[1]);
      }
      return null;
    }

    // ==================== SPECIFICATIONS ====================
    
    async extractSpecifications() {
      const specs = {};

      const specSelectors = [
        '#productDetails_techSpec_section_1 tr',
        '#productDetails_detailBullets_sections1 tr',
        '.product-specifications tr',
        '[class*="specification"] tr',
        '.product-details-module tr',
        'table[class*="spec"] tr'
      ];

      for (const sel of specSelectors) {
        const rows = document.querySelectorAll(sel);
        rows.forEach(row => {
          const th = row.querySelector('th, td:first-child');
          const td = row.querySelector('td, td:last-child');
          if (th && td && th !== td) {
            const key = th.textContent?.trim();
            const value = td.textContent?.trim();
            if (key && value && key.length < 100) {
              specs[key] = value.substring(0, 500);
            }
          }
        });

        if (Object.keys(specs).length > 0) break;
      }

      return specs;
    }

    // ==================== HELPERS ====================
    
    cleanText(text) {
      if (!text) return '';
      return text
        .replace(/Raccourci clavier[\s\S]*/gi, '')
        .replace(/shift\s*\+[\s\S]*/gi, '')
        .replace(/alt\s*\+[\s\S]*/gi, '')
        .replace(/Ajouter au panier[\s\S]*/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 500);
    }
  }

  // ==================== STOCK MONITORING ====================
  
  class StockMonitor {
    constructor() {
      this.monitoredProducts = [];
      this.checkInterval = null;
    }

    async init() {
      await this.loadMonitoredProducts();
      this.startMonitoring();
    }

    async loadMonitoredProducts() {
      return new Promise(resolve => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['stock_monitored_products'], result => {
            this.monitoredProducts = result.stock_monitored_products || [];
            resolve();
          });
        } else {
          resolve();
        }
      });
    }

    async saveMonitoredProducts() {
      return new Promise(resolve => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ stock_monitored_products: this.monitoredProducts }, resolve);
        } else {
          resolve();
        }
      });
    }

    startMonitoring() {
      // Check stock every hour
      const interval = 60 * 60 * 1000;
      
      if (this.checkInterval) clearInterval(this.checkInterval);
      this.checkInterval = setInterval(() => this.checkAllStock(), interval);
      
      console.log('[StockMonitor] Started monitoring', this.monitoredProducts.length, 'products');
    }

    async addProduct(productData) {
      const existing = this.monitoredProducts.find(p => p.url === productData.url);
      
      if (existing) {
        // Update existing
        Object.assign(existing, {
          lastStock: productData.stockStatus,
          lastQuantity: productData.stockQuantity,
          lastChecked: new Date().toISOString()
        });
      } else {
        this.monitoredProducts.push({
          id: `stock_${Date.now()}`,
          url: productData.url,
          title: productData.title,
          image: productData.images?.[0],
          platform: productData.platform,
          lastStock: productData.stockStatus,
          lastQuantity: productData.stockQuantity,
          addedAt: new Date().toISOString(),
          lastChecked: new Date().toISOString(),
          stockHistory: [{
            status: productData.stockStatus,
            quantity: productData.stockQuantity,
            date: new Date().toISOString()
          }]
        });
      }

      await this.saveMonitoredProducts();
      console.log('[StockMonitor] Added product for monitoring:', productData.title?.substring(0, 50));
    }

    async checkAllStock() {
      // This would be implemented via backend API for actual scraping
      console.log('[StockMonitor] Checking stock for', this.monitoredProducts.length, 'products');
    }
  }

  // ==================== EXPORTS ====================
  
  window.AdvancedProductScraper = AdvancedProductScraper;
  window.StockMonitor = StockMonitor;

  // Create singleton instances
  window.__dcAdvancedScraper = new AdvancedProductScraper();
  window.__dcStockMonitor = new StockMonitor();
  window.__dcStockMonitor.init();

  // Message handler for commands from popup/sidebar
  window.addEventListener('message', async (event) => {
    if (event.source !== window || !event.data.type) return;

    if (event.data.type === 'DC_EXTRACT_COMPLETE') {
      const scraper = new AdvancedProductScraper();
      const data = await scraper.extractCompleteProduct();
      
      window.postMessage({
        type: 'DC_EXTRACT_COMPLETE_RESULT',
        requestId: event.data.requestId,
        data
      }, '*');
    }

    if (event.data.type === 'DC_ADD_STOCK_MONITOR') {
      const data = event.data.productData;
      await window.__dcStockMonitor.addProduct(data);
      
      window.postMessage({
        type: 'DC_ADD_STOCK_MONITOR_RESULT',
        requestId: event.data.requestId,
        success: true
      }, '*');
    }
  });

  console.log('[DropCraft] Advanced Scraper v4.5 loaded');
})();
