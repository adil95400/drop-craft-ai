/**
 * DropCraft Fnac Extractor
 * Extracts product data from Fnac.com
 */

class DropCraftFnacExtractor {
  constructor() {
    this.platform = 'fnac';
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
        variants: this.extractVariants(),
        specifications: this.extractSpecifications()
      };

      return product;
    } catch (error) {
      console.error('[DropCraft Fnac] Extraction error:', error);
      return null;
    }
  }

  extractTitle() {
    const selectors = [
      'h1.f-productHeader-Title',
      'h1[class*="productHeader"]',
      '.f-productHeader h1',
      'h1.product-title',
      '[data-automation-id="product-title"]',
      'h1'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el?.textContent?.trim()) {
        return el.textContent.trim();
      }
    }
    return document.title.split('|')[0]?.trim() || '';
  }

  extractPrice() {
    const selectors = [
      '.f-priceBox-price .f-priceBox-price--price',
      '[data-automation-id="product-price"]',
      '.f-productPrice .userPrice',
      '.f-priceBox .userPrice',
      '.price .userPrice',
      '.f-productPrice-price'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) {
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
      '.f-priceBox-price--old',
      '.f-productPrice-oldPrice',
      '.price--old',
      '[class*="oldPrice"]',
      '.f-priceBox .oldPrice'
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
      '.f-productDetails-text',
      '.f-productPresentation-text',
      '[data-automation-id="product-description"]',
      '.product-description',
      '.f-productDetails'
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
      '.f-productVisuals-mainMedia img',
      '.f-productVisuals img[src*="fnac"]',
      '.f-productGallery img',
      '[data-automation-id="product-image"] img',
      '.f-productVisuals-thumbnails img'
    ];

    imageSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(img => {
        let src = img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.src;
        if (src && src.includes('fnac') && !src.includes('placeholder')) {
          // Get high-res version
          src = src.replace(/\/\d+x\d+\//, '/1000x1000/');
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
    // Fnac article reference
    const refEl = document.querySelector('[data-automation-id="product-reference"]');
    if (refEl) return refEl.textContent.trim();

    const skuMatch = window.location.pathname.match(/\/a(\d+)\//);
    if (skuMatch) return `FNAC-${skuMatch[1]}`;

    const jsonLd = this.getJsonLd();
    return jsonLd?.sku || jsonLd?.mpn || '';
  }

  extractBrand() {
    const selectors = [
      '.f-productHeader-brand a',
      '[data-automation-id="product-brand"]',
      '.f-productBrand a',
      '.brand-name'
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
    const breadcrumbs = document.querySelectorAll('.f-breadcrumb a, .breadcrumb a');
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
    const ratingEl = document.querySelector('.f-productRating-value, [data-automation-id="product-rating"]');
    if (ratingEl) {
      const match = ratingEl.textContent.match(/[\d,\.]+/);
      if (match) return parseFloat(match[0].replace(',', '.'));
    }

    const jsonLd = this.getJsonLd();
    return jsonLd?.aggregateRating?.ratingValue || null;
  }

  extractReviewCount() {
    const countEl = document.querySelector('.f-productRating-count, [data-automation-id="review-count"]');
    if (countEl) {
      const match = countEl.textContent.match(/\d+/);
      if (match) return parseInt(match[0]);
    }

    const jsonLd = this.getJsonLd();
    return jsonLd?.aggregateRating?.reviewCount || 0;
  }

  extractAvailability() {
    const availEl = document.querySelector('.f-productAvailability, [data-automation-id="availability"]');
    if (availEl) {
      const text = availEl.textContent.toLowerCase();
      if (text.includes('stock') || text.includes('disponible')) return 'in_stock';
      if (text.includes('épuisé') || text.includes('indisponible')) return 'out_of_stock';
    }

    const jsonLd = this.getJsonLd();
    if (jsonLd?.offers?.availability) {
      return jsonLd.offers.availability.includes('InStock') ? 'in_stock' : 'out_of_stock';
    }

    return 'unknown';
  }

  extractSeller() {
    const sellerEl = document.querySelector('.f-sellerInfo-name, [data-automation-id="seller-name"]');
    return sellerEl?.textContent?.trim() || 'Fnac';
  }

  extractVariants() {
    const variants = [];
    
    // Color variants
    const colorOptions = document.querySelectorAll('.f-productVariants-color input, [data-automation-id="color-variant"]');
    colorOptions.forEach(opt => {
      const label = opt.getAttribute('aria-label') || opt.getAttribute('title');
      if (label) {
        variants.push({
          type: 'color',
          value: label,
          available: !opt.disabled
        });
      }
    });

    // Size/capacity variants
    const sizeOptions = document.querySelectorAll('.f-productVariants-size button, [data-automation-id="size-variant"]');
    sizeOptions.forEach(opt => {
      const text = opt.textContent.trim();
      if (text) {
        variants.push({
          type: 'size',
          value: text,
          available: !opt.disabled
        });
      }
    });

    return variants;
  }

  extractSpecifications() {
    const specs = {};
    
    const specRows = document.querySelectorAll('.f-productCharacteristics tr, .f-productSpecs-item');
    specRows.forEach(row => {
      const label = row.querySelector('th, .label, dt')?.textContent?.trim();
      const value = row.querySelector('td, .value, dd')?.textContent?.trim();
      if (label && value) {
        specs[label] = value;
      }
    });

    return specs;
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
window.DropCraftFnacExtractor = DropCraftFnacExtractor;
console.log('[DropCraft] Fnac extractor loaded');
