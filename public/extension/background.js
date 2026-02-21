/**
 * ShopOpti+ Pro - Background Service Worker
 * Version: 7.0.0
 * 
 * Features:
 * - Import Preview Pro (preview before import)
 * - Instant Deduplication (check existing products)
 * - AI-Assisted Merge (merge duplicates)
 * - Dashboard Sync (refresh counters after import)
 * - Security: domain whitelisting, rate limiting, XSS sanitization
 * - Debug logging, token validation, retry with backoff
 */

const SUPABASE_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzbXdja3pybXFlY3d3cnN3d3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjY0NDEsImV4cCI6MjA4MTc0MjQ0MX0.jhrwOY7-tKeNF54E3Ec6yRzjmTW8zJyKuE9R4rvi41I';

// ============================================
// Debug Logger
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

  clearHistory() { this._history = []; },

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
    if (this._enabled) console.log(this._prefix('API'), `${method} ${url} → ${status} (${durationMs}ms)`);
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
  static async getSession() { return this.get('shopopti_session'); }
  static async setSession(session) { return this.set('shopopti_session', session); }
  static async getSettings() {
    const settings = await this.get('shopopti_settings');
    return settings || {
      autoImport: false, priceMargin: 30, roundingRule: 'ceil_99',
      defaultSupplier: 'aliexpress', notifications: true, language: 'fr', debugLogs: false
    };
  }
}

// ============================================
// API Client — with retry & logging
// ============================================
class ShopOptiAPI {
  static async withRetry(fn, { maxRetries = 3, baseDelayMs = 1000, label = 'API' } = {}) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try { return await fn(attempt); }
      catch (error) {
        lastError = error;
        const status = error.status || 0;
        const isRetryable = !status || status >= 500 || error.message?.includes('NETWORK_ERROR');
        if (!isRetryable || attempt === maxRetries) {
          Logger.error(`[${label}] Failed after ${attempt} attempt(s):`, error.message);
          throw error;
        }
        const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500;
        Logger.warn(`[${label}] Attempt ${attempt}/${maxRetries} failed, retrying in ${Math.round(delay)}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    throw lastError;
  }

  static async callEdgeFunction(functionName, body, token, { retry = true } = {}) {
    const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
    const requestId = `ext-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const startTime = Date.now();

    if (!Security.isAllowedApiDomain(url)) {
      Logger.security('Blocked API call to disallowed domain:', url);
      throw new Error('Domaine API non autorisé');
    }

    Logger.info(`[REQ ${requestId}] ${functionName}`, JSON.stringify(body).substring(0, 500));

    const doFetch = async (attempt) => {
      if (attempt > 1) Logger.info(`[REQ ${requestId}] Retry attempt ${attempt}`);
      let response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_ANON_KEY,
            'x-extension-version': '7.0.0',
            'x-request-id': requestId,
            'x-retry-attempt': String(attempt)
          },
          body: JSON.stringify(body)
        });
      } catch (networkErr) {
        const durationMs = Date.now() - startTime;
        Logger.error(`[REQ ${requestId}] Network failure after ${durationMs}ms:`, networkErr.message);
        const err = new Error(`NETWORK_ERROR: ${networkErr.message}`);
        err.status = 0;
        throw err;
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

      return response;
    };

    const response = retry
      ? await this.withRetry(doFetch, { maxRetries: 3, label: `REQ ${requestId}` })
      : await doFetch(1);

    const result = await response.json();
    Logger.info(`[REQ ${requestId}] Success:`, JSON.stringify(result).substring(0, 200));
    return { ...result, _requestId: requestId };
  }

  static async validateToken(token) {
    Logger.info('[TOKEN] Validating token, length:', token?.length);
    if (!token || typeof token !== 'string' || token.length < 10) {
      return { success: false, error: 'Format de token invalide', code: 'INVALID_TOKEN_FORMAT' };
    }
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { success: false, error: 'Le token n\'est pas un JWT valide', code: 'INVALID_JWT_FORMAT' };
    }
    try {
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return { success: false, error: 'Token expiré localement', code: 'TOKEN_EXPIRED_LOCAL' };
      }
    } catch (e) {
      Logger.warn('[TOKEN] Could not decode JWT payload:', e.message);
    }
    try {
      const startTime = Date.now();
      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY }
      });
      const durationMs = Date.now() - startTime;
      Logger.api('GET', 'auth/v1/user', response.status, durationMs);

      if (response.status === 401) return { success: false, error: 'Token expiré côté serveur', code: 'TOKEN_EXPIRED' };
      if (!response.ok) return { success: false, error: `Erreur de validation (${response.status})`, code: 'VALIDATION_ERROR' };

      const user = await response.json();
      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: 'Impossible de valider le token.', code: 'NETWORK_ERROR' };
    }
  }

  static async importProduct(productData, token) {
    return this.callEdgeFunction('extension-realtime-import', {
      action: 'import_single', product: productData
    }, token);
  }

  static async bulkImport(products, token) {
    return this.callEdgeFunction('extension-realtime-import', {
      action: 'import_bulk', products
    }, token);
  }

  static async syncSettings(settings, token) {
    return this.callEdgeFunction('extension-realtime-import', {
      action: 'sync_settings', settings
    }, token);
  }

  static async getRemoteSettings(token) {
    return this.callEdgeFunction('extension-realtime-import', {
      action: 'get_settings'
    }, token);
  }

  // P3: Check for duplicates before import
  static async checkDuplicate(productData, token) {
    return this.callEdgeFunction('extension-realtime-import', {
      action: 'check_duplicate',
      product: {
        title: productData.title,
        url: productData.url,
        sku: productData.sku,
        platform: productData.platform
      }
    }, token, { retry: false });
  }

  // P3: AI Merge for duplicates
  static async aiMerge(existingProductId, newProductData, token) {
    return this.callEdgeFunction('extension-realtime-import', {
      action: 'ai_merge',
      existing_product_id: existingProductId,
      new_product: newProductData
    }, token);
  }

  // P3: Notify dashboard after import
  static async notifyDashboard(event, data, token) {
    return this.callEdgeFunction('extension-realtime-import', {
      action: 'dashboard_sync',
      event,
      data
    }, token, { retry: false });
  }
}

