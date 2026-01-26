/**
 * ShopOpti+ Remote Selectors Manager v5.7.0
 * Dynamic selector updates without extension republishing
 * Automatic fallback to local selectors if remote fails
 */

const RemoteSelectorsManager = {
  VERSION: '5.7.0',
  
  // Remote configuration
  config: {
    remoteUrl: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1/extension-selectors',
    cacheKey: 'sho_remote_selectors',
    cacheExpiry: 6 * 60 * 60 * 1000, // 6 hours
    retryDelay: 30000, // 30 seconds
    maxRetries: 3
  },
  
  // Selector version tracking
  localVersion: '5.7.0',
  remoteVersion: null,
  lastUpdate: null,
  
  /**
   * Initialize and fetch remote selectors
   */
  async init() {
    console.log('[ShopOpti+] RemoteSelectorsManager v5.7.0 initializing...');
    
    // Load cached selectors first
    const cached = await this.getCachedSelectors();
    if (cached && !this.isCacheExpired(cached.timestamp)) {
      console.log('[ShopOpti+] Using cached remote selectors v' + cached.version);
      this.applySelectors(cached.selectors);
      this.remoteVersion = cached.version;
      this.lastUpdate = cached.timestamp;
      
      // Still try to update in background
      this.fetchRemoteSelectors(true);
      return cached.selectors;
    }
    
    // Fetch fresh selectors
    return await this.fetchRemoteSelectors();
  },
  
  /**
   * Fetch selectors from remote server
   */
  async fetchRemoteSelectors(silent = false) {
    let retries = 0;
    
    while (retries < this.config.maxRetries) {
      try {
        const token = await this.getAuthToken();
        
        const response = await fetch(this.config.remoteUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': token || '',
            'x-extension-version': this.localVersion
          },
          timeout: 10000
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.selectors && data.version) {
          // Cache the new selectors
          await this.cacheSelectors(data.selectors, data.version);
          
          // Apply them
          this.applySelectors(data.selectors);
          this.remoteVersion = data.version;
          this.lastUpdate = Date.now();
          
          if (!silent) {
            console.log(`[ShopOpti+] Remote selectors updated to v${data.version}`);
          }
          
          return data.selectors;
        }
      } catch (error) {
        retries++;
        if (!silent) {
          console.warn(`[ShopOpti+] Remote selectors fetch failed (attempt ${retries}):`, error.message);
        }
        
        if (retries < this.config.maxRetries) {
          await this.delay(this.config.retryDelay * retries);
        }
      }
    }
    
    // Fallback to local selectors
    if (!silent) {
      console.log('[ShopOpti+] Using local fallback selectors');
    }
    return this.getLocalFallback();
  },
  
  /**
   * Apply selectors to global config
   */
  applySelectors(selectors) {
    if (typeof window !== 'undefined') {
      window.ShopOptiRemoteSelectors = selectors;
      
      // Merge with existing selectors config if available
      if (window.ShopOptiSelectorsConfig) {
        Object.keys(selectors).forEach(platform => {
          if (selectors[platform]) {
            window.ShopOptiSelectorsConfig[platform] = {
              ...window.ShopOptiSelectorsConfig[platform],
              ...selectors[platform]
            };
          }
        });
      }
    }
    
    // Also update chrome.storage for background script
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ remoteSelectors: selectors });
    }
  },
  
  /**
   * Get cached selectors from storage
   */
  async getCachedSelectors() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        return new Promise(resolve => {
          chrome.storage.local.get([this.config.cacheKey], (result) => {
            resolve(result[this.config.cacheKey] || null);
          });
        });
      } else {
        const cached = localStorage.getItem(this.config.cacheKey);
        return cached ? JSON.parse(cached) : null;
      }
    } catch (e) {
      return null;
    }
  },
  
  /**
   * Cache selectors to storage
   */
  async cacheSelectors(selectors, version) {
    const cacheData = {
      selectors,
      version,
      timestamp: Date.now()
    };
    
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ [this.config.cacheKey]: cacheData });
      } else {
        localStorage.setItem(this.config.cacheKey, JSON.stringify(cacheData));
      }
    } catch (e) {
      console.warn('[ShopOpti+] Failed to cache selectors:', e);
    }
  },
  
  /**
   * Check if cache is expired
   */
  isCacheExpired(timestamp) {
    return Date.now() - timestamp > this.config.cacheExpiry;
  },
  
  /**
   * Get auth token from storage
   */
  async getAuthToken() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        return new Promise(resolve => {
          chrome.storage.local.get(['extensionToken'], (result) => {
            resolve(result.extensionToken || null);
          });
        });
      }
    } catch (e) {
      return null;
    }
  },
  
  /**
   * Report broken selector to backend
   */
  async reportBrokenSelector(platform, selectorType, details = {}) {
    try {
      const token = await this.getAuthToken();
      
      await fetch(this.config.remoteUrl + '/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': token || ''
        },
        body: JSON.stringify({
          platform,
          selectorType,
          currentUrl: window.location.href,
          userAgent: navigator.userAgent,
          localVersion: this.localVersion,
          remoteVersion: this.remoteVersion,
          details,
          timestamp: new Date().toISOString()
        })
      });
      
      console.log(`[ShopOpti+] Broken selector reported for ${platform}:${selectorType}`);
      return true;
    } catch (e) {
      console.warn('[ShopOpti+] Failed to report broken selector:', e);
      return false;
    }
  },
  
  /**
   * Create feedback UI for reporting issues
   */
  createFeedbackButton() {
    const btn = document.createElement('button');
    btn.id = 'sho-report-selector';
    btn.innerHTML = '⚠️ Signaler un problème';
    btn.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 999999;
      padding: 8px 12px;
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
      color: white;
      border: none;
      border-radius: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
      transition: all 0.3s ease;
      display: none;
    `;
    
    btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
    btn.onmouseout = () => btn.style.transform = 'scale(1)';
    
    btn.onclick = () => this.showFeedbackDialog();
    
    document.body.appendChild(btn);
    
    // Show button when extraction fails
    window.addEventListener('sho-extraction-failed', () => {
      btn.style.display = 'block';
    });
    
    return btn;
  },
  
  /**
   * Show feedback dialog for broken selectors
   */
  showFeedbackDialog() {
    const platform = window.ShopOptiConfig?.detectPlatform?.() || 'unknown';
    
    const dialog = document.createElement('div');
    dialog.id = 'sho-feedback-dialog';
    dialog.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 9999999;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          background: white;
          padding: 24px;
          border-radius: 16px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        ">
          <h3 style="margin: 0 0 16px; color: #333; font-size: 18px;">
            ⚠️ Signaler un problème d'extraction
          </h3>
          <p style="color: #666; font-size: 14px; margin-bottom: 16px;">
            Plateforme détectée : <strong>${platform}</strong>
          </p>
          
          <label style="display: block; margin-bottom: 8px; color: #333; font-size: 14px;">
            Quel élément ne fonctionne pas ?
          </label>
          <select id="sho-feedback-type" style="
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 14px;
          ">
            <option value="title">Titre du produit</option>
            <option value="price">Prix</option>
            <option value="images">Images</option>
            <option value="description">Description</option>
            <option value="variants">Variantes</option>
            <option value="reviews">Avis</option>
            <option value="shipping">Livraison</option>
            <option value="button">Bouton d'import</option>
            <option value="other">Autre</option>
          </select>
          
          <label style="display: block; margin-bottom: 8px; color: #333; font-size: 14px;">
            Détails (optionnel)
          </label>
          <textarea id="sho-feedback-details" style="
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 14px;
            min-height: 80px;
            resize: vertical;
          " placeholder="Décrivez le problème..."></textarea>
          
          <div style="display: flex; gap: 12px;">
            <button id="sho-feedback-cancel" style="
              flex: 1;
              padding: 12px;
              background: #f5f5f5;
              color: #333;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
            ">Annuler</button>
            <button id="sho-feedback-submit" style="
              flex: 1;
              padding: 12px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
            ">Envoyer</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Event handlers
    dialog.querySelector('#sho-feedback-cancel').onclick = () => dialog.remove();
    dialog.querySelector('#sho-feedback-submit').onclick = async () => {
      const type = dialog.querySelector('#sho-feedback-type').value;
      const details = dialog.querySelector('#sho-feedback-details').value;
      
      await this.reportBrokenSelector(platform, type, { description: details });
      
      // Show success
      dialog.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 9999999;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            background: white;
            padding: 32px;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          ">
            <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
            <h3 style="margin: 0 0 8px; color: #333;">Merci !</h3>
            <p style="color: #666; margin: 0;">Votre signalement a été envoyé.</p>
          </div>
        </div>
      `;
      
      setTimeout(() => dialog.remove(), 2000);
    };
  },
  
  /**
   * Get local fallback selectors
   */
  getLocalFallback() {
    return {
      amazon: {
        title: ['#productTitle', '.product-title-word-break', 'h1[data-automation-id="title"]'],
        price: ['#corePrice_feature_div .a-price .a-offscreen', '.priceToPay .a-price .a-offscreen', '#priceblock_ourprice', '#priceblock_dealprice'],
        images: ['#imgTagWrapperId img', '#landingImage', '#main-image-container img'],
        description: ['#productDescription', '#feature-bullets', '.a-unordered-list.a-vertical'],
        reviews: ['#cm_cr-review_list .review', '.review-views .review']
      },
      aliexpress: {
        title: ['.product-title-text', 'h1[data-pl="product-title"]', '.HazeProductCard--title'],
        price: ['[class*="Price--currentPriceText"]', '.product-price-value', '.uniform-banner-box-price'],
        images: ['[class*="Slider--sliderMain"] img', '.images-view-item img', '.magnifier-image'],
        description: ['#product-description', '.product-description', '.detail-desc-decorate-richtext'],
        reviews: ['.feedback-list-wrap .feedback-item', '.buyer-feedback']
      },
      temu: {
        title: ['h1[class*="ProductTitle"]', '.product-title', '[data-testid="pdp-title"]'],
        price: ['[class*="Price"] span', '.product-price', '[data-testid="pdp-price"]'],
        images: ['[class*="ImageContainer"] img', '.product-image img'],
        description: ['[class*="Description"]', '.product-description'],
        reviews: ['[class*="Review"]', '.review-item']
      },
      shein: {
        title: ['h1.product-intro__head-name', '.goods-title', '.product-intro h1'],
        price: ['.product-intro__head-price .original', '.from', '.product-intro__head-price'],
        images: ['.product-intro__thumbs-item img', '.goods-image img', '.crop-image-container img'],
        description: ['.product-intro__description', '.goods-description'],
        reviews: ['.j-expose__common-reviews .comment-item', '.review-item']
      },
      ebay: {
        title: ['h1.x-item-title__mainTitle', '.it-ttl', '#itemTitle'],
        price: ['[data-testid="x-price-primary"] .ux-textspans', '#prcIsum', '.x-price-primary'],
        images: ['#PicturePanel img', '.img-wrapper img', '.ux-image-carousel-item img'],
        description: ['#desc_ifr', '.item-description', '#ds_div'],
        reviews: ['.reviews-section .ebay-review-item']
      },
      shopify: {
        title: ['.product__title h1', '.product-single__title', 'h1.title'],
        price: ['.product__price', '.price', 'span[data-product-price]'],
        images: ['.product__media img', '.product-single__photo img', '.product-image'],
        description: ['.product__description', '.product-single__description', '.description'],
        reviews: ['.spr-review', '.stamped-review']
      }
    };
  },
  
  /**
   * Utility: delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  /**
   * Get selector status
   */
  getStatus() {
    return {
      localVersion: this.localVersion,
      remoteVersion: this.remoteVersion,
      lastUpdate: this.lastUpdate,
      isUsingRemote: this.remoteVersion !== null,
      cacheExpired: this.lastUpdate ? this.isCacheExpired(this.lastUpdate) : true
    };
  }
};

// Export for different contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RemoteSelectorsManager;
}

if (typeof window !== 'undefined') {
  window.ShopOptiRemoteSelectors = RemoteSelectorsManager;
  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => RemoteSelectorsManager.init());
  } else {
    RemoteSelectorsManager.init();
  }
}
