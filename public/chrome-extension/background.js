// Background script for Drop Craft AI Chrome Extension

class DropCraftBackground {
  constructor() {
    this.reviewImporter = new ReviewImporter();
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
        scrapingInterval: 30,
        enableNotifications: true,
        targetSites: []
      },
      stats: {
        totalScraped: 0,
        sessionsCount: 0,
        reviewsImported: 0,
        lastSync: null
      }
    });

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
      id: 'importReviews',
      title: 'Importer les avis de cette page',
      contexts: ['page']
    });

    chrome.contextMenus.create({
      id: 'openDashboard',
      title: 'Ouvrir Drop Craft AI Dashboard',
      contexts: ['page']
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });
  }

  setupAlarms() {
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

        case 'IMPORT_REVIEWS':
          await this.importReviews(message.config);
          sendResponse({ success: true });
          break;

        case 'GET_REVIEW_CONFIG':
          const reviewConfig = await this.getReviewConfig();
          sendResponse(reviewConfig);
          break;

        case 'UPDATE_REVIEW_CONFIG':
          await this.updateReviewConfig(message.config);
          sendResponse({ success: true });
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }

  async handleContextMenuClick(info, tab) {
    switch (info.menuItemId) {
      case 'scrapePage':
        await this.scrapePage(tab);
        break;

      case 'importReviews':
        const config = await this.getReviewConfig();
        await this.importReviews(config);
        break;

      case 'openDashboard':
        chrome.tabs.create({
          url: 'https://7af4654f-dfc7-42c6-900f-b9ac682ca5ec.lovableproject.com'
        });
        break;
    }
  }

  async importReviews(config) {
    try {
      const reviews = await this.reviewImporter.importFromSite(config);
      await this.handleImportedReviews(reviews);
      this.showNotification(`${reviews.length} avis importés avec succès`);
    } catch (error) {
      console.error('Error importing reviews:', error);
      this.showNotification('Erreur lors de l\'importation des avis', 'error');
    }
  }

  async handleImportedReviews(reviews) {
    if (!reviews || reviews.length === 0) return;

    const result = await chrome.storage.local.get(['importedReviews', 'stats']);
    const existingReviews = result.importedReviews || [];
    const stats = result.stats || { totalScraped: 0, sessionsCount: 0, reviewsImported: 0 };

    const newReviews = [...existingReviews, ...reviews];
    stats.reviewsImported = (stats.reviewsImported || 0) + reviews.length;
    stats.lastReviewSync = new Date().toISOString();

    await chrome.storage.local.set({
      importedReviews: newReviews,
      stats: stats
    });

    await this.syncReviewsToApplication(reviews);
  }

  async syncReviewsToApplication(reviews) {
    try {
      const response = await fetch('https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/reviews-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviews: reviews,
          source: 'chrome_extension',
          extensionVersion: '1.0.0',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log('Reviews synced successfully');
      }
    } catch (error) {
      console.error('Error syncing reviews to application:', error);
    }
  }

  async getReviewConfig() {
    const result = await chrome.storage.local.get(['reviewConfig']);
    return result.reviewConfig || {
      platforms: {
        trustpilot: { enabled: true, maxReviews: 50 },
        google: { enabled: true, maxReviews: 50 },
        facebook: { enabled: false, maxReviews: 50 },
        yelp: { enabled: false, maxReviews: 50 }
      },
      filters: {
        minRating: 1,
        maxRating: 5,
        dateRange: 30,
        language: 'auto'
      },
      autoImport: false,
      importInterval: 60
    };
  }

  async updateReviewConfig(config) {
    await chrome.storage.local.set({ reviewConfig: config });
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

// Review Importer Class
class ReviewImporter {
  constructor() {
    this.platformDetectors = {
      trustpilot: new TrustpilotReviewDetector(),
      google: new GoogleReviewDetector(),
      amazon: new AmazonReviewDetector(),
      aliexpress: new AliExpressReviewDetector()
    };
  }

  async importFromSite(config) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentUrl = tabs[0]?.url || '';
    const platform = this.detectPlatform(currentUrl);
    
    if (!platform || !this.platformDetectors[platform]) {
      throw new Error('Plateforme d\'avis non supportée');
    }

    const detector = this.platformDetectors[platform];
    return await detector.extractReviews(config);
  }

  detectPlatform(url) {
    const hostname = new URL(url).hostname.toLowerCase();
    
    if (hostname.includes('trustpilot')) return 'trustpilot';
    if (hostname.includes('google') && url.includes('reviews')) return 'google';
    if (hostname.includes('amazon')) return 'amazon';
    if (hostname.includes('aliexpress')) return 'aliexpress';
    
    return null;
  }
}

