/**
 * DropCraft Rakuten Extractor
 * Extracts product data from fr.shopping.rakuten.com (PriceMinister)
 */

class DropCraftRakutenExtractor {
  constructor() {
    this.platform = 'rakuten';
  }

  async extractProduct() {
    try {
      const product = {
        platform: this.platform,
        url: window.location.href,
        title: this.extractTitle(),
        price: this.extractPrice(),
        originalPrice: this.extractOriginalPrice(),
        description: this.extractDescription(),
        images: this.extractImages(),
        sku: this.extractSku(),
        brand: this.extractBrand(),
        category: this.extractCategory(),
        rating: this.extractRating(),
        reviewCount: this.extractReviewCount(),
        availability: this.extractAvailability(),
        seller: this.extractSeller(),
        condition: this.extractCondition(),
        variants: this.extractVariants(),
        offers: this.extractOffers()
      };

      return product;
    } catch (error) {
      console.error('[DropCraft Rakuten] Extraction error:', error);
      return null;
    }
  }

  extractTitle() {
    const selectors = [
      'h1[itemprop="name"]',
      '.product-title h1',
      '[data-test="product-title"]',
      '.prdTitle h1',
      'h1.title',
      'h1'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el?.textContent?.trim()) {
        return el.textContent.trim();
      }
    }
    return document.title.split('-')[0]?.trim() || '';
  }

  extractPrice() {
    const selectors = [
      '[itemprop="price"]',
      '.product-price .price',
      '[data-test="product-price"]',
      '.prdPrice .price',
      '.buyBox-price',
      '.price-value'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) {
        const content = el.getAttribute('content');
        if (content) {
          const price = parseFloat(content);
          if (!isNaN(price) && price > 0) return price;
        }
        
        const text = el.textContent.replace(/[^\d,\.]/g, '').replace(',', '.');
        const price = parseFloat(text);
        if (!isNaN(price) && price > 0) return price;
      }
    }

    // Try JSON-LD
    const jsonLd = this.getJsonLd();
    if (jsonLd?.offers?.price) {
      return parseFloat(jsonLd.offers.price);
    }

    return 0;
  }

  extractOriginalPrice() {
    const selectors = [
      '.product-price .old-price',
      '.price-strike',
      '.crossed-price',
      '[data-test="crossed-price"]'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) {
        const text = el.textContent.replace(/[^\d,\.]/g, '').replace(',', '.');
        const price = parseFloat(text);
        if (!isNaN(price) && price > 0) return price;
      }
    }
    return null;
  }

  extractDescription() {
    const selectors = [
      '[itemprop="description"]',
      '.product-description',
      '[data-test="product-description"]',
      '.prdDescription',
      '#description'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el?.textContent?.trim()) {
        return el.textContent.trim().substring(0, 5000);
      }
    }

    const jsonLd = this.getJsonLd();
    return jsonLd?.description || '';
  }

  extractImages() {
    const images = new Set();

    // Main product images
    const imageSelectors = [
      '.product-images img',
      '[data-test="product-image"] img',
      '.prdPicture img',
      '.gallery img',
      '[itemprop="image"]'
    ];

    imageSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(img => {
        let src = img.getAttribute('data-src') || img.getAttribute('data-lazy') || img.src;
        if (src && !src.includes('placeholder') && !src.includes('data:')) {
          // Get high-res version
          src = src.replace(/_\d+x\d+/, '_1000x1000');
          images.add(src);
        }
      });
    });

    // JSON-LD images
    const jsonLd = this.getJsonLd();
    if (jsonLd?.image) {
      const imgs = Array.isArray(jsonLd.image) ? jsonLd.image : [jsonLd.image];
      imgs.forEach(img => images.add(img));
    }

    return Array.from(images).slice(0, 10);
  }

  extractSku() {
    // Rakuten product ID
    const productIdMatch = window.location.pathname.match(/\/(\d+)\//);
    if (productIdMatch) return `RAK-${productIdMatch[1]}`;

    const skuEl = document.querySelector('[data-test="product-sku"], [itemprop="sku"]');
    if (skuEl) return skuEl.textContent.trim() || skuEl.getAttribute('content');

    const jsonLd = this.getJsonLd();
    return jsonLd?.sku || jsonLd?.productID || '';
  }

  extractBrand() {
    const selectors = [
      '[itemprop="brand"]',
      '.product-brand a',
      '[data-test="product-brand"]',
      '.prdBrand a'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el?.textContent?.trim()) {
        return el.textContent.trim();
      }
    }

    const jsonLd = this.getJsonLd();
    return jsonLd?.brand?.name || '';
  }

  extractCategory() {
    const breadcrumbs = document.querySelectorAll('.breadcrumb a, [data-test="breadcrumb"] a');
    if (breadcrumbs.length > 1) {
      return Array.from(breadcrumbs)
        .slice(1)
        .map(a => a.textContent.trim())
        .filter(Boolean)
        .join(' > ');
    }
    return '';
  }

  extractRating() {
    const ratingEl = document.querySelector('[itemprop="ratingValue"], [data-test="rating"]');
    if (ratingEl) {
      const content = ratingEl.getAttribute('content');
      if (content) return parseFloat(content);
      
      const match = ratingEl.textContent.match(/[\d,\.]+/);
      if (match) return parseFloat(match[0].replace(',', '.'));
    }

    const jsonLd = this.getJsonLd();
    return jsonLd?.aggregateRating?.ratingValue || null;
  }

  extractReviewCount() {
    const countEl = document.querySelector('[itemprop="reviewCount"], [data-test="review-count"]');
    if (countEl) {
      const content = countEl.getAttribute('content');
      if (content) return parseInt(content);
      
      const match = countEl.textContent.match(/\d+/);
      if (match) return parseInt(match[0]);
    }

    const jsonLd = this.getJsonLd();
    return jsonLd?.aggregateRating?.reviewCount || 0;
  }

  extractAvailability() {
    const availEl = document.querySelector('[itemprop="availability"], [data-test="availability"]');
    if (availEl) {
      const href = availEl.getAttribute('href') || availEl.textContent;
      if (href) {
        if (href.includes('InStock') || href.toLowerCase().includes('stock')) return 'in_stock';
        if (href.includes('OutOfStock') || href.toLowerCase().includes('épuisé')) return 'out_of_stock';
      }
    }

    const jsonLd = this.getJsonLd();
    if (jsonLd?.offers?.availability) {
      return jsonLd.offers.availability.includes('InStock') ? 'in_stock' : 'out_of_stock';
    }

    return 'unknown';
  }

  extractSeller() {
    const sellerEl = document.querySelector('.seller-name, [data-test="seller-name"], .vendeur');
    return sellerEl?.textContent?.trim() || 'Rakuten';
  }

  extractCondition() {
    const conditionEl = document.querySelector('.product-condition, [data-test="condition"]');
    if (conditionEl) {
      const text = conditionEl.textContent.toLowerCase();
      if (text.includes('neuf')) return 'new';
      if (text.includes('occasion') || text.includes('reconditionné')) return 'used';
    }
    return 'new';
  }

  extractVariants() {
    const variants = [];
    
    // Product variants/options
    const optionGroups = document.querySelectorAll('.product-variants select, .product-options select');
    optionGroups.forEach(select => {
      const label = select.getAttribute('aria-label') || select.previousElementSibling?.textContent;
      const options = Array.from(select.options).filter(o => o.value);
      
      options.forEach(opt => {
        variants.push({
          type: label?.toLowerCase() || 'option',
          value: opt.textContent.trim(),
          available: !opt.disabled
        });
      });
    });

    return variants;
  }

  extractOffers() {
    const offers = [];
    
    // Multiple seller offers on Rakuten
    const offerElements = document.querySelectorAll('.offer-item, [data-test="offer-row"]');
    offerElements.forEach(offerEl => {
      const priceEl = offerEl.querySelector('.offer-price, .price');
      const sellerEl = offerEl.querySelector('.offer-seller, .seller');
      const conditionEl = offerEl.querySelector('.offer-condition, .condition');
      
      if (priceEl) {
        const priceText = priceEl.textContent.replace(/[^\d,\.]/g, '').replace(',', '.');
        offers.push({
          price: parseFloat(priceText) || 0,
          seller: sellerEl?.textContent?.trim() || 'Unknown',
          condition: conditionEl?.textContent?.trim() || 'Neuf'
        });
      }
    });

    return offers;
  }

  getJsonLd() {
    try {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        const data = JSON.parse(script.textContent);
        if (data['@type'] === 'Product') return data;
        if (Array.isArray(data)) {
          const product = data.find(d => d['@type'] === 'Product');
          if (product) return product;
        }
      }
    } catch (e) {}
    return null;
  }
}

// Expose globally
window.DropCraftRakutenExtractor = DropCraftRakutenExtractor;
console.log('[DropCraft] Rakuten extractor loaded');