// ============================================
// Security Module
// ============================================
const Security = {
  ALLOWED_API_DOMAINS: ['jsmwckzrmqecwwrswwrz.supabase.co', 'shopopti.io'],
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
    'product_detected', 'ping', 'get_debug_logs', 'get_diagnostics',
    'get_import_logs', 'clear_import_logs',
    'preview_product', 'check_duplicate', 'ai_merge', 'confirm_import',
    'get_capabilities', 'import_reviews'
  ],

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
    if (recent.length >= this.RATE_LIMIT_MAX) return false;
    recent.push(now);
    this._rateLimits.set(key, recent);
    return true;
  },

  sanitizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/data\s*:\s*text\/html/gi, '')
      .replace(/&#x?[0-9a-f]+;?/gi, '')
      .replace(/expression\s*\(/gi, '')
      .replace(/vbscript\s*:/gi, '')
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
      sku: this.sanitizeText(product.sku || ''),
      url: product.url && typeof product.url === 'string' ? product.url.substring(0, 2048) : '',
      images: Array.isArray(product.images)
        ? product.images
            .filter(u => typeof u === 'string' && (u.startsWith('https://') || u.startsWith('http://')))
            .map(u => u.substring(0, 2048))
            .slice(0, 30)
        : [],
      variants: Array.isArray(product.variants) ? product.variants.slice(0, 50) : [],
      price: typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0,
    };

    if (sanitized.url) {
      try {
        const hostname = new URL(sanitized.url).hostname;
        if (!this.isAllowedScrapingDomain(hostname)) sanitized.url = '';
      } catch { sanitized.url = ''; }
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

  if (!Security.isAllowedMessageType(action)) {
    return { success: false, error: `Action non autorisée: ${action}`, code: 'BLOCKED_ACTION' };
  }
  if (!Security.checkRateLimit(action)) {
    return { success: false, error: 'Trop de requêtes. Veuillez patienter.', code: 'RATE_LIMITED' };
  }

  Logger.info(`Handling action: ${action}`);

  switch (action) {
    case 'login': return handleLogin(data);
    case 'logout': return handleLogout();
    case 'check_auth': return checkAuth();
    case 'validate_token': return validateToken(data?.token);
    case 'import_product': return importProduct(data);
    case 'bulk_import': return bulkImport(data?.products);
    case 'quick_import': return quickImport(sender.tab?.id);
    case 'get_settings': return StorageManager.getSettings();
    case 'save_settings': return saveSettings(data);
    case 'sync_settings': return syncSettingsWithServer();
    case 'product_detected': return handleProductDetected(data, sender.tab);
    case 'ping': return { success: true, version: '7.0.0', timestamp: Date.now() };
    case 'get_debug_logs': return { success: true, logs: Logger.getHistory(data?.filter), total: Logger._history.length };
    case 'get_diagnostics': return getDiagnostics();
    case 'get_import_logs': return getImportLogs();
    case 'clear_import_logs': return clearImportLogs();
    // P3: New handlers
    case 'preview_product': return previewProduct(sender.tab?.id);
    case 'check_duplicate': return checkDuplicate(data);
    case 'ai_merge': return aiMergeProduct(data);
    case 'confirm_import': return confirmImport(data);
    case 'import_reviews': return importReviews(data);
    default:
      return { success: false, error: `Unknown action: ${action}`, code: 'UNKNOWN_ACTION' };
  }
}

// ============================================
// P3: Preview Product — Extract & return full preview data
// ============================================
async function previewProduct(tabId) {
  if (!tabId) return { success: false, error: 'Aucun onglet actif', code: 'NO_TAB' };

  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab?.url) {
      try {
        const hostname = new URL(tab.url).hostname;
        if (!Security.isAllowedScrapingDomain(hostname)) {
          return { success: false, error: `Site non supporté: ${hostname}`, code: 'UNSUPPORTED_SITE' };
        }
      } catch {}
    }

    // Extract with retry
    let response = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await chrome.tabs.sendMessage(tabId, { action: 'extract_product' });
        if (response?.success && response.product) break;
        response = null;
        if (attempt < 3) await new Promise(r => setTimeout(r, 800 * attempt));
      } catch (err) {
        Logger.warn(`[PREVIEW] Extraction attempt ${attempt}/3 error:`, err.message);
        if (attempt < 3) await new Promise(r => setTimeout(r, 800 * attempt));
      }
    }

    if (!response?.success || !response.product) {
      return { success: false, error: 'Impossible d\'extraire le produit.', code: 'EXTRACTION_FAILED' };
    }

    const sanitized = Security.sanitizeProductData(response.product);
    if (!sanitized || !sanitized.title) {
      return { success: false, error: 'Données produit invalides.', code: 'INVALID_DATA' };
    }

    // Apply pricing rules for preview
    const settings = await StorageManager.getSettings();
    const processed = applyPricingRules(sanitized, settings);

    // Store for later confirm_import
    await StorageManager.set('preview_product', processed);

    Logger.info('[PREVIEW] Product extracted for preview:', sanitized.title?.substring(0, 50));

    return {
      success: true,
      product: {
        title: processed.title,
        description: processed.description || '',
        images: processed.images || [],
        price: processed.price,
        cost_price: processed.cost_price,
        margin_percent: processed.margin_percent,
        platform: processed.platform || processed.source_platform,
        url: processed.url || processed.source_url,
        sku: processed.sku || '',
        brand: processed.brand || '',
        category: processed.category || '',
        variants: processed.variants || [],
        rating: processed.rating || null,
        reviews_count: processed.reviews_count || null
      }
    };
  } catch (error) {
    Logger.error('[PREVIEW] Error:', error.message);
    return { success: false, error: error.message, code: 'PREVIEW_ERROR' };
  }
}

