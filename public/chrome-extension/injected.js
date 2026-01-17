// Injected script for advanced product detection v4.1
// This script runs in the page context to access site-specific APIs

class AdvancedProductDetector {
  constructor() {
    this.API_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';
    this.platformDetectors = {
      aliexpress: new AliExpressDetector(this.API_URL),
      amazon: new AmazonDetector(this.API_URL),
      temu: new TemuDetector(this.API_URL),
      shopify: new ShopifyDetector(this.API_URL),
      woocommerce: new WooCommerceDetector(this.API_URL),
      generic: new GenericDetector(this.API_URL)
    };
    
    this.init();
  }

  init() {
    this.setupMessageListener();
    this.injectOneClickButtons();
    console.log('[DropCraft] Advanced detector initialized');
  }

  setupMessageListener() {
    window.addEventListener('message', (event) => {
      if (event.source !== window || !event.data.type) return;
      
      switch (event.data.type) {
        case 'EXTRACT_PRODUCTS':
          this.extractProducts().then(products => {
            window.postMessage({
              type: 'PRODUCTS_EXTRACTED',
              products: products
            }, '*');
          });
          break;
          
        case 'EXTRACT_SINGLE_PRODUCT':
          this.extractSingleProduct().then(product => {
            window.postMessage({
              type: 'SINGLE_PRODUCT_EXTRACTED',
              product: product
            }, '*');
          });
          break;
          
        case 'INJECT_ONE_CLICK_BUTTONS':
          this.injectOneClickButtons();
          break;
      }
    });
  }

  async extractProducts() {
    const platform = this.detectPlatform();
    const detector = this.platformDetectors[platform] || this.platformDetectors.generic;
    return await detector.extractProducts();
  }

  async extractSingleProduct() {
    const platform = this.detectPlatform();
    const detector = this.platformDetectors[platform] || this.platformDetectors.generic;
    return await detector.extractSingleProduct();
  }

  detectPlatform() {
    const hostname = window.location.hostname.toLowerCase();
    
    if (hostname.includes('aliexpress')) return 'aliexpress';
    if (hostname.includes('amazon')) return 'amazon';
    if (hostname.includes('temu')) return 'temu';
    if (hostname.includes('myshopify') || document.querySelector('meta[name="generator"][content*="Shopify"]')) return 'shopify';
    if (document.querySelector('meta[name="generator"][content*="WooCommerce"]')) return 'woocommerce';
    
    return 'generic';
  }

