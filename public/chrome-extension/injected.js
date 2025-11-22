// Injected script for advanced product detection
// This script runs in the page context to access site-specific APIs

class AdvancedProductDetector {
  constructor() {
    this.platformDetectors = {
      aliexpress: new AliExpressDetector(),
      amazon: new AmazonDetector(),
      temu: new TemuDetector(),
      shopify: new ShopifyDetector(),
      woocommerce: new WooCommerceDetector(),
      generic: new GenericDetector()
    };
    
    this.init();
  }

  init() {
    this.setupMessageListener();
    this.injectOneClickButtons();
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
    
    // Inject global styles for toasts
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
        
        .dropcraft-import-btn:active {
          transform: scale(0.95) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// AliExpress specific detector
class AliExpressDetector {
  async extractProducts() {
    const products = [];
    
    // AliExpress product list selectors
    const productElements = document.querySelectorAll(
      '.list-item, .product-item, [data-spm-anchor-id*="item"], .item-info'
    );
    
    for (let i = 0; i < productElements.length; i++) {
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
      price: this.getProductPrice(),
      originalPrice: this.getOriginalPrice(),
      discount: this.getDiscount(),
      image: this.getProductImage(),
      images: this.getProductImages(),
      description: this.getProductDescription(),
      specifications: this.getSpecifications(),
      reviews: await this.getReviews(),
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
        '.item-title', '.title', '.product-title', 'h3', 'h2'
      ]),
      price: this.getPriceContent(element, [
        '.price-current', '.price', '[class*="price"]'
      ]),
      image: this.getImageSrc(element, [
        '.item-img img', '.product-img img', 'img'
      ]),
      rating: this.getRatingFromElement(element),
      orders: this.getOrdersFromElement(element),
      url: this.getLinkFromElement(element),
      domain: 'aliexpress.com',
      platform: 'aliexpress',
      scrapedAt: new Date().toISOString(),
      source: 'extension_injected'
    };
  }

  getProductTitle() {
    return this.getTextContent(document, [
      'h1', '.product-title-text', '[data-pl="product-title"]'
    ]);
  }

  getProductPrice() {
    return this.getPriceContent(document, [
      '.product-price-value', '.price-current', '[data-pl="product-price"]'
    ]);
  }

  getOriginalPrice() {
    return this.getPriceContent(document, [
      '.price-original', '.price-del', '[class*="original-price"]'
    ]);
  }

  getDiscount() {
    const discountEl = document.querySelector('.discount, [class*="discount"]');
    return discountEl ? discountEl.textContent.trim() : null;
  }

  getProductImage() {
    return this.getImageSrc(document, [
      '.magnifier-image img', '.product-image img', '.main-image img'
    ]);
  }

  getProductImages() {
    const images = [];
    document.querySelectorAll('.images-view-item img, .thumb-img img').forEach(img => {
      const src = img.src || img.dataset.src;
      if (src) images.push(src);
    });
    return images;
  }

  getProductDescription() {
    return this.getTextContent(document, [
      '.product-description', '[data-pl="product-description"]'
    ]);
  }

  getSpecifications() {
    const specs = {};
    document.querySelectorAll('.product-prop-list .product-prop').forEach(prop => {
      const key = prop.querySelector('.prop-title')?.textContent.trim();
      const value = prop.querySelector('.prop-value')?.textContent.trim();
      if (key && value) specs[key] = value;
    });
    return specs;
  }

  async getReviews() {
    const reviews = [];
    document.querySelectorAll('.review-item').forEach((review, index) => {
      if (index < 5) { // Limit to first 5 reviews
        reviews.push({
          rating: this.getRatingFromElement(review),
          text: this.getTextContent(review, ['.review-content', '.review-text']),
          author: this.getTextContent(review, ['.review-author', '.reviewer-name']),
          date: this.getTextContent(review, ['.review-date', '.review-time'])
        });
      }
    });
    return reviews;
  }

  getRating() {
    const ratingEl = document.querySelector('.product-reviewer-reviews .average-star');
    return ratingEl ? parseFloat(ratingEl.textContent) : null;
  }

  getOrderCount() {
    const ordersEl = document.querySelector('[class*="order"], [class*="sold"]');
    return ordersEl ? ordersEl.textContent.trim() : null;
  }

  getShippingInfo() {
    return this.getTextContent(document, [
      '.shipping-info', '[class*="shipping"]', '.delivery-info'
    ]);
  }

  getVariations() {
    const variations = {};
    document.querySelectorAll('.product-variation').forEach(variation => {
      const type = variation.querySelector('.variation-type')?.textContent.trim();
      const options = Array.from(variation.querySelectorAll('.variation-option')).map(
        opt => opt.textContent.trim()
      );
      if (type) variations[type] = options;
    });
    return variations;
  }

  getSellerInfo() {
    return {
      name: this.getTextContent(document, ['.seller-name', '[class*="seller"]']),
      rating: this.getTextContent(document, ['.seller-rating']),
      followers: this.getTextContent(document, ['.seller-followers'])
    };
  }

  getCategory() {
    const breadcrumbs = document.querySelector('.breadcrumb');
    if (breadcrumbs) {
      const links = breadcrumbs.querySelectorAll('a');
      return links.length > 1 ? links[links.length - 2].textContent.trim() : '';
    }
    return '';
  }

  injectOneClickButtons() {
    // Inject import button on product pages
    if (this.isProductPage()) {
      this.injectProductImportButton();
    }
    
    // Inject buttons on product listings
    this.injectListingButtons();
  }

  isProductPage() {
    return window.location.pathname.includes('/item/') || 
           document.querySelector('.product-title-text, .product-price-value');
  }

  injectProductImportButton() {
    if (document.querySelector('.dropcraft-import-btn')) return;
    
    const targetEl = document.querySelector('.product-title-text, h1');
    if (!targetEl) return;
    
    const button = this.createImportButton('🚀 Importer dans Drop Craft AI', () => {
      this.importCurrentProduct();
    });
    
    targetEl.parentNode.insertBefore(button, targetEl.nextSibling);
  }

  injectListingButtons() {
    const productElements = document.querySelectorAll('.list-item, .product-item');
    productElements.forEach((element) => {
      if (element.querySelector('.dropcraft-import-btn')) return;
      
      const button = this.createImportButton('Importer', () => {
        this.importProductFromURL(this.getLinkFromElement(element));
      }, true);
      
      element.style.position = 'relative';
      element.appendChild(button);
    });
  }

  createImportButton(text, onClick, isSmall = false) {
    const button = document.createElement('button');
    button.className = 'dropcraft-import-btn';
    button.textContent = text;
    button.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    };
    
    button.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: ${isSmall ? '6px 12px' : '12px 24px'};
      border-radius: ${isSmall ? '6px' : '8px'};
      font-size: ${isSmall ? '12px' : '16px'};
      font-weight: 600;
      cursor: pointer;
      position: ${isSmall ? 'absolute' : 'relative'};
      top: ${isSmall ? '10px' : 'auto'};
      right: ${isSmall ? '10px' : 'auto'};
      z-index: 10000;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      margin: ${isSmall ? '0' : '16px 0'};
      display: inline-flex;
      align-items: center;
      gap: 8px;
    `;
    
    button.onmouseover = () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
    };
    
    button.onmouseout = () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
    };
    
    return button;
  }

  async importCurrentProduct() {
    this.importProductFromURL(window.location.href);
  }

  async importProductFromElement(element, index) {
    const link = this.getLinkFromElement(element);
    this.importProductFromURL(link);
  }

  async importProductFromURL(url) {
    this.showLoadingToast('⏳ Import en cours...');
    
    try {
      const response = await fetch('https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/product-url-scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      const result = await response.json();
      
      if (result.success) {
        this.showSuccessToast(`✅ ${result.product?.name || 'Produit'} importé!`);
      } else {
        this.showErrorToast('❌ ' + (result.error || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Import error:', error);
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
    setTimeout(() => toast.remove(), 3000);
  }

  showErrorToast(message) {
    this.hideAllToasts();
    const toast = this.createToast(message, '#ef4444');
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  hideAllToasts() {
    document.querySelectorAll('.dropcraft-toast').forEach(t => t.remove());
  }

  createToast(message, color) {
    const toast = document.createElement('div');
    toast.className = 'dropcraft-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${color};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
      z-index: 100000;
      animation: slideIn 0.3s ease-out;
      max-width: 350px;
    `;
    return toast;
  }

