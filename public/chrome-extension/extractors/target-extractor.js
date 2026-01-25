/**
 * ShopOpti+ Target Extractor v5.3.0
 * Extraction engine for target.com
 */

class TargetExtractor {
  constructor() {
    this.platform = 'target';
  }

  async extract() {
    const product = {
      url: window.location.href,
      platform: this.platform,
      extractedAt: new Date().toISOString()
    };

    // Try JSON-LD first
    const jsonLD = this.extractFromJsonLD();
    if (jsonLD.title) {
      Object.assign(product, jsonLD);
    } else {
      Object.assign(product, this.extractFromDOM());
    }

    product.images = this.extractImages();
    product.variants = this.extractVariants();
    
    return product;
  }

  extractFromJsonLD() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item['@type'] === 'Product') {
            const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            return {
              title: item.name || '',
              description: item.description || '',
              sku: item.sku || '',
              brand: typeof item.brand === 'string' ? item.brand : item.brand?.name || '',
              price: parseFloat(offers?.price) || 0,
              currency: offers?.priceCurrency || 'USD'
            };
          }
        }
      } catch (e) {}
    }
    return {};
  }

  extractFromDOM() {
    const title = document.querySelector('[data-test="product-title"], h1[class*="Title"]')?.textContent?.trim() || '';
    const priceEl = document.querySelector('[data-test="product-price"], [class*="CurrentPrice"]');
    const price = priceEl ? this.parsePrice(priceEl.textContent) : 0;
    const description = document.querySelector('[data-test="item-details-description"]')?.textContent?.trim() || '';
    
    return { title, price, description, currency: 'USD' };
  }

  extractImages() {
    const images = new Set();
    document.querySelectorAll('[data-test="image-gallery-item"] img, [class*="ProductImage"] img').forEach(img => {
      const src = img.dataset.src || img.src;
      if (src && src.includes('http')) {
        images.add(src.replace(/\?.*$/, ''));
      }
    });
    return Array.from(images).slice(0, 30);
  }

  extractVariants() {
    const variants = [];
    document.querySelectorAll('[data-test="swatch"], [class*="VariantSelector"] button').forEach(el => {
      const name = el.getAttribute('aria-label') || el.textContent?.trim();
      if (name) {
        variants.push({ name, available: !el.disabled });
      }
    });
    return variants;
  }

  parsePrice(str) {
    if (!str) return 0;
    const clean = str.replace(/[^0-9.,]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  }
}

if (typeof window !== 'undefined') {
  window.TargetExtractor = TargetExtractor;
}
