// ============================================
// ShopOpti+ Chrome Extension - Background Service Worker v5.8.1
// 100% AutoDS Feature Parity - Complete Production Ready
// Ads Spy, Auto-Order, Multi-Store, Real-Time Sync
// NOTIFICATIONS SYSTEM + DYNAMIC BADGE + TOKEN REFRESH
// ============================================

const API_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';
const APP_URL = 'https://shopopti.io';

// Get version dynamically from manifest.json
function getManifestVersion() {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
      return chrome.runtime.getManifest().version;
    }
  } catch (e) {
    console.warn('Could not read manifest version:', e);
  }
  return '6.0.0'; // Fallback
}

const VERSION = getManifestVersion();

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
    'FIND_SUPPLIERS', 'EXTRACT_COMPLETE', 'REQUEST_PERMISSIONS',
    'OPEN_IMPORT_OVERLAY', 'IMPORT_WITH_OPTIONS',
    // Bulk Import V5 + Multi-Store + Sourcing messages
    'OPEN_BULK_IMPORT_UI', 'BULK_IMPORT_PRODUCTS', 'GET_USER_STORES',
    'IMPORT_TO_STORES', 'SYNC_PRODUCT_TO_STORES',
    'SEARCH_ALL_SUPPLIERS', 'COMPARE_SUPPLIERS',
    // Auto-Order + Ads Spy (AutoDS Parity)
    'PROCESS_AUTO_ORDER', 'GET_PENDING_ORDERS', 'TOGGLE_AUTO_ORDER',
    'SEARCH_ADS', 'GET_VIRAL_PRODUCTS', 'SAVE_AD_TO_COLLECTION',
    // Auth + Backend Connection
    'GET_AUTH_TOKEN', 'PRODUCT_IMPORTED', 'CHECK_AUTH_STATUS',
    // Notifications System
    'UPDATE_BADGE', 'GET_NOTIFICATIONS', 'ADD_NOTIFICATION', 'CLEAR_NOTIFICATIONS',
    // SaaS Sync (NEW)
    'OPEN_AUTH_PAGE', 'SYNC_WITH_SAAS', 'GET_SAAS_STATUS'
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

        // ============================================
        // AUTH TOKEN HANDLERS (NEW - for content script)
        // ============================================
        
        case 'GET_AUTH_TOKEN':
          const authResult = await this.getAuthToken();
          sendResponse(authResult);
          break;

        case 'CHECK_AUTH_STATUS':
          const authStatus = await this.checkAuthStatus();
          sendResponse(authStatus);
          break;

        case 'PRODUCT_IMPORTED':
          await this.onProductImported(message.productId);
          sendResponse({ success: true });
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
          const permResult = await this.requestPermissions(message.origins);
          sendResponse(permResult);
          break;

        case 'OPEN_IMPORT_OVERLAY':
          const overlayResult = await this.openImportOverlay(sender.tab, message.productData);
          sendResponse(overlayResult);
          break;

        case 'IMPORT_WITH_OPTIONS':
          const importWithOptionsResult = await this.importWithOptions(message.importData);
          sendResponse(importWithOptionsResult);
          break;

        // ============================================
        // BULK IMPORT V5 + MULTI-STORE HANDLERS
        // ============================================
        
        case 'OPEN_BULK_IMPORT_UI':
          const bulkUIResult = await this.openBulkImportUI(sender.tab, message.products);
          sendResponse(bulkUIResult);
          break;

        case 'BULK_IMPORT_PRODUCTS':
          const bulkResult = await this.bulkImportProducts(message.products, message.options);
          sendResponse(bulkResult);
          break;

        case 'GET_USER_STORES':
          const stores = await this.getUserStores();
          sendResponse(stores);
          break;

        case 'IMPORT_TO_STORES':
          const storeResult = await this.importToStores(message.products, message.storeIds, message.options);
          sendResponse(storeResult);
          break;

        case 'SYNC_PRODUCT_TO_STORES':
          const syncResult = await this.syncProductToStores(message.productId, message.storeIds);
          sendResponse(syncResult);
          break;

        // ============================================
        // SUPPLIER SOURCING HANDLERS
        // ============================================
        
        case 'SEARCH_ALL_SUPPLIERS':
          const supplierResults = await this.searchAllSuppliers(message.query, message.options);
          sendResponse(supplierResults);
          break;

        case 'COMPARE_SUPPLIERS':
          const compareResults = await this.compareSuppliers(message.productId, message.suppliers);
          sendResponse(compareResults);
          break;

        // ============================================
        // AUTO-ORDER + ADS SPY HANDLERS (AutoDS Parity)
        // ============================================
        
        case 'PROCESS_AUTO_ORDER':
          const orderResult = await this.processAutoOrder(message.orderId);
          sendResponse(orderResult);
          break;

        case 'GET_PENDING_ORDERS':
          const pendingOrders = await this.getPendingOrders();
          sendResponse(pendingOrders);
          break;

        case 'SEARCH_ADS':
          const adsResult = await this.searchViralAds(message.platform, message.query, message.options);
          sendResponse(adsResult);
          break;

        case 'GET_VIRAL_PRODUCTS':
          const viralProducts = await this.getViralProducts(message.platform, message.limit);
          sendResponse(viralProducts);
          break;

        // ============================================
        // NOTIFICATIONS HANDLERS (NEW)
        // ============================================
        
        case 'UPDATE_BADGE':
          await this.updateExtensionBadge(message.count);
          sendResponse({ success: true });
          break;

        case 'GET_NOTIFICATIONS':
          const notifications = await this.getNotifications();
          sendResponse(notifications);
          break;

        case 'ADD_NOTIFICATION':
          await this.addNotification(message.notification);
          sendResponse({ success: true });
          break;

        case 'CLEAR_NOTIFICATIONS':
          await this.clearNotifications();
          sendResponse({ success: true });
          break;

        // ============================================
        // SAAS SYNC HANDLERS (NEW)
        // ============================================
        
        case 'OPEN_AUTH_PAGE':
          chrome.tabs.create({ url: `${APP_URL}/auth/extension` });
          sendResponse({ success: true });
          break;

        case 'SYNC_WITH_SAAS':
          const saasResult = await this.syncWithSaaS(message.action, message.data);
          sendResponse(saasResult);
          break;

        case 'GET_SAAS_STATUS':
          const saasStatus = await this.getSaaSStatus();
          sendResponse(saasStatus);
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
  // SAAS SYNC METHODS
  // ============================================
  
  async syncWithSaaS(action, data = {}) {
    try {
      const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
      
      if (!extensionToken) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/extension-sync-realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': extensionToken
        },
        body: JSON.stringify({
          action: action || 'sync',
          data,
          timestamp: new Date().toISOString(),
          extensionVersion: VERSION
        })
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Update local cache with synced data
      if (result.settings) {
        await chrome.storage.local.set({ syncedSettings: result.settings });
      }
      if (result.stores) {
        await chrome.storage.local.set({ userStores: result.stores });
      }

      return { success: true, ...result };
    } catch (error) {
      console.error('[ShopOpti+] SaaS sync error:', error);
      return { success: false, error: error.message };
    }
  }

  async getSaaSStatus() {
    try {
      const { extensionToken, syncedSettings, userStores, lastSyncAt } = 
        await chrome.storage.local.get(['extensionToken', 'syncedSettings', 'userStores', 'lastSyncAt']);

      return {
        connected: !!extensionToken,
        lastSync: lastSyncAt || null,
        storesCount: userStores?.length || 0,
        settings: syncedSettings || null
      };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }
  // AUTH TOKEN METHODS (for content scripts)
  // ============================================
  
  async getAuthToken() {
    try {
      const { extensionToken, tokenExpiry, user } = await chrome.storage.local.get([
        'extensionToken', 'tokenExpiry', 'user'
      ]);
      
      if (!extensionToken) {
        return { token: null, authenticated: false, error: 'Non connecté' };
      }
      
      // Check expiry
      if (tokenExpiry && new Date(tokenExpiry) < new Date()) {
        return { token: null, authenticated: false, error: 'Session expirée' };
      }
      
      return { 
        token: extensionToken, 
        authenticated: true, 
        user: user || null 
      };
    } catch (error) {
      console.error('[ShopOpti+] getAuthToken error:', error);
      return { token: null, authenticated: false, error: error.message };
    }
  }

  async checkAuthStatus() {
    const { extensionToken, tokenExpiry, user } = await chrome.storage.local.get([
      'extensionToken', 'tokenExpiry', 'user'
    ]);
    
    const isExpired = tokenExpiry && new Date(tokenExpiry) < new Date();
    
    return {
      authenticated: !!(extensionToken && !isExpired),
      user: user || null,
      expiresAt: tokenExpiry || null
    };
  }

  async onProductImported(productId) {
    console.log('[ShopOpti+] Product imported:', productId);
    
    // Update local stats
    await this.updateStats({ products: 1 });
    
    // Update badge
    await this.updateBadge();
    
    // Log activity
    await this.logActivity('product_imported', { productId });
  }

  async updateBadge() {
    try {
      const { stats } = await chrome.storage.local.get(['stats']);
      const count = stats?.products || 0;
      
      if (count > 0) {
        chrome.action.setBadgeText({ text: count > 99 ? '99+' : String(count) });
        chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
      } else {
        chrome.action.setBadgeText({ text: '' });
      }
    } catch (e) {
      console.error('[ShopOpti+] Badge update error:', e);
    }
  }

  async logActivity(action, details = {}) {
    try {
      const { activities = [] } = await chrome.storage.local.get(['activities']);
      
      activities.unshift({
        action,
        details,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 100 activities
      await chrome.storage.local.set({ 
        activities: activities.slice(0, 100) 
      });
    } catch (e) {
      console.error('[ShopOpti+] Activity log error:', e);
    }
  }

  // ============================================
  // NOTIFICATIONS METHODS
  // ============================================
  
  async updateExtensionBadge(count) {
    try {
      if (count > 0) {
        chrome.action.setBadgeText({ text: count > 99 ? '99+' : String(count) });
        chrome.action.setBadgeBackgroundColor({ color: '#ff4757' });
      } else {
        chrome.action.setBadgeText({ text: '' });
      }
    } catch (e) {
      console.error('[ShopOpti+] Badge update error:', e);
    }
  }

  async getNotifications() {
    try {
      const { notifications = [], unreadCount = 0 } = await chrome.storage.local.get([
        'notifications', 'unreadCount'
      ]);
      return { success: true, notifications, unreadCount };
    } catch (e) {
      console.error('[ShopOpti+] Get notifications error:', e);
      return { success: false, notifications: [], unreadCount: 0 };
    }
  }

  async addNotification(notification) {
    try {
      const { notifications = [] } = await chrome.storage.local.get(['notifications']);
      
      const newNotification = {
        id: notification.id || `notif_${Date.now()}`,
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        platform: notification.platform,
        product_id: notification.productId,
        action_url: notification.actionUrl,
        read: false,
        created_at: new Date().toISOString()
      };
      
      notifications.unshift(newNotification);
      const trimmed = notifications.slice(0, 50);
      const unreadCount = trimmed.filter(n => !n.read).length;
      
      await chrome.storage.local.set({ 
        notifications: trimmed,
        unreadCount 
      });
      
      // Update badge
      await this.updateExtensionBadge(unreadCount);
      
      // Show chrome notification if permitted
      if (notification.showSystemNotification) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon128.png',
          title: notification.title,
          message: notification.message || '',
          priority: 2
        });
      }
      
    } catch (e) {
      console.error('[ShopOpti+] Add notification error:', e);
    }
  }

  async clearNotifications() {
    try {
      await chrome.storage.local.set({ 
        notifications: [],
        unreadCount: 0 
      });
      await this.updateExtensionBadge(0);
    } catch (e) {
      console.error('[ShopOpti+] Clear notifications error:', e);
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
      // Try API first
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
        return data;
      }
      
      // API failed - try local fallback
      console.log('[ShopOpti+] API failed, trying local fallback...', data.error);
      return await this.localFallbackImport(url, extensionToken, data.error);
      
    } catch (error) {
      // Network error - try local fallback
      console.log('[ShopOpti+] Network error, trying local fallback...', error.message);
      return await this.localFallbackImport(url, extensionToken, error.message);
    }
  }

  async localFallbackImport(url, extensionToken, originalError) {
    try {
      // Execute advanced-scraper on the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab?.id) {
        return { success: false, error: originalError || 'Onglet non disponible', fallbackAttempted: true };
      }
      
      // Execute local extraction using AdvancedProductScraper
      const extractResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          if (typeof AdvancedProductScraper !== 'undefined') {
            const scraper = new AdvancedProductScraper();
            return scraper.extractCompleteProduct();
          }
          return null;
        }
      });
      
      const extractedData = extractResults[0]?.result;
      
      if (!extractedData || !extractedData.title) {
        return { 
          success: false, 
          error: originalError || 'Extraction locale échouée - données insuffisantes',
          fallbackAttempted: true 
        };
      }
      
      console.log('[ShopOpti+] Local extraction successful:', extractedData.title);
      
      // Save locally extracted product via API with minimal data
      const saveResponse = await fetch(`${API_URL}/extension-scraper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': extensionToken
        },
        body: JSON.stringify({ 
          action: 'save_extracted',
          extractedData,
          url,
          source: 'local_fallback'
        })
      });
      
      if (saveResponse.ok) {
        const result = await saveResponse.json();
        if (result.success) {
          await this.updateStats({ products: 1 });
          this.showNotification('Import réussi (fallback)', extractedData.title);
          return { success: true, ...result, usedFallback: true };
        }
      }
      
      // If save also failed, still return as partial success with data
      return { 
        success: false, 
        error: 'Sauvegarde échouée après extraction locale',
        extractedData, // Return data for debugging
        usedFallback: true
      };
      
    } catch (fallbackError) {
      console.error('[ShopOpti+] Local fallback failed:', fallbackError);
      return { 
        success: false, 
        error: originalError || fallbackError.message,
        fallbackAttempted: true
      };
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
      console.log('[ShopOpti+] Requesting permissions for origins:', origins);
      
      if (!origins || !Array.isArray(origins) || origins.length === 0) {
        console.warn('[ShopOpti+] No origins provided for permission request');
        return { success: false, error: 'Aucune origine spécifiée' };
      }
      
      // Validate origins format
      const validOrigins = origins.filter(o => {
        try {
          const url = new URL(o.replace('*://', 'https://').replace('/*', ''));
          return true;
        } catch {
          return false;
        }
      });
      
      if (validOrigins.length === 0) {
        console.warn('[ShopOpti+] No valid origins after validation');
        return { success: false, error: 'Origines invalides' };
      }
      
      const granted = await chrome.permissions.request({ origins });
      
      console.log('[ShopOpti+] Permission request result:', granted);
      
      // Return exact grant status - do NOT return success: true if denied
      return { 
        success: granted === true, 
        granted: granted === true,
        requestedOrigins: origins,
        message: granted ? 'Permissions accordées' : 'Permissions refusées par l\'utilisateur'
      };
    } catch (error) {
      console.error('[ShopOpti+] Permission request error:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // IMPORT OVERLAY V2 INTEGRATION
  // ============================================

  async openImportOverlay(tab, productData) {
    if (!tab?.id) {
      return { success: false, error: 'No active tab' };
    }

    try {
      // Inject the overlay script dynamically
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['import-overlay-v2.js']
      });

      // Notify content script that overlay is ready
      await chrome.tabs.sendMessage(tab.id, {
        type: 'OVERLAY_SCRIPT_INJECTED',
        productData
      });

      return { success: true };
    } catch (error) {
      console.error('[ShopOpti+] Failed to inject overlay:', error);
      return { success: false, error: error.message };
    }
  }

  async importWithOptions(importData) {
    const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
    
    if (!extensionToken) {
      return { success: false, error: 'Non connecté. Connectez-vous via l\'extension.' };
    }

    try {
      const {
        product,
        store,
        options = {},
        selectedVariants,
        selectedImages,
        pricingRules
      } = importData;

      // Apply pricing rules if provided
      let finalProduct = { ...product };
      
      if (pricingRules?.enabled) {
        const basePrice = product.price || 0;
        let markup = 0;
        
        if (pricingRules.markupType === 'percentage') {
          markup = basePrice * (pricingRules.markupValue / 100);
        } else {
          markup = pricingRules.markupValue;
        }
        
        let finalPrice = basePrice + markup;
        
        // Apply tax if enabled
        if (pricingRules.includeTax && pricingRules.taxRate) {
          finalPrice = finalPrice * (1 + pricingRules.taxRate / 100);
        }
        
        // Round to nearest
        if (pricingRules.roundToNearest) {
          const roundTo = pricingRules.roundToNearest;
          finalPrice = Math.ceil(finalPrice) - (1 - roundTo);
        }
        
        finalProduct.price = finalPrice;
        finalProduct.costPrice = basePrice;
        finalProduct.profit = finalPrice - basePrice;
      }

      // Filter variants if specified
      if (selectedVariants && selectedVariants.length > 0 && product.variants) {
        finalProduct.variants = product.variants.filter((_, index) => 
          selectedVariants.includes(index)
        );
      }

      // Filter images if specified
      if (selectedImages && selectedImages.length > 0 && product.images) {
        finalProduct.images = selectedImages.map(index => product.images[index]).filter(Boolean);
      }

      // Send to backend with all options
      const response = await fetch(`${API_URL}/extension-scraper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': extensionToken
        },
        body: JSON.stringify({
          action: 'import_product_with_options',
          product: finalProduct,
          storeId: store?.id,
          options: {
            ...options,
            status: options.status || 'draft',
            category: options.category,
            tags: options.tags,
            aiOptimization: options.aiOptimization || false,
            translateReviews: options.translateReviews || false,
            removeWatermark: options.removeWatermark || false
          }
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        await this.updateStats({ products: 1 });
        this.showNotification('Import réussi', finalProduct.title || 'Produit importé');
        
        // Log to activity
        await this.logActivity({
          type: 'import',
          productTitle: finalProduct.title,
          store: store?.name,
          timestamp: new Date().toISOString()
        });
      }

      return data;
    } catch (error) {
      console.error('[ShopOpti+] Import with options error:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // BULK IMPORT V5 + MULTI-STORE METHODS
  // ============================================

  async openBulkImportUI(tab, products) {
    if (!tab?.id) {
      return { success: false, error: 'No active tab' };
    }

    try {
      // Inject bulk import V5 script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['bulk-import-v5.js']
      });

      // Also inject dependencies
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['lib/import-queue.js', 'lib/store-manager.js']
      });

      return { success: true, productCount: products?.length || 0 };
    } catch (error) {
      console.error('[ShopOpti+] Failed to inject bulk import UI:', error);
      return { success: false, error: error.message };
    }
  }

  async bulkImportProducts(products, options = {}) {
    const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
    
    if (!extensionToken) {
      return { success: false, error: 'Non connecté. Connectez-vous via l\'extension.' };
    }

    const results = {
      total: products.length,
      success: 0,
      failed: 0,
      errors: []
    };

    // Process in chunks with throttling (200ms delay between requests)
    const CHUNK_SIZE = 10;
    const DELAY_MS = 200;

    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
      const chunk = products.slice(i, i + CHUNK_SIZE);
      
      try {
        const response = await fetch(`${API_URL}/extension-scraper`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': extensionToken
          },
          body: JSON.stringify({
            action: 'bulk_import',
            products: chunk,
            options: {
              status: options.status || 'draft',
              category: options.category,
              aiOptimization: options.aiOptimization || false,
              pricingRules: options.pricingRules
            }
          })
        });

        const data = await response.json();
        
        if (data.success) {
          results.success += data.imported || chunk.length;
        } else {
          results.failed += chunk.length;
          results.errors.push({ chunk: i / CHUNK_SIZE, error: data.error });
        }
      } catch (error) {
        results.failed += chunk.length;
        results.errors.push({ chunk: i / CHUNK_SIZE, error: error.message });
      }

      // Throttle between chunks
      if (i + CHUNK_SIZE < products.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }

    await this.updateStats({ products: results.success });
    
    if (results.success > 0) {
      this.showNotification(
        'Import en masse terminé',
        `${results.success}/${results.total} produits importés`
      );
    }

    return { success: true, results };
  }

  async getUserStores() {
    const { extensionToken, cachedStores, storesCacheTime } = 
      await chrome.storage.local.get(['extensionToken', 'cachedStores', 'storesCacheTime']);
    
    // Return cached if fresh (< 5 minutes)
    if (cachedStores && storesCacheTime && (Date.now() - storesCacheTime < 5 * 60 * 1000)) {
      return { success: true, stores: cachedStores };
    }

    if (!extensionToken) {
      return { success: false, error: 'Non connecté', stores: [] };
    }

    try {
      const response = await fetch(`${API_URL}/list-user-stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': extensionToken
        },
        body: JSON.stringify({ action: 'list' })
      });

      const data = await response.json();
      
      if (data.success && data.stores) {
        // Cache the stores
        await chrome.storage.local.set({
          cachedStores: data.stores,
          storesCacheTime: Date.now()
        });
        return { success: true, stores: data.stores };
      }

      return { success: false, stores: [], error: data.error };
    } catch (error) {
      // Return cached stores as fallback
      if (cachedStores) {
        return { success: true, stores: cachedStores, fromCache: true };
      }
      return { success: false, stores: [], error: error.message };
    }
  }

  async importToStores(products, storeIds, options = {}) {
    const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
    
    if (!extensionToken) {
      return { success: false, error: 'Non connecté' };
    }

    const results = {
      byStore: {},
      totalSuccess: 0,
      totalFailed: 0
    };

    // Parallel import to all selected stores
    const storePromises = storeIds.map(async (storeId) => {
      try {
        const response = await fetch(`${API_URL}/import-to-store`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': extensionToken
          },
          body: JSON.stringify({
            storeId,
            products,
            options: {
              status: options.status || 'draft',
              syncStock: options.syncStock || false,
              syncPrices: options.syncPrices || false
            }
          })
        });

        const data = await response.json();
        
        results.byStore[storeId] = {
          success: data.success,
          imported: data.imported || 0,
          failed: data.failed || 0,
          error: data.error
        };

        if (data.success) {
          results.totalSuccess += data.imported || products.length;
        } else {
          results.totalFailed += products.length;
        }

        return data;
      } catch (error) {
        results.byStore[storeId] = {
          success: false,
          imported: 0,
          failed: products.length,
          error: error.message
        };
        results.totalFailed += products.length;
        return { success: false, error: error.message };
      }
    });

    await Promise.all(storePromises);

    // Update store sync timestamps
    await this.updateStoresSyncTime(storeIds);

    if (results.totalSuccess > 0) {
      this.showNotification(
        'Import multi-boutiques',
        `${results.totalSuccess} produits vers ${storeIds.length} boutique(s)`
      );
    }

    return { success: true, results };
  }

  async syncProductToStores(productId, storeIds) {
    const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
    
    if (!extensionToken) {
      return { success: false, error: 'Non connecté' };
    }

    try {
      const response = await fetch(`${API_URL}/sync-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': extensionToken
        },
        body: JSON.stringify({
          productId,
          storeIds,
          syncFields: ['price', 'stock', 'status']
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await this.updateStoresSyncTime(storeIds);
      }

      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateStoresSyncTime(storeIds) {
    const { cachedStores = [] } = await chrome.storage.local.get(['cachedStores']);
    
    const updatedStores = cachedStores.map(store => {
      if (storeIds.includes(store.id)) {
        return { ...store, last_sync_at: new Date().toISOString() };
      }
      return store;
    });

    await chrome.storage.local.set({ cachedStores: updatedStores });
  }

  async logActivity(activity) {
    const { activities = [] } = await chrome.storage.local.get(['activities']);
    activities.unshift(activity);
    await chrome.storage.local.set({ 
      activities: activities.slice(0, 100) // Keep last 100 activities
    });
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

  // ============================================
  // SUPPLIER SOURCING METHODS
  // ============================================

  async searchAllSuppliers(query, options = {}) {
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
          action: 'search_all',
          query: query,
          platforms: options.platforms || ['aliexpress', '1688', 'alibaba'],
          limit: options.limit || 20
        })
      });

      const data = await response.json();
      return { success: response.ok, ...data };
    } catch (error) {
      console.error('[ShopOpti+] Supplier search error:', error);
      return { success: false, error: error.message };
    }
  }

  async compareSuppliers(productId, suppliers) {
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
          action: 'compare',
          productId,
          suppliers
        })
      });

      const data = await response.json();
      return { success: response.ok, ...data };
    } catch (error) {
      console.error('[ShopOpti+] Compare suppliers error:', error);
      return { success: false, error: error.message };
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

// ============================================
// AUTO-ORDER & ADS SPY METHODS (AutoDS Parity)
// ============================================

ShopOptiBackground.prototype.processAutoOrder = async function(orderId) {
  const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
  if (!extensionToken) return { success: false, error: 'Non connecté' };
  
  try {
    const response = await fetch(`${API_URL}/auto-order-processor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-extension-token': extensionToken },
      body: JSON.stringify({ action: 'process_order', orderId })
    });
    const data = await response.json();
    if (data.success) this.showNotification('Commande auto', 'Commande passée avec succès');
    return data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

ShopOptiBackground.prototype.getPendingOrders = async function() {
  const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
  if (!extensionToken) return { success: false, pendingOrders: [] };
  
  try {
    const response = await fetch(`${API_URL}/auto-order-processor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-extension-token': extensionToken },
      body: JSON.stringify({ action: 'get_pending' })
    });
    return await response.json();
  } catch (error) {
    return { success: false, pendingOrders: [], error: error.message };
  }
};

ShopOptiBackground.prototype.searchViralAds = async function(platform = 'tiktok', query = '', options = {}) {
  const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
  if (!extensionToken) return { success: false, products: [] };
  
  const endpoint = platform === 'tiktok' ? 'tiktok-ad-scraper' : 'facebook-ad-scraper';
  
  try {
    const response = await fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${extensionToken}` },
      body: JSON.stringify({ keywords: query ? [query] : ['trending'], limit: options.limit || 15 })
    });
    return await response.json();
  } catch (error) {
    return { success: false, products: [], error: error.message };
  }
};

ShopOptiBackground.prototype.getViralProducts = async function(platform = 'tiktok', limit = 10) {
  return this.searchViralAds(platform, 'viral trending', { limit });
};

// Initialize
new ShopOptiBackground();