// ============================================
// Import Reviews — Send extracted reviews to backend
// ============================================
async function importReviews(data) {
  const session = await StorageManager.getSession();
  const token = session?.access_token || await StorageManager.get('extension_token');

  if (!token) return { success: false, error: 'Non authentifié', code: 'AUTH_REQUIRED' };
  if (!data?.reviews || !Array.isArray(data.reviews) || data.reviews.length === 0) {
    return { success: false, error: 'Aucun avis à importer', code: 'INVALID_DATA' };
  }

  try {
    const startTime = Date.now();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/extension-review-importer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'x-extension-token': token,
        ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
      },
      body: JSON.stringify({
        source: 'extension',
        platform: data.platform || 'unknown',
        product_id: data.product_id || null,
        reviews: data.reviews.slice(0, 200)
      })
    });

    const result = await response.json();
    Logger.api('POST', 'extension-review-importer', response.status, Date.now() - startTime);

    if (!response.ok || !result.success) {
      Logger.error('[REVIEWS] Import failed:', result.error);
      return { success: false, error: result.error || 'Erreur serveur', code: 'IMPORT_FAILED' };
    }

    Logger.info(`[REVIEWS] Imported ${result.imported} reviews from ${data.platform}`);
    return { success: true, imported: result.imported, total: data.reviews.length };
  } catch (error) {
    Logger.error('[REVIEWS] Network error:', error.message);
    return { success: false, error: error.message, code: 'NETWORK_ERROR' };
  }
}