  // Utility methods
  getTextContent(container, selectors) {
    for (const selector of selectors) {
      const element = container.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    return '';
  }

  getPriceContent(container, selectors) {
    for (const selector of selectors) {
      const element = container.querySelector(selector);
      if (element) {
        const text = element.textContent.trim();
        const priceMatch = text.match(/[\d,.]+(€|$|£|₹|¥|kr|zł|CHF|USD|EUR)/i);
        if (priceMatch) return priceMatch[0];
      }
    }
    return '';
  }

  getImageSrc(container, selectors) {
    for (const selector of selectors) {
      const element = container.querySelector(selector);
      if (element) {
        return element.src || element.dataset.src || element.dataset.original || '';
      }
    }
    return '';
  }

  getRatingFromElement(element) {
    const ratingEl = element.querySelector('.star, .rating, [class*="star"]');
    if (ratingEl) {
      const ratingMatch = ratingEl.textContent.match(/(\d+\.?\d*)/);
      return ratingMatch ? parseFloat(ratingMatch[1]) : null;
    }
    return null;
  }

  getOrdersFromElement(element) {
    const ordersEl = element.querySelector('[class*="order"], [class*="sold"]');
    return ordersEl ? ordersEl.textContent.trim() : null;
  }

  getLinkFromElement(element) {
    const link = element.querySelector('a');
    return link ? link.href : window.location.href;
  }
}

// Temu specific detector  
class TemuDetector {
  async extractProducts() {
    const products = [];
    const productElements = document.querySelectorAll(
      '[data-testid="product-card"], .goods-item, .product-item'
    );
    
    for (let i = 0; i < productElements.length; i++) {
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
      id: `temu_${Date.now()}`,
      name: this.getProductTitle(),
      price: this.getProductPrice(),
      originalPrice: this.getOriginalPrice(),
      discount: this.getDiscount(),
      image: this.getProductImage(),
      images: this.getProductImages(),
      description: this.getProductDescription(),
      rating: this.getRating(),
      reviews: this.getReviewCount(),
      url: window.location.href,
      domain: 'temu.com',
      platform: 'temu',
      scrapedAt: new Date().toISOString(),
      source: 'extension_injected'
    };
  }

