// Drop Craft AI Chrome Extension - Content Script v4.0
// Professional Dropshipping Extension

class DropCraftContentScript {
  constructor() {
    this.isActive = false;
    this.scrapingIndicator = null;
    this.init();
  }

  init() {
    this.setupMessageListener();
    this.injectStyles();
    this.setupAutoDetection();
    this.injectSidebar(); // NEW: Inject professional sidebar
    this.injectScript();
    this.setupInjectedScriptListener();
  }

  // NEW: Inject the professional sidebar and tools
  injectSidebar() {
    // Inject sidebar
    const sidebarScript = document.createElement('script');
    sidebarScript.src = chrome.runtime.getURL('sidebar.js');
    sidebarScript.onload = function() { this.remove(); };
    (document.head || document.documentElement).appendChild(sidebarScript);
    
    // Inject grabber for bulk import
    const grabberScript = document.createElement('script');
    grabberScript.src = chrome.runtime.getURL('grabber.js');
    grabberScript.onload = function() { this.remove(); };
    (document.head || document.documentElement).appendChild(grabberScript);
    
    // Inject fulfillment tools
    const fulfillmentScript = document.createElement('script');
    fulfillmentScript.src = chrome.runtime.getURL('fulfillment.js');
    fulfillmentScript.onload = function() { this.remove(); };
    (document.head || document.documentElement).appendChild(fulfillmentScript);
    
    // Inject automation engine
    const automationScript = document.createElement('script');
    automationScript.src = chrome.runtime.getURL('automation.js');
    automationScript.onload = function() { this.remove(); };
    (document.head || document.documentElement).appendChild(automationScript);
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'SCRAPE_PAGE':
        this.scrapePage().then(sendResponse);
        break;
        
      case 'HIGHLIGHT_PRODUCTS':
        this.highlightProducts();
        sendResponse({ success: true });
        break;
        
      case 'REMOVE_HIGHLIGHTS':
        this.removeHighlights();
        sendResponse({ success: true });
        break;
        
      case 'GET_PAGE_INFO':
        sendResponse(this.getPageInfo());
        break;
        
      case 'AUTO_SCRAPE':
        this.startAutoScraping();
        sendResponse({ success: true });
        break;
        
        case 'STOP_AUTO_SCRAPE':
        this.stopAutoScraping();
        sendResponse({ success: true });
        break;
        
      case 'INJECT_ONE_CLICK_BUTTONS':
        this.injectOneClickButtons();
        sendResponse({ success: true });
        break;
    }
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .dropcraft-highlight {
        outline: 2px solid #667eea !important;
        outline-offset: 2px !important;
        background: rgba(102, 126, 234, 0.1) !important;
        transition: all 0.3s ease !important;
      }
      
      .dropcraft-highlight:hover {
        outline-color: #764ba2 !important;
        background: rgba(118, 75, 162, 0.2) !important;
      }
      
      .dropcraft-indicator {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        z-index: 10000;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .dropcraft-indicator:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 25px rgba(102, 126, 234, 0.4);
      }
      
