// Drop Craft AI Chrome Extension - Background Service Worker
// Handles all network requests to bypass CSP restrictions

const CONFIG = {
  API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
  APP_URL: 'https://drop-craft-ai.lovable.app',
  // Always align with manifest.json to avoid stale version redirects
  VERSION: chrome.runtime.getManifest().version
};

console.log(`[DropCraft BG] Background service worker v${CONFIG.VERSION} starting...`);

// ============================================
// MESSAGE HANDLERS
// ============================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[DropCraft BG] Received message:', message.type);

  // Handle async responses
  (async () => {
    try {
      switch (message.type) {
        case 'DC_IMPORT_PRODUCT':
          const importResult = await handleImportProduct(message.payload);
          sendResponse(importResult);
          break;

        case 'IMPORT_PRODUCT':
          // Legacy support
          const legacyResult = await handleImportProduct({ productData: message.product });
          sendResponse(legacyResult);
          break;

        case 'DC_FETCH_API':
        case 'FETCH_API':
          const fetchResult = await handleFetchAPI(message.url || message.payload?.url, message.options || message.payload?.options);
          sendResponse(fetchResult);
          break;

        case 'DC_GET_TOKEN':
        case 'GET_TOKEN':
          const token = await getStoredToken();
          sendResponse({ success: true, token });
          break;

        case 'DC_SAVE_TOKEN':
          await saveToken(message.payload?.token || message.token);
          sendResponse({ success: true });
          break;

        case 'GET_SETTINGS':
          const settings = await getSettings();
          sendResponse(settings);
          break;

        case 'GET_STATS':
          const stats = await getStats();
          sendResponse(stats);
          break;

        default:
          console.log('[DropCraft BG] Unknown message type:', message.type);
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[DropCraft BG] Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true; // Keep channel open for async response
});

// ============================================
// IMPORT PRODUCT HANDLER
// ============================================
async function handleImportProduct(payload) {
  console.log('[DropCraft BG] Handling import...');

  try {
    // Get stored token
    const token = await getStoredToken();

    if (!token) {
      return { 
        success: false, 
        error: 'Token manquant. Connectez-vous depuis l\'application Drop Craft AI.' 
      };
    }

    // Prepare request body
    const productData = payload.productData || payload.product || payload;
    const requestBody = {
      url: payload.url || productData.source_url,
      product_data: productData,
      action: 'import_product'
    };

    console.log('[DropCraft BG] Sending to API with token:', token.slice(0, 8) + '...');

    // Try extension-scraper first (handles auth internally)
    let response = await fetch(`${CONFIG.API_URL}/extension-scraper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-extension-token': token,
        'x-extension-version': CONFIG.VERSION
      },
      body: JSON.stringify(requestBody)
    });

    // If extension-scraper fails, try extension-sync-realtime
    if (!response.ok && response.status === 404) {
      console.log('[DropCraft BG] extension-scraper not found, trying extension-sync-realtime...');
      response = await fetch(`${CONFIG.API_URL}/extension-sync-realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': token,
          'x-extension-version': CONFIG.VERSION
        },
        body: JSON.stringify({
          action: 'import_products',
          products: [productData]
        })
      });
    }

    const data = await response.json();
    console.log('[DropCraft BG] API response:', response.status, data);

    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP ${response.status}`);
    }

    // Update local stats
    const stats = await getStats();
    await chrome.storage.local.set({
      stats: {
        ...stats,
        products: (stats.products || 0) + 1
      }
    });

    return { 
      success: true, 
      data: data 
    };

  } catch (error) {
    console.error('[DropCraft BG] Import error:', error);
    return { 
      success: false, 
      error: error.message || 'Erreur lors de l\'import' 
    };
  }
}

// ============================================
// GENERIC FETCH API HANDLER (CSP Bypass)
// ============================================
async function handleFetchAPI(url, options = {}) {
  console.log('[DropCraft BG] Handling fetch:', url);

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
    });

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType?.includes('application/json')) {
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
    console.error('[DropCraft BG] Fetch error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================
// TOKEN MANAGEMENT
// ============================================
async function getStoredToken() {
  const result = await chrome.storage.local.get(['extensionToken']);
  return result.extensionToken || null;
}

async function saveToken(token) {
  await chrome.storage.local.set({ extensionToken: token });
  console.log('[DropCraft BG] Token saved successfully');
}

// ============================================
// SETTINGS & STATS
// ============================================
async function getSettings() {
  return await chrome.storage.local.get({
    autoInjectButtons: true,
    pushNotifications: true,
    extensionToken: null
  });
}

async function getStats() {
  const result = await chrome.storage.local.get(['stats']);
  return result.stats || { products: 0, reviews: 0, monitored: 0 };
}

// ============================================
// INSTALLATION HANDLER
// ============================================
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[DropCraft BG] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // Initialize storage
    chrome.storage.local.set({
      extensionVersion: CONFIG.VERSION,
      installDate: new Date().toISOString(),
      stats: { products: 0, reviews: 0, monitored: 0 }
    });

    // Open setup page only once (reloading unpacked extensions can retrigger "install")
    chrome.storage.local.get(['hasOpenedInstallPage']).then(({ hasOpenedInstallPage }) => {
      if (hasOpenedInstallPage) return;
      chrome.storage.local.set({ hasOpenedInstallPage: true });

      chrome.tabs.create({
        url: `${CONFIG.APP_URL}/auth?redirect=/extensions/chrome&installed=true&v=${encodeURIComponent(CONFIG.VERSION)}`
      });
    });
  }

  if (details.reason === 'update') {
    chrome.storage.local.set({
      extensionVersion: CONFIG.VERSION,
      lastUpdate: new Date().toISOString()
    });
  }
});

// ============================================
// TAB UPDATE HANDLER (for badge updates)
// ============================================
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const supportedDomains = [
      'amazon', 'aliexpress', 'alibaba', 'temu', 'shein',
      'ebay', 'etsy', 'walmart', 'shopify', 'myshopify',
      'banggood', 'dhgate', 'wish', 'cdiscount', 'fnac'
    ];

    const isSupported = supportedDomains.some(domain => 
      tab.url.toLowerCase().includes(domain)
    );

    if (isSupported) {
      chrome.action.setBadgeText({ text: '✓', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981', tabId });
    } else {
      chrome.action.setBadgeText({ text: '', tabId });
    }
  }
});

// ============================================
// CONTEXT MENUS
// ============================================
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'dropcraft-import',
      title: 'Importer dans Drop Craft AI',
      contexts: ['page', 'link']
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'dropcraft-import') {
    // Send message to content script to trigger import
    chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_IMPORT' });
  }
});

console.log(`[DropCraft BG] Background service worker v${CONFIG.VERSION} ready`);
