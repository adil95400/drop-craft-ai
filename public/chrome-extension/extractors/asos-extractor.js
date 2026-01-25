/**
 * ShopOpti+ ASOS Extractor v5.3.0
 * Extraction engine for asos.com
 */

class ASOSExtractor {
  constructor() {
    this.platform = 'asos';
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
              currency: offers?.priceCurrency || 'EUR'
            };
          }
        }
      } catch (e) {}
    }
    return {};
  }

  extractFromDOM() {
    const title = document.querySelector('[data-test-id="product-title"], h1.product-title')?.textContent?.trim() || '';
    const priceEl = document.querySelector('[data-test-id="product-price"] span, .product-price');
    const price = priceEl ? this.parsePrice(priceEl.textContent) : 0;
    const description = document.querySelector('[data-test-id="product-description"]')?.textContent?.trim() || '';
    
    return { title, price, description, currency: 'EUR' };
  }

  extractImages() {
    const images = new Set();
    document.querySelectorAll('[data-test-id="image-gallery"] img, .gallery-image img').forEach(img => {
      let src = img.dataset.src || img.src;
      if (src && src.includes('http')) {
        // ASOS uses wid parameter for width
        src = src.replace(/wid=\d+/, 'wid=1000');
        images.add(src);
      }
    });
    return Array.from(images).slice(0, 30);
  }

  extractVariants() {
    const variants = [];
    // Color variants
    document.querySelectorAll('[data-test-id="colour-button"], .colour-selector button').forEach(el => {
      const color = el.getAttribute('aria-label') || el.title;
      if (color) {
        variants.push({ name: `Color: ${color}`, available: !el.disabled, type: 'color' });
      }
    });
    // Size variants
    document.querySelectorAll('[data-test-id="size-button"], select[data-id="sizeSelect"] option').forEach(el => {
      const size = el.value || el.textContent?.trim();
      if (size && size !== 'Please select') {
        variants.push({ name: `Size: ${size}`, available: !el.disabled, type: 'size' });
      }
    });
    return variants;
  }

  parsePrice(str) {
    if (!str) return 0;
    let clean = str.replace(/[€$£\s]/g, '').trim();
    if (clean.includes(',') && !clean.includes('.')) {
      clean = clean.replace(',', '.');
    }
    return parseFloat(clean) || 0;
  }
}

if (typeof window !== 'undefined') {
  window.ASOSExtractor = ASOSExtractor;
}
