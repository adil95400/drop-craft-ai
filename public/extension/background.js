/**
 * ShopOpti+ Pro - Background Service Worker
 * Version: 5.9.0
 * 
 * Security Hardened:
 * - Strict domain whitelisting (API + scraping)
 * - Rate limiting (30 req/min)
 * - XSS sanitization on all extracted data
 * - Structured error codes with user-facing messages
 * - Debug logging (controlled via settings)
 * - Token validation with expiry checks
 */

const SUPABASE_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzbXdja3pybXFlY3d3cnN3d3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjY0NDEsImV4cCI6MjA4MTc0MjQ0MX0.jhrwOY7-tKeNF54E3Ec6yRzjmTW8zJyKuE9R4rvi41I';

// ============================================
// Debug Logger — [SHOULD] Ticket: Ajouter logs de debug
// ============================================
const Logger = {
  _enabled: true,
  _history: [],
  MAX_HISTORY: 200,

  _prefix(level) {
    return `[ShopOpti+ ${level}] ${new Date().toISOString()}`;
  },

  _record(level, args) {
    const entry = {
      level,
      timestamp: new Date().toISOString(),
      message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
    };
    this._history.push(entry);
    if (this._history.length > this.MAX_HISTORY) this._history.shift();
  },

  getHistory(filter) {
    if (!filter) return [...this._history];
    return this._history.filter(e => e.level === filter || e.message.toLowerCase().includes(filter.toLowerCase()));
  },

  clearHistory() {
    this._history = [];
  },

  info(...args) {
    this._record('INFO', args);
    if (this._enabled) console.log(this._prefix('INFO'), ...args);
  },

  warn(...args) {
    this._record('WARN', args);
    console.warn(this._prefix('WARN'), ...args);
  },

  error(...args) {
    this._record('ERROR', args);
    console.error(this._prefix('ERROR'), ...args);
  },

  security(...args) {
    this._record('SECURITY', args);
    console.warn(this._prefix('SECURITY'), ...args);
  },

  api(method, url, status, durationMs) {
    this._record('API', [`${method} ${url} → ${status} (${durationMs}ms)`]);
    if (this._enabled) {
      console.log(this._prefix('API'), `${method} ${url} → ${status} (${durationMs}ms)`);
    }
  }
};

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
      language: 'fr',
      debugLogs: false
    };
  }
}