// Platform-specific review detectors
class TrustpilotReviewDetector {
  async extractReviews(config) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: this.scrapeTrustpilotReviews,
      args: [config]
    });
    
    return results[0]?.result || [];
  }

  scrapeTrustpilotReviews(config) {
    const reviews = [];
    const reviewElements = document.querySelectorAll('[data-service-review-card-paper]');
    
    reviewElements.forEach((element, index) => {
      if (index >= (config.maxReviews || 50)) return;
      
      const ratingEl = element.querySelector('[data-service-review-rating]');
      const titleEl = element.querySelector('[data-service-review-title-typography="true"]');
      const contentEl = element.querySelector('[data-service-review-text-typography="true"]');
      const authorEl = element.querySelector('[data-consumer-name-typography="true"]');
      
      const review = {
        id: `trustpilot_${Date.now()}_${index}`,
        platform: 'trustpilot',
        rating: ratingEl ? parseInt(ratingEl.getAttribute('data-service-review-rating')) : null,
        title: titleEl ? titleEl.textContent.trim() : '',
        content: contentEl ? contentEl.textContent.trim() : '',
        author: authorEl ? authorEl.textContent.trim() : '',
        date: new Date().toISOString(),
        url: window.location.href,
        scrapedAt: new Date().toISOString()
      };
      
      if (review.rating && review.content) {
        reviews.push(review);
      }
    });
    
    return reviews;
  }
}

class GoogleReviewDetector {
  async extractReviews(config) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: this.scrapeGoogleReviews,
      args: [config]
    });
    
    return results[0]?.result || [];
  }

  scrapeGoogleReviews(config) {
    const reviews = [];
    const reviewElements = document.querySelectorAll('[data-review-id], .review-item');
    
    reviewElements.forEach((element, index) => {
      if (index >= (config.maxReviews || 50)) return;
      
      const ratingEl = element.querySelector('[role="img"][aria-label*="star"]');
      const contentEl = element.querySelector('.review-text, [data-expand-review]');
      const authorEl = element.querySelector('.review-author');
      
      let rating = null;
      if (ratingEl) {
        const ariaLabel = ratingEl.getAttribute('aria-label');
        const match = ariaLabel?.match(/(\d+)/);
        rating = match ? parseInt(match[1]) : null;
      }
      
      const review = {
        id: `google_${Date.now()}_${index}`,
        platform: 'google',
        rating: rating,
        content: contentEl ? contentEl.textContent.trim() : '',
        author: authorEl ? authorEl.textContent.trim() : '',
        date: new Date().toISOString(),
        url: window.location.href,
        scrapedAt: new Date().toISOString()
      };
      
      if (review.rating && review.content) {
        reviews.push(review);
      }
    });
    
    return reviews;
  }
}

class AmazonReviewDetector {
  async extractReviews(config) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: this.scrapeAmazonReviews,
      args: [config]
    });
    
    return results[0]?.result || [];
  }

  scrapeAmazonReviews(config) {
    const reviews = [];
    const reviewElements = document.querySelectorAll('[data-hook="review"]');
    
    reviewElements.forEach((element, index) => {
      if (index >= (config.maxReviews || 50)) return;
      
      const ratingEl = element.querySelector('[data-hook="review-star-rating"] span');
      const titleEl = element.querySelector('[data-hook="review-title"] span');
      const contentEl = element.querySelector('[data-hook="review-body"] span');
      const authorEl = element.querySelector('[data-hook="review-author"] span');
      
      const review = {
        id: `amazon_${Date.now()}_${index}`,
        platform: 'amazon',
        rating: ratingEl ? parseInt(ratingEl.textContent.match(/(\d+)/)?.[1]) : null,
        title: titleEl ? titleEl.textContent.trim() : '',
        content: contentEl ? contentEl.textContent.trim() : '',
        author: authorEl ? authorEl.textContent.trim() : '',
        verified: element.querySelector('[data-hook="avp-badge"]') !== null,
        date: new Date().toISOString(),
        url: window.location.href,
        scrapedAt: new Date().toISOString()
      };
      
      if (review.rating && review.content) {
        reviews.push(review);
      }
    });
    
    return reviews;
  }
}

class AliExpressReviewDetector {
  async extractReviews(config) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: this.scrapeAliExpressReviews,
      args: [config]
    });
    
    return results[0]?.result || [];
  }

  scrapeAliExpressReviews(config) {
    const reviews = [];
    const reviewElements = document.querySelectorAll('.review-item, .feedback-item');
    
    reviewElements.forEach((element, index) => {
      if (index >= (config.maxReviews || 50)) return;
      
      const ratingEl = element.querySelector('.star-view');
      const contentEl = element.querySelector('.review-content');
      const authorEl = element.querySelector('.reviewer-name');
      
      let rating = null;
      if (ratingEl) {
        const filledStars = ratingEl.querySelectorAll('.star-fill, [class*="filled"]');
        rating = filledStars.length;
      }
      
      const review = {
        id: `aliexpress_${Date.now()}_${index}`,
        platform: 'aliexpress',
        rating: rating,
        content: contentEl ? contentEl.textContent.trim() : '',
        author: authorEl ? authorEl.textContent.trim() : '',
        date: new Date().toISOString(),
        url: window.location.href,
        scrapedAt: new Date().toISOString()
      };
      
      if (review.rating && review.content) {
        reviews.push(review);
      }
    });
    
    return reviews;
  }
}

// Initialize the background script
new DropCraftBackground();