/**
 * ShopOpti+ BestBuy Extractor v5.3.0
 * Extraction engine for bestbuy.com
 */

class BestBuyExtractor {
  constructor() {
    this.platform = 'bestbuy';
  }

  async extract() {
    const product = {
      url: window.location.href,
      platform: this.platform,
      extractedAt: new Date().toISOString()
    };

    const jsonLD = this.extractFromJsonLD();
    if (jsonLD.title) {
      Object.assign(product, jsonLD);
    } else {
      Object.assign(product, this.extractFromDOM());
    }

    product.images = this.extractImages();
    product.variants = this.extractVariants();
    product.specifications = this.extractSpecifications();
    
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
              currency: offers?.priceCurrency || 'USD',
              inStock: offers?.availability?.includes('InStock')
            };
          }
        }
      } catch (e) {}
    }
    return {};
  }

  extractFromDOM() {
    const title = document.querySelector('.sku-title h1, [data-testid="sku-title"]')?.textContent?.trim() || '';
    const priceEl = document.querySelector('[data-testid="customer-price"] span, .priceView-customer-price span');
    const price = priceEl ? this.parsePrice(priceEl.textContent) : 0;
    const description = document.querySelector('.product-description')?.textContent?.trim() || '';
    const sku = document.querySelector('.sku-value, [data-testid="sku-value"]')?.textContent?.trim() || '';
    
    return { title, price, description, sku, currency: 'USD' };
  }

  extractImages() {
    const images = new Set();
    document.querySelectorAll('.primary-image img, .image-gallery img, [data-testid="image-media"] img').forEach(img => {
      let src = img.dataset.src || img.src;
      if (src && src.includes('http')) {
        // Get high-res version
        src = src.replace(/;maxHeight=\d+;maxWidth=\d+/, ';maxHeight=1000;maxWidth=1000');
        images.add(src);
      }
    });
    return Array.from(images).slice(0, 30);
  }

  extractVariants() {
    const variants = [];
    document.querySelectorAll('.variation-selector button, [data-testid="variation-button"]').forEach(el => {
      const name = el.getAttribute('aria-label') || el.textContent?.trim();
      if (name) {
        variants.push({ name, available: !el.disabled });
      }
    });
    return variants;
  }

  extractSpecifications() {
    const specs = {};
    document.querySelectorAll('.specification-item, [data-testid="specification-item"]').forEach(item => {
      const label = item.querySelector('.specification-label, dt')?.textContent?.trim();
      const value = item.querySelector('.specification-value, dd')?.textContent?.trim();
      if (label && value) {
        specs[label] = value;
      }
    });
    return specs;
  }

  parsePrice(str) {
    if (!str) return 0;
    const clean = str.replace(/[^0-9.,]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  }
}

if (typeof window !== 'undefined') {
  window.BestBuyExtractor = BestBuyExtractor;
}
