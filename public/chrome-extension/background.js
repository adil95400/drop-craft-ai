// ShopOpti+ Chrome Extension - Background Service Worker v4.3.10

const API_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';
const APP_URL = 'https://shopopti.io';
const VERSION = '4.3.10';

class ShopOptiBackground {
  constructor() {
    console.log('[ShopOpti+] Background service worker initializing...');
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupContextMenus();
    this.setupAlarms();
    console.log('[ShopOpti+] Background service worker initialized');
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
    console.log('[ShopOpti+] Extension installed');
    
    await chrome.storage.local.set({
      extensionVersion: '4.3.10',
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
      url: `${APP_URL}/extensions/chrome?installed=true&v=4.3.10`
    });
  }

  async onUpdate(previousVersion) {
    console.log(`[ShopOpti+] Extension updated from ${previousVersion} to 4.3.10`);
    
    await chrome.storage.local.set({
      extensionVersion: '4.3.10',
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
          // Handle fetch requests from content scripts (bypasses CSP)
          const fetchResult = await this.fetchApi(message.url, message.options);
          sendResponse(fetchResult);
          break;

        case 'IMPORT_FROM_URL':
          // Import product from URL (for listing page buttons)
          const urlImportResult = await this.scrapeAndImport(message.url);
          sendResponse(urlImportResult);
          break;

        case 'OPEN_BULK_IMPORT':
          // Open bulk import page in ShopOpti
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

        default:
          console.warn('[ShopOpti+] Unknown message type:', message.type);
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[ShopOpti+] Error handling message:', error);
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
      console.error('[ShopOpti+] Fetch API error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async scrapeAndImport(url) {
    try {
      console.log('[ShopOpti+] Scraping and importing from URL:', url);
      
      const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
      
      if (!extensionToken) {
        return { success: false, error: 'Non connecté. Connectez-vous via l\'extension.' };
      }
      
      // Use the extension-scraper edge function
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
        // Update local stats
        const { stats } = await chrome.storage.local.get(['stats']);
        await chrome.storage.local.set({
          stats: {
            ...stats,
            products: (stats?.products || 0) + 1
          }
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
      console.error('[ShopOpti+] Import product error:', error);
      return { success: false, error: error.message };
    }
  }

  async handleContextMenuClick(info, tab) {
    switch (info.menuItemId) {
      case 'shopopti-import-product':
        await this.importFromContextMenu(info.linkUrl || tab.url);
        break;

      case 'shopopti-import-reviews':
        await this.importReviews({});
        break;

      case 'shopopti-monitor-price':
        await this.addToMonitoring(tab.url);
        break;

      case 'shopopti-open-dashboard':
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
        
        console.log('[ShopOpti+] Content script injected for:', url);
      } catch (error) {
        // Content script might already be injected
        console.log('[ShopOpti+] Script injection skipped:', error.message);
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
      console.error('[ShopOpti+] Sync error:', error);
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
        console.error('[ShopOpti+] Error sending products to API:', error);
      }
    }

    // Show notification
    this.showNotification(
      `${products.length} produit(s) importé(s)`,
      'Import réussi via ShopOpti+'
    );
  }

  async importReviews(config) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const { extensionToken, stats } = await chrome.storage.local.get(['extensionToken', 'stats']);

      if (!extensionToken) {
        console.error('[ShopOpti+] No extension token for review import');
        return [];
      }

      // First, try to open the reviews panel in the content script
      try {
        await chrome.tabs.sendMessage(tab.id, { 
          type: 'SHOW_REVIEWS_PANEL',
          autoExtract: config?.autoExtract || false
        });
        
        console.log('[ShopOpti+] Reviews panel opened in content script');
        return { success: true, message: 'Reviews panel opened' };
      } catch (e) {
        console.log('[ShopOpti+] Content script not available, using direct extraction');
      }

      // Fallback: direct extraction via scripting API
      const safeConfig = {
        maxReviews: Number(config?.maxReviews || 50) || 50,
      };
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractReviewsFromPage,
        args: [safeConfig]
      });

      const reviews = results[0]?.result || [];

      if (reviews.length > 0) {
        await chrome.storage.local.set({
          stats: {
            ...stats,
            reviews: (stats?.reviews || 0) + reviews.length
          }
        });

        // Send to import-reviews edge function
        const response = await fetch(`${API_URL}/import-reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': extensionToken
          },
          body: JSON.stringify({
            reviews,
            options: {
              translate: config?.translate ?? true,
              targetLanguage: 'fr',
              platform: this.detectPlatform(tab.url),
              productUrl: tab.url
            }
          })
        });

        const result = await response.json();
        
        if (result.success) {
          this.showNotification(
            `${result.imported} avis importés`,
            'Import des avis réussi'
          );
        }
      }

      return reviews;
    } catch (error) {
      console.error('[ShopOpti+] Error importing reviews:', error);
      return [];
    }
  }

  detectPlatform(url) {
    if (!url) return 'unknown';
    const hostname = new URL(url).hostname.toLowerCase();
    
    const platforms = ['aliexpress', 'amazon', 'ebay', 'temu', 'walmart', 'etsy', 'shein', 'cdiscount', 'shopify'];
    for (const p of platforms) {
      if (hostname.includes(p)) return p;
    }
    
    if (hostname.includes('myshopify')) return 'shopify';
    return 'other';
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

  async addToMonitoring(url, productData = null) {
    try {
      const { extensionToken, monitoredUrls, stats } = await chrome.storage.local.get([
        'extensionToken', 'monitoredUrls', 'stats'
      ]);
      
      const urls = monitoredUrls || [];

      // Add to local list
      if (!urls.includes(url)) {
        urls.push(url);
        
        await chrome.storage.local.set({
          monitoredUrls: urls,
          stats: {
            ...stats,
            monitored: urls.length
          }
        });
      }

      // If we have a token and product data, register with backend
      if (extensionToken && productData?.productId) {
        const response = await fetch(`${API_URL}/price-stock-monitor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': extensionToken
          },
          body: JSON.stringify({
            action: 'add_monitoring',
            products: [{
              productId: productData.productId,
              price: productData.price,
              stock: productData.stock,
              threshold: productData.threshold || 5
            }]
          })
        });

        const result = await response.json();
        
        if (result.success) {
          console.log('[ShopOpti+] Product added to monitoring:', productData.productId);
          this.showNotification(
            '📈 Surveillance activée',
            `${productData.title || 'Produit'} est maintenant surveillé`
          );
        } else {
          console.error('[ShopOpti+] Failed to add to monitoring:', result.error);
          this.showNotification('Surveillance activée (local)', 'Vous serez notifié des changements de prix');
        }
      } else {
        this.showNotification('Surveillance activée', 'Vous serez notifié des changements de prix');
      }

