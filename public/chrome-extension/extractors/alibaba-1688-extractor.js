/**
 * ShopOpti+ 1688/Taobao Extractor v5.3.0
 * Extraction engine for 1688.com and taobao.com
 */

class Alibaba1688Extractor {
  constructor() {
    const hostname = window.location.hostname;
    this.platform = hostname.includes('1688') ? '1688' : 'taobao';
  }

  async extract() {
    const product = {
      url: window.location.href,
      platform: this.platform,
      extractedAt: new Date().toISOString()
    };

    Object.assign(product, this.extractFromDOM());
    product.images = this.extractImages();
    product.variants = this.extractVariants();
    
    return product;
  }

  extractFromDOM() {
    // 1688 selectors
    const title1688 = document.querySelector('.d-title, .title-text, [data-spm="title"]')?.textContent?.trim();
    const taobaoTitle = document.querySelector('.ItemHeader--mainTitle, .tb-detail-hd h1')?.textContent?.trim();
    const title = title1688 || taobaoTitle || '';

    // Price - Chinese sites use different formats
    const priceEl = document.querySelector('.price-text, .d-price em, .tb-rmb-num, [class*="Price"]');
    const price = priceEl ? this.parsePrice(priceEl.textContent) : 0;

    // MOQ (Minimum Order Quantity) - specific to 1688
    const moqEl = document.querySelector('.d-amount em, [class*="moq"], .amount-num');
    const moq = moqEl ? parseInt(moqEl.textContent) || 1 : 1;

    // Supplier info
    const supplierEl = document.querySelector('.company-name a, .shop-name, .tb-shop-name');
    const supplier = supplierEl?.textContent?.trim() || '';

    return { 
      title, 
      price, 
      moq,
      supplier,
      currency: 'CNY',
      description: document.querySelector('.detail-desc, .ItemHeader--descText')?.textContent?.trim() || ''
    };
  }

  extractImages() {
    const images = new Set();
    
    // 1688 image selectors
    document.querySelectorAll('.detail-gallery img, .tab-pane img, .d-img-list img, .detail-img img').forEach(img => {
      let src = img.dataset.lazyload || img.dataset.src || img.src;
      if (src && src.includes('http')) {
        // Get high-res version - Alibaba CDN uses specific size formats
        src = src.replace(/_\d+x\d+\./, '_800x800.').replace(/_.+?\.(jpg|png|webp)/i, '.$1');
        images.add(src);
      }
    });

    // Taobao image selectors
    document.querySelectorAll('.tb-gallery img, .J_UlThumb img, .tb-main-pic img').forEach(img => {
      let src = img.dataset.src || img.src;
      if (src && src.includes('http')) {
        src = src.replace(/_\d+x\d+/, '_800x800');
        images.add(src);
      }
    });

    return Array.from(images).slice(0, 50);
  }

  extractVariants() {
    const variants = [];
    
    // 1688 variants
    document.querySelectorAll('.obj-sku .obj-content span, .sku-wrapper .sku-item').forEach(el => {
      const name = el.textContent?.trim();
      if (name) {
        variants.push({ 
          name, 
          available: !el.classList.contains('disabled'),
          image: el.querySelector('img')?.src || null
        });
      }
    });

    // Taobao variants
    document.querySelectorAll('.tb-sku .tb-prop-content li, .ItemSku--skuItem').forEach(el => {
      const name = el.getAttribute('data-value') || el.textContent?.trim();
      if (name) {
        variants.push({ 
          name, 
          available: !el.classList.contains('tb-disabled'),
          image: el.querySelector('img')?.src || null
        });
      }
    });

    return variants;
  }

  parsePrice(str) {
    if (!str) return 0;
    // Chinese price format: ¥19.99 or 19.99元
    const clean = str.replace(/[¥元\s]/g, '').trim();
    // Handle range prices like "19.99-29.99" - take the first
    const firstPrice = clean.split('-')[0];
    return parseFloat(firstPrice) || 0;
  }
}

if (typeof window !== 'undefined') {
  window.Alibaba1688Extractor = Alibaba1688Extractor;
}
