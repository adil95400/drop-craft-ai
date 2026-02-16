/**
 * ShopOpti+ Pro - Background Service Worker
 * Version: 5.8.1
 * 
 * Handles:
 * - Authentication via JWT tokens
 * - API calls to ShopOpti backend
 * - Message passing between content scripts and popup
 * - Notifications and alarms
 */

const SUPABASE_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzbXdja3pybXFlY3d3cnN3d3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjY0NDEsImV4cCI6MjA4MTc0MjQ0MX0.jhrwOY7-tKeNF54E3Ec6yRzjmTW8zJyKuE9R4rvi41I';

// ============================================
// Storage Manager
// ============================================
class StorageManager {
  static async get(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => resolve(result[key]));
    });
  }

  static async set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  }

  static async remove(key) {
    return new Promise((resolve) => {
      chrome.storage.local.remove([key], resolve);
    });
  }

  static async getSession() {
    return this.get('shopopti_session');
  }

  static async setSession(session) {
    return this.set('shopopti_session', session);
  }

  static async getSettings() {
    const settings = await this.get('shopopti_settings');
    return settings || {
      autoImport: false,
      priceMargin: 30,
      roundingRule: 'ceil_99',
      defaultSupplier: 'aliexpress',
      notifications: true,
      language: 'fr'
    };
  }
}

// ============================================
// API Client
// ============================================
class ShopOptiAPI {
  static async callEdgeFunction(functionName, body, token) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  static async validateToken(token) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/validate_extension_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ p_token: token })
      });

      return response.json();
    } catch (error) {
      console.error('Token validation error:', error);
      return { success: false, error: error.message };
    }
  }

  static async importProduct(productData, token) {
    return this.callEdgeFunction('extension-realtime-import', {
      action: 'import_single',
      product: productData
    }, token);
  }

  static async bulkImport(products, token) {
    return this.callEdgeFunction('extension-realtime-import', {
      action: 'import_bulk',
      products
    }, token);
  }

  static async syncSettings(settings, token) {
    return this.callEdgeFunction('extension-realtime-import', {
      action: 'sync_settings',
      settings
    }, token);
  }

  static async getRemoteSettings(token) {
    return this.callEdgeFunction('extension-realtime-import', {
      action: 'get_settings'
    }, token);
  }
}

// ============================================
// Message Handlers
// ============================================
// ============================================
// Security Module
// ============================================
const Security = {
  ALLOWED_API_DOMAINS: [
    'jsmwckzrmqecwwrswwrz.supabase.co',
    'shopopti.io'
  ],

  ALLOWED_SCRAPING_DOMAINS: [
    'aliexpress.com', 'amazon.com', 'amazon.fr', 'amazon.de', 'amazon.co.uk',
    'amazon.es', 'amazon.it', 'amazon.ca', 'amazon.com.au',
    'ebay.com', 'ebay.fr', 'ebay.de', 'ebay.co.uk', 'ebay.es', 'ebay.it',
    'walmart.com', 'temu.com', 'shein.com', 'shein.fr', 'etsy.com',
    'banggood.com', 'cjdropshipping.com', 'costco.com', 'homedepot.com'
  ],

  ALLOWED_MESSAGE_TYPES: [
    'login', 'logout', 'check_auth', 'validate_token',
    'import_product', 'bulk_import', 'quick_import',
    'get_settings', 'save_settings', 'sync_settings',
    'product_detected', 'ping'
  ],

  // Rate limiting
  _rateLimits: new Map(),
  RATE_LIMIT_MAX: 30,
  RATE_LIMIT_WINDOW_MS: 60000,

  isAllowedApiDomain(url) {
    try {
      const hostname = new URL(url).hostname;
      return this.ALLOWED_API_DOMAINS.some(d => hostname.endsWith(d));
    } catch { return false; }
  },

  isAllowedScrapingDomain(hostname) {
    return this.ALLOWED_SCRAPING_DOMAINS.some(d => hostname.endsWith(d));
  },

  isAllowedMessageType(action) {
    return this.ALLOWED_MESSAGE_TYPES.includes(action);
  },

  checkRateLimit(key) {
    const now = Date.now();
    const attempts = this._rateLimits.get(key) || [];
    const recent = attempts.filter(t => now - t < this.RATE_LIMIT_WINDOW_MS);
    if (recent.length >= this.RATE_LIMIT_MAX) {
      console.warn(`[Security] Rate limit exceeded for ${key}`);
      return false;
    }
    recent.push(now);
    this._rateLimits.set(key, recent);
    return true;
  },

  sanitizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim()
      .substring(0, 5000);
  },

  sanitizeProductData(product) {
    if (!product || typeof product !== 'object') return null;
    return {
      ...product,
      title: this.sanitizeText(product.title),
      description: this.sanitizeText(product.description),
      brand: this.sanitizeText(product.brand),
      category: this.sanitizeText(product.category),
      url: product.url && typeof product.url === 'string' ? product.url.substring(0, 2048) : '',
      images: Array.isArray(product.images)
        ? product.images.filter(u => typeof u === 'string' && (u.startsWith('https://') || u.startsWith('http://'))).slice(0, 30)
        : [],
      price: typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0,
    };
  }
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch((error) => {
    console.error('Message handler error:', error);
    sendResponse({ success: false, error: error.message });
  });
  return true; // Keep channel open for async response
});