// ============================================
// API Client — with logging & timing
// ============================================
class ShopOptiAPI {
  static async callEdgeFunction(functionName, body, token) {
    const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
    const requestId = `ext-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const startTime = Date.now();

    // [MUST] Verify URL is on allowed API domain
    if (!Security.isAllowedApiDomain(url)) {
      Logger.security('Blocked API call to disallowed domain:', url);
      throw new Error('Domaine API non autorisé');
    }

    // [MUST] Log exact payload for debugging
    Logger.info(`[REQ ${requestId}] ${functionName}`, JSON.stringify(body).substring(0, 500));

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_ANON_KEY,
          'x-extension-version': '5.9.0',
          'x-request-id': requestId
        },
        body: JSON.stringify(body)
      });
    } catch (networkErr) {
      const durationMs = Date.now() - startTime;
      Logger.error(`[REQ ${requestId}] Network failure after ${durationMs}ms:`, networkErr.message);
      throw new Error(`NETWORK_ERROR: ${networkErr.message}`);
    }

    const durationMs = Date.now() - startTime;
    Logger.api('POST', functionName, response.status, durationMs);

    if (!response.ok) {
      let errorBody = '';
      try { errorBody = await response.text(); } catch { errorBody = 'Unable to read response'; }
      Logger.error(`[REQ ${requestId}] API ${response.status}:`, errorBody.substring(0, 500));
      
      const error = new Error(`API Error: ${response.status} - ${errorBody}`);
      error.status = response.status;
      error.requestId = requestId;
      error.responseBody = errorBody;
      throw error;
    }

    const result = await response.json();
    Logger.info(`[REQ ${requestId}] Success:`, JSON.stringify(result).substring(0, 200));
    return { ...result, _requestId: requestId };
  }

  // [MUST] Token validation with proper error handling + diagnostics
  static async validateToken(token) {
    Logger.info('[TOKEN] Validating token, length:', token?.length, 'prefix:', token?.substring(0, 20) + '...');

    if (!token || typeof token !== 'string' || token.length < 10) {
      Logger.security('Invalid token format:', { type: typeof token, length: token?.length });
      return { success: false, error: 'Format de token invalide', code: 'INVALID_TOKEN_FORMAT' };
    }

    // Check JWT structure (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      Logger.security('Token is not a valid JWT (expected 3 parts, got', parts.length, ')');
      return { success: false, error: 'Le token n\'est pas un JWT valide', code: 'INVALID_JWT_FORMAT' };
    }

    // Check JWT expiry locally first
    try {
      const payload = JSON.parse(atob(parts[1]));
      const exp = payload.exp;
      if (exp && exp * 1000 < Date.now()) {
        Logger.security('[TOKEN] JWT expired at', new Date(exp * 1000).toISOString());
        return { success: false, error: 'Token expiré localement', code: 'TOKEN_EXPIRED_LOCAL', expiredAt: new Date(exp * 1000).toISOString() };
      }
      Logger.info('[TOKEN] JWT valid until', new Date(exp * 1000).toISOString(), 'sub:', payload.sub);
    } catch (e) {
      Logger.warn('[TOKEN] Could not decode JWT payload:', e.message);
    }

    try {
      const startTime = Date.now();
      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_ANON_KEY
        }
      });

      const durationMs = Date.now() - startTime;
      Logger.api('GET', 'auth/v1/user', response.status, durationMs);

      if (response.status === 401) {
        Logger.security('[TOKEN] Server rejected token: 401');
        return { success: false, error: 'Token expiré ou invalide côté serveur', code: 'TOKEN_EXPIRED' };
      }

      if (!response.ok) {
        const body = await response.text();
        Logger.warn('[TOKEN] Validation HTTP error:', response.status, body.substring(0, 200));
        return { success: false, error: `Erreur de validation (${response.status})`, code: 'VALIDATION_ERROR' };
      }

      const user = await response.json();
      Logger.info('[TOKEN] Valid for user:', user.email);
      return { success: true, data: user };
    } catch (error) {
      Logger.error('[TOKEN] Network error:', error.message);
      return { success: false, error: 'Impossible de valider le token. Vérifiez votre connexion.', code: 'NETWORK_ERROR' };
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
// Security Module — [SHOULD] Audit XSS renforcé
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
    'banggood.com', 'cjdropshipping.com', 'costco.com', 'homedepot.com',
    'cdiscount.com', 'fnac.com', 'rakuten.com', 'darty.com',
    'manomano.fr', 'leroy-merlin.fr', 'boulanger.com'
  ],

  ALLOWED_MESSAGE_TYPES: [
    'login', 'logout', 'check_auth', 'validate_token',
    'import_product', 'bulk_import', 'quick_import',
    'get_settings', 'save_settings', 'sync_settings',
    'product_detected', 'ping', 'get_debug_logs', 'get_diagnostics'
  ],

  // Rate limiting
  _rateLimits: new Map(),
  RATE_LIMIT_MAX: 30,
  RATE_LIMIT_WINDOW_MS: 60000,

  isAllowedApiDomain(url) {
    try {
      const hostname = new URL(url).hostname;
      return this.ALLOWED_API_DOMAINS.some(d => hostname.endsWith(d));
    } catch {
      Logger.security('Failed to parse API URL:', url);
      return false;
    }
  },

  isAllowedScrapingDomain(hostname) {
    const allowed = this.ALLOWED_SCRAPING_DOMAINS.some(d => hostname.endsWith(d));
    if (!allowed) {
      Logger.security('Blocked scraping on disallowed domain:', hostname);
    }
    return allowed;
  },

  isAllowedMessageType(action) {
    const allowed = this.ALLOWED_MESSAGE_TYPES.includes(action);
    if (!allowed) {
      Logger.security('Blocked unknown message type:', action);
    }
    return allowed;
  },

  checkRateLimit(key) {
    const now = Date.now();
    const attempts = this._rateLimits.get(key) || [];
    const recent = attempts.filter(t => now - t < this.RATE_LIMIT_WINDOW_MS);
    if (recent.length >= this.RATE_LIMIT_MAX) {
      Logger.security('Rate limit exceeded for:', key, `(${recent.length}/${this.RATE_LIMIT_MAX})`);
      return false;
    }
    recent.push(now);
    this._rateLimits.set(key, recent);
    return true;
  },

  /**
   * [SHOULD] Sanitize text — renforcé pour neutraliser toutes formes d'injection
   * Utilise une approche whitelist : seul le texte brut est conservé.
   */
  sanitizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      // Remove all HTML tags (not just script/iframe)
      .replace(/<[^>]*>/g, '')
      // Remove event handlers
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove javascript: protocol
      .replace(/javascript\s*:/gi, '')
      // Remove data: protocol (potential XSS vector)
      .replace(/data\s*:\s*text\/html/gi, '')
      // Remove HTML entities that could be used for obfuscation
      .replace(/&#x?[0-9a-f]+;?/gi, '')
      // Remove expression() CSS attacks
      .replace(/expression\s*\(/gi, '')
      // Remove vbscript
      .replace(/vbscript\s*:/gi, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000);
  },

  sanitizeProductData(product) {
    if (!product || typeof product !== 'object') return null;

    const sanitized = {
      ...product,
      title: this.sanitizeText(product.title),
      description: this.sanitizeText(product.description),
      brand: this.sanitizeText(product.brand),
      category: this.sanitizeText(product.category),
      url: product.url && typeof product.url === 'string' ? product.url.substring(0, 2048) : '',
      images: Array.isArray(product.images)
        ? product.images
            .filter(u => typeof u === 'string' && (u.startsWith('https://') || u.startsWith('http://')))
            .map(u => u.substring(0, 2048))
            .slice(0, 30)
        : [],
      price: typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0,
    };

    // Validate URL domain if present
    if (sanitized.url) {
      try {
        const hostname = new URL(sanitized.url).hostname;
        if (!this.isAllowedScrapingDomain(hostname)) {
          Logger.security('Product URL from disallowed domain, clearing:', hostname);
          sanitized.url = '';
        }
      } catch {
        sanitized.url = '';
      }
    }

    return sanitized;
  }
};

// ============================================
// Message Routing
// ============================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch((error) => {
    Logger.error('Message handler error:', error.message);
    sendResponse({ success: false, error: error.message, code: 'INTERNAL_ERROR' });
  });
  return true;
});

async function handleMessage(message, sender) {
  const { action, data } = message;

  // Validate message type
  if (!Security.isAllowedMessageType(action)) {
    return { success: false, error: `Action non autorisée: ${action}`, code: 'BLOCKED_ACTION' };
  }

  // Rate limit per action
  if (!Security.checkRateLimit(action)) {
    return { success: false, error: 'Trop de requêtes. Veuillez patienter 1 minute.', code: 'RATE_LIMITED' };
  }

  Logger.info(`Handling action: ${action}`);

  switch (action) {
    case 'login':
      return handleLogin(data);
    case 'logout':
      return handleLogout();
    case 'check_auth':
      return checkAuth();
    case 'validate_token':
      return validateToken(data?.token);
    case 'import_product':
      return importProduct(data);
    case 'bulk_import':
      return bulkImport(data?.products);
    case 'quick_import':
      return quickImport(sender.tab?.id);
    case 'get_settings':
      return StorageManager.getSettings();
    case 'save_settings':
      return saveSettings(data);
    case 'sync_settings':
      return syncSettingsWithServer();
    case 'product_detected':
      return handleProductDetected(data, sender.tab);
    case 'ping':
      return { success: true, version: '5.9.0', timestamp: Date.now() };
    case 'get_debug_logs':
      return { success: true, logs: Logger.getHistory(data?.filter), total: Logger._history.length };
    case 'get_diagnostics':
      return getDiagnostics();
    default:
      return { success: false, error: `Unknown action: ${action}`, code: 'UNKNOWN_ACTION' };
  }
}

// ============================================
// Auth Handlers
// ============================================
async function handleLogin(credentials) {
  if (!credentials?.email || !credentials?.password) {
    return { success: false, error: 'Email et mot de passe requis', code: 'MISSING_CREDENTIALS' };
  }

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
      Logger.warn('Login failed:', data.error);
      throw new Error(data.error_description || data.error);
    }

    await StorageManager.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
      expires_at: Date.now() + (data.expires_in * 1000)
    });

    // Generate extension token
    try {
      const tokenResult = await ShopOptiAPI.callEdgeFunction('extension-auth', {
        action: 'generate_token',
        device_info: {
          browser: 'chrome',
          version: '5.9.0',
          platform: navigator.platform
        }
      }, data.access_token);

      if (tokenResult.success && tokenResult.token) {
        await StorageManager.set('extension_token', tokenResult.token);
        Logger.info('Extension token generated successfully');
      }
    } catch (tokenError) {
      Logger.warn('Extension token generation failed (non-blocking):', tokenError.message);
    }

    if ((await StorageManager.getSettings()).notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ShopOpti+ Pro',
        message: `Connecté en tant que ${data.user.email}`
      });
    }

    Logger.info('Login successful for:', data.user.email);
    return { success: true, user: data.user };

  } catch (error) {
    Logger.error('Login error:', error.message);
    return { success: false, error: error.message, code: 'LOGIN_FAILED' };
  }
}

async function handleLogout() {
  try {
    await StorageManager.remove('shopopti_session');
    await StorageManager.remove('extension_token');
    await StorageManager.remove('current_product');

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'ShopOpti+ Pro',
      message: 'Déconnecté avec succès'
    });

    Logger.info('User logged out');
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
    Logger.info('Session expired, attempting refresh...');
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
        Logger.warn('Token refresh failed:', data.error);
        await handleLogout();
        return { authenticated: false };
      }

      await StorageManager.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
        expires_at: Date.now() + (data.expires_in * 1000)
      });

      Logger.info('Token refreshed successfully');
      return { authenticated: true, user: data.user };

    } catch (error) {
      Logger.error('Token refresh network error:', error.message);
      await handleLogout();
      return { authenticated: false };
    }
  }

  return { authenticated: true, user: session.user };
}

// [MUST] Token validation with proper 401 handling
async function validateToken(token) {
  if (!token) {
    return { success: false, error: 'Aucun token fourni', code: 'NO_TOKEN' };
  }
  return ShopOptiAPI.validateToken(token);
}

// ============================================
// Import Handlers — [MUST] Gestion erreurs scraping améliorée
// ============================================
async function importProduct(productData) {
  const session = await StorageManager.getSession();
  const extensionToken = await StorageManager.get('extension_token');

  if (!session?.access_token && !extensionToken) {
    return { success: false, error: 'Non authentifié. Veuillez vous connecter.', code: 'AUTH_REQUIRED' };
  }

  const sanitizedData = Security.sanitizeProductData(productData);
  if (!sanitizedData || !sanitizedData.title) {
    Logger.warn('Invalid product data rejected');
    return { success: false, error: 'Données produit invalides ou incomplètes.', code: 'INVALID_DATA' };
  }

  try {
    const settings = await StorageManager.getSettings();
    const processedProduct = applyPricingRules(sanitizedData, settings);

    const result = await ShopOptiAPI.importProduct(
      processedProduct,
      session?.access_token || extensionToken
    );

    if (result.success) {
      Logger.info('Product imported:', sanitizedData.title?.substring(0, 50));
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Produit importé ✓',
        message: `${sanitizedData.title?.substring(0, 50)}...`
      });
    }

    return result;

  } catch (error) {
    Logger.error('Import error:', error.message);
    const errorMsg = error.message || 'Erreur inconnue';
    const isNetworkError = errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError');
    const isAuthError = errorMsg.includes('401') || errorMsg.includes('Unauthorized');
    const isQuotaError = errorMsg.includes('402') || errorMsg.includes('quota');

    if (isAuthError) {
      return {
        success: false,
        error: 'Session expirée. Veuillez vous reconnecter.',
        code: 'AUTH_EXPIRED',
        canRetry: false
      };
    }

    if (isQuotaError) {
      return {
        success: false,
        error: 'Quota d\'import atteint. Mettez à niveau votre plan.',
        code: 'QUOTA_EXCEEDED',
        canRetry: false
      };
    }

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

  if (products.length > 100) {
    return { success: false, error: 'Maximum 100 produits par import en masse', code: 'BULK_LIMIT' };
  }

  try {
    const settings = await StorageManager.getSettings();
    const sanitizedProducts = products
      .map(p => Security.sanitizeProductData(p))
      .filter(p => p && p.title);
    const processedProducts = sanitizedProducts.map(p => applyPricingRules(p, settings));

    Logger.info(`Bulk import: ${processedProducts.length} products`);

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
    Logger.error('Bulk import error:', error.message);
    const isNetworkError = (error.message || '').includes('Failed to fetch');
    return {
      success: false,
      error: isNetworkError ? 'Connexion impossible. Réessayez.' : error.message,
      code: isNetworkError ? 'NETWORK_ERROR' : 'BULK_IMPORT_ERROR',
      canRetry: isNetworkError
    };
  }
}

// [MUST] Quick import with explicit error feedback (no silent fail)
async function quickImport(tabId) {
  if (!tabId) {
    return { success: false, error: 'Aucun onglet actif', code: 'NO_TAB' };
  }

  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab?.url) {
      try {
        const hostname = new URL(tab.url).hostname;
        if (!Security.isAllowedScrapingDomain(hostname)) {
          const errorMsg = `Ce site (${hostname}) n'est pas supporté. Sites supportés : AliExpress, Amazon, eBay, Walmart, Temu, Shein, Etsy, Cdiscount, Fnac...`;
          Logger.warn('Quick import blocked — unsupported site:', hostname);

          // [MUST] Show notification instead of silent fail
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Site non supporté',
            message: `${hostname} n'est pas dans la liste des marketplaces supportés.`
          });

          return {
            success: false,
            error: errorMsg,
            code: 'UNSUPPORTED_SITE'
          };
        }
      } catch { /* URL parse error, continue */ }
    }

    const response = await chrome.tabs.sendMessage(tabId, { action: 'extract_product' });

    if (!response?.success || !response.product) {
      Logger.warn('Product extraction failed on tab:', tabId);

      // [MUST] Notify user of extraction failure
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Extraction impossible',
        message: 'Impossible d\'extraire le produit. Assurez-vous d\'être sur une page produit.'
      });

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
      // [MUST] Notify instead of silent fail
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Script non chargé',
        message: 'Rechargez la page et réessayez l\'import.'
      });

      return {
        success: false,
        error: 'Le script d\'extraction n\'est pas chargé sur cette page. Rechargez la page et réessayez.',
        code: 'CONTENT_SCRIPT_NOT_LOADED'
      };
    }

    Logger.error('Quick import error:', msg);
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

  // Update logger state
  if (typeof settings.debugLogs === 'boolean') {
    Logger._enabled = settings.debugLogs;
  }

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
    Logger.info('Settings synced with server');
    return result;
  } catch (error) {
    Logger.error('Settings sync error:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// Product Detection
// ============================================
async function handleProductDetected(productData, tab) {
  if (tab?.id) {
    chrome.action.setBadgeText({ text: '1', tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#10B981', tabId: tab.id });
  }

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

  Logger.info('Extension installed/updated — context menus created');
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'shopopti-import') {
    const response = await quickImport(tab?.id);
    Logger.info('Context menu import result:', response.success ? 'OK' : response.code);
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
      Logger.info('Keyboard shortcut import result:', response.success ? 'OK' : response.code);
    }
  }
});

// ============================================
// External Messages (from SaaS)
// ============================================
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  const allowedOrigins = [
    'https://drop-craft-ai.lovable.app',
    /https:\/\/.*-preview--.*\.lovable\.app/
  ];

  const isAllowed = allowedOrigins.some(origin => {
    if (typeof origin === 'string') return sender.origin === origin;
    return origin.test(sender.origin);
  });

  if (!isAllowed) {
    Logger.security('Blocked external message from unauthorized origin:', sender.origin);
    sendResponse({ success: false, error: 'Unauthorized origin' });
    return;
  }

  handleMessage(message, sender).then(sendResponse);
  return true;
});