  async extractProductFromElement(element, index) {
    return {
      id: `temu_list_${Date.now()}_${index}`,
      name: this.getTextContent(element, [
        'h1', 'h2', 'h3', '.product-title', '[class*="title"]'
      ]),
      price: this.getPriceContent(element, [
        '.price', '[class*="price"]', '[data-testid*="price"]'
      ]),
      image: this.getImageSrc(element, [
        'img[src*="product"]', 'img'
      ]),
      url: this.getLinkFromElement(element),
      domain: 'temu.com',
      platform: 'temu',
      scrapedAt: new Date().toISOString(),
      source: 'extension_injected'
    };
  }

  getProductTitle() {
    return this.getTextContent(document, [
      'h1', '[data-testid="product-title"]', '.product-title'
    ]);
  }

  getProductPrice() {
    return this.getPriceContent(document, [
      '[class*="price-current"]', '.price', '[data-testid*="price"]'
    ]);
  }

  getOriginalPrice() {
    return this.getPriceContent(document, [
      '[class*="original"]', '[class*="regular"]'
    ]);
  }

  getDiscount() {
    const discountEl = document.querySelector('[class*="discount"], [class*="save"]');
    return discountEl ? discountEl.textContent.trim() : null;
  }

  getProductImage() {
    return this.getImageSrc(document, [
      '[class*="main-image"] img', 'img[alt*="product"]', 'img'
    ]);
  }

