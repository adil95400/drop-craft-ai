// ============================================
// ShopOpti+ Security Module v5.7.2
// Message validation, URL whitelist, sanitization
// Chrome Web Store Compliant - Manifest V3
// SECURITY FIX v5.7.2: Added XSS-safe DOM helpers
// ============================================

const ShopOptiSecurity = {
  VERSION: '5.7.2',

  // ============================================
  // ALLOWED DOMAINS FOR API & SCRAPING
  // ============================================
  ALLOWED_API_DOMAINS: [
    'supabase.co',
    'shopopti.io'
  ],

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

  // ============================================
  // MESSAGE TYPE WHITELIST
  // ============================================
  ALLOWED_MESSAGE_TYPES: [
    'PING',
    'GET_SETTINGS',
    'UPDATE_SETTINGS',
    'SYNC_DATA',
    'PRODUCTS_SCRAPED',
    'GET_STATS',
    'IMPORT_REVIEWS',
    'SCRAPE_URL',
    'IMPORT_PRODUCT',
    'FETCH_API',
    'IMPORT_FROM_URL',
    'IMPORT_PRODUCT_WITH_REVIEWS',
    'OPEN_BULK_IMPORT',
    'ADD_TO_MONITORING',
    'REMOVE_FROM_MONITORING',
    'CHECK_PRICES',
    'CHECK_STOCK',
    'GET_MONITORED_PRODUCTS',
    'GET_PRICE_HISTORY',
    'GET_MONITORING_STATUS',
    'GET_PRODUCT_DATA',
    'FIND_SUPPLIERS',
    'SEARCH_ALL_SUPPLIERS',
    'COMPARE_SUPPLIERS',
    'BULK_IMPORT_PRODUCTS',
    'GET_USER_STORES',
    'IMPORT_TO_STORES',
    'SYNC_PRODUCT_STORES',
    'OPEN_IMPORT_OVERLAY',
    'OPEN_BULK_IMPORT_UI'
  ],

  // ============================================
  // URL VALIDATION
  // ============================================
  isUrlAllowedForApi(url) {
    if (!url || typeof url !== 'string') return false;
    
    try {
      const parsed = new URL(url);
      
      // Only allow HTTPS
      if (parsed.protocol !== 'https:') {
        console.warn('[ShopOpti+ Security] Blocked non-HTTPS URL:', url);
        return false;
      }
      
      // Check against whitelist
      const hostname = parsed.hostname.toLowerCase();
      return this.ALLOWED_API_DOMAINS.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      );
    } catch (e) {
      console.warn('[ShopOpti+ Security] Invalid URL:', url);
      return false;
    }
  },

  isUrlAllowedForScrape(url) {
    if (!url || typeof url !== 'string') return false;
    
    try {
      const parsed = new URL(url);
      
      // Only allow HTTP(S)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        console.warn('[ShopOpti+ Security] Blocked non-HTTP URL:', url);
        return false;
      }
      
      // Check against whitelist
      const hostname = parsed.hostname.toLowerCase();
      return this.ALLOWED_SCRAPE_DOMAINS.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      );
    } catch (e) {
      console.warn('[ShopOpti+ Security] Invalid URL:', url);
      return false;
    }
  },

  // ============================================
  // MESSAGE VALIDATION
  // ============================================
  validateMessage(message, sender) {
    // Check message structure
    if (!message || typeof message !== 'object') {
      return { valid: false, error: 'Invalid message structure' };
    }

    // Check message type
    if (!message.type || typeof message.type !== 'string') {
      return { valid: false, error: 'Missing or invalid message type' };
    }

    // Whitelist check
    if (!this.ALLOWED_MESSAGE_TYPES.includes(message.type)) {
      console.warn('[ShopOpti+ Security] Unknown message type:', message.type);
      return { valid: false, error: 'Unknown message type' };
    }

    // Origin validation for content scripts
    if (sender?.tab?.url) {
      try {
        const senderUrl = new URL(sender.tab.url);
        const hostname = senderUrl.hostname.toLowerCase();
        
        // Allow our own domains always
        if (hostname.includes('shopopti.io')) {
          return { valid: true };
        }
        
        // For scrape-related messages, validate against allowed domains
        if (['SCRAPE_URL', 'IMPORT_FROM_URL', 'IMPORT_PRODUCT_WITH_REVIEWS'].includes(message.type)) {
          if (!this.ALLOWED_SCRAPE_DOMAINS.some(d => hostname.includes(d))) {
            console.warn('[ShopOpti+ Security] Message from unauthorized domain:', hostname);
            return { valid: false, error: 'Unauthorized origin domain' };
          }
        }
      } catch (e) {
        console.warn('[ShopOpti+ Security] Could not parse sender URL');
      }
    }

    // URL parameter validation
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

  // ============================================
  // HTML SANITIZATION
  // ============================================
  sanitizeText(text) {
    if (!text || typeof text !== 'string') return '';
    
    // Create a text node and extract its content (auto-escapes HTML)
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  sanitizeHtml(html) {
    if (!html || typeof html !== 'string') return '';
    
    // Allow only safe tags
    const allowedTags = ['b', 'i', 'u', 'strong', 'em', 'br', 'p', 'span', 'div', 'ul', 'ol', 'li'];
    
    // Create temporary element
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remove all script, style, and event handlers
    temp.querySelectorAll('script, style, link, iframe, object, embed').forEach(el => el.remove());
    
    // Remove event handlers
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(el => {
      // Remove all on* attributes
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('on') || attr.name === 'href' && attr.value.startsWith('javascript:')) {
          el.removeAttribute(attr.name);
        }
      });
      
      // Remove elements not in whitelist
      if (!allowedTags.includes(el.tagName.toLowerCase())) {
        // Keep text content but remove the element
        const textContent = el.textContent;
        const textNode = document.createTextNode(textContent);
        el.parentNode.replaceChild(textNode, el);
      }
    });
    
    return temp.innerHTML;
  },

  // ============================================
  // SAFE DOM CREATION
  // SECURITY FIX v5.7.2: XSS-safe element creation
  // ============================================
  createElement(tag, attributes = {}, textContent = null) {
    const el = document.createElement(tag);
    
    for (const [key, value] of Object.entries(attributes)) {
      // Skip dangerous attributes
      if (key.startsWith('on') || key === 'innerHTML' || key === 'outerHTML') {
        console.warn('[ShopOpti+ Security] Blocked dangerous attribute:', key);
        continue;
      }
      
      if (key === 'className') {
        el.className = value;
      } else if (key === 'dataset') {
        for (const [dataKey, dataValue] of Object.entries(value)) {
          el.dataset[dataKey] = dataValue;
        }
      } else {
        el.setAttribute(key, value);
      }
    }
    
    if (textContent !== null) {
      el.textContent = textContent; // SAFE: textContent auto-escapes HTML
    }
    
    return el;
  },
  
  /**
   * Create a safe text element (span, div, p, etc.) with escaped content
   * SECURITY: Always use this instead of innerHTML when displaying user data
   */
  createSafeTextElement(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  },
  
  /**
   * Safely set content of an existing element
   * SECURITY: Replaces innerHTML usage with textContent
   */
  setElementText(element, text) {
    if (!element) return;
    element.textContent = text || '';
  },
  
  /**
   * Create a safe toast/notification element
   * SECURITY: All user-provided content is escaped via textContent
   */
  createSafeNotification(message, options = {}) {
    const container = document.createElement('div');
    container.className = options.className || 'shopopti-notification';
    
    if (options.icon) {
      const iconSpan = document.createElement('span');
      iconSpan.className = 'notification-icon';
      iconSpan.textContent = options.icon;
      container.appendChild(iconSpan);
    }
    
    const textSpan = document.createElement('span');
    textSpan.className = 'notification-text';
    textSpan.textContent = message; // SAFE
    container.appendChild(textSpan);
    
    return container;
  },

  // ============================================
  // INPUT VALIDATION
  // ============================================
  validateProductData(data) {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Invalid product data structure' };
    }

    // Required fields
    if (!data.title || typeof data.title !== 'string' || data.title.length > 500) {
      return { valid: false, error: 'Invalid or missing title' };
    }

    // Price validation
    if (data.price !== undefined) {
      const price = parseFloat(data.price);
      if (isNaN(price) || price < 0 || price > 1000000) {
        return { valid: false, error: 'Invalid price value' };
      }
    }

    // URL validation
    if (data.source_url && !this.isUrlAllowedForScrape(data.source_url)) {
      return { valid: false, error: 'Invalid source URL' };
    }

    // Image URLs validation
    if (data.images && Array.isArray(data.images)) {
      for (const img of data.images) {
        try {
          new URL(img);
        } catch (e) {
          return { valid: false, error: 'Invalid image URL' };
        }
      }
    }

    return { valid: true };
  },

  // ============================================
  // RATE LIMITING
  // ============================================
  rateLimits: new Map(),
  
  checkRateLimit(action, limit = 10, windowMs = 60000) {
    const now = Date.now();
    const key = action;
    
    if (!this.rateLimits.has(key)) {
      this.rateLimits.set(key, { count: 0, resetAt: now + windowMs });
    }
    
    const rateData = this.rateLimits.get(key);
    
    // Reset if window expired
    if (now > rateData.resetAt) {
      rateData.count = 0;
      rateData.resetAt = now + windowMs;
    }
    
    rateData.count++;
    
    if (rateData.count > limit) {
      console.warn('[ShopOpti+ Security] Rate limit exceeded for:', action);
      return false;
    }
    
    return true;
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShopOptiSecurity;
}