// ============================================
// P3: Check Duplicate
// ============================================
async function checkDuplicate(productData) {
  const session = await StorageManager.getSession();
  const token = session?.access_token || await StorageManager.get('extension_token');

  if (!token) return { success: false, error: 'Non authentifié', code: 'AUTH_REQUIRED' };
  if (!productData?.title) return { success: false, error: 'Titre requis', code: 'INVALID_DATA' };

  try {
    const result = await ShopOptiAPI.checkDuplicate(productData, token);
    Logger.info('[DEDUP] Check result:', result.status || 'new');
    return result;
  } catch (error) {
    // If edge function doesn't support dedup yet, do local check
    Logger.warn('[DEDUP] Backend check failed, falling back to local:', error.message);
    return localDuplicateCheck(productData);
  }
}

// Local fallback: check import_logs for recent imports with similar title/URL
async function localDuplicateCheck(productData) {
  const logs = (await StorageManager.get('import_logs')) || [];
  const normalizedTitle = (productData.title || '').toLowerCase().trim();
  const normalizedUrl = (productData.url || '').split('?')[0].toLowerCase();

  for (const log of logs) {
    if (log.status !== 'success') continue;
    const logTitle = (log.title || '').toLowerCase().trim();
    const logUrl = (log.url || '').split('?')[0].toLowerCase();

    // Exact URL match
    if (normalizedUrl && logUrl && normalizedUrl === logUrl) {
      return { success: true, status: 'duplicate', match_type: 'url', existing_title: log.title, imported_at: log.timestamp };
    }
    // Title similarity (>85% match)
    if (normalizedTitle && logTitle) {
      const similarity = titleSimilarity(normalizedTitle, logTitle);
      if (similarity > 0.85) {
        return { success: true, status: 'conflict', match_type: 'title', similarity: Math.round(similarity * 100), existing_title: log.title, imported_at: log.timestamp };
      }
    }
  }

  return { success: true, status: 'new' };
}

function titleSimilarity(a, b) {
  if (a === b) return 1;
  const wordsA = a.split(/\s+/);
  const wordsB = new Set(b.split(/\s+/));
  let matches = 0;
  for (const w of wordsA) { if (wordsB.has(w)) matches++; }
  return matches / Math.max(wordsA.length, wordsB.size);
}

// ============================================
// P3: AI Merge Product
// ============================================
async function aiMergeProduct(data) {
  const session = await StorageManager.getSession();
  const token = session?.access_token || await StorageManager.get('extension_token');

  if (!token) return { success: false, error: 'Non authentifié', code: 'AUTH_REQUIRED' };
  if (!data?.existing_product_id || !data?.new_product) {
    return { success: false, error: 'Données de merge incomplètes', code: 'INVALID_DATA' };
  }

  try {
    const result = await ShopOptiAPI.aiMerge(data.existing_product_id, data.new_product, token);
    Logger.info('[MERGE] AI merge result:', result.success ? 'OK' : result.error);

    if (result.success) {
      await recordImportLog({
        title: data.new_product.title?.substring(0, 80),
        platform: data.new_product.platform || 'unknown',
        status: 'merged',
        requestId: result._requestId || 'N/A',
        error: null,
        code: 'AI_MERGE'
      });

      // Sync dashboard
      await syncDashboardAfterImport('merge', result);
    }

    return result;
  } catch (error) {
    Logger.error('[MERGE] Error:', error.message);
    return { success: false, error: error.message, code: 'MERGE_ERROR' };
  }
}

