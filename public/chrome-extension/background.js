// Background script for Drop Craft AI Chrome Extension

class DropCraftBackground {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupContextMenus();
    this.setupAlarms();
  }

  setupEventListeners() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.onInstall();
      } else if (details.reason === 'update') {
        this.onUpdate();
      }
    });

    // Handle messages from content scripts and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Handle tab updates for automatic scraping
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.handleTabUpdate(tabId, tab);
      }
    });

    // Handle alarm events
    chrome.alarms.onAlarm.addListener((alarm) => {
      this.handleAlarm(alarm);
    });
  }

  async onInstall() {
    // Set up initial data
    await chrome.storage.local.set({
      extensionVersion: '1.0.0',
      installDate: new Date().toISOString(),
      settings: {
        autoScrape: false,
        scrapingInterval: 30, // minutes
        enableNotifications: true,
        targetSites: []
      },
      stats: {
        totalScraped: 0,
        sessionsCount: 0,
        lastSync: null
      }
    });

    // Open welcome page
    chrome.tabs.create({
      url: 'https://7af4654f-dfc7-42c6-900f-b9ac682ca5ec.lovableproject.com/extensions-hub?installed=chrome'
    });
  }

  async onUpdate() {
    const result = await chrome.storage.local.get(['extensionVersion']);
    console.log(`Extension updated from ${result.extensionVersion} to 1.0.0`);
    
    await chrome.storage.local.set({
      extensionVersion: '1.0.0',
      lastUpdate: new Date().toISOString()
    });
  }

  setupContextMenus() {
    chrome.contextMenus.create({
      id: 'scrapePage',
      title: 'Scraper cette page avec Drop Craft AI',
      contexts: ['page']
    });

    chrome.contextMenus.create({
      id: 'scrapeSelection',
      title: 'Scraper la sélection',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'openDashboard',
      title: 'Ouvrir Drop Craft AI Dashboard',
      contexts: ['page']
    });

    // Handle context menu clicks
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });
  }

  setupAlarms() {
    // Set up periodic sync alarm
    chrome.alarms.create('periodicSync', {
      delayInMinutes: 30,
      periodInMinutes: 30
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'SCRAPE_PAGE':
          await this.scrapePage(sender.tab);
          break;

        case 'GET_SETTINGS':
          const settings = await this.getSettings();
          sendResponse(settings);
          break;

        case 'UPDATE_SETTINGS':
          await this.updateSettings(message.settings);
          sendResponse({ success: true });
          break;

        case 'SYNC_DATA':
          await this.syncData();
          sendResponse({ success: true });
          break;

        case 'PRODUCTS_SCRAPED':
          await this.handleScrapedProducts(message.products);
          break;

        case 'GET_STATS':
          const stats = await this.getStats();
          sendResponse(stats);
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }

  async handleTabUpdate(tabId, tab) {
    const settings = await this.getSettings();
    
    if (settings.autoScrape && this.isTargetSite(tab.url, settings.targetSites)) {
      // Auto-scrape if enabled for this site
      setTimeout(() => {
        this.scrapePage(tab);
      }, 2000); // Wait for page to fully load
    }
  }

  async handleContextMenuClick(info, tab) {
    switch (info.menuItemId) {
      case 'scrapePage':
        await this.scrapePage(tab);
        break;

      case 'scrapeSelection':
        await this.scrapeSelection(tab, info.selectionText);
        break;

      case 'openDashboard':
        chrome.tabs.create({
          url: 'https://7af4654f-dfc7-42c6-900f-b9ac682ca5ec.lovableproject.com'
        });
        break;
    }
  }

  async handleAlarm(alarm) {
    switch (alarm.name) {
      case 'periodicSync':
        await this.syncData();
        break;
    }
  }

  async scrapePage(tab) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: this.contentScriptScraper
      });

      if (results && results[0] && results[0].result) {
        await this.handleScrapedProducts(results[0].result);
        this.showNotification(`${results[0].result.length} produits scrapés depuis ${tab.title}`);
      }
    } catch (error) {
      console.error('Error scraping page:', error);
      this.showNotification('Erreur lors du scraping', 'error');
    }
  }

  async scrapeSelection(tab, selectionText) {
    // Extract product information from selected text
    const productInfo = this.parseSelectionForProduct(selectionText);
    
    if (productInfo) {
      await this.handleScrapedProducts([{
        ...productInfo,
        id: `selection_${Date.now()}`,
        url: tab.url,
        domain: new URL(tab.url).hostname,
        scrapedAt: new Date().toISOString(),
        source: 'selection'
      }]);
      
      this.showNotification('Produit extrait de la sélection');
    }
  }

  contentScriptScraper() {
    // This function runs in the page context
    const products = [];
    
    // Advanced product detection
    const productSelectors = {
      containers: [
        '[data-testid*="product"]',
        '.product-item, .product-card, .product',
        '[class*="product-"]',
        '.item[data-product]',
        '.listing-item'
      ],
      
      titles: [
        'h1, h2, h3',
        '.product-title, .title, .name',
        '[data-testid*="title"]',
        '[data-testid*="name"]'
      ],
      
      prices: [
        '.price, [class*="price"]',
        '[data-testid*="price"]',
        '.cost, .amount',
        '.currency'
      ],
      
      images: [
        'img[src*="product"]',
        'img[alt*="product"]',
        '.product-image img',
        'img[data-src]'
      ]
    };

    // E-commerce platform specific selectors
    const platformSelectors = {
      shopify: {
        products: '.product-item, .grid-product__content',
        title: '.product-item__title, .grid-product__title',
        price: '.product-item__price, .grid-product__price'
      },
      
      woocommerce: {
        products: '.product, .woocommerce-loop-product__link',
        title: '.woocommerce-loop-product__title',
        price: '.price, .woocommerce-Price-amount'
      },
      
      magento: {
        products: '.product-item, .item',
        title: '.product-item-name',
        price: '.price'
      }
    };

    // Detect platform
    const platform = this.detectPlatform();
    const selectors = platformSelectors[platform] || productSelectors;

    // Extract products
    const productElements = this.findElements(selectors.containers || selectors.products);
    
    productElements.forEach((element, index) => {
      const product = {
        id: `scraped_${Date.now()}_${index}`,
        name: this.extractText(element, selectors.titles || selectors.title),
        price: this.extractPrice(element, selectors.prices || selectors.price),
        image: this.extractImage(element, selectors.images || productSelectors.images),
        url: window.location.href,
        domain: window.location.hostname,
        category: this.extractCategory(),
        description: this.extractDescription(element),
        availability: this.extractAvailability(element),
        rating: this.extractRating(element),
        scrapedAt: new Date().toISOString(),
        source: 'chrome_extension',
        platform: platform
      };

      if (product.name && product.price) {
        products.push(product);
      }
    });

    // If no products found in containers, try single product page
    if (products.length === 0) {
      const singleProduct = this.extractSingleProduct();
      if (singleProduct) products.push(singleProduct);
    }

    return products;
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
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) return Array.from(elements);
    }
    
    return [];
  }

  extractText(container, selectors) {
    if (typeof selectors === 'string') selectors = [selectors];
    
    for (const selector of selectors) {
      const element = container.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    return '';
  }

  extractPrice(container, selectors) {
    if (typeof selectors === 'string') selectors = [selectors];
    
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

  extractImage(container, selectors) {
    if (typeof selectors === 'string') selectors = [selectors];
    
    for (const selector of selectors) {
      const element = container.querySelector(selector);
      if (element) {
        return element.src || element.dataset.src || element.dataset.original;
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

  extractDescription(container) {
    const descSelectors = ['.description', '.product-description', '.summary', '.excerpt'];
    for (const selector of descSelectors) {
      const element = container.querySelector(selector);
      if (element) return element.textContent.trim().substring(0, 200);
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

  extractSingleProduct() {
    return {
      id: `single_${Date.now()}`,
      name: this.extractText(document, ['h1', '.product-title', '.title']),
      price: this.extractPrice(document, ['.price', '[class*="price"]']),
      image: this.extractImage(document, ['img']),
      url: window.location.href,
      domain: window.location.hostname,
      category: this.extractCategory(),
      description: this.extractDescription(document),
      availability: this.extractAvailability(document),
      rating: this.extractRating(document),
      scrapedAt: new Date().toISOString(),
      source: 'chrome_extension_single'
    };
  }

  async handleScrapedProducts(products) {
    if (!products || products.length === 0) return;

    // Store locally
    const result = await chrome.storage.local.get(['scrapedProducts', 'stats']);
    const existingProducts = result.scrapedProducts || [];
    const stats = result.stats || { totalScraped: 0, sessionsCount: 0 };

    const newProducts = [...existingProducts, ...products];
    stats.totalScraped += products.length;
    stats.lastSync = new Date().toISOString();

    await chrome.storage.local.set({
      scrapedProducts: newProducts,
      stats: stats
    });

    // Send to main application
    await this.syncToApplication(products);
  }

  async syncToApplication(products) {
    try {
      const response = await fetch('https://7af4654f-dfc7-42c6-900f-b9ac682ca5ec.lovableproject.com/api/extension/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: products,
          source: 'chrome_extension',
          extensionVersion: '1.0.0',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log('Products synced successfully');
      }
    } catch (error) {
      console.error('Error syncing to application:', error);
    }
  }

  async syncData() {
    const result = await chrome.storage.local.get(['scrapedProducts']);
    const products = result.scrapedProducts || [];
    
    if (products.length > 0) {
      await this.syncToApplication(products);
    }
  }

  async getSettings() {
    const result = await chrome.storage.local.get(['settings']);
    return result.settings || {
      autoScrape: false,
      scrapingInterval: 30,
      enableNotifications: true,
      targetSites: []
    };
  }

  async updateSettings(newSettings) {
    await chrome.storage.local.set({ settings: newSettings });
  }

  async getStats() {
    const result = await chrome.storage.local.get(['stats']);
    return result.stats || {
      totalScraped: 0,
      sessionsCount: 0,
      lastSync: null
    };
  }

  isTargetSite(url, targetSites) {
    if (!targetSites || targetSites.length === 0) return false;
    return targetSites.some(site => url.includes(site));
  }

  parseSelectionForProduct(text) {
    const priceMatch = text.match(/[\d,.]+(€|$|£|₹|¥|kr|zł)/);
    if (priceMatch) {
      return {
        name: text.substring(0, 50).trim(),
        price: priceMatch[0]
      };
    }
    return null;
  }

  showNotification(message, type = 'basic') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Drop Craft AI',
      message: message
    });
  }
}

// Initialize background script
new DropCraftBackground();