  getProductImages() {
    const images = [];
    document.querySelectorAll('img[src*="product"], [class*="gallery"] img').forEach(img => {
      const src = img.src || img.dataset.src;
      if (src && !images.includes(src)) images.push(src);
    });
    return images.slice(0, 10); // Limit to 10 images
  }

  getProductDescription() {
    return this.getTextContent(document, [
      '[class*="description"]', '[data-testid="description"]', 'p'
    ]);
  }

  getRating() {
    const ratingEl = document.querySelector('[class*="rating"], [class*="star"]');
    if (ratingEl) {
      const ratingMatch = ratingEl.textContent.match(/(\d+\.?\d*)/);
      return ratingMatch ? parseFloat(ratingMatch[1]) : null;
    }
    return null;
  }

  getReviewCount() {
    const reviewEl = document.querySelector('[class*="review"]');
    return reviewEl ? reviewEl.textContent.trim() : null;
  }

  injectOneClickButtons() {
    if (this.isProductPage()) {
      this.injectProductImportButton();
    }
    this.injectListingButtons();
  }

  isProductPage() {
    return window.location.pathname.includes('/g-') || 
           document.querySelector('h1, [data-testid="product-title"]');
  }

  injectProductImportButton() {
    if (document.querySelector('.dropcraft-import-btn')) return;
    
    const targetEl = document.querySelector('h1, [data-testid="product-title"]');
    if (!targetEl) return;
    
    const button = this.createImportButton('🚀 Importer dans Drop Craft AI', () => {
      this.importCurrentProduct();
    });
    
    targetEl.parentNode.insertBefore(button, targetEl.nextSibling);
  }

  injectListingButtons() {
    const productElements = document.querySelectorAll('[data-testid="product-card"], .goods-item');
    productElements.forEach((element, index) => {
      if (element.querySelector('.dropcraft-import-btn')) return;
      
      const button = this.createImportButton('Importer', () => {
        this.importProductFromURL(this.getLinkFromElement(element));
      }, true);
      
      element.style.position = 'relative';
      element.appendChild(button);
    });
  }

  createImportButton(text, onClick, isSmall = false) {
    const button = document.createElement('button');
    button.className = 'dropcraft-import-btn';
    button.textContent = text;
    button.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    };
    
    button.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: ${isSmall ? '6px 12px' : '12px 24px'};
      border-radius: ${isSmall ? '6px' : '8px'};
      font-size: ${isSmall ? '12px' : '16px'};
      font-weight: 600;
      cursor: pointer;
      position: ${isSmall ? 'absolute' : 'relative'};
      top: ${isSmall ? '10px' : 'auto'};
      right: ${isSmall ? '10px' : 'auto'};
      z-index: 10000;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      margin: ${isSmall ? '0' : '16px 0'};
      display: inline-flex;
      align-items: center;
      gap: 8px;
    `;
    
    button.onmouseover = () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
    };
    
    button.onmouseout = () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
    };
    
    return button;
  }

  async importCurrentProduct() {
    this.importProductFromURL(window.location.href);
  }

  async importProductFromURL(url) {
    this.showLoadingToast('⏳ Import en cours...');
    
    try {
      // Use the product-url-scraper edge function
      const response = await fetch('https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/product-url-scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      const result = await response.json();
      
      if (result.success) {
        this.showSuccessToast(`✅ ${result.product?.name || 'Produit'} importé avec succès!`);
      } else {
        this.showErrorToast('❌ Erreur lors de l\'import: ' + (result.error || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Import error:', error);
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
    setTimeout(() => toast.remove(), 3000);
  }

  showErrorToast(message) {
    this.hideAllToasts();
    const toast = this.createToast(message, '#ef4444');
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  hideAllToasts() {
    document.querySelectorAll('.dropcraft-toast').forEach(t => t.remove());
  }

  createToast(message, color) {
    const toast = document.createElement('div');
    toast.className = 'dropcraft-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${color};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
      z-index: 100000;
      animation: slideIn 0.3s ease-out;
      max-width: 350px;
    `;
    return toast;
  }