      // Log activity
      const { activities } = await chrome.storage.local.get(['activities']);
      const newActivity = {
        title: `Surveillance: ${productData?.title || url.substring(0, 50)}`,
        icon: 'trending-up',
        timestamp: new Date().toISOString()
      };
      await chrome.storage.local.set({
        activities: [newActivity, ...(activities || [])].slice(0, 20)
      });

    } catch (error) {
      console.error('[ShopOpti+] Error adding to monitoring:', error);
      this.showNotification('Erreur', 'Impossible d\'ajouter à la surveillance');
    }
  }

  async removeFromMonitoring(url, productId = null) {
    try {
      const { extensionToken, monitoredUrls, stats } = await chrome.storage.local.get([
        'extensionToken', 'monitoredUrls', 'stats'
      ]);

      // Remove from local list
      const urls = (monitoredUrls || []).filter(u => u !== url);
      await chrome.storage.local.set({
        monitoredUrls: urls,
        stats: {
          ...stats,
          monitored: urls.length
        }
      });

      // Remove from backend if we have a token and product ID
      if (extensionToken && productId) {
        await fetch(`${API_URL}/price-stock-monitor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': extensionToken
          },
          body: JSON.stringify({
            action: 'remove_monitoring',
            productId
          })
        });
      }

      this.showNotification('Surveillance désactivée', 'Le produit n\'est plus surveillé');
    } catch (error) {
      console.error('[ShopOpti+] Error removing from monitoring:', error);
    }
  }

  async checkPriceChanges() {
    console.log('[ShopOpti+] Checking price changes...');
    
    try {
      const { extensionToken, monitoredUrls, priceHistory } = await chrome.storage.local.get([
        'extensionToken', 'monitoredUrls', 'priceHistory'
      ]);
      
      if (!extensionToken) {
        console.log('[ShopOpti+] No token, skipping price check');
        return;
      }
      
      const urls = monitoredUrls || [];
      if (urls.length === 0) {
        console.log('[ShopOpti+] No monitored URLs');
        return;
      }

      // Call edge function to check all monitored products
      const response = await fetch(`${API_URL}/price-stock-monitor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': extensionToken
        },
        body: JSON.stringify({
          action: 'check_all'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`[ShopOpti+] Price check complete: ${result.checked} products, ${result.changes} changes`);
        
        // Update local history
        const history = priceHistory || [];
        const newEntry = {
          timestamp: new Date().toISOString(),
          checked: result.checked,
          changes: result.changes,
          alerts: result.alerts
        };
        
        const updatedHistory = [newEntry, ...history].slice(0, 100);
        await chrome.storage.local.set({ 
          priceHistory: updatedHistory,
          lastPriceCheck: new Date().toISOString()
        });

        // Show notification if there are alerts
        if (result.alerts > 0) {
          this.showNotification(
            '📊 Alertes prix détectées',
            `${result.alerts} changement(s) de prix significatif(s)`
          );
        }

        // Update stats
        const { stats } = await chrome.storage.local.get(['stats']);
        await chrome.storage.local.set({
          stats: {
            ...stats,
            lastPriceCheck: result.checked,
            priceAlerts: (stats?.priceAlerts || 0) + result.alerts
          }
        });
      } else {
        console.error('[ShopOpti+] Price check failed:', result.error);
      }
    } catch (error) {
      console.error('[ShopOpti+] Error checking price changes:', error);
    }
  }

  async checkStockChanges() {
    console.log('[ShopOpti+] Checking stock changes...');
    
    try {
      const { extensionToken, monitoredUrls, stockHistory } = await chrome.storage.local.get([
        'extensionToken', 'monitoredUrls', 'stockHistory'
      ]);
      
      if (!extensionToken) {
        console.log('[ShopOpti+] No token, skipping stock check');
        return;
      }
      
      const urls = monitoredUrls || [];
      if (urls.length === 0) {
        console.log('[ShopOpti+] No monitored URLs for stock check');
        return;
      }

      // Call edge function with stock focus
      const response = await fetch(`${API_URL}/price-stock-monitor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': extensionToken
        },
        body: JSON.stringify({
          action: 'check_all'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`[ShopOpti+] Stock check complete: ${result.checked} products`);
        
        // Update local stock history
        const history = stockHistory || [];
        const newEntry = {
          timestamp: new Date().toISOString(),
          checked: result.checked,
          stockChanges: result.details?.stock_changes || 0
        };
        
        const updatedHistory = [newEntry, ...history].slice(0, 100);
        await chrome.storage.local.set({ 
          stockHistory: updatedHistory,
          lastStockCheck: new Date().toISOString()
        });

        // Show notification for stock alerts
        const stockAlerts = result.details?.stock_changes || 0;
        if (stockAlerts > 0) {
          this.showNotification(
            '📦 Alertes stock détectées',
            `${stockAlerts} changement(s) de stock`
          );
        }

        // Update stats
        const { stats } = await chrome.storage.local.get(['stats']);
        await chrome.storage.local.set({
          stats: {
            ...stats,
            lastStockCheck: result.checked,
            stockAlerts: (stats?.stockAlerts || 0) + stockAlerts
          }
        });
      } else {
        console.error('[ShopOpti+] Stock check failed:', result.error);
      }
    } catch (error) {
      console.error('[ShopOpti+] Error checking stock changes:', error);
    }
  }

  async getMonitoredProducts() {
    try {
      const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
      
      if (!extensionToken) return [];

      const response = await fetch(`${API_URL}/price-stock-monitor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': extensionToken
        },
        body: JSON.stringify({
          action: 'get_monitored'
        })
      });

      const result = await response.json();
      return result.success ? result.monitored : [];
    } catch (error) {
      console.error('[ShopOpti+] Error getting monitored products:', error);
      return [];
    }
  }

  async getPriceHistory(productId = null) {
    try {
      const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
      
      if (!extensionToken) return [];

      const response = await fetch(`${API_URL}/price-stock-monitor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': extensionToken
        },
        body: JSON.stringify({
          action: 'get_history',
          productId
        })
      });

      const result = await response.json();
      return result.success ? result.history : [];
    } catch (error) {
      console.error('[ShopOpti+] Error getting price history:', error);
      return [];
    }
  }

  showNotification(title, message) {
    chrome.storage.local.get(['pushNotifications'], (result) => {
      if (result.pushNotifications !== false) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: `ShopOpti+ - ${title}`,
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
  new ShopOptiBackground();
} catch (error) {
  console.error('[ShopOpti+] Failed to initialize:', error);
}
