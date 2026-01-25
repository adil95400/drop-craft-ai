/**
 * ShopOpti+ Newegg Extractor v5.3.0
 * Extraction engine for newegg.com
 */

class NeweggExtractor {
  constructor() {
    this.platform = 'newegg';
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
              sku: item.sku || item.mpn || '',
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
    const title = document.querySelector('.product-title, h1.page-title-text')?.textContent?.trim() || '';
    const priceEl = document.querySelector('.price-current, .product-price .price');
    const price = priceEl ? this.parsePrice(priceEl.textContent) : 0;
    const description = document.querySelector('.product-bullets, #product-details')?.textContent?.trim() || '';
    const sku = document.querySelector('.product-sku em, [itemprop="sku"]')?.textContent?.trim() || '';
    
    return { title, price, description, sku, currency: 'USD' };
  }

  extractImages() {
    const images = new Set();
    document.querySelectorAll('.product-view-images img, .swiper-slide img, .product-gallery img').forEach(img => {
      let src = img.dataset.src || img.src;
      if (src && src.includes('http')) {
        // Get high-res version
        src = src.replace(/ProductImage\d+/, 'ProductImageLarge');
        images.add(src.replace(/\?.*$/, ''));
      }
    });
    return Array.from(images).slice(0, 30);
  }

  extractSpecifications() {
    const specs = {};
    document.querySelectorAll('.tab-pane.tab-spec tr, .product-specs tr').forEach(row => {
      const label = row.querySelector('th, td:first-child')?.textContent?.trim();
      const value = row.querySelector('td:last-child')?.textContent?.trim();
      if (label && value && label !== value) {
        specs[label] = value;
      }
    });
    return specs;
  }

  parsePrice(str) {
    if (!str) return 0;
    const clean = str.replace(/[^0-9.,]/g, '').replace(',', '');
    return parseFloat(clean) || 0;
  }
}

if (typeof window !== 'undefined') {
  window.NeweggExtractor = NeweggExtractor;
}