// ============================================
// P3: Confirm Import (from preview)
// ============================================
async function confirmImport(data) {
  // data.product contains potentially edited product from preview
  const productData = data?.product || await StorageManager.get('preview_product');

  if (!productData) {
    return { success: false, error: 'Aucun produit en preview', code: 'NO_PREVIEW' };
  }

  // Run import with the (possibly edited) data
  const result = await importProduct(productData);

  // After successful import, sync dashboard
  if (result.success) {
    await syncDashboardAfterImport('import', result);
  }

  // Clear preview
  await StorageManager.remove('preview_product');

  return result;
}

// ============================================
// P3: Dashboard Sync
// ============================================
async function syncDashboardAfterImport(eventType, importResult) {
  const session = await StorageManager.getSession();
  const token = session?.access_token;
  if (!token) return;

  try {
    await ShopOptiAPI.notifyDashboard(eventType, {
      product_id: importResult?.product_id,
      timestamp: new Date().toISOString()
    }, token);
    Logger.info('[SYNC] Dashboard notified:', eventType);
  } catch (err) {
    // Non-blocking: dashboard sync failure shouldn't affect import
    Logger.warn('[SYNC] Dashboard notification failed:', err.message);
  }

  // Update local badge
  const stats = await chrome.storage.local.get(['import_count']);
  chrome.action.setBadgeText({ text: String((stats.import_count || 0)) });
  chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
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
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ email: credentials.email, password: credentials.password })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error_description || data.error);

    await StorageManager.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
      expires_at: Date.now() + (data.expires_in * 1000)
    });

    try {
      const tokenResult = await ShopOptiAPI.callEdgeFunction('extension-auth', {
        action: 'generate_token',
        device_info: { browser: 'chrome', version: '7.0.0', platform: navigator.platform }
      }, data.access_token);
      if (tokenResult.success && tokenResult.token) {
        await StorageManager.set('extension_token', tokenResult.token);
      }
    } catch (tokenError) {
      Logger.warn('Extension token generation failed (non-blocking):', tokenError.message);
    }

    if ((await StorageManager.getSettings()).notifications) {
      chrome.notifications.create({
        type: 'basic', iconUrl: 'icons/icon48.png',
        title: 'ShopOpti+ Pro', message: `Connecté en tant que ${data.user.email}`
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
    await StorageManager.remove('preview_product');
    chrome.notifications.create({
      type: 'basic', iconUrl: 'icons/icon48.png',
      title: 'ShopOpti+ Pro', message: 'Déconnecté avec succès'
    });
    Logger.info('User logged out');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function checkAuth() {
  const session = await StorageManager.getSession();
  if (!session) return { authenticated: false };

  if (session.expires_at && session.expires_at < Date.now()) {
    Logger.info('Session expired, attempting refresh...');
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({ refresh_token: session.refresh_token })
      });
      const data = await response.json();
      if (data.error) {
        await handleLogout();
        return { authenticated: false };
      }
      await StorageManager.setSession({
        access_token: data.access_token, refresh_token: data.refresh_token,
        user: data.user, expires_at: Date.now() + (data.expires_in * 1000)
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
  if (!token) return { success: false, error: 'Aucun token fourni', code: 'NO_TOKEN' };
  return ShopOptiAPI.validateToken(token);
}

// ============================================
// Import Handlers
// ============================================
async function importProduct(productData) {
  const session = await StorageManager.getSession();
  const extensionToken = await StorageManager.get('extension_token');

  if (!session?.access_token && !extensionToken) {
    return { success: false, error: 'Non authentifié.', code: 'AUTH_REQUIRED' };
  }

  const sanitizedData = Security.sanitizeProductData(productData);
  if (!sanitizedData || !sanitizedData.title) {
    return { success: false, error: 'Données produit invalides.', code: 'INVALID_DATA' };
  }

  try {
    const settings = await StorageManager.getSettings();
    const processedProduct = applyPricingRules(sanitizedData, settings);
    const result = await ShopOptiAPI.importProduct(processedProduct, session?.access_token || extensionToken);

    if (result.success) {
      Logger.info('Product imported:', sanitizedData.title?.substring(0, 50));
      chrome.notifications.create({
        type: 'basic', iconUrl: 'icons/icon48.png',
        title: 'Produit importé ✓', message: `${sanitizedData.title?.substring(0, 50)}...`
      });
    }

    await recordImportLog({
      title: sanitizedData.title?.substring(0, 80),
      url: sanitizedData.url || '',
      platform: sanitizedData.platform || 'unknown',
      status: result.success ? 'success' : 'error',
      requestId: result._requestId || 'N/A',
      error: result.success ? null : (result.error || 'Erreur inconnue'),
      code: result.code || null
    });

    return result;
  } catch (error) {
    Logger.error('Import error:', error.message);
    const errorMsg = error.message || 'Erreur inconnue';
    const isNetworkError = errorMsg.includes('NETWORK_ERROR') || errorMsg.includes('Failed to fetch');
    const isAuthError = errorMsg.includes('401');
    const isQuotaError = errorMsg.includes('402');

    let code = 'IMPORT_ERROR', userError = errorMsg, canRetry = false;
    if (isAuthError) { code = 'AUTH_EXPIRED'; userError = 'Session expirée.'; }
    else if (isQuotaError) { code = 'QUOTA_EXCEEDED'; userError = 'Quota atteint.'; }
    else if (isNetworkError) { code = 'NETWORK_ERROR'; userError = 'Connexion impossible.'; canRetry = true; }

    await recordImportLog({
      title: sanitizedData.title?.substring(0, 80),
      url: sanitizedData.url || '',
      platform: sanitizedData.platform || 'unknown',
      status: 'error', requestId: error.requestId || 'N/A',
      error: userError, code
    });

    return { success: false, error: userError, code, canRetry };
  }
}

async function bulkImport(products) {
  const session = await StorageManager.getSession();
  const extensionToken = await StorageManager.get('extension_token');
  if (!session?.access_token && !extensionToken) return { success: false, error: 'Non authentifié', code: 'AUTH_REQUIRED' };
  if (!Array.isArray(products) || products.length === 0) return { success: false, error: 'Aucun produit', code: 'INVALID_DATA' };
  if (products.length > 100) return { success: false, error: 'Maximum 100 produits', code: 'BULK_LIMIT' };

  try {
    const settings = await StorageManager.getSettings();
    const sanitizedProducts = products.map(p => Security.sanitizeProductData(p)).filter(p => p && p.title);
    const processedProducts = sanitizedProducts.map(p => applyPricingRules(p, settings));
    const result = await ShopOptiAPI.bulkImport(processedProducts, session?.access_token || extensionToken);

    if (result.success) {
      chrome.notifications.create({
        type: 'basic', iconUrl: 'icons/icon48.png',
        title: 'Import en masse ✓', message: `${result.imported || processedProducts.length} produits importés`
      });
      await syncDashboardAfterImport('bulk_import', result);
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message, code: 'BULK_IMPORT_ERROR', canRetry: (error.message || '').includes('fetch') };
  }
}

async function quickImport(tabId) {
  if (!tabId) return { success: false, error: 'Aucun onglet actif', code: 'NO_TAB' };
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab?.url) {
      try {
        const hostname = new URL(tab.url).hostname;
        if (!Security.isAllowedScrapingDomain(hostname)) {
          return { success: false, error: `Site non supporté: ${hostname}`, code: 'UNSUPPORTED_SITE' };
        }
      } catch {}
    }

    let response = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await chrome.tabs.sendMessage(tabId, { action: 'extract_product' });
        if (response?.success && response.product) break;
        response = null;
        if (attempt < 3) await new Promise(r => setTimeout(r, 800 * attempt));
      } catch (err) {
        if (attempt < 3) await new Promise(r => setTimeout(r, 800 * attempt));
      }
    }

    if (!response?.success || !response.product) {
      return { success: false, error: 'Extraction impossible.', code: 'EXTRACTION_FAILED' };
    }

    return importProduct(response.product);
  } catch (error) {
    const msg = error.message || '';
    if (msg.includes('Could not establish connection') || msg.includes('Receiving end does not exist')) {
      return { success: false, error: 'Rechargez la page et réessayez.', code: 'CONTENT_SCRIPT_NOT_LOADED' };
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

  switch (settings.roundingRule) {
    case 'ceil_99': calculatedPrice = Math.ceil(calculatedPrice) - 0.01; break;
    case 'ceil': calculatedPrice = Math.ceil(calculatedPrice); break;
    case 'round': calculatedPrice = Math.round(calculatedPrice * 100) / 100; break;
    case 'floor': calculatedPrice = Math.floor(calculatedPrice); break;
  }

  return {
    ...product, cost_price: basePrice, price: calculatedPrice,
    margin_percent: margin, imported_at: new Date().toISOString(),
    source_platform: product.platform || 'unknown', source_url: product.url
  };
}

// ============================================
// Settings
// ============================================
async function saveSettings(settings) {
  await StorageManager.set('shopopti_settings', settings);
  if (typeof settings.debugLogs === 'boolean') Logger._enabled = settings.debugLogs;
  return { success: true };
}

async function syncSettingsWithServer() {
  const session = await StorageManager.getSession();
  if (!session?.access_token) return { success: false, error: 'Non authentifié' };
  try {
    const localSettings = await StorageManager.getSettings();
    return await ShopOptiAPI.syncSettings(localSettings, session.access_token);
  } catch (error) {
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
    ...productData, detected_at: Date.now(), tab_id: tab?.id
  });
  return { success: true };
}

// ============================================
// Context Menu
// ============================================
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'shopopti-import', title: 'Importer avec ShopOpti+', contexts: ['page', 'link'] });
  chrome.contextMenus.create({ id: 'shopopti-analyze', title: 'Analyser ce produit', contexts: ['page', 'link'] });
  Logger.info('Extension installed/updated — v7.0.0');
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'shopopti-import') {
    const response = await quickImport(tab?.id);
    Logger.info('Context menu import:', response.success ? 'OK' : response.code);
  }
});