async function handleMessage(message, sender) {
  const { action, data } = message;

  // Validate message type
  if (!Security.isAllowedMessageType(action)) {
    console.warn(`[Security] Blocked unknown action: ${action}`);
    return { success: false, error: `Action non autorisée: ${action}` };
  }

  // Rate limit per action
  if (!Security.checkRateLimit(action)) {
    return { success: false, error: 'Trop de requêtes. Veuillez patienter.' };
  }

  switch (action) {
    // Auth
    case 'login':
      return handleLogin(data);
    
    case 'logout':
      return handleLogout();
    
    case 'check_auth':
      return checkAuth();
    
    case 'validate_token':
      return validateToken(data.token);

    // Import
    case 'import_product':
      return importProduct(data);
    
    case 'bulk_import':
      return bulkImport(data.products);
    
    case 'quick_import':
      return quickImport(sender.tab?.id);

    // Settings
    case 'get_settings':
      return StorageManager.getSettings();
    
    case 'save_settings':
      return saveSettings(data);
    
    case 'sync_settings':
      return syncSettingsWithServer();

    // Product detection
    case 'product_detected':
      return handleProductDetected(data, sender.tab);

    // Health check
    case 'ping':
      return { success: true, version: '5.8.1', timestamp: Date.now() };

    default:
      return { success: false, error: `Unknown action: ${action}` };
  }
}

// ============================================
// Auth Handlers
// ============================================
async function handleLogin(credentials) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    // Store session
    await StorageManager.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
      expires_at: Date.now() + (data.expires_in * 1000)
    });

    // Generate extension token
    const tokenResult = await ShopOptiAPI.callEdgeFunction('extension-auth', {
      action: 'generate_token',
      device_info: {
        browser: 'chrome',
        version: '5.8.1',
        platform: navigator.platform
      }
    }, data.access_token);

    if (tokenResult.success && tokenResult.token) {
      await StorageManager.set('extension_token', tokenResult.token);
    }

    // Show success notification
    if ((await StorageManager.getSettings()).notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ShopOpti+ Pro',
        message: `Connecté en tant que ${data.user.email}`
      });
    }

    return { success: true, user: data.user };

  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}

async function handleLogout() {
  try {
    await StorageManager.remove('shopopti_session');
    await StorageManager.remove('extension_token');
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'ShopOpti+ Pro',
      message: 'Déconnecté avec succès'
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function checkAuth() {
  const session = await StorageManager.getSession();
  
  if (!session) {
    return { authenticated: false };
  }

  // Check if token expired
  if (session.expires_at && session.expires_at < Date.now()) {
    // Try refresh
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ refresh_token: session.refresh_token })
      });

      const data = await response.json();

      if (data.error) {
        await handleLogout();
        return { authenticated: false };
      }

      await StorageManager.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
        expires_at: Date.now() + (data.expires_in * 1000)
      });

      return { authenticated: true, user: data.user };

    } catch (error) {
      await handleLogout();
      return { authenticated: false };
    }
  }

  return { authenticated: true, user: session.user };
}

