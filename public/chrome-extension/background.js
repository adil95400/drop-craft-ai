// Drop Craft AI Chrome Extension - Background Service Worker v4.0

const API_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';
const APP_URL = 'https://shopopti.io';

class DropCraftBackground {
  constructor() {
    console.log('[DropCraft] Background service worker initializing...');
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupContextMenus();
    this.setupAlarms();
    console.log('[DropCraft] Background service worker initialized');
  }

  setupEventListeners() {
    // Installation
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.onInstall();
      } else if (details.reason === 'update') {
        this.onUpdate(details.previousVersion);
      }
    });

    // Messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.handleTabUpdate(tabId, tab);
      }
    });

    // Alarms
    chrome.alarms.onAlarm.addListener((alarm) => {
      this.handleAlarm(alarm);
    });

    // Web navigation
    if (chrome.webNavigation) {
      chrome.webNavigation.onCompleted.addListener((details) => {
        if (details.frameId === 0) {
          this.injectContentScript(details.tabId, details.url);
        }
      });
    }
  }

  async onInstall() {
    console.log('[DropCraft] Extension installed');
    
    await chrome.storage.local.set({
      extensionVersion: '4.0.0',
      installDate: new Date().toISOString(),
      settings: {
        autoInjectButtons: true,
        autoPriceMonitoring: false,
        autoStockAlerts: false,
        pushNotifications: true
      },
      stats: {
        products: 0,
        reviews: 0,
        monitored: 0
      },
      activities: [],
      pendingItems: [],
      importHistory: []
    });

    // Open welcome page
    chrome.tabs.create({
      url: `${APP_URL}/extensions/chrome?installed=true&v=4.0`
    });
  }

  async onUpdate(previousVersion) {
    console.log(`[DropCraft] Extension updated from ${previousVersion} to 4.0.0`);
    
    await chrome.storage.local.set({
      extensionVersion: '4.0.0',
      lastUpdate: new Date().toISOString()
    });
  }

  setupContextMenus() {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'dropcraft-import-product',
        title: 'Importer dans Drop Craft AI',
        contexts: ['page', 'link']
      });

      chrome.contextMenus.create({
        id: 'dropcraft-import-reviews',
        title: 'Importer les avis',
        contexts: ['page']
      });

      chrome.contextMenus.create({
        id: 'dropcraft-monitor-price',
        title: 'Surveiller le prix',
        contexts: ['page']
      });

      chrome.contextMenus.create({
        id: 'separator-1',
        type: 'separator',
        contexts: ['page']
      });

      chrome.contextMenus.create({
        id: 'dropcraft-open-dashboard',
        title: 'Ouvrir Drop Craft AI',
        contexts: ['page']
      });
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });
  }

  setupAlarms() {
    // Periodic sync
    chrome.alarms.create('periodic-sync', {
      delayInMinutes: 30,
      periodInMinutes: 30
    });

    // Check for settings-based alarms
    chrome.storage.local.get(['autoPriceMonitoring', 'autoStockAlerts'], (result) => {
      if (result.autoPriceMonitoring) {
        chrome.alarms.create('price-monitoring', { periodInMinutes: 30 });
      }
      if (result.autoStockAlerts) {
        chrome.alarms.create('stock-alerts', { periodInMinutes: 15 });
      }
    });
  }

  async handleMessage(message, sender, sendResponse) {
    console.log('[DropCraft] Message received:', message.type);
    
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
          // Handle fetch requests from content scripts (bypasses CSP)
          const fetchResult = await this.fetchApi(message.url, message.options);
          sendResponse(fetchResult);
          break;

        default:
          console.warn('[DropCraft] Unknown message type:', message.type);
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[DropCraft] Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }
  
  // Fetch API handler - allows content scripts to make requests through background
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
      
      return {
        success: response.ok,
        status: response.status,
        data: data
      };
    } catch (error) {
      console.error('[DropCraft] Fetch API error:', error);
      return {
        success: false,
        error: error.message
      };
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
        // Update local stats
        const { stats } = await chrome.storage.local.get(['stats']);
        await chrome.storage.local.set({
          stats: {
            ...stats,
            products: (stats?.products || 0) + 1
          }
        });
        
        this.showNotification('Produit importé', product.title || 'Import réussi');
        return { success: true, data };
      } else {
        return { success: false, error: data.error || 'Erreur import' };
      }
    } catch (error) {
      console.error('[DropCraft] Import product error:', error);
      return { success: false, error: error.message };
    }
  }

  async handleContextMenuClick(info, tab) {
    switch (info.menuItemId) {
      case 'dropcraft-import-product':
        await this.importFromContextMenu(info.linkUrl || tab.url);
        break;

      case 'dropcraft-import-reviews':
        await this.importReviews({});
        break;

      case 'dropcraft-monitor-price':
        await this.addToMonitoring(tab.url);
        break;

      case 'dropcraft-open-dashboard':
        chrome.tabs.create({ url: `${APP_URL}/dashboard` });
        break;
    }
  }

  async handleTabUpdate(tabId, tab) {
    const settings = await chrome.storage.local.get(['autoInjectButtons']);
    
    if (settings.autoInjectButtons !== false) {
      await this.injectContentScript(tabId, tab.url);
    }
  }

  async injectContentScript(tabId, url) {
    if (!url) return;
    
    // Comprehensive list of all 25+ supported platforms
    const supportedDomains = [
      // Major International
      'aliexpress.com', 'aliexpress.fr', 'aliexpress.us',
      'amazon.com', 'amazon.fr', 'amazon.de', 'amazon.co.uk', 'amazon.es', 'amazon.it',
      'ebay.com', 'ebay.fr', 'ebay.de', 'ebay.co.uk',
      'temu.com',
      'walmart.com',
      'etsy.com',
      'wish.com',
      // Asian Suppliers
      'banggood.com',
      'dhgate.com',
      'shein.com',
      'cjdropshipping.com',
      'lightinthebox.com',
      'gearbest.com',
      '1688.com',
      'taobao.com',
      'made-in-china.com',
      // French Marketplaces
      'cdiscount.com',
      'fnac.com',
      'rakuten.fr',
      'darty.com',
      'boulanger.com',
      'manomano.fr', 'manomano.com',
      'leroymerlin.fr',
      // US Home Improvement
      'homedepot.com',
      'lowes.com',
      'costco.com',
      // TikTok Shop
      'tiktok.com',
      'tiktokshop.com',
      'seller.tiktok.com',
      // Fashion
      'asos.com',
      'zalando.com', 'zalando.fr'
    ];

    const isSupported = supportedDomains.some(domain => url.includes(domain));
    
    if (isSupported) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content.js']
        });
        
        await chrome.scripting.insertCSS({
          target: { tabId },
          files: ['content.css']
        });
        
        console.log('[DropCraft] Content script injected for:', url);
      } catch (error) {
        // Content script might already be injected
        console.log('[DropCraft] Script injection skipped:', error.message);
      }
    }
  }

  async handleAlarm(alarm) {
    switch (alarm.name) {
      case 'periodic-sync':
        await this.syncData();
        break;

      case 'price-monitoring':
        await this.checkPriceChanges();
        break;

      case 'stock-alerts':
        await this.checkStockChanges();
        break;
    }
  }

  async getSettings() {
    return await chrome.storage.local.get({
      autoInjectButtons: true,
      autoPriceMonitoring: false,
      autoStockAlerts: false,
      pushNotifications: true,
      minMargin: 30,
      maxPrice: 100,
      minRating: 4,
      excludeKeywords: '',
      importDelay: 2,
      debugMode: false
    });
  }

  async updateSettings(settings) {
    await chrome.storage.local.set(settings);
    
    // Update alarms
    if (settings.autoPriceMonitoring !== undefined) {
      if (settings.autoPriceMonitoring) {
        chrome.alarms.create('price-monitoring', { periodInMinutes: 30 });
      } else {
        chrome.alarms.clear('price-monitoring');
      }
    }

    if (settings.autoStockAlerts !== undefined) {
      if (settings.autoStockAlerts) {
        chrome.alarms.create('stock-alerts', { periodInMinutes: 15 });
      } else {
        chrome.alarms.clear('stock-alerts');
      }
    }
  }

  async getStats() {
    const result = await chrome.storage.local.get(['stats']);
    return result.stats || { products: 0, reviews: 0, monitored: 0 };
  }

  async syncData() {
    try {
      const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
      
      if (!extensionToken) return;

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
        
        if (data.todayStats) {
          await chrome.storage.local.set({
            stats: {
              products: data.todayStats.imports || 0,
              reviews: data.todayStats.reviews || 0,
              monitored: data.todayStats.monitored || 0
            }
          });
        }
      }
    } catch (error) {
      console.error('[DropCraft] Sync error:', error);
    }
  }

  async handleScrapedProducts(products) {
    if (!products || products.length === 0) return;

    const { extensionToken, stats, activities } = await chrome.storage.local.get([
      'extensionToken', 'stats', 'activities'
    ]);

    // Update local stats
    const newStats = {
      ...stats,
      products: (stats?.products || 0) + products.length
    };

    // Add to activities
    const newActivity = {
      title: `${products.length} produit(s) importé(s)`,
      icon: 'package',
      timestamp: new Date().toISOString()
    };

    const newActivities = [newActivity, ...(activities || [])].slice(0, 20);

    await chrome.storage.local.set({
      stats: newStats,
      activities: newActivities
    });

    // Send to API if connected
    if (extensionToken) {
      try {
        await fetch(`${API_URL}/extension-sync-realtime`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': extensionToken
          },
          body: JSON.stringify({
            action: 'import_products',
            products: products.map(p => ({
              title: p.name || p.title,
              name: p.name || p.title,
              price: p.price,
              description: p.description,
              image: p.image,
              url: p.url,
              source: 'chrome_extension',
              platform: p.platform || p.domain
            }))
          })
        });
      } catch (error) {
        console.error('[DropCraft] Error sending products to API:', error);
      }
    }

    // Show notification
    this.showNotification(
      `${products.length} produit(s) importé(s)`,
      'Import réussi via Drop Craft AI'
    );
  }

  async importReviews(config) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractReviewsFromPage,
        args: [config]
      });

      const reviews = results[0]?.result || [];

      if (reviews.length > 0) {
        const { extensionToken, stats } = await chrome.storage.local.get(['extensionToken', 'stats']);

        await chrome.storage.local.set({
          stats: {
            ...stats,
            reviews: (stats?.reviews || 0) + reviews.length
          }
        });

        // Send to API
        if (extensionToken) {
          await fetch(`${API_URL}/extension-sync-realtime`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-extension-token': extensionToken
            },
            body: JSON.stringify({
              action: 'import_reviews',
              reviews
            })
          });
        }

        this.showNotification(
          `${reviews.length} avis importés`,
          'Import des avis réussi'
        );
      }

      return reviews;
    } catch (error) {
      console.error('[DropCraft] Error importing reviews:', error);
      return [];
    }
  }

  async importFromContextMenu(url) {
    try {
      const result = await this.scrapeUrl(url);
      
      if (result.success && result.product) {
        await this.handleScrapedProducts([result.product]);
      } else {
        this.showNotification('Erreur d\'import', result.error || 'Impossible d\'importer ce produit');
      }
    } catch (error) {
      this.showNotification('Erreur', error.message);
    }
  }

  async scrapeUrl(url) {
    try {
      const { extensionToken } = await chrome.storage.local.get(['extensionToken']);

      const response = await fetch(`${API_URL}/product-url-scraper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(extensionToken && { 'x-extension-token': extensionToken })
        },
        body: JSON.stringify({ url })
      });

      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async addToMonitoring(url) {
    const { monitoredUrls, stats } = await chrome.storage.local.get(['monitoredUrls', 'stats']);
    const urls = monitoredUrls || [];

    if (!urls.includes(url)) {
      urls.push(url);
      
      await chrome.storage.local.set({
        monitoredUrls: urls,
        stats: {
          ...stats,
          monitored: urls.length
        }
      });

      this.showNotification('Surveillance activée', 'Vous serez notifié des changements de prix');
    }
  }

  async checkPriceChanges() {
    console.log('[DropCraft] Checking price changes...');
  }

  async checkStockChanges() {
    console.log('[DropCraft] Checking stock changes...');
  }

  showNotification(title, message) {
    chrome.storage.local.get(['pushNotifications'], (result) => {
      if (result.pushNotifications !== false) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: `Drop Craft AI - ${title}`,
          message
        });
      }
    });
  }
}

// Review extraction function (runs in page context)
function extractReviewsFromPage(config) {
  const reviews = [];
  const maxReviews = config?.maxReviews || 50;

  const reviewSelectors = [
    '[data-hook="review"]',
    '.review-item',
    '.review',
    '[class*="review"]',
    '.feedback-item',
    '.customer-review'
  ];

  let reviewElements = [];
  for (const selector of reviewSelectors) {
    reviewElements = document.querySelectorAll(selector);
    if (reviewElements.length > 0) break;
  }

  reviewElements.forEach((element, index) => {
    if (index >= maxReviews) return;

    const ratingEl = element.querySelector('[class*="star"], [data-rating], [aria-label*="star"]');
    const contentEl = element.querySelector('[class*="content"], [class*="text"], p');
    const authorEl = element.querySelector('[class*="author"], [class*="name"], [class*="user"]');
    const dateEl = element.querySelector('[class*="date"], time');

    let rating = null;
    if (ratingEl) {
      const ratingText = ratingEl.getAttribute('aria-label') || ratingEl.textContent;
      const match = ratingText?.match(/(\d+)/);
      rating = match ? parseInt(match[1]) : null;
    }

    const review = {
      id: `review_${Date.now()}_${index}`,
      rating,
      content: contentEl?.textContent?.trim() || '',
      author: authorEl?.textContent?.trim() || 'Anonymous',
      date: dateEl?.textContent?.trim() || new Date().toISOString(),
      url: window.location.href,
      platform: window.location.hostname
    };

    if (review.content) {
      reviews.push(review);
    }
  });

  return reviews;
}

// Initialize the background service worker
try {
  new DropCraftBackground();
} catch (error) {
  console.error('[DropCraft] Failed to initialize:', error);
}