// ============================================
// Keyboard Shortcuts
// ============================================
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'quick_import') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) await quickImport(tab.id);
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
    Logger.security('Blocked external message from:', sender.origin);
    sendResponse({ success: false, error: 'Unauthorized origin' });
    return;
  }
  handleMessage(message, sender).then(sendResponse);
  return true;
});

// ============================================
// Periodic Sync
// ============================================
chrome.alarms.create('sync-settings', { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'sync-settings') {
    const session = await StorageManager.getSession();
    if (session?.access_token) await syncSettingsWithServer();
  }
});

// ============================================
// Diagnostics
// ============================================
async function getDiagnostics() {
  const session = await StorageManager.getSession();
  const extToken = await StorageManager.get('extension_token');
  const settings = await StorageManager.getSettings();

  let tokenStatus = 'missing', tokenExpiry = null, tokenUser = null;
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

  let apiReachable = false, apiLatency = 0;
  try {
    const t0 = Date.now();
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/`, { method: 'HEAD', headers: { 'apikey': SUPABASE_ANON_KEY } });
    apiLatency = Date.now() - t0;
    apiReachable = resp.ok || resp.status === 400;
  } catch { apiReachable = false; }

  return {
    success: true,
    diagnostics: {
      version: '7.0.0', timestamp: new Date().toISOString(),
      auth: {
        hasSession: !!session, hasAccessToken: !!session?.access_token,
        hasRefreshToken: !!session?.refresh_token, hasExtensionToken: !!extToken,
        tokenStatus, tokenExpiry, tokenUser,
        sessionExpiresAt: session?.expires_at ? new Date(session.expires_at).toISOString() : null
      },
      api: { baseUrl: SUPABASE_URL, reachable: apiReachable, latencyMs: apiLatency },
      settings: { autoImport: settings.autoImport, priceMargin: settings.priceMargin, debugLogs: settings.debugLogs, notifications: settings.notifications },
      recentErrors: Logger.getHistory('ERROR').slice(-10),
      recentApiCalls: Logger.getHistory('API').slice(-10)
    }
  };
}

// ============================================
// Import Log History
// ============================================
const MAX_IMPORT_LOGS = 50;

async function recordImportLog(entry) {
  const logs = (await StorageManager.get('import_logs')) || [];
  logs.unshift({ ...entry, timestamp: new Date().toISOString() });
  if (logs.length > MAX_IMPORT_LOGS) logs.length = MAX_IMPORT_LOGS;
  await StorageManager.set('import_logs', logs);
}

async function getImportLogs() {
  return { success: true, logs: (await StorageManager.get('import_logs')) || [] };
}

async function clearImportLogs() {
  await StorageManager.set('import_logs', []);
  return { success: true };
}

Logger.info('ShopOpti+ Pro Background Service Worker v7.0.0 loaded');