async function validateToken(token) {
  return ShopOptiAPI.validateToken(token);
}

// ============================================
// Import Handlers
// ============================================
async function importProduct(productData) {
  const session = await StorageManager.getSession();
  const extensionToken = await StorageManager.get('extension_token');
  
  if (!session?.access_token && !extensionToken) {
    return { success: false, error: 'Non authentifié. Veuillez vous connecter.', code: 'AUTH_REQUIRED' };
  }

  // Sanitize product data before processing
  const sanitizedData = Security.sanitizeProductData(productData);
  if (!sanitizedData || !sanitizedData.title) {
    return { success: false, error: 'Données produit invalides ou incomplètes.', code: 'INVALID_DATA' };
  }

  try {
    // Apply pricing rules
    const settings = await StorageManager.getSettings();
    const processedProduct = applyPricingRules(sanitizedData, settings);

    const result = await ShopOptiAPI.importProduct(
      processedProduct, 
      session?.access_token || extensionToken
    );

    if (result.success) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Produit importé ✓',
        message: `${sanitizedData.title?.substring(0, 50)}...`
      });
    }

    return result;

  } catch (error) {
    console.error('Import error:', error);
    // Enhanced error feedback
    const errorMsg = error.message || 'Erreur inconnue';
    const isNetworkError = errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError');
    
    if (isNetworkError) {
      return { 
        success: false, 
        error: 'Connexion au serveur impossible. Vérifiez votre connexion internet.',
        code: 'NETWORK_ERROR',
        canRetry: true
      };
    }

    return { success: false, error: errorMsg, code: 'IMPORT_ERROR' };
  }
}

async function bulkImport(products) {
  const session = await StorageManager.getSession();
  const extensionToken = await StorageManager.get('extension_token');
  
  if (!session?.access_token && !extensionToken) {
    return { success: false, error: 'Non authentifié', code: 'AUTH_REQUIRED' };
  }

  if (!Array.isArray(products) || products.length === 0) {
    return { success: false, error: 'Aucun produit à importer', code: 'INVALID_DATA' };
  }

  // Limit bulk size to prevent abuse
  if (products.length > 100) {
    return { success: false, error: 'Maximum 100 produits par import en masse', code: 'BULK_LIMIT' };
  }

  try {
    const settings = await StorageManager.getSettings();
    const sanitizedProducts = products
      .map(p => Security.sanitizeProductData(p))
      .filter(p => p && p.title);
    const processedProducts = sanitizedProducts.map(p => applyPricingRules(p, settings));

    const result = await ShopOptiAPI.bulkImport(
      processedProducts,
      session?.access_token || extensionToken
    );

    if (result.success) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Import en masse terminé ✓',
        message: `${result.imported || processedProducts.length} produits importés`
      });
    }

    return result;

  } catch (error) {
    console.error('Bulk import error:', error);
    const isNetworkError = (error.message || '').includes('Failed to fetch');
    return { 
      success: false, 
      error: isNetworkError ? 'Connexion impossible. Réessayez.' : error.message,
      code: isNetworkError ? 'NETWORK_ERROR' : 'BULK_IMPORT_ERROR',
      canRetry: isNetworkError
    };
  }
}