  // Utility methods
  getTextContent(container, selectors) {
    for (const selector of selectors) {
      const element = container.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    return '';
  }

  getPriceContent(container, selectors) {
    for (const selector of selectors) {
      const element = container.querySelector(selector);
      if (element) {
        const text = element.textContent.trim();
        const priceMatch = text.match(/[\d,.]+(€|$|£|₹|¥|kr|zł|CHF|USD|EUR)/i);
        if (priceMatch) return priceMatch[0];
      }
    }
    return '';
  }

  getImageSrc(container, selectors) {
    for (const selector of selectors) {
      const element = container.querySelector(selector);
      if (element) {
        return element.src || element.dataset.src || element.dataset.original || '';
      }
    }
    return '';
  }

  getLinkFromElement(element) {
    const link = element.querySelector('a');
    return link ? link.href : window.location.href;
  }
}

// Amazon specific detector
class AmazonDetector {
  async extractProducts() {
    const products = [];
    const productElements = document.querySelectorAll(
      '[data-component-type="s-search-result"], .s-result-item, .a-section'
    );
    
    for (let i = 0; i < productElements.length; i++) {
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
      id: `amazon_${Date.now()}`,
      name: this.getTextContent(document, ['#productTitle', 'h1']),
      price: this.getPriceContent(document, ['.a-price-current', '.a-price']),
      image: this.getImageSrc(document, ['#landingImage', '.a-dynamic-image']),
      description: this.getTextContent(document, ['#feature-bullets', '.a-unordered-list']),
      rating: this.getRating(),
      reviews: this.getReviewCount(),
      url: window.location.href,
      domain: 'amazon.com',
      platform: 'amazon',
      scrapedAt: new Date().toISOString(),
      source: 'extension_injected'
    };
  }

  async extractProductFromElement(element, index) {
    return {
      id: `amazon_list_${Date.now()}_${index}`,
      name: this.getTextContent(element, ['h2 a span', '.s-size-mini span']),
      price: this.getPriceContent(element, ['.a-price-current', '.a-price']),
      image: this.getImageSrc(element, ['.s-image']),
      rating: this.getRatingFromElement(element),
      url: this.getLinkFromElement(element),
      domain: 'amazon.com',
      platform: 'amazon',
      scrapedAt: new Date().toISOString(),
      source: 'extension_injected'
    };
  }

  getRating() {
    const ratingEl = document.querySelector('.a-icon-alt');
    if (ratingEl) {
      const ratingMatch = ratingEl.textContent.match(/(\d+\.?\d*)/);
      return ratingMatch ? parseFloat(ratingMatch[1]) : null;
    }
    return null;
  }

  getReviewCount() {
    const reviewEl = document.querySelector('#acrCustomerReviewText');
    return reviewEl ? reviewEl.textContent.trim() : null;
  }

  injectOneClickButtons() {
    // Similar implementation as AliExpress but with Amazon-specific selectors
    if (this.isProductPage()) {
      this.injectProductImportButton();
    }
    this.injectListingButtons();
  }

  isProductPage() {
    return document.querySelector('#productTitle') || window.location.pathname.includes('/dp/');
  }

