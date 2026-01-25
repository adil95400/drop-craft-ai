// ============================================
// ShopOpti+ Chrome Extension - Background Service Worker v5.0.0
// SECURITY HARDENED - Message validation, URL whitelist, rate limiting
// ============================================

const API_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';
const APP_URL = 'https://shopopti.io';
const VERSION = '5.0.0';

// ============================================
// SECURITY MODULE
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
    'lightinthebox.com', 'made-in-china.com',
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
    'FIND_SUPPLIERS', 'EXTRACT_COMPLETE', 'REQUEST_PERMISSIONS'
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
      return { valid: false, error: 'Unknown message type' };
    }

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
    console.log(`[ShopOpti+] Background v${VERSION} initializing...`);
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupAlarms();
    console.log('[ShopOpti+] Background initialized');
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
      importHistory: []
    });

    chrome.tabs.create({
      url: `${APP_URL}/extensions/chrome?installed=true&v=${VERSION}`
    });
  }

  async onUpdate(previousVersion) {
    console.log(`[ShopOpti+] Updated from ${previousVersion} to ${VERSION}`);
    await chrome.storage.local.set({
      extensionVersion: VERSION,
      lastUpdate: new Date().toISOString()
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
      sendResponse({ success: false, error: 'Rate limit exceeded. Please wait.' });
      return;
    }

    console.log('[ShopOpti+] Message:', message.type);
    
    try {
      switch (message.type) {
        case 'PING':
          sendResponse({ success: true, version: VERSION });
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

        case 'GET_STATS':
          const stats = await this.getStats();
          sendResponse(stats);
          break;

        case 'IMPORT_FROM_URL':
          const urlResult = await this.scrapeAndImport(message.url);
          sendResponse(urlResult);
          break;

        case 'IMPORT_PRODUCT_WITH_REVIEWS':
          const combinedResult = await this.importProductWithReviews(message.url, message.reviewLimit || 50);
          sendResponse(combinedResult);
          break;

        case 'IMPORT_PRODUCT':
          const importResult = await this.importProduct(message.product);
          sendResponse(importResult);
          break;

        case 'FETCH_API':
          const fetchResult = await this.fetchApi(message.url, message.options);
          sendResponse(fetchResult);
          break;

        case 'OPEN_BULK_IMPORT':
          chrome.tabs.create({ url: `${APP_URL}/products/import` });
          sendResponse({ success: true });
          break;

        case 'GET_MONITORING_STATUS':
          const status = await this.getMonitoringStatus();
          sendResponse({ success: true, status });
          break;

        case 'FIND_SUPPLIERS':
          const suppliers = await this.findSuppliers(message.productData);
          sendResponse(suppliers);
          break;

        case 'REQUEST_PERMISSIONS':
          await this.requestPermissions(message.origins);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[ShopOpti+] Error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // ============================================
  // CORE METHODS
  // ============================================

  async getSettings() {
    const { settings } = await chrome.storage.local.get(['settings']);
    return settings || {};
  }

  async updateSettings(newSettings) {
    const { settings } = await chrome.storage.local.get(['settings']);
    await chrome.storage.local.set({
      settings: { ...settings, ...newSettings }
    });
  }

  async getStats() {
    const { stats } = await chrome.storage.local.get(['stats']);
    return stats || { products: 0, reviews: 0, monitored: 0 };
  }

  async syncData() {
    const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
    if (!extensionToken) return;

    try {
      const response = await fetch(`${API_URL}/extension-sync-realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': extensionToken
        },
        body: JSON.stringify({ action: 'sync_status' })
      });

      if (response.ok) {
        const data = await response.json();
        await chrome.storage.local.set({ lastSync: new Date().toISOString() });
        return data;
      }
    } catch (error) {
      console.error('[ShopOpti+] Sync error:', error);
    }
  }

  async scrapeAndImport(url) {
    const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
    
    if (!extensionToken) {
      return { success: false, error: 'Non connecté. Connectez-vous via l\'extension.' };
    }

    try {
      const response = await fetch(`${API_URL}/extension-scraper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': extensionToken
        },
        body: JSON.stringify({ action: 'scrape_and_import', url })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        await this.updateStats({ products: 1 });
        this.showNotification('Import réussi', data.product?.title || 'Produit importé');
      }

      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async importProductWithReviews(url, reviewLimit = 50) {
    const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
    
    if (!extensionToken) {
      return { success: false, error: 'Non connecté. Connectez-vous via l\'extension.' };
    }

    try {
      // Import product
      const productResponse = await fetch(`${API_URL}/extension-scraper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': extensionToken
        },
        body: JSON.stringify({ action: 'scrape_and_import', url })
      });

      const productData = await productResponse.json();
      
      if (!productResponse.ok || !productData.success) {
        return { success: false, error: productData.error || 'Import failed' };
      }

      const product = productData.product || productData.data?.product;
      const productId = product?.id;

      // Extract reviews from page
      let reviewCount = 0;
      
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab?.id) {
          const reviewResults = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractReviewsFromPage,
            args: [{ maxReviews: reviewLimit }]
          });
          
          const reviews = reviewResults[0]?.result || [];
          
          if (reviews.length > 0 && productId) {
            const reviewsResponse = await fetch(`${API_URL}/import-reviews`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-extension-token': extensionToken
              },
              body: JSON.stringify({
                action: 'import',
                productId,
                reviews: reviews.map(r => ({
                  author: Security.sanitizeText(r.author || 'Anonymous'),
                  rating: Math.min(5, Math.max(1, parseInt(r.rating) || 5)),
                  content: Security.sanitizeText(r.content || ''),
                  date: r.date || new Date().toISOString(),
                  verified: !!r.verified,
                  images: (r.images || []).slice(0, 10)
                })),
                options: { translate: true, targetLanguage: 'fr' }
              })
            });
            
            const reviewsData = await reviewsResponse.json();
            reviewCount = reviewsData.imported || reviews.length;
          }
        }
      } catch (reviewError) {
        console.warn('[ShopOpti+] Review extraction failed:', reviewError);
      }

      await this.updateStats({ products: 1, reviews: reviewCount });
      this.showNotification('Import complet', `${product?.title || 'Produit'} + ${reviewCount} avis`);

      return {
        success: true,
        product: {
          id: productId,
          title: product?.title,
          variantCount: product?.variants?.length || 0,
          imageCount: product?.images?.length || 0
        },
        reviews: { count: reviewCount }
      };
    } catch (error) {
      console.error('[ShopOpti+] Combined import error:', error);
      return { success: false, error: error.message };
    }
  }

  async importProduct(product) {
    const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
    
    if (!extensionToken) {
      return { success: false, error: 'Non connecté' };
    }

    try {
      const response = await fetch(`${API_URL}/extension-scraper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': extensionToken
        },
        body: JSON.stringify({ action: 'import_product', product })
      });

      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async fetchApi(url, options = {}) {
    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type');
      
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      return { success: response.ok, status: response.status, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getMonitoringStatus() {
    const { monitoredUrls, lastPriceCheck, lastStockCheck } = 
      await chrome.storage.local.get(['monitoredUrls', 'lastPriceCheck', 'lastStockCheck']);
    
    return {
      monitoredCount: monitoredUrls?.length || 0,
      lastPriceCheck,
      lastStockCheck
    };
  }

  async findSuppliers(productData) {
    const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
    
    if (!extensionToken) {
      return { success: false, error: 'Non connecté' };
    }

    try {
      const response = await fetch(`${API_URL}/find-supplier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': extensionToken
        },
        body: JSON.stringify({
          title: productData.title,
          images: productData.images?.slice(0, 3),
          currentPrice: productData.price
        })
      });

      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async requestPermissions(origins) {
    try {
      const granted = await chrome.permissions.request({ origins });
      return { success: granted };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateStats(increments) {
    const { stats } = await chrome.storage.local.get(['stats']);
    const newStats = { ...stats };
    
    if (increments.products) newStats.products = (newStats.products || 0) + increments.products;
    if (increments.reviews) newStats.reviews = (newStats.reviews || 0) + increments.reviews;
    if (increments.monitored) newStats.monitored = (newStats.monitored || 0) + increments.monitored;
    
    await chrome.storage.local.set({ stats: newStats });
  }

  showNotification(title, message) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: `ShopOpti+ - ${title}`,
      message
    });
  }

  async handleAlarm(alarm) {
    if (alarm.name === 'periodic-sync') {
      await this.syncData();
    }
  }
}

// ============================================
// REVIEW EXTRACTION FUNCTION (injected into page)
// ============================================
function extractReviewsFromPage({ maxReviews = 50 }) {
  const reviews = [];
  const platform = detectPlatformFromPage();
  
  function detectPlatformFromPage() {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes('amazon')) return 'amazon';
    if (hostname.includes('aliexpress')) return 'aliexpress';
    if (hostname.includes('ebay')) return 'ebay';
    if (hostname.includes('cdiscount')) return 'cdiscount';
    return 'generic';
  }
  
  const selectors = {
    amazon: {
      item: '[data-hook="review"]',
      author: '.a-profile-name',
      rating: '.review-rating span',
      content: '[data-hook="review-body"] span',
      date: '[data-hook="review-date"]',
      verified: '.avp-badge'
    },
    aliexpress: {
      item: '.feedback-item',
      author: '.user-name',
      rating: '.star-view',
      content: '.buyer-feedback',
      date: '.feedback-time',
      verified: '.buyer-verified'
    },
    cdiscount: {
      item: '.rv-list__item',
      author: '.rv-author',
      rating: '.rv-rating',
      content: '.rv-text',
      date: '.rv-date',
      verified: '.verified'
    },
    generic: {
      item: '[class*="review-item"], [class*="review "]',
      author: '[class*="author"]',
      rating: '[class*="rating"], [class*="star"]',
      content: '[class*="content"], [class*="text"]',
      date: '[class*="date"]',
      verified: '[class*="verified"]'
    }
  };
  
  const config = selectors[platform] || selectors.generic;
  
  document.querySelectorAll(config.item).forEach((item, i) => {
    if (i >= maxReviews) return;
    
    const author = item.querySelector(config.author)?.textContent?.trim() || 'Anonymous';
    const ratingEl = item.querySelector(config.rating);
    let rating = 5;
    if (ratingEl) {
      const text = ratingEl.textContent || ratingEl.getAttribute('aria-label') || '';
      const match = text.match(/(\d[.,]?\d?)/);
      rating = match ? Math.min(5, Math.max(1, parseFloat(match[1].replace(',', '.')))) : 5;
    }
    const content = item.querySelector(config.content)?.textContent?.trim() || '';
    const date = item.querySelector(config.date)?.textContent?.trim() || '';
    const verified = !!item.querySelector(config.verified);
    
    const images = [];
    item.querySelectorAll('img').forEach(img => {
      if (img.src && img.src.includes('http') && !img.src.includes('avatar') && !img.src.includes('profile')) {
        images.push(img.src);
      }
    });
    
    if (content || rating) {
      reviews.push({ author, rating, content, date, verified, images: images.slice(0, 5) });
    }
  });
  
  return reviews;
}

// Initialize
new ShopOptiBackground();