async function quickImport(tabId) {
  if (!tabId) return { success: false, error: 'Aucun onglet actif', code: 'NO_TAB' };

  try {
    // Verify tab URL is on allowed domain
    const tab = await chrome.tabs.get(tabId);
    if (tab?.url) {
      try {
        const hostname = new URL(tab.url).hostname;
        if (!Security.isAllowedScrapingDomain(hostname)) {
          return { 
            success: false, 
            error: `Ce site (${hostname}) n'est pas supporté. Rendez-vous sur AliExpress, Amazon, eBay ou un autre marketplace supporté.`,
            code: 'UNSUPPORTED_SITE'
          };
        }
      } catch { /* URL parse error, continue */ }
    }

    // Request product data from content script
    const response = await chrome.tabs.sendMessage(tabId, { action: 'extract_product' });
    
    if (!response?.success || !response.product) {
      return { 
        success: false, 
        error: 'Impossible d\'extraire le produit. Vérifiez que vous êtes sur une page produit.',
        code: 'EXTRACTION_FAILED'
      };
    }

    return importProduct(response.product);

  } catch (error) {
    const msg = error.message || '';
    if (msg.includes('Could not establish connection') || msg.includes('Receiving end does not exist')) {
      return { 
        success: false, 
        error: 'Le script d\'extraction n\'est pas chargé sur cette page. Rechargez la page et réessayez.',
        code: 'CONTENT_SCRIPT_NOT_LOADED'
      };
    }
    return { success: false, error: msg, code: 'QUICK_IMPORT_ERROR' };
  }
}

// ============================================
// Pricing Rules
// ============================================
function applyPricingRules(product, settings) {
  const margin = settings.priceMargin || 30;
  const basePrice = parseFloat(product.price) || 0;
  
  let calculatedPrice = basePrice * (1 + margin / 100);

  // Apply rounding rule
  switch (settings.roundingRule) {
    case 'ceil_99':
      calculatedPrice = Math.ceil(calculatedPrice) - 0.01;
      break;
    case 'ceil':
      calculatedPrice = Math.ceil(calculatedPrice);
      break;
    case 'round':
      calculatedPrice = Math.round(calculatedPrice * 100) / 100;
      break;
    case 'floor':
      calculatedPrice = Math.floor(calculatedPrice);
      break;
  }

  return {
    ...product,
    cost_price: basePrice,
    price: calculatedPrice,
    margin_percent: margin,
    imported_at: new Date().toISOString(),
    source_platform: product.platform || 'unknown',
    source_url: product.url
  };
}

// ============================================
// Settings
// ============================================
async function saveSettings(settings) {
  await StorageManager.set('shopopti_settings', settings);
  return { success: true };
}

async function syncSettingsWithServer() {
  const session = await StorageManager.getSession();
  if (!session?.access_token) {
    return { success: false, error: 'Non authentifié' };
  }

  try {
    const localSettings = await StorageManager.getSettings();
    const result = await ShopOptiAPI.syncSettings(localSettings, session.access_token);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// Product Detection
// ============================================
async function handleProductDetected(productData, tab) {
  // Update badge to show product is available for import
  if (tab?.id) {
    chrome.action.setBadgeText({ text: '1', tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#10B981', tabId: tab.id });
  }

  // Store for quick access
  await StorageManager.set('current_product', {
    ...productData,
    detected_at: Date.now(),
    tab_id: tab?.id
  });

  return { success: true };
}

// ============================================
// Context Menu
// ============================================
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'shopopti-import',
    title: 'Importer avec ShopOpti+',
    contexts: ['page', 'link']
  });

  chrome.contextMenus.create({
    id: 'shopopti-analyze',
    title: 'Analyser ce produit',
    contexts: ['page', 'link']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'shopopti-import') {
    const response = await quickImport(tab?.id);
    console.log('Context menu import result:', response);
  }
});

// ============================================
// Keyboard Shortcuts
// ============================================
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'quick_import') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      const response = await quickImport(tab.id);
      console.log('Quick import result:', response);
    }
  }
});

// ============================================
// External Messages (from SaaS)
// ============================================
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  // Verify sender is our SaaS
  const allowedOrigins = [
    'https://drop-craft-ai.lovable.app',
    /https:\/\/.*-preview--.*\.lovable\.app/
  ];

  const isAllowed = allowedOrigins.some(origin => {
    if (typeof origin === 'string') return sender.origin === origin;
    return origin.test(sender.origin);
  });

  if (!isAllowed) {
    sendResponse({ success: false, error: 'Unauthorized origin' });
    return;
  }

  handleMessage(message, sender).then(sendResponse);
  return true;
});

console.log('ShopOpti+ Pro Background Service Worker v5.9.0 loaded');
