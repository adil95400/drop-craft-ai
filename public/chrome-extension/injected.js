// Injected script for advanced product detection
// This script runs in the page context to access site-specific APIs

class AdvancedProductDetector {
  constructor() {
    this.platformDetectors = {
      aliexpress: new AliExpressDetector(),
      amazon: new AmazonDetector(),
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
    if (hostname.includes('myshopify') || document.querySelector('meta[name="generator"][content*="Shopify"]')) return 'shopify';
    if (document.querySelector('meta[name="generator"][content*="WooCommerce"]')) return 'woocommerce';
    
    return 'generic';
  }

  injectOneClickButtons() {
    const platform = this.detectPlatform();
    const detector = this.platformDetectors[platform] || this.platformDetectors.generic;
    detector.injectOneClickButtons();
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
    
    const button = this.createImportButton('Importer dans Drop Craft AI', () => {
      this.importCurrentProduct();
    });
    
    targetEl.parentNode.insertBefore(button, targetEl.nextSibling);
  }

  injectListingButtons() {
    const productElements = document.querySelectorAll('.list-item, .product-item');
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
    
    button.onmouseover = () => {
      button.style.transform = 'translateY(-1px)';
      button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
    };
    
    button.onmouseout = () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 2px 10px rgba(102, 126, 234, 0.3)';
    };
    
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