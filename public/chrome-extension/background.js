// ShopOpti+ Chrome Extension - Background Service Worker v4.4.0
// SECURITY HARDENED - Message validation, URL whitelist, rate limiting

const API_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';
const APP_URL = 'https://shopopti.io';
const VERSION = '4.4.0';

// ============================================
// SECURITY MODULE (inline for service worker)
// ============================================
const Security = {
  ALLOWED_API_DOMAINS: ['supabase.co', 'shopopti.io'],
  
  ALLOWED_SCRAPE_DOMAINS: [
    'aliexpress.com', 'aliexpress.fr', 'aliexpress.us',
    'amazon.com', 'amazon.fr', 'amazon.de', 'amazon.co.uk', 'amazon.es', 'amazon.it', 'amazon.ca', 'amazon.co.jp',
    'ebay.com', 'ebay.fr', 'ebay.de', 'ebay.co.uk',
    'walmart.com', 'etsy.com', 'temu.com', 'wish.com',
    'shein.com', 'shein.fr', 'banggood.com', 'dhgate.com',
    '1688.com', 'taobao.com', 'cjdropshipping.com',
    'lightinthebox.com', 'gearbest.com', 'made-in-china.com',
    'cdiscount.com', 'fnac.com', 'rakuten.fr', 'rakuten.com',
    'homedepot.com', 'lowes.com', 'costco.com',
    'darty.com', 'boulanger.com', 'manomano.fr', 'leroymerlin.fr',
    'target.com', 'bestbuy.com', 'newegg.com',
    'overstock.com', 'wayfair.com', 'zalando.fr', 'asos.com',
    'myshopify.com'
  ],

  ALLOWED_MESSAGE_TYPES: [
    'PING', 'GET_SETTINGS', 'UPDATE_SETTINGS', 'SYNC_DATA',
    'PRODUCTS_SCRAPED', 'GET_STATS', 'IMPORT_REVIEWS',
    'SCRAPE_URL', 'IMPORT_PRODUCT', 'FETCH_API',
    'IMPORT_FROM_URL', 'IMPORT_PRODUCT_WITH_REVIEWS',
    'OPEN_BULK_IMPORT', 'ADD_TO_MONITORING', 'REMOVE_FROM_MONITORING',
    'CHECK_PRICES', 'CHECK_STOCK', 'GET_MONITORED_PRODUCTS',
    'GET_PRICE_HISTORY', 'GET_MONITORING_STATUS', 'GET_PRODUCT_DATA',
    'FIND_SUPPLIERS'
  ],

  rateLimits: new Map(),

  isUrlAllowedForApi(url) {
    if (!url || typeof url !== 'string') return false;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') return false;
      const hostname = parsed.hostname.toLowerCase();
      return this.ALLOWED_API_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
    } catch (e) { return false; }
  },

  isUrlAllowedForScrape(url) {
    if (!url || typeof url !== 'string') return false;
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) return false;
      const hostname = parsed.hostname.toLowerCase();
      return this.ALLOWED_SCRAPE_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
    } catch (e) { return false; }
  },

  validateMessage(message, sender) {
    if (!message || typeof message !== 'object') {
      return { valid: false, error: 'Invalid message structure' };
    }
    if (!message.type || typeof message.type !== 'string') {
      return { valid: false, error: 'Missing message type' };
    }
    if (!this.ALLOWED_MESSAGE_TYPES.includes(message.type)) {
      console.warn('[ShopOpti+ Security] Unknown message type:', message.type);
      return { valid: false, error: 'Unknown message type' };
    }

    // URL validation for specific message types
    if (message.url) {
      if (message.type === 'FETCH_API') {
        if (!this.isUrlAllowedForApi(message.url)) {
          return { valid: false, error: 'URL not in API whitelist' };
        }
      } else if (['SCRAPE_URL', 'IMPORT_FROM_URL', 'IMPORT_PRODUCT_WITH_REVIEWS'].includes(message.type)) {
        if (!this.isUrlAllowedForScrape(message.url)) {
          return { valid: false, error: 'URL not in scrape whitelist' };
        }
      }
    }

    return { valid: true };
  },

  checkRateLimit(action, limit = 30, windowMs = 60000) {
    const now = Date.now();
    if (!this.rateLimits.has(action)) {
      this.rateLimits.set(action, { count: 0, resetAt: now + windowMs });
    }
    const data = this.rateLimits.get(action);
    if (now > data.resetAt) {
      data.count = 0;
      data.resetAt = now + windowMs;
    }
    data.count++;
    return data.count <= limit;
  },

  sanitizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/[<>'"&]/g, c => ({
      '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;', '&': '&amp;'
    }[c]));
  }
};