      .dropcraft-indicator.active {
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      
      .dropcraft-tooltip {
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 10001;
        pointer-events: none;
        transition: opacity 0.2s ease;
      }
    `;
    document.head.appendChild(style);
  }

  async scrapePage() {
    this.showScrapingIndicator();
    
    try {
      const products = await this.extractProducts();
      
      // Send to background script
      chrome.runtime.sendMessage({
        type: 'PRODUCTS_SCRAPED',
        products: products
      });
      
      this.hideScrapingIndicator();
      return { success: true, count: products.length };
    } catch (error) {
      this.hideScrapingIndicator();
      return { success: false, error: error.message };
    }
  }

  async extractProducts() {
    const products = [];
    
    // Advanced product detection with multiple strategies
    const strategies = [
      this.extractFromStructuredData.bind(this),
      this.extractFromMicrodata.bind(this),
      this.extractFromContainers.bind(this),
      this.extractSingleProduct.bind(this)
    ];
    
    for (const strategy of strategies) {
      const result = await strategy();
      if (result && result.length > 0) {
        products.push(...result);
        break; // Use the first successful strategy
      }
    }
    
    // Deduplicate products
    return this.deduplicateProducts(products);
  }

  injectScript() {
    // Inject the advanced detector script into the page
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = function() {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  }

  setupInjectedScriptListener() {
    window.addEventListener('message', (event) => {
      if (event.source !== window || !event.data.type) return;
      
      switch (event.data.type) {
        case 'IMPORT_PRODUCTS':
          this.handleImportProducts(event.data.products);
          break;
          
        case 'PRODUCTS_EXTRACTED':
          this.handleExtractedProducts(event.data.products);
          break;
          
        case 'SINGLE_PRODUCT_EXTRACTED':
          if (event.data.product) {
            this.handleImportProducts([event.data.product]);
          }
          break;
      }
    });
  }

  async handleImportProducts(products) {
    if (!products || products.length === 0) return;
    
    this.showScrapingIndicator(`Importation de ${products.length} produit(s)...`);
    
    try {
      // Send to background script for processing
      chrome.runtime.sendMessage({
        type: 'PRODUCTS_SCRAPED',
        products: products
      });
      
      this.showImportNotification(`${products.length} produit(s) importé(s) avec succès!`);
      this.hideScrapingIndicator();
    } catch (error) {
      this.showImportNotification('Erreur lors de l\'importation', 'error');
      this.hideScrapingIndicator();
    }
  }

  handleExtractedProducts(products) {
    this.handleImportProducts(products);
  }

  injectOneClickButtons() {
    // Trigger the injected script to add one-click buttons
    window.postMessage({
      type: 'INJECT_ONE_CLICK_BUTTONS'
    }, '*');
  }

  showImportNotification(message, type = 'success') {
    // Create a toast notification
    const toast = document.createElement('div');
    toast.className = `dropcraft-toast dropcraft-toast-${type}`;
    toast.textContent = message;
    
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: ${type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      z-index: 10002;
      animation: slideIn 0.3s ease-out;
      max-width: 300px;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  extractFromStructuredData() {
    const products = [];
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    
    scripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        const items = Array.isArray(data) ? data : [data];
        
        items.forEach(item => {
          if (item['@type'] === 'Product' || item.type === 'Product') {
            products.push({
              id: `structured_${Date.now()}_${products.length}`,
              name: item.name,
              price: this.extractPriceFromOffer(item.offers),
              image: item.image?.[0] || item.image,
              description: item.description,
              brand: item.brand?.name,
              category: item.category,
              rating: item.aggregateRating?.ratingValue,
              availability: this.mapAvailability(item.offers?.availability),
              url: window.location.href,
              domain: window.location.hostname,
              scrapedAt: new Date().toISOString(),
              source: 'structured_data'
            });
          }
        });
      } catch (e) {
        console.log('Error parsing structured data:', e);
      }
    });
    
    return products;
  }

  extractFromMicrodata() {
    const products = [];
    const productElements = document.querySelectorAll('[itemtype*="Product"]');
    
    productElements.forEach((element, index) => {
      const product = {
        id: `microdata_${Date.now()}_${index}`,
        name: this.getMicrodataProperty(element, 'name'),
        price: this.getMicrodataProperty(element, 'price'),
        image: this.getMicrodataProperty(element, 'image'),
        description: this.getMicrodataProperty(element, 'description'),
        brand: this.getMicrodataProperty(element, 'brand'),
        category: this.getMicrodataProperty(element, 'category'),
        url: window.location.href,
        domain: window.location.hostname,
        scrapedAt: new Date().toISOString(),
        source: 'microdata'
      };
      
      if (product.name) {
        products.push(product);
      }
    });
    
    return products;
  }

  extractFromContainers() {
    const products = [];
    
    // Platform-specific selectors
    const platformSelectors = this.getPlatformSelectors();
    const selectors = platformSelectors[this.detectPlatform()] || platformSelectors.generic;
    
    const productElements = this.findElements(selectors.products);
    
    productElements.forEach((element, index) => {
      const product = {
        id: `container_${Date.now()}_${index}`,
        name: this.extractText(element, selectors.title),
        price: this.extractPrice(element, selectors.price),
        image: this.extractImage(element, selectors.image),
        description: this.extractText(element, selectors.description),
        category: this.extractCategory(),
        availability: this.extractAvailability(element),
        rating: this.extractRating(element),
        url: window.location.href,
        domain: window.location.hostname,
        scrapedAt: new Date().toISOString(),
        source: 'container_extraction',
        platform: this.detectPlatform()
      };
      
      if (product.name && product.price) {
        products.push(product);
      }
    });
    
    return products;
  }

  extractSingleProduct() {
    // Try to extract single product from current page
    const selectors = this.getPlatformSelectors().generic;
    
    const product = {
      id: `single_${Date.now()}`,
      name: this.extractText(document, ['h1', '.product-title', '.title', selectors.title]),
      price: this.extractPrice(document, ['.price', '[class*="price"]', selectors.price]),
      image: this.extractImage(document, ['img', selectors.image]),
      description: this.extractText(document, ['.description', '.product-description']),
      category: this.extractCategory(),
      availability: this.extractAvailability(document),
      rating: this.extractRating(document),
      url: window.location.href,
      domain: window.location.hostname,
      scrapedAt: new Date().toISOString(),
      source: 'single_product'
    };
    
    return product.name ? [product] : [];
  }

  getPlatformSelectors() {
    return {
      shopify: {
        products: '.product-item, .grid-product__content, .product-card',
        title: '.product-item__title, .grid-product__title, h3',
        price: '.product-item__price, .grid-product__price, .price',
        image: '.product-item__image img, .grid-product__image img',
        description: '.product-item__description'
      },
      
      woocommerce: {
        products: '.product, .woocommerce-loop-product__link',
        title: '.woocommerce-loop-product__title, h2',
        price: '.price, .woocommerce-Price-amount',
        image: '.wp-post-image, .attachment-woocommerce_thumbnail',
        description: '.woocommerce-product-details__short-description'
      },
      
      magento: {
        products: '.product-item, .item',
        title: '.product-item-name, .product-name',
        price: '.price, .regular-price',
        image: '.product-image-photo',
        description: '.product-item-description'
      },
      
      prestashop: {
        products: '.product-miniature, .product',
        title: '.product-title, h3',
        price: '.price, .product-price',
        image: '.product-thumbnail img',
        description: '.product-description'
      },
      
      generic: {
        products: [
          '[data-testid*="product"]',
          '.product-item, .product-card, .product',
          '[class*="product-"]',
          '.item[data-product]',
          '.listing-item'
        ],
        title: [
          'h1, h2, h3',
          '.product-title, .title, .name',
          '[data-testid*="title"]'
        ],
        price: [
          '.price, [class*="price"]',
          '[data-testid*="price"]',
          '.cost, .amount'
        ],
        image: [
          'img[src*="product"]',
          'img[alt*="product"]',
          '.product-image img',
          'img'
        ],
        description: [
          '.description, .product-description',
          '.summary, .excerpt'
        ]
      }
    };
  }

  detectPlatform() {
    const indicators = {
      shopify: ['Shopify', 'shopify', '/cdn/shop/', 'myshopify.com'],
      woocommerce: ['woocommerce', 'wp-content', 'wp-includes'],
      magento: ['Magento', 'magento', '/static/version'],
      prestashop: ['PrestaShop', 'prestashop'],
      opencart: ['catalog/view/javascript', 'OpenCart']
    };

    const pageSource = document.documentElement.outerHTML.toLowerCase();
    
    for (const [platform, signs] of Object.entries(indicators)) {
      if (signs.some(sign => pageSource.includes(sign.toLowerCase()))) {
        return platform;
      }
    }
    
    return 'generic';
  }

  findElements(selectors) {
    if (typeof selectors === 'string') selectors = [selectors];
    if (!Array.isArray(selectors)) return [];
    
    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) return Array.from(elements);
      } catch (e) {
        console.log('Invalid selector:', selector);
      }
    }
    
    return [];
  }

  extractText(container, selectors) {
    if (typeof selectors === 'string') selectors = [selectors];
    if (!Array.isArray(selectors)) return '';
    
    for (const selector of selectors) {
      try {
        const element = container.querySelector(selector);
        if (element && element.textContent.trim()) {
          return element.textContent.trim();
        }
      } catch (e) {
        console.log('Invalid selector:', selector);
      }
    }
    return '';
  }

  extractPrice(container, selectors) {
    if (typeof selectors === 'string') selectors = [selectors];
    if (!Array.isArray(selectors)) return '';
    
    for (const selector of selectors) {
      try {
        const element = container.querySelector(selector);
        if (element) {
          const text = element.textContent.trim();
          const priceMatch = text.match(/[\d,.]+(€|$|£|₹|¥|kr|zł|CHF|USD|EUR)/i);
          if (priceMatch) return priceMatch[0];
        }
      } catch (e) {
        console.log('Invalid selector:', selector);
      }
    }
    return '';
  }

  extractImage(container, selectors) {
    if (typeof selectors === 'string') selectors = [selectors];
    if (!Array.isArray(selectors)) return '';
    
    for (const selector of selectors) {
      try {
        const element = container.querySelector(selector);
        if (element) {
          return element.src || element.dataset.src || element.dataset.original || '';
        }
      } catch (e) {
        console.log('Invalid selector:', selector);
      }
    }
    return '';
  }

  extractCategory() {
    const breadcrumbs = document.querySelector('.breadcrumb, .breadcrumbs, nav[aria-label="breadcrumb"]');
    if (breadcrumbs) {
      const links = breadcrumbs.querySelectorAll('a');
      if (links.length > 1) {
        return links[links.length - 2].textContent.trim();
      }
    }
    return '';
  }

  extractAvailability(container) {
    const stockSelectors = ['.stock', '.availability', '.in-stock', '.out-of-stock'];
    for (const selector of stockSelectors) {
      const element = container.querySelector(selector);
      if (element) {
        const text = element.textContent.toLowerCase();
        if (text.includes('stock') || text.includes('disponible')) return 'in_stock';
        if (text.includes('rupture') || text.includes('indisponible')) return 'out_of_stock';
      }
    }
    return 'unknown';
  }

  extractRating(container) {
    const ratingSelectors = ['.rating', '.stars', '.review-rating'];
    for (const selector of ratingSelectors) {
      const element = container.querySelector(selector);
      if (element) {
        const ratingMatch = element.textContent.match(/(\d+\.?\d*)/);
        if (ratingMatch) return parseFloat(ratingMatch[1]);
      }
    }
    return null;
  }

  getMicrodataProperty(element, property) {
    const prop = element.querySelector(`[itemprop="${property}"]`);
    if (prop) {
      return prop.content || prop.textContent.trim() || prop.src;
    }
    return '';
  }

  extractPriceFromOffer(offers) {
    if (!offers) return '';
    const offerArray = Array.isArray(offers) ? offers : [offers];
    const offer = offerArray[0];
    return offer?.price || offer?.lowPrice || '';
  }

  mapAvailability(availability) {
    if (!availability) return 'unknown';
    const av = availability.toLowerCase();
    if (av.includes('instock')) return 'in_stock';
    if (av.includes('outofstock')) return 'out_of_stock';
    return 'unknown';
  }

  deduplicateProducts(products) {
    const seen = new Map();
    return products.filter(product => {
      const key = `${product.name}_${product.price}`;
      if (seen.has(key)) return false;
      seen.set(key, true);
      return true;
    });
  }

  highlightProducts() {
    const selectors = this.getPlatformSelectors().generic.products;
    const elements = this.findElements(selectors);
    
    elements.forEach(element => {
      element.classList.add('dropcraft-highlight');
      
      element.addEventListener('mouseenter', this.showTooltip.bind(this));
      element.addEventListener('mouseleave', this.hideTooltip.bind(this));
    });
  }

  removeHighlights() {
    const highlighted = document.querySelectorAll('.dropcraft-highlight');
    highlighted.forEach(element => {
      element.classList.remove('dropcraft-highlight');
    });
  }

  showTooltip(event) {
    const element = event.target;
    const name = this.extractText(element, this.getPlatformSelectors().generic.title);
    const price = this.extractPrice(element, this.getPlatformSelectors().generic.price);
    
    if (name || price) {
      const tooltip = document.createElement('div');
      tooltip.className = 'dropcraft-tooltip';
      tooltip.textContent = `${name} - ${price}`;
      tooltip.style.left = event.pageX + 10 + 'px';
      tooltip.style.top = event.pageY - 30 + 'px';
      
      document.body.appendChild(tooltip);
      
      setTimeout(() => {
        if (tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip);
        }
      }, 3000);
    }
  }

  hideTooltip() {
    const tooltips = document.querySelectorAll('.dropcraft-tooltip');
    tooltips.forEach(tooltip => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    });
  }

  showScrapingIndicator() {
    if (this.scrapingIndicator) return;
    
    this.scrapingIndicator = document.createElement('div');
    this.scrapingIndicator.className = 'dropcraft-indicator active';
    this.scrapingIndicator.textContent = '🚀 Scraping en cours...';
    
    document.body.appendChild(this.scrapingIndicator);
  }

  hideScrapingIndicator() {
    if (this.scrapingIndicator) {
      this.scrapingIndicator.remove();
      this.scrapingIndicator = null;
    }
  }

  getPageInfo() {
    return {
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
      platform: this.detectPlatform(),
      productCount: this.findElements(this.getPlatformSelectors().generic.products).length
    };
  }

  setupAutoDetection() {
    // Detect if this is an e-commerce page
    const isEcommercePage = this.detectEcommercePage();
    
    if (isEcommercePage) {
      // Show subtle indicator
      this.showPageIndicator();
    }
  }

  detectEcommercePage() {
    const ecommerceIndicators = [
      'add to cart', 'buy now', 'checkout', 'shopping cart',
      'product', 'price', '€', '$', '£', 'shop', 'store'
    ];
    
    const pageText = document.body.textContent.toLowerCase();
    const hasIndicators = ecommerceIndicators.some(indicator => 
      pageText.includes(indicator)
    );
    
    const hasProductStructure = this.findElements(
      this.getPlatformSelectors().generic.products
    ).length > 0;
    
    return hasIndicators || hasProductStructure;
  }

  showPageIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'dropcraft-indicator';
    indicator.textContent = '🛍️ Page e-commerce détectée';
    indicator.style.cursor = 'pointer';
    
    indicator.addEventListener('click', () => {
      this.scrapePage();
    });
    
    document.body.appendChild(indicator);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.style.opacity = '0.5';
      }
    }, 5000);
  }

  startAutoScraping() {
    this.isActive = true;
    this.autoScrapeInterval = setInterval(() => {
      if (this.isActive) {
        this.scrapePage();
      }
    }, 30000); // Every 30 seconds
  }

  stopAutoScraping() {
    this.isActive = false;
    if (this.autoScrapeInterval) {
      clearInterval(this.autoScrapeInterval);
      this.autoScrapeInterval = null;
    }
  }
}

// Initialize content script
new DropCraftContentScript();