  // ... (similar utility methods as AliExpress)
  getTextContent(container, selectors) {
    for (const selector of selectors) {
      const element = container.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    return '';
  }

  getPriceContent(container, selectors) {
    for (const selector of selectors) {
      const element = container.querySelector(selector);
      if (element) {
        const text = element.textContent.trim();
        const priceMatch = text.match(/[\d,.]+(€|$|£|₹|¥|kr|zł|CHF|USD|EUR)/i);
        if (priceMatch) return priceMatch[0];
      }
    }
    return '';
  }

  getImageSrc(container, selectors) {
    for (const selector of selectors) {
      const element = container.querySelector(selector);
      if (element) {
        return element.src || element.dataset.src || element.dataset.original || '';
      }
    }
    return '';
  }

  getRatingFromElement(element) {
    const ratingEl = element.querySelector('.a-icon-alt');
    if (ratingEl) {
      const ratingMatch = ratingEl.textContent.match(/(\d+\.?\d*)/);
      return ratingMatch ? parseFloat(ratingMatch[1]) : null;
    }
    return null;
  }

  getLinkFromElement(element) {
    const link = element.querySelector('h2 a, .s-link-style a');
    return link ? new URL(link.href, window.location.origin).href : window.location.href;
  }

  injectProductImportButton() {
    if (document.querySelector('.dropcraft-import-btn')) return;
    
    const targetEl = document.querySelector('#productTitle');
    if (!targetEl) return;
    
    const button = this.createImportButton('Importer dans Drop Craft AI', () => {
      this.importCurrentProduct();
    });
    
    targetEl.parentNode.insertBefore(button, targetEl.nextSibling);
  }

  injectListingButtons() {
    const productElements = document.querySelectorAll('[data-component-type="s-search-result"]');
    productElements.forEach((element, index) => {
      if (element.querySelector('.dropcraft-import-btn')) return;
      
      const button = this.createImportButton('Importer', () => {
        this.importProductFromElement(element, index);
      }, true);
      
      element.style.position = 'relative';
      element.appendChild(button);
    });
  }

  createImportButton(text, onClick, isSmall = false) {
    const button = document.createElement('button');
    button.className = 'dropcraft-import-btn';
    button.textContent = text;
    button.onclick = onClick;
    
    button.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: ${isSmall ? '6px 12px' : '10px 20px'};
      border-radius: ${isSmall ? '4px' : '6px'};
      font-size: ${isSmall ? '11px' : '14px'};
      font-weight: 500;
      cursor: pointer;
      position: ${isSmall ? 'absolute' : 'static'};
      top: ${isSmall ? '10px' : 'auto'};
      right: ${isSmall ? '10px' : 'auto'};
      z-index: 1000;
      transition: all 0.2s ease;
      box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
    `;
    
    return button;
  }

  async importCurrentProduct() {
    const product = await this.extractSingleProduct();
    this.sendToExtension([product]);
  }

  async importProductFromElement(element, index) {
    const product = await this.extractProductFromElement(element, index);
    this.sendToExtension([product]);
  }

  sendToExtension(products) {
    window.postMessage({
      type: 'IMPORT_PRODUCTS',
      products: products
    }, '*');
  }
}

// Shopify and other platform detectors (simplified)
class ShopifyDetector {
  async extractProducts() {
    // Shopify-specific logic
    return [];
  }

  async extractSingleProduct() {
    return null;
  }

  injectOneClickButtons() {
    // Shopify-specific button injection
  }
}

class WooCommerceDetector {
  async extractProducts() {
    // WooCommerce-specific logic
    return [];
  }

  async extractSingleProduct() {
    return null;
  }

  injectOneClickButtons() {
    // WooCommerce-specific button injection
  }
}

class GenericDetector {
  async extractProducts() {
    // Generic e-commerce detection
    return [];
  }

  async extractSingleProduct() {
    return null;
  }

  injectOneClickButtons() {
    // Generic button injection
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AdvancedProductDetector();
  });
} else {
  new AdvancedProductDetector();
}