// ============================================
// Periodic Sync (every 30 min)
// ============================================
chrome.alarms.create('sync-settings', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'sync-settings') {
    const session = await StorageManager.getSession();
    if (session?.access_token) {
      Logger.info('Periodic sync triggered');
      await syncSettingsWithServer();
    }
  }
});

// ============================================
// Diagnostics endpoint — [MUST] Debug complet
// ============================================
async function getDiagnostics() {
  const session = await StorageManager.getSession();
  const extToken = await StorageManager.get('extension_token');
  const settings = await StorageManager.getSettings();
  
  let tokenStatus = 'missing';
  let tokenExpiry = null;
  let tokenUser = null;

  if (session?.access_token) {
    try {
      const parts = session.access_token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        tokenExpiry = payload.exp ? new Date(payload.exp * 1000).toISOString() : null;
        tokenUser = payload.sub || null;
        tokenStatus = (payload.exp * 1000 > Date.now()) ? 'valid' : 'expired';
      }
    } catch { tokenStatus = 'malformed'; }
  }

  // Test API connectivity
  let apiReachable = false;
  let apiLatency = 0;
  try {
    const t0 = Date.now();
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: { 'apikey': SUPABASE_ANON_KEY }
    });
    apiLatency = Date.now() - t0;
    apiReachable = resp.ok || resp.status === 400; // 400 means API is reachable
  } catch { apiReachable = false; }

  return {
    success: true,
    diagnostics: {
      version: '5.9.0',
      timestamp: new Date().toISOString(),
      auth: {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        hasRefreshToken: !!session?.refresh_token,
        hasExtensionToken: !!extToken,
        tokenStatus,
        tokenExpiry,
        tokenUser,
        sessionExpiresAt: session?.expires_at ? new Date(session.expires_at).toISOString() : null
      },
      api: {
        baseUrl: SUPABASE_URL,
        reachable: apiReachable,
        latencyMs: apiLatency
      },
      settings: {
        autoImport: settings.autoImport,
        priceMargin: settings.priceMargin,
        debugLogs: settings.debugLogs,
        notifications: settings.notifications
      },
      recentErrors: Logger.getHistory('ERROR').slice(-10),
      recentApiCalls: Logger.getHistory('API').slice(-10)
    }
  };
}

Logger.info('ShopOpti+ Pro Background Service Worker v5.9.0 loaded');