// ============================================
// MAIN CLASS
// ============================================
class ShopOptiBackground {
  constructor() {
    console.log('[ShopOpti+] Background service worker v4.4.0 initializing (Security Hardened)...');
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupContextMenus();
    this.setupAlarms();
    console.log('[ShopOpti+] Background service worker initialized');
  }

  setupEventListeners() {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.onInstall();
      } else if (details.reason === 'update') {
        this.onUpdate(details.previousVersion);
      }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.handleTabUpdate(tabId, tab);
      }
    });

    chrome.alarms.onAlarm.addListener((alarm) => {
      this.handleAlarm(alarm);
    });
  }

  async onInstall() {
    console.log(`[ShopOpti+] Extension installed v${VERSION}`);
    
    await chrome.storage.local.set({
      extensionVersion: VERSION,
      installDate: new Date().toISOString(),
      settings: {
        autoInjectButtons: true,
        autoPriceMonitoring: false,
        autoStockAlerts: false,
        pushNotifications: true
      },
      stats: { products: 0, reviews: 0, monitored: 0 },
      activities: [],
      pendingItems: [],
      importHistory: []
    });

    chrome.tabs.create({
      url: `${APP_URL}/extensions/chrome?installed=true&v=${VERSION}`
    });
  }

  async onUpdate(previousVersion) {
    console.log(`[ShopOpti+] Extension updated from ${previousVersion} to ${VERSION}`);
    await chrome.storage.local.set({
      extensionVersion: VERSION,
      lastUpdate: new Date().toISOString()
    });
  }

  setupContextMenus() {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'shopopti-import-product',
        title: 'Importer dans ShopOpti',
        contexts: ['page', 'link']
      });

      chrome.contextMenus.create({
        id: 'shopopti-import-reviews',
        title: 'Importer les avis',
        contexts: ['page']
      });

      chrome.contextMenus.create({
        id: 'shopopti-monitor-price',
        title: 'Surveiller le prix',
        contexts: ['page']
      });

      chrome.contextMenus.create({
        id: 'separator-1',
        type: 'separator',
        contexts: ['page']
      });

      chrome.contextMenus.create({
        id: 'shopopti-open-dashboard',
        title: 'Ouvrir ShopOpti',
        contexts: ['page']
      });
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });
  }

  setupAlarms() {
    chrome.alarms.create('periodic-sync', {
      delayInMinutes: 30,
      periodInMinutes: 30
    });
  }

  async handleMessage(message, sender, sendResponse) {
    // Security validation
    const validation = Security.validateMessage(message, sender);
    if (!validation.valid) {
      console.error('[ShopOpti+] Message validation failed:', validation.error);
      sendResponse({ success: false, error: validation.error });
      return;
    }

    // Rate limiting
    if (!Security.checkRateLimit(message.type)) {
      console.warn('[ShopOpti+] Rate limit exceeded for:', message.type);
      sendResponse({ success: false, error: 'Rate limit exceeded. Please wait.' });
      return;
    }

    console.log('[ShopOpti+] Message received:', message.type);
    
    try {
      switch (message.type) {
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
          sendResponse({ success: true, count: message.products?.length || 0 });
          break;

        case 'GET_STATS':
          const stats = await this.getStats();
          sendResponse(stats);
          break;

        case 'IMPORT_REVIEWS':
          const reviews = await this.importReviews(message.config);
          sendResponse({ success: true, count: reviews?.length || 0 });
          break;

        case 'SCRAPE_URL':
          const result = await this.scrapeUrl(message.url);
          sendResponse(result);
          break;
          
        case 'IMPORT_PRODUCT':
          const importResult = await this.importProduct(message.product);
          sendResponse(importResult);
          break;
          
        case 'FETCH_API':
          const fetchResult = await this.fetchApi(message.url, message.options);
          sendResponse(fetchResult);
          break;

        case 'IMPORT_FROM_URL':
          const urlImportResult = await this.scrapeAndImport(message.url);
          sendResponse(urlImportResult);
          break;

        case 'IMPORT_PRODUCT_WITH_REVIEWS':
          const combinedResult = await this.importProductWithReviews(message.url, message.reviewLimit);
          sendResponse(combinedResult);
          break;

        case 'OPEN_BULK_IMPORT':
          chrome.tabs.create({ url: `${APP_URL}/products/import` });
          sendResponse({ success: true });
          break;

        case 'ADD_TO_MONITORING':
          await this.addToMonitoring(message.url, message.productData);
          sendResponse({ success: true });
          break;

        case 'REMOVE_FROM_MONITORING':
          await this.removeFromMonitoring(message.url, message.productId);
          sendResponse({ success: true });
          break;

        case 'CHECK_PRICES':
          await this.checkPriceChanges();
          sendResponse({ success: true });
          break;

        case 'CHECK_STOCK':
          await this.checkStockChanges();
          sendResponse({ success: true });
          break;

        case 'GET_MONITORED_PRODUCTS':
          const monitored = await this.getMonitoredProducts();
          sendResponse({ success: true, products: monitored });
          break;

        case 'GET_PRICE_HISTORY':
          const history = await this.getPriceHistory(message.productId);
          sendResponse({ success: true, history });
          break;

        case 'GET_MONITORING_STATUS':
          const { monitoredUrls, lastPriceCheck, lastStockCheck, priceHistory, stockHistory } = 
            await chrome.storage.local.get(['monitoredUrls', 'lastPriceCheck', 'lastStockCheck', 'priceHistory', 'stockHistory']);
          sendResponse({
            success: true,
            status: {
              monitoredCount: monitoredUrls?.length || 0,
              lastPriceCheck,
              lastStockCheck,
              recentPriceChanges: priceHistory?.slice(0, 5) || [],
              recentStockChanges: stockHistory?.slice(0, 5) || []
            }
          });
          break;

        case 'FIND_SUPPLIERS':
          const suppliers = await this.findSuppliers(message.productData);
          sendResponse(suppliers);
          break;

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[ShopOpti+] Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }

  // === COMBINED PRODUCT + REVIEWS IMPORT ===
  async importProductWithReviews(url, reviewLimit = 50) {
    // URL already validated by Security module
    try {
      console.log('[ShopOpti+] Starting combined import for:', url);
      
      const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
      
      if (!extensionToken) {
        return { success: false, error: 'Non connecté. Connectez-vous via l\'extension.' };
      }
      
      const productResponse = await fetch(`${API_URL}/extension-scraper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': extensionToken
        },
        body: JSON.stringify({
          action: 'scrape_and_import',
          url: url
        })
      });
      
      const productData = await productResponse.json();
      
      if (!productResponse.ok || !productData.success) {
        console.error('[ShopOpti+] Product import failed:', productData.error);
        return { success: false, error: productData.error || 'Échec de l\'import produit' };
      }
      
      const product = productData.product || productData.data?.product;
      const productId = product?.id;
      
      console.log('[ShopOpti+] Product imported:', product?.title, 'ID:', productId);
      
      // Extract reviews from page
      let reviews = [];
      let reviewCount = 0;
      
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const reviewResults = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: extractReviewsFromPage,
          args: [{ maxReviews: reviewLimit }]
        });
        
        reviews = reviewResults[0]?.result || [];
        console.log('[ShopOpti+] Extracted', reviews.length, 'reviews from page');
        
        if (reviews.length > 0 && productId) {
          const reviewsResponse = await fetch(`${API_URL}/import-reviews`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-extension-token': extensionToken
            },
            body: JSON.stringify({
              action: 'import',
              productId: productId,
              reviews: reviews.map(r => ({
                author: Security.sanitizeText(r.author || 'Anonymous'),
                rating: Math.min(5, Math.max(1, parseInt(r.rating) || 5)),
                content: Security.sanitizeText(r.content || r.text || ''),
                date: r.date || new Date().toISOString(),
                images: (r.images || []).filter(img => {
                  try { new URL(img); return true; } catch { return false; }
                }),
                verified: !!r.verified,
                helpful_count: parseInt(r.helpful_count) || 0,
                country: Security.sanitizeText(r.country || '')
              })),
              options: {
                translate: true,
                targetLanguage: 'fr'
              }
            })
          });
          
          const reviewsData = await reviewsResponse.json();
          reviewCount = reviewsData.imported || reviews.length;
        }
      } catch (reviewError) {
        console.warn('[ShopOpti+] Review extraction/import failed:', reviewError);
      }
      
      // Update local stats
      const { stats } = await chrome.storage.local.get(['stats']);
      await chrome.storage.local.set({
        stats: {
          ...stats,
          products: (stats?.products || 0) + 1,
          reviews: (stats?.reviews || 0) + reviewCount
        }
      });
      
      this.showNotification(`Import complet réussi`, `${product?.title || 'Produit'} + ${reviewCount} avis`);
      
      return {
        success: true,
        product: {
          id: productId,
          title: product?.title || product?.name,
          image: product?.image || product?.images?.[0],
          variantCount: product?.variants?.length || productData.variantCount || 0,
          imageCount: product?.images?.length || productData.imageCount || 0
        },
        reviews: { count: reviewCount },
        variantCount: product?.variants?.length || productData.variantCount || 0,
        imageCount: product?.images?.length || productData.imageCount || 0
      };
    } catch (error) {
      console.error('[ShopOpti+] Combined import error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Fetch API handler with security validation
  async fetchApi(url, options = {}) {
    // URL already validated by Security module
    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type');
      
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      return {
        success: response.ok,
        status: response.status,
        data: data
      };
    } catch (error) {
      console.error('[ShopOpti+] Fetch API error:', error);
      return { success: false, error: error.message };
    }
  }

  async scrapeAndImport(url) {
    // URL already validated by Security module
    try {
      console.log('[ShopOpti+] Scraping and importing from URL:', url);
      
      const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
      
      if (!extensionToken) {
        return { success: false, error: 'Non connecté. Connectez-vous via l\'extension.' };
      }
      
      const response = await fetch(`${API_URL}/extension-scraper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': extensionToken
        },
        body: JSON.stringify({
          action: 'scrape_and_import',
          url: url
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const { stats } = await chrome.storage.local.get(['stats']);
        await chrome.storage.local.set({
          stats: { ...stats, products: (stats?.products || 0) + 1 }
        });
        
        this.showNotification('Produit importé', data.product?.title || 'Import réussi');
        return { success: true, data };
      } else {
        console.error('[ShopOpti+] Scrape and import failed:', data.error);
        return { success: false, error: data.error || 'Échec de l\'import' };
      }
    } catch (error) {
      console.error('[ShopOpti+] Scrape and import error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async importProduct(product) {
    try {
      const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
      
      if (!extensionToken) {
        return { success: false, error: 'Non connecté' };
      }
      
      const response = await fetch(`${API_URL}/extension-sync-realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': extensionToken
        },
        body: JSON.stringify({
          action: 'import_products',
          products: [product]
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const { stats } = await chrome.storage.local.get(['stats']);
        await chrome.storage.local.set({
          stats: { ...stats, products: (stats?.products || 0) + 1 }
        });
        
        this.logActivity('import', { title: product.title || product.name });
        return { success: true, data };
      } else {
        return { success: false, error: data.error || 'Échec de l\'import' };
      }
    } catch (error) {
      console.error('[ShopOpti+] Import error:', error);
      return { success: false, error: error.message };
    }
  }

  async findSuppliers(productData) {
    try {
      const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
      
      const response = await fetch(`${API_URL}/find-supplier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(extensionToken ? { 'x-extension-token': extensionToken } : {})
        },
        body: JSON.stringify(productData)
      });
      
      return await response.json();
    } catch (error) {
      console.error('[ShopOpti+] Find suppliers error:', error);
      return { success: false, error: error.message };
    }
  }

  async getSettings() {
    const result = await chrome.storage.local.get(['settings']);
    return result.settings || {};
  }

  async updateSettings(newSettings) {
    const { settings } = await chrome.storage.local.get(['settings']);
    await chrome.storage.local.set({
      settings: { ...settings, ...newSettings }
    });
  }

  async syncData() {
    console.log('[ShopOpti+] Syncing data...');
    await chrome.storage.local.set({ lastSync: new Date().toISOString() });
  }

  async handleScrapedProducts(products) {
    if (!products || !Array.isArray(products)) return;
    
    const { pendingItems } = await chrome.storage.local.get(['pendingItems']);
    const updated = [...(pendingItems || []), ...products];
    await chrome.storage.local.set({ pendingItems: updated.slice(-100) });
  }

  async getStats() {
    const { stats } = await chrome.storage.local.get(['stats']);
    return stats || { products: 0, reviews: 0, monitored: 0 };
  }

  async importReviews(config) {
    console.log('[ShopOpti+] Importing reviews with config:', config);
    return [];
  }

  async scrapeUrl(url) {
    // URL already validated by Security module
    try {
      const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
      
      const response = await fetch(`${API_URL}/extension-scraper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(extensionToken ? { 'x-extension-token': extensionToken } : {})
        },
        body: JSON.stringify({ action: 'scrape', url })
      });
      
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async addToMonitoring(url, productData) {
    if (!Security.isUrlAllowedForScrape(url)) {
      console.warn('[ShopOpti+] URL not allowed for monitoring:', url);
      return;
    }
    
    const { monitoredUrls } = await chrome.storage.local.get(['monitoredUrls']);
    const updated = [...(monitoredUrls || [])];
    
    if (!updated.find(m => m.url === url)) {
      updated.push({
        url,
        title: productData?.title,
        price: productData?.price,
        addedAt: new Date().toISOString()
      });
      await chrome.storage.local.set({ monitoredUrls: updated.slice(-100) });
    }
  }

  async removeFromMonitoring(url, productId) {
    const { monitoredUrls } = await chrome.storage.local.get(['monitoredUrls']);
    const updated = (monitoredUrls || []).filter(m => m.url !== url);
    await chrome.storage.local.set({ monitoredUrls: updated });
  }

  async getMonitoredProducts() {
    const { monitoredUrls } = await chrome.storage.local.get(['monitoredUrls']);
    return monitoredUrls || [];
  }

  async getPriceHistory(productId) {
    const { priceHistory } = await chrome.storage.local.get(['priceHistory']);
    return (priceHistory || []).filter(h => h.productId === productId);
  }

  async checkPriceChanges() {
    console.log('[ShopOpti+] Checking price changes...');
    await chrome.storage.local.set({ lastPriceCheck: new Date().toISOString() });
  }

  async checkStockChanges() {
    console.log('[ShopOpti+] Checking stock changes...');
    await chrome.storage.local.set({ lastStockCheck: new Date().toISOString() });
  }

  handleTabUpdate(tabId, tab) {
    // Inject content script on supported domains
    if (tab.url) {
      try {
        const url = new URL(tab.url);
        const hostname = url.hostname.toLowerCase();
        
        if (Security.ALLOWED_SCRAPE_DOMAINS.some(d => hostname.includes(d))) {
          // Content script will be auto-injected via manifest
          console.log('[ShopOpti+] Supported domain detected:', hostname);
        }
      } catch (e) {
        // Invalid URL, ignore
      }
    }
  }

  handleAlarm(alarm) {
    console.log('[ShopOpti+] Alarm triggered:', alarm.name);
    
    if (alarm.name === 'periodic-sync') {
      this.syncData();
    } else if (alarm.name === 'price-monitoring') {
      this.checkPriceChanges();
    } else if (alarm.name === 'stock-alerts') {
      this.checkStockChanges();
    }
  }

  handleContextMenuClick(info, tab) {
    const url = info.linkUrl || info.pageUrl;
    
    if (!Security.isUrlAllowedForScrape(url)) {
      console.warn('[ShopOpti+] Context menu action blocked - URL not allowed');
      return;
    }
    
    switch (info.menuItemId) {
      case 'shopopti-import-product':
        this.scrapeAndImport(url);
        break;
      case 'shopopti-import-reviews':
        this.importReviews({ url });
        break;
      case 'shopopti-monitor-price':
        this.addToMonitoring(url, {});
        break;
      case 'shopopti-open-dashboard':
        chrome.tabs.create({ url: APP_URL });
        break;
    }
  }

  async logActivity(action, data = {}) {
    const { activities } = await chrome.storage.local.get(['activities']);
    const updated = [
      { action, data, timestamp: new Date().toISOString() },
      ...(activities || [])
    ].slice(0, 50);
    await chrome.storage.local.set({ activities: updated });
  }

  showNotification(title, message) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: title,
      message: message
    });
  }
}

// Review extraction function (injected into page)
function extractReviewsFromPage(config = {}) {
  const maxReviews = config.maxReviews || 50;
  const reviews = [];
  
  // Amazon selectors
  const amazonReviews = document.querySelectorAll('[data-hook="review"]');
  amazonReviews.forEach((el, i) => {
    if (i >= maxReviews) return;
    
    const rating = el.querySelector('[data-hook="review-star-rating"] .a-icon-alt')?.textContent?.match(/[\d,.]+/)?.[0];
    const author = el.querySelector('.a-profile-name')?.textContent?.trim();
    const content = el.querySelector('[data-hook="review-body"] span')?.textContent?.trim();
    const date = el.querySelector('[data-hook="review-date"]')?.textContent?.trim();
    const verified = !!el.querySelector('[data-hook="avp-badge"]');
    
    if (content) {
      reviews.push({
        rating: parseFloat(rating?.replace(',', '.')) || 5,
        author: author || 'Client',
        content,
        date,
        verified,
        images: []
      });
    }
  });
  
  // AliExpress selectors
  const aliReviews = document.querySelectorAll('[class*="review-item"], [class*="ReviewItem"]');
  aliReviews.forEach((el, i) => {
    if (i >= maxReviews) return;
    
    const stars = el.querySelectorAll('[class*="star"][class*="full"], .star-view .star-icon').length;
    const author = el.querySelector('[class*="user-name"], [class*="reviewer"]')?.textContent?.trim();
    const content = el.querySelector('[class*="review-content"], [class*="content"]')?.textContent?.trim();
    
    if (content) {
      reviews.push({
        rating: stars || 5,
        author: author || 'Buyer',
        content,
        verified: true,
        images: []
      });
    }
  });
  
  return reviews;
}

// Initialize
new ShopOptiBackground();