  injectOneClickButtons() {
    const platform = this.detectPlatform();
    const detector = this.platformDetectors[platform] || this.platformDetectors.generic;
    detector.injectOneClickButtons();
    
    // Inject global styles
    if (!document.querySelector('#dropcraft-styles')) {
      const style = document.createElement('style');
      style.id = 'dropcraft-styles';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .dropcraft-import-btn:active {
          transform: scale(0.95) !important;
        }
        
        .dropcraft-import-btn {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// Base Detector class
class BaseDetector {
  constructor(apiUrl) {
    this.API_URL = apiUrl;
  }
  
  async getExtensionToken() {
    // Try to get token from storage via message
    return new Promise((resolve) => {
      // Check if we have a cached token
      if (window.__dropcraft_token) {
        resolve(window.__dropcraft_token);
        return;
      }
      resolve(null);
    });
  }

  createImportButton(text, onClick, isSmall = false) {
    const button = document.createElement('button');
    button.className = 'dropcraft-import-btn';
    button.innerHTML = `
      <svg width="${isSmall ? 14 : 18}" height="${isSmall ? 14 : 18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>${text}</span>
    `;
    
    button.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    };
    
    button.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      border: none !important;
      padding: ${isSmall ? '8px 14px' : '14px 24px'} !important;
      border-radius: ${isSmall ? '8px' : '10px'} !important;
      font-size: ${isSmall ? '12px' : '15px'} !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      position: ${isSmall ? 'absolute' : 'relative'} !important;
      top: ${isSmall ? '10px' : 'auto'} !important;
      right: ${isSmall ? '10px' : 'auto'} !important;
      z-index: 10000 !important;
      transition: all 0.3s ease !important;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4) !important;
      margin: ${isSmall ? '0' : '16px 0'} !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      text-decoration: none !important;
      outline: none !important;
    `;
    
    button.onmouseover = () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
    };
    
    button.onmouseout = () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
    };
    
    return button;
  }

  async importProductFromURL(url) {
    this.showLoadingToast('⏳ Import en cours...');
    
    try {
      const response = await fetch(`${this.API_URL}/product-url-scraper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      const result = await response.json();
      
      if (result.success && result.product) {
        // Notify the extension about the imported product
        window.postMessage({
          type: 'IMPORT_PRODUCTS',
          products: [result.product]
        }, '*');
        
        this.showSuccessToast(`✅ ${result.product?.title || result.product?.name || 'Produit'} importé!`);
      } else {
        this.showErrorToast('❌ ' + (result.error || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('[DropCraft] Import error:', error);
      this.showErrorToast('❌ Erreur de connexion');
    }
  }

  showLoadingToast(message) {
    this.hideAllToasts();
    const toast = this.createToast(message, '#667eea');
    document.body.appendChild(toast);
  }

  showSuccessToast(message) {
    this.hideAllToasts();
    const toast = this.createToast(message, '#10b981');
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  showErrorToast(message) {
    this.hideAllToasts();
    const toast = this.createToast(message, '#ef4444');
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }

  hideAllToasts() {
    document.querySelectorAll('.dropcraft-toast').forEach(t => t.remove());
  }

  createToast(message, color) {
    const toast = document.createElement('div');
    toast.className = 'dropcraft-toast';
    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
          <path d="M12 6v6l4 2"/>
        </svg>
        <span>${message}</span>
      </div>
    `;
    toast.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      background: ${color} !important;
      color: white !important;
      padding: 16px 24px !important;
      border-radius: 12px !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25) !important;
      z-index: 2147483647 !important;
      animation: slideIn 0.4s ease-out !important;
      max-width: 400px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    `;
    return toast;
  }

  // Utility methods
  getTextContent(container, selectors) {
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];
    for (const selector of selectorList) {
      const element = container.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    return '';
  }

  getPriceContent(container, selectors) {
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];
    for (const selector of selectorList) {
      const element = container.querySelector(selector);
      if (element) {
        const text = element.textContent.trim();
        // Extract price with currency
        const priceMatch = text.match(/[\d\s,.]+(€|\$|£|₹|¥|kr|zł|CHF|USD|EUR|GBP)/i) || 
                          text.match(/(€|\$|£)[\d\s,.]+/i) ||
                          text.match(/[\d,.]+/);
        if (priceMatch) return priceMatch[0].trim();
      }
    }
    return '';
  }

  getImageSrc(container, selectors) {
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];
    for (const selector of selectorList) {
      const element = container.querySelector(selector);
      if (element) {
        return element.src || element.dataset.src || element.dataset.original || element.getAttribute('data-lazy-src') || '';
      }
    }
    return '';
  }

  getRatingFromElement(element) {
    const ratingEl = element.querySelector('.star, .rating, [class*="star"], [class*="rating"]');
    if (ratingEl) {
      const ariaLabel = ratingEl.getAttribute('aria-label');
      if (ariaLabel) {
        const match = ariaLabel.match(/(\d+\.?\d*)/);
        if (match) return parseFloat(match[1]);
      }
      const ratingMatch = ratingEl.textContent.match(/(\d+\.?\d*)/);
      return ratingMatch ? parseFloat(ratingMatch[1]) : null;
    }
    return null;
  }

  getLinkFromElement(element) {
    const link = element.querySelector('a[href]');
    if (link) {
      const href = link.getAttribute('href');
      if (href.startsWith('http')) return href;
      return window.location.origin + href;
    }
    return window.location.href;
  }
}

// AliExpress specific detector
class AliExpressDetector extends BaseDetector {
  async extractProducts() {
    const products = [];
    
    const productElements = document.querySelectorAll(
      '.list-item, .product-item, [data-spm-anchor-id*="item"], .search-item-card-wrapper-gallery, .multi--outWrapper--SeJ8bEF'
    );
    
    for (let i = 0; i < Math.min(productElements.length, 50); i++) {
      const element = productElements[i];
      const product = await this.extractProductFromElement(element, i);
      if (product.name && product.price) {
        products.push(product);
      }
    }
    
    return products;
  }

  async extractSingleProduct() {
    return {
      id: `aliexpress_${Date.now()}`,
      name: this.getProductTitle(),
      title: this.getProductTitle(),
      price: this.getProductPrice(),
      originalPrice: this.getOriginalPrice(),
      discount: this.getDiscount(),
      image: this.getProductImage(),
      images: this.getProductImages(),
      description: this.getProductDescription(),
      specifications: this.getSpecifications(),
      rating: this.getRating(),
      orders: this.getOrderCount(),
      shipping: this.getShippingInfo(),
      variations: this.getVariations(),
      seller: this.getSellerInfo(),
      category: this.getCategory(),
      url: window.location.href,
      domain: 'aliexpress.com',
      platform: 'aliexpress',
      scrapedAt: new Date().toISOString(),
      source: 'extension_injected'
    };
  }

  async extractProductFromElement(element, index) {
    return {
      id: `aliexpress_list_${Date.now()}_${index}`,
      name: this.getTextContent(element, [
        '.item-title', '.title', '.product-title', 'h3', 'h2', '.multi--titleText--nXeOvyr'
      ]),
      price: this.getPriceContent(element, [
        '.price-current', '.price', '[class*="price"]', '.multi--price-sale--U-S0jtj'
      ]),
      image: this.getImageSrc(element, [
        '.item-img img', '.product-img img', 'img', '.images--item--3XZa6xf img'
      ]),
      rating: this.getRatingFromElement(element),
      orders: this.getTextContent(element, ['[class*="sold"]', '[class*="order"]']),
      url: this.getLinkFromElement(element),
      domain: 'aliexpress.com',
      platform: 'aliexpress',
      scrapedAt: new Date().toISOString(),
      source: 'extension_injected'
    };
  }

  getProductTitle() {
    return this.getTextContent(document, [
      'h1', '.product-title-text', '[data-pl="product-title"]', '.title--wrap--UUHae_g h1'
    ]);
  }

  getProductPrice() {
    return this.getPriceContent(document, [
      '.product-price-value', '.price-current', '[data-pl="product-price"]', '.price--currentPriceText--V8_y_b5'
    ]);
  }

  getOriginalPrice() {
    return this.getPriceContent(document, [
      '.price-original', '.price-del', '[class*="original-price"]', '.price--originalText--gxVO5_d'
    ]);
  }

  getDiscount() {
    const discountEl = document.querySelector('.discount, [class*="discount"], .price--discount--Y9uG2LK');
    return discountEl ? discountEl.textContent.trim() : null;
  }

  getProductImage() {
    return this.getImageSrc(document, [
      '.magnifier-image img', '.product-image img', '.main-image img', '.slider--img--K6MIH9z'
    ]);
  }

  getProductImages() {
    const images = [];
    document.querySelectorAll('.images-view-item img, .thumb-img img, .slider--item--RiRGiDV img').forEach(img => {
      const src = img.src || img.dataset.src;
      if (src && !images.includes(src)) images.push(src);
    });
    return images;
  }

  getProductDescription() {
    return this.getTextContent(document, [
      '.product-description', '[data-pl="product-description"]', '.detail--desc--ql2Dslg'
    ]);
  }

  getSpecifications() {
    const specs = {};
    document.querySelectorAll('.product-prop-list .product-prop, .specification--prop--Jh28bKu').forEach(prop => {
      const key = prop.querySelector('.prop-title, .specification--title--SfH3sA1')?.textContent.trim();
      const value = prop.querySelector('.prop-value, .specification--desc--Dxx6W0W')?.textContent.trim();
      if (key && value) specs[key] = value;
    });
    return specs;
  }

  getRating() {
    const ratingEl = document.querySelector('.product-reviewer-reviews .average-star, .reviewer--rating--xrWWFzx');
    return ratingEl ? parseFloat(ratingEl.textContent) : null;
  }

  getOrderCount() {
    const ordersEl = document.querySelector('[class*="order"], [class*="sold"], .reviewer--sold--ytPeoEy');
    return ordersEl ? ordersEl.textContent.trim() : null;
  }

  getShippingInfo() {
    return this.getTextContent(document, [
      '.shipping-info', '[class*="shipping"]', '.delivery-info', '.dynamic-shipping'
    ]);
  }

  getVariations() {
    const variations = {};
    document.querySelectorAll('.product-variation, .sku-item--container--1DKzz9L').forEach(variation => {
      const type = variation.querySelector('.variation-type, .sku-item--title--1K8Q8AN')?.textContent.trim();
      const options = Array.from(variation.querySelectorAll('.variation-option, .sku-item--image--jMZSVgH')).map(
        opt => opt.textContent.trim() || opt.getAttribute('title') || ''
      ).filter(Boolean);
      if (type) variations[type] = options;
    });
    return variations;
  }

  getSellerInfo() {
    return {
      name: this.getTextContent(document, ['.seller-name', '[class*="seller"]', '.store-info--name--ARDz0oP']),
      rating: this.getTextContent(document, ['.seller-rating']),
      followers: this.getTextContent(document, ['.seller-followers'])
    };
  }

  getCategory() {
    const breadcrumbs = document.querySelector('.breadcrumb, .comet-breadcrumb');
    if (breadcrumbs) {
      const links = breadcrumbs.querySelectorAll('a');
      return links.length > 1 ? links[links.length - 2].textContent.trim() : '';
    }
    return '';
  }

  injectOneClickButtons() {
    if (this.isProductPage()) {
      this.injectProductImportButton();
    }
    this.injectListingButtons();
  }

  isProductPage() {
    return window.location.pathname.includes('/item/') || 
           document.querySelector('.product-title-text, .product-price-value, .title--wrap--UUHae_g');
  }

  injectProductImportButton() {
    if (document.querySelector('.dropcraft-import-btn-main')) return;
    
    const targetEl = document.querySelector('.product-title-text, h1, .title--wrap--UUHae_g');
    if (!targetEl) return;
    
    const button = this.createImportButton('🚀 Importer dans Drop Craft AI', () => {
      this.importProductFromURL(window.location.href);
    });
    button.classList.add('dropcraft-import-btn-main');
    
    targetEl.parentNode.insertBefore(button, targetEl.nextSibling);
  }

  injectListingButtons() {
    const productElements = document.querySelectorAll('.list-item, .product-item, .search-item-card-wrapper-gallery, .multi--outWrapper--SeJ8bEF');
    
    productElements.forEach((element) => {
      if (element.querySelector('.dropcraft-import-btn')) return;
      
      const link = this.getLinkFromElement(element);
      const button = this.createImportButton('Import', () => {
        this.importProductFromURL(link);
      }, true);
      
      element.style.position = 'relative';
      element.appendChild(button);
    });
  }
}

// Amazon specific detector  
class AmazonDetector extends BaseDetector {
  async extractProducts() {
    const products = [];
    
    const productElements = document.querySelectorAll(
      '[data-component-type="s-search-result"], .s-result-item[data-asin], .sg-col-inner'
    );
    
    for (let i = 0; i < Math.min(productElements.length, 50); i++) {
      const element = productElements[i];
      const asin = element.dataset.asin;
      if (!asin) continue;
      
      const product = {
        id: `amazon_${asin}_${Date.now()}`,
        asin: asin,
        name: this.getTextContent(element, ['h2 a span', '.a-text-normal', '.a-size-base-plus']),
        price: this.getPriceContent(element, ['.a-price .a-offscreen', '.a-price-whole', '.a-color-price']),
        image: this.getImageSrc(element, ['.s-image', 'img.s-image']),
        rating: this.getRatingFromElement(element),
        reviews: this.getTextContent(element, ['.a-size-small .a-link-normal']),
        url: this.getLinkFromElement(element),
        domain: 'amazon.com',
        platform: 'amazon',
        scrapedAt: new Date().toISOString(),
        source: 'extension_injected'
      };
      
      if (product.name) products.push(product);
    }
    
    return products;
  }

  async extractSingleProduct() {
    return {
      id: `amazon_${Date.now()}`,
      asin: document.querySelector('[data-asin]')?.dataset.asin || '',
      name: this.getTextContent(document, ['#productTitle', '#title', 'h1']),
      title: this.getTextContent(document, ['#productTitle', '#title', 'h1']),
      price: this.getPriceContent(document, ['.a-price .a-offscreen', '#priceblock_ourprice', '#priceblock_dealprice', '.a-price-whole']),
      image: this.getImageSrc(document, ['#landingImage', '#imgBlkFront', '#main-image']),
      images: this.getProductImages(),
      description: this.getTextContent(document, ['#productDescription', '#feature-bullets']),
      rating: this.getRating(),
      reviews: this.getTextContent(document, ['#acrCustomerReviewText']),
      brand: this.getTextContent(document, ['#bylineInfo', '.po-brand .a-span9']),
      category: this.getCategory(),
      url: window.location.href,
      domain: 'amazon.com',
      platform: 'amazon',
      scrapedAt: new Date().toISOString(),
      source: 'extension_injected'
    };
  }

  getProductImages() {
    const images = [];
    document.querySelectorAll('#altImages img, .imageThumbnail img').forEach(img => {
      let src = img.src || img.dataset.src;
      if (src) {
        // Get larger image
        src = src.replace(/\._[A-Z0-9_]+_\./, '._AC_SL1500_.');
        if (!images.includes(src)) images.push(src);
      }
    });
    return images;
  }

  getRating() {
    const ratingEl = document.querySelector('#acrPopover, .a-icon-star');
    if (ratingEl) {
      const title = ratingEl.getAttribute('title') || ratingEl.textContent;
      const match = title.match(/(\d+\.?\d*)/);
      return match ? parseFloat(match[1]) : null;
    }
    return null;
  }

  getCategory() {
    const breadcrumbs = document.querySelector('#wayfinding-breadcrumbs_container');
    if (breadcrumbs) {
      const links = breadcrumbs.querySelectorAll('a');
      return links.length > 0 ? links[links.length - 1].textContent.trim() : '';
    }
    return '';
  }

  injectOneClickButtons() {
    if (this.isProductPage()) {
      this.injectProductImportButton();
    }
    this.injectListingButtons();
  }

  isProductPage() {
    return window.location.pathname.includes('/dp/') || 
           document.querySelector('#productTitle');
  }

  injectProductImportButton() {
    if (document.querySelector('.dropcraft-import-btn-main')) return;
    
    const targetEl = document.querySelector('#productTitle, #title');
    if (!targetEl) return;
    
    const button = this.createImportButton('🚀 Importer dans Drop Craft AI', () => {
      this.importProductFromURL(window.location.href);
    });
    button.classList.add('dropcraft-import-btn-main');
    
    targetEl.parentNode.insertBefore(button, targetEl.nextSibling);
  }

  injectListingButtons() {
    const productElements = document.querySelectorAll('[data-component-type="s-search-result"]');
    
    productElements.forEach((element) => {
      if (element.querySelector('.dropcraft-import-btn')) return;
      
      const link = this.getLinkFromElement(element);
      const button = this.createImportButton('Import', () => {
        this.importProductFromURL(link);
      }, true);
      
      element.style.position = 'relative';
      element.appendChild(button);
    });
  }
}

// Temu specific detector
class TemuDetector extends BaseDetector {
  async extractProducts() {
    const products = [];
    
    const productElements = document.querySelectorAll(
      '[data-testid="goods-item"], .goods-item, ._2HuFNl-g'
    );
    
    for (let i = 0; i < Math.min(productElements.length, 50); i++) {
      const element = productElements[i];
      const product = {
        id: `temu_${Date.now()}_${i}`,
        name: this.getTextContent(element, ['.goods-title', '[data-testid="goods-title"]', '._2BhJdGp7']),
        price: this.getPriceContent(element, ['.goods-price', '[data-testid="goods-price"]', '._1YKNiRe1']),
        image: this.getImageSrc(element, ['img', '.goods-img img']),
        rating: this.getRatingFromElement(element),
        url: this.getLinkFromElement(element),
        domain: 'temu.com',
        platform: 'temu',
        scrapedAt: new Date().toISOString(),
        source: 'extension_injected'
      };
      
      if (product.name) products.push(product);
    }
    
    return products;
  }

  async extractSingleProduct() {
    return {
      id: `temu_${Date.now()}`,
      name: this.getTextContent(document, ['h1', '.goods-des-title', '[data-testid="goods-title"]']),
      title: this.getTextContent(document, ['h1', '.goods-des-title', '[data-testid="goods-title"]']),
      price: this.getPriceContent(document, ['.goods-price', '[data-testid="goods-price"]', '._1YKNiRe1']),
      image: this.getImageSrc(document, ['.goods-img img', '.main-image img']),
      description: this.getTextContent(document, ['.goods-description', '.detail-desc']),
      rating: this.getRating(),
      url: window.location.href,
      domain: 'temu.com',
      platform: 'temu',
      scrapedAt: new Date().toISOString(),
      source: 'extension_injected'
    };
  }

  getRating() {
    const ratingEl = document.querySelector('[class*="rating"], [class*="star"]');
    if (ratingEl) {
      const match = ratingEl.textContent.match(/(\d+\.?\d*)/);
      return match ? parseFloat(match[1]) : null;
    }
    return null;
  }

  injectOneClickButtons() {
    if (this.isProductPage()) {
      this.injectProductImportButton();
    }
    this.injectListingButtons();
  }

  isProductPage() {
    return window.location.pathname.includes('/goods') || 
           document.querySelector('.goods-des-title, [data-testid="goods-title"]');
  }

  injectProductImportButton() {
    if (document.querySelector('.dropcraft-import-btn-main')) return;
    
    const targetEl = document.querySelector('h1, .goods-des-title');
    if (!targetEl) return;
    
    const button = this.createImportButton('🚀 Importer dans Drop Craft AI', () => {
      this.importProductFromURL(window.location.href);
    });
    button.classList.add('dropcraft-import-btn-main');
    
    targetEl.parentNode.insertBefore(button, targetEl.nextSibling);
  }

  injectListingButtons() {
    const productElements = document.querySelectorAll('[data-testid="goods-item"], .goods-item');
    
    productElements.forEach((element) => {
      if (element.querySelector('.dropcraft-import-btn')) return;
      
      const link = this.getLinkFromElement(element);
      const button = this.createImportButton('Import', () => {
        this.importProductFromURL(link);
      }, true);
      
      element.style.position = 'relative';
      element.appendChild(button);
    });
  }
}

// Shopify detector
class ShopifyDetector extends BaseDetector {
  async extractProducts() {
    const products = [];
    
    const productElements = document.querySelectorAll(
      '.product-item, .grid-product__content, .product-card, [data-product]'
    );
    
    for (let i = 0; i < Math.min(productElements.length, 50); i++) {
      const element = productElements[i];
      const product = {
        id: `shopify_${Date.now()}_${i}`,
        name: this.getTextContent(element, ['.product-item__title', '.grid-product__title', 'h3', '.product-title']),
        price: this.getPriceContent(element, ['.product-item__price', '.grid-product__price', '.price', '.money']),
        image: this.getImageSrc(element, ['.product-item__image img', '.grid-product__image img', 'img']),
        url: this.getLinkFromElement(element),
        domain: window.location.hostname,
        platform: 'shopify',
        scrapedAt: new Date().toISOString(),
        source: 'extension_injected'
      };
      
      if (product.name) products.push(product);
    }
    
    return products;
  }

  async extractSingleProduct() {
    // Try to get product JSON from Shopify
    let productData = null;
    try {
      const productJsonEl = document.querySelector('[data-product-json], script[type="application/json"][data-product-json]');
      if (productJsonEl) {
        productData = JSON.parse(productJsonEl.textContent);
      }
    } catch (e) {}

    return {
      id: `shopify_${Date.now()}`,
      name: productData?.title || this.getTextContent(document, ['h1', '.product-title', '.product__title']),
      title: productData?.title || this.getTextContent(document, ['h1', '.product-title', '.product__title']),
      price: productData?.price ? (productData.price / 100).toFixed(2) : this.getPriceContent(document, ['.product__price', '.price', '.money']),
      image: productData?.featured_image || this.getImageSrc(document, ['.product__media img', '.product-image img']),
      description: productData?.description || this.getTextContent(document, ['.product-description', '.product__description']),
      vendor: productData?.vendor || this.getTextContent(document, ['.product__vendor', '.vendor']),
      url: window.location.href,
      domain: window.location.hostname,
      platform: 'shopify',
      scrapedAt: new Date().toISOString(),
      source: 'extension_injected'
    };
  }

  injectOneClickButtons() {
    if (this.isProductPage()) {
      this.injectProductImportButton();
    }
    this.injectListingButtons();
  }

  isProductPage() {
    return window.location.pathname.includes('/products/') || 
           document.querySelector('.product-single, .product-template, [data-product-json]');
  }

  injectProductImportButton() {
    if (document.querySelector('.dropcraft-import-btn-main')) return;
    
    const targetEl = document.querySelector('h1, .product-title, .product__title');
    if (!targetEl) return;
    
    const button = this.createImportButton('🚀 Importer dans Drop Craft AI', () => {
      this.importProductFromURL(window.location.href);
    });
    button.classList.add('dropcraft-import-btn-main');
    
    targetEl.parentNode.insertBefore(button, targetEl.nextSibling);
  }

  injectListingButtons() {
    const productElements = document.querySelectorAll('.product-item, .grid-product, .product-card');
    
    productElements.forEach((element) => {
      if (element.querySelector('.dropcraft-import-btn')) return;
      
      const link = this.getLinkFromElement(element);
      const button = this.createImportButton('Import', () => {
        this.importProductFromURL(link);
      }, true);
      
      element.style.position = 'relative';
      element.appendChild(button);
    });
  }
}

// WooCommerce detector
class WooCommerceDetector extends BaseDetector {
  async extractProducts() {
    const products = [];
    
    const productElements = document.querySelectorAll(
      '.product, .woocommerce-loop-product__link, li.product'
    );
    
    for (let i = 0; i < Math.min(productElements.length, 50); i++) {
      const element = productElements[i];
      const product = {
        id: `woo_${Date.now()}_${i}`,
        name: this.getTextContent(element, ['.woocommerce-loop-product__title', 'h2', '.product-title']),
        price: this.getPriceContent(element, ['.price', '.woocommerce-Price-amount']),
        image: this.getImageSrc(element, ['.wp-post-image', '.attachment-woocommerce_thumbnail', 'img']),
        url: this.getLinkFromElement(element),
        domain: window.location.hostname,
        platform: 'woocommerce',
        scrapedAt: new Date().toISOString(),
        source: 'extension_injected'
      };
      
      if (product.name) products.push(product);
    }
    
    return products;
  }

  async extractSingleProduct() {
    return {
      id: `woo_${Date.now()}`,
      name: this.getTextContent(document, ['.product_title', 'h1', '.entry-title']),
      title: this.getTextContent(document, ['.product_title', 'h1', '.entry-title']),
      price: this.getPriceContent(document, ['.price', '.woocommerce-Price-amount']),
      image: this.getImageSrc(document, ['.woocommerce-product-gallery__image img', '.wp-post-image']),
      description: this.getTextContent(document, ['.woocommerce-product-details__short-description', '.product-short-description']),
      sku: this.getTextContent(document, ['.sku']),
      categories: this.getCategories(),
      url: window.location.href,
      domain: window.location.hostname,
      platform: 'woocommerce',
      scrapedAt: new Date().toISOString(),
      source: 'extension_injected'
    };
  }

  getCategories() {
    const cats = [];
    document.querySelectorAll('.posted_in a, .product_meta .posted_in a').forEach(a => {
      cats.push(a.textContent.trim());
    });
    return cats;
  }

  injectOneClickButtons() {
    if (this.isProductPage()) {
      this.injectProductImportButton();
    }
    this.injectListingButtons();
  }

  isProductPage() {
    return document.body.classList.contains('single-product') || 
           document.querySelector('.product_title');
  }

  injectProductImportButton() {
    if (document.querySelector('.dropcraft-import-btn-main')) return;
    
    const targetEl = document.querySelector('.product_title, h1');
    if (!targetEl) return;
    
    const button = this.createImportButton('🚀 Importer dans Drop Craft AI', () => {
      this.importProductFromURL(window.location.href);
    });
    button.classList.add('dropcraft-import-btn-main');
    
    targetEl.parentNode.insertBefore(button, targetEl.nextSibling);
  }

  injectListingButtons() {
    const productElements = document.querySelectorAll('li.product, .product');
    
    productElements.forEach((element) => {
      if (element.querySelector('.dropcraft-import-btn')) return;
      
      const link = this.getLinkFromElement(element);
      const button = this.createImportButton('Import', () => {
        this.importProductFromURL(link);
      }, true);
      
      element.style.position = 'relative';
      element.appendChild(button);
    });
  }
}

// Generic detector for unknown platforms
class GenericDetector extends BaseDetector {
  async extractProducts() {
    const products = [];
    
    // Try multiple common selectors
    const selectors = [
      '[data-product]',
      '.product-item, .product-card, .product',
      '[class*="product-"]',
      '.item[data-product]',
      '.listing-item',
      '.goods-item'
    ];
    
    let productElements = [];
    for (const selector of selectors) {
      productElements = document.querySelectorAll(selector);
      if (productElements.length > 0) break;
    }
    
    for (let i = 0; i < Math.min(productElements.length, 50); i++) {
      const element = productElements[i];
      const product = {
        id: `generic_${Date.now()}_${i}`,
        name: this.getTextContent(element, ['h1', 'h2', 'h3', '.title', '.name', '[class*="title"]']),
        price: this.getPriceContent(element, ['.price', '[class*="price"]', '.cost', '.amount']),
        image: this.getImageSrc(element, ['img']),
        url: this.getLinkFromElement(element),
        domain: window.location.hostname,
        platform: 'generic',
        scrapedAt: new Date().toISOString(),
        source: 'extension_injected'
      };
      
      if (product.name || product.price) products.push(product);
    }
    
    return products;
  }

  async extractSingleProduct() {
    return {
      id: `generic_${Date.now()}`,
      name: this.getTextContent(document, ['h1', '.product-title', '.title', '[class*="title"]']),
      title: this.getTextContent(document, ['h1', '.product-title', '.title', '[class*="title"]']),
      price: this.getPriceContent(document, ['.price', '[class*="price"]', '.cost']),
      image: this.getMainProductImage(),
      description: this.getTextContent(document, ['.description', '.product-description', '[class*="description"]']),
      url: window.location.href,
      domain: window.location.hostname,
      platform: 'generic',
      scrapedAt: new Date().toISOString(),
      source: 'extension_injected'
    };
  }

  getMainProductImage() {
    // Try to find the main product image
    const selectors = [
      '.product-image img',
      '.main-image img',
      '[class*="product"] img',
      '.gallery img:first-child',
      'article img:first-child'
    ];
    
    for (const selector of selectors) {
      const img = document.querySelector(selector);
      if (img && img.src && !img.src.includes('logo') && !img.src.includes('icon')) {
        return img.src;
      }
    }
    
    // Fallback: find largest image
    let largestImg = null;
    let maxSize = 0;
    document.querySelectorAll('img').forEach(img => {
      const size = (img.naturalWidth || img.width || 0) * (img.naturalHeight || img.height || 0);
      if (size > maxSize && !img.src.includes('logo') && !img.src.includes('icon')) {
        maxSize = size;
        largestImg = img;
      }
    });
    
    return largestImg?.src || '';
  }

  injectOneClickButtons() {
    // For generic sites, only inject on product-like pages
    if (this.isProductPage()) {
      this.injectProductImportButton();
    }
  }

  isProductPage() {
    // Check for common product page indicators
    const hasPrice = document.querySelector('.price, [class*="price"]');
    const hasAddToCart = document.querySelector('[class*="add-to-cart"], [class*="buy"], button[class*="cart"]');
    const hasProductTitle = document.querySelector('h1');
    
    return hasPrice && (hasAddToCart || hasProductTitle);
  }

  injectProductImportButton() {
    if (document.querySelector('.dropcraft-import-btn-main')) return;
    
    const targetEl = document.querySelector('h1');
    if (!targetEl) return;
    
    const button = this.createImportButton('🚀 Importer dans Drop Craft AI', () => {
      this.importProductFromURL(window.location.href);
    });
    button.classList.add('dropcraft-import-btn-main');
    
    targetEl.parentNode.insertBefore(button, targetEl.nextSibling);
  }
}

// Initialize
try {
  new AdvancedProductDetector();
} catch (error) {
  console.error('[DropCraft] Initialization error:', error);
}
