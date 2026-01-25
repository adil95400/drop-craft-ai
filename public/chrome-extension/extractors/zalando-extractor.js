/**
 * ShopOpti+ Zalando Extractor v5.3.0
 * Extraction engine for zalando.fr / zalando.com
 */

class ZalandoExtractor {
  constructor() {
    this.platform = 'zalando';
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
    const title = document.querySelector('[data-testid="product-name"], h1.EKabf7')?.textContent?.trim() || '';
    const brand = document.querySelector('[data-testid="product-brand-link"], .FtrEr_')?.textContent?.trim() || '';
    const priceEl = document.querySelector('[data-testid="product-price"], .Km7l2y');
    const price = priceEl ? this.parsePrice(priceEl.textContent) : 0;
    const description = document.querySelector('[data-testid="product-description"]')?.textContent?.trim() || '';
    
    return { title: brand ? `${brand} - ${title}` : title, price, description, brand, currency: 'EUR' };
  }

  extractImages() {
    const images = new Set();
    document.querySelectorAll('[data-testid="product-image"] img, .JT3_zV img, .gallery-media img').forEach(img => {
      let src = img.dataset.src || img.src;
      if (src && src.includes('http')) {
        // Get high-res version - Zalando uses imwidth parameter
        src = src.replace(/imwidth=\d+/, 'imwidth=1000');
        images.add(src);
      }
    });
    return Array.from(images).slice(0, 30);
  }

  extractVariants() {
    const variants = [];
    // Size variants
    document.querySelectorAll('[data-testid="size-picker"] button, .gfqTIl').forEach(el => {
      const size = el.textContent?.trim();
      if (size) {
        variants.push({ name: `Size: ${size}`, available: !el.disabled, type: 'size' });
      }
    });
    return variants;
  }

  parsePrice(str) {
    if (!str) return 0;
    // Handle European format (19,99 €)
    let clean = str.replace(/[€$£\s]/g, '').trim();
    if (clean.includes(',') && !clean.includes('.')) {
      clean = clean.replace(',', '.');
    }
    return parseFloat(clean) || 0;
  }
}

if (typeof window !== 'undefined') {
  window.ZalandoExtractor = ZalandoExtractor;
}
