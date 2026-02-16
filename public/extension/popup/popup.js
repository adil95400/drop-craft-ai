/**
 * ShopOpti+ Pro - Popup Script
 * Version: 5.9.0
 * 
 * [SHOULD] Audit XSS: All dynamic content uses textContent instead of innerHTML
 */

// ============================================
// DOM Elements
// ============================================
const screens = {
  loading: document.getElementById('loading'),
  login: document.getElementById('login-screen'),
  main: document.getElementById('main-screen'),
  settings: document.getElementById('settings-screen')
};

const elements = {
  loginForm: document.getElementById('login-form'),
  emailInput: document.getElementById('email'),
  passwordInput: document.getElementById('password'),
  loginError: document.getElementById('login-error'),
  loginText: document.getElementById('login-text'),
  loginLoading: document.getElementById('login-loading'),

  userAvatar: document.getElementById('user-avatar'),
  userName: document.getElementById('user-name'),
  userEmail: document.getElementById('user-email'),
  userPlan: document.getElementById('user-plan'),
  statImported: document.getElementById('stat-imported'),
  statToday: document.getElementById('stat-today'),
  statSynced: document.getElementById('stat-synced'),
  currentProduct: document.getElementById('current-product'),
  noProduct: document.getElementById('no-product'),
  productImage: document.getElementById('product-image'),
  productTitle: document.getElementById('product-title'),
  productPrice: document.getElementById('product-price'),
  productPlatform: document.getElementById('product-platform'),
  importBtn: document.getElementById('import-btn'),
  settingsBtn: document.getElementById('settings-btn'),
  logoutBtn: document.getElementById('logout-btn'),
  openDashboard: document.getElementById('open-dashboard'),
  viewProducts: document.getElementById('view-products'),
  debugBtn: document.getElementById('debug-btn'),
  debugPanel: document.getElementById('debug-panel'),
  debugContent: document.getElementById('debug-content'),
  debugRefresh: document.getElementById('debug-refresh'),
  debugLogs: document.getElementById('debug-logs'),
  debugErrors: document.getElementById('debug-errors'),
  debugApi: document.getElementById('debug-api'),
  importLogsBtn: document.getElementById('import-logs-btn'),
  importLogsPanel: document.getElementById('import-logs-panel'),
  importLogsList: document.getElementById('import-logs-list'),
  importLogsClear: document.getElementById('import-logs-clear'),

  backBtn: document.getElementById('back-btn'),
  settingAutoImport: document.getElementById('setting-auto-import'),
  settingMargin: document.getElementById('setting-margin'),
  settingRounding: document.getElementById('setting-rounding'),
  settingNotifications: document.getElementById('setting-notifications'),
  saveSettingsBtn: document.getElementById('save-settings'),
  syncSettingsBtn: document.getElementById('sync-settings')
};

// ============================================
// State
// ============================================
let state = {
  user: null,
  currentProduct: null,
  settings: null
};

// ============================================
// Utilities
// ============================================
function showScreen(screenName) {
  Object.values(screens).forEach(screen => {
    if (screen) screen.style.display = 'none';
  });
  if (screens[screenName]) screens[screenName].style.display = 'flex';
}

function sendMessage(action, data = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action, data }, resolve);
  });
}

function formatPrice(price, currency = '€') {
  return `${parseFloat(price).toFixed(2)} ${currency}`;
}

/**
 * [SHOULD] Safely set text content — never use innerHTML for user data
 */
function safeSetText(element, text) {
  if (element) {
    element.textContent = text || '';
  }
}

// ============================================
// Initialization
// ============================================
async function init() {
  showScreen('loading');

  try {
    const authResult = await sendMessage('check_auth');

    if (authResult?.authenticated && authResult.user) {
      state.user = authResult.user;
      await loadMainScreen();
    } else {
      showScreen('login');
    }

    state.settings = await sendMessage('get_settings');
  } catch (error) {
    console.error('Init error:', error);
    showScreen('login');
  }
}

// ============================================
// Login — [SHOULD] uses textContent for error display
// ============================================
elements.loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = elements.emailInput?.value?.trim();
  const password = elements.passwordInput?.value;

  if (!email || !password) {
    showError('Veuillez remplir tous les champs');
    return;
  }

  if (elements.loginText) elements.loginText.style.display = 'none';
  if (elements.loginLoading) elements.loginLoading.style.display = 'inline';
  const btn = elements.loginForm.querySelector('button');
  if (btn) btn.disabled = true;
  hideError();

  const result = await sendMessage('login', { email, password });

  if (elements.loginText) elements.loginText.style.display = 'inline';
  if (elements.loginLoading) elements.loginLoading.style.display = 'none';
  if (btn) btn.disabled = false;

  if (result?.success) {
    state.user = result.user;
    await loadMainScreen();
  } else {
    showError(result?.error || 'Erreur de connexion');
  }
});

function showError(message) {
  if (elements.loginError) {
    // [SHOULD] textContent instead of innerHTML
    elements.loginError.textContent = message;
    elements.loginError.style.display = 'block';
  }
}

function hideError() {
  if (elements.loginError) {
    elements.loginError.style.display = 'none';
  }
}

// ============================================
// Main Screen
// ============================================
async function loadMainScreen() {
  showScreen('main');

  if (state.user) {
    const initial = (state.user.email?.[0] || 'U').toUpperCase();
    safeSetText(elements.userAvatar, initial);
    safeSetText(elements.userName, state.user.user_metadata?.full_name || 'Utilisateur');
    safeSetText(elements.userEmail, state.user.email);
    safeSetText(elements.userPlan, state.user.user_metadata?.plan || 'Free');
  }

  await loadStats();
  await checkCurrentProduct();
}

async function loadStats() {
  const stats = await chrome.storage.local.get(['import_count', 'import_today', 'sync_count']);
  safeSetText(elements.statImported, String(stats.import_count || 0));
  safeSetText(elements.statToday, String(stats.import_today || 0));
  safeSetText(elements.statSynced, String(stats.sync_count || 0));
}

async function checkCurrentProduct() {
  const { current_product } = await chrome.storage.local.get(['current_product']);

  if (current_product && current_product.title) {
    state.currentProduct = current_product;
    displayProduct(current_product);
  } else {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract_product' });
        if (response?.success && response.product) {
          state.currentProduct = response.product;
          displayProduct(response.product);
        }
      }
    } catch (error) {
      console.log('No content script on this page');
    }
  }
}

function displayProduct(product) {
  if (elements.noProduct) elements.noProduct.style.display = 'none';
  if (elements.currentProduct) elements.currentProduct.style.display = 'block';

  if (elements.productImage) {
    elements.productImage.src = product.images?.[0] || 'icons/icon48.png';
    elements.productImage.alt = 'Product image';
  }
  // [SHOULD] textContent for all user-sourced data
  safeSetText(elements.productTitle, (product.title || 'Produit sans titre').substring(0, 80));
  safeSetText(elements.productPrice, formatPrice(product.price || 0));
  safeSetText(elements.productPlatform, product.platform || 'Unknown');
}

// ============================================
// Import button — [MUST] clear error feedback
// ============================================
elements.importBtn?.addEventListener('click', async () => {
  if (!state.currentProduct) return;

  elements.importBtn.disabled = true;
  safeSetText(elements.importBtn, 'Importation...');

  const result = await sendMessage('import_product', state.currentProduct);

  if (result?.success) {
    safeSetText(elements.importBtn, '✓ Importé');
    elements.importBtn.style.background = '#10B981';

    const stats = await chrome.storage.local.get(['import_count', 'import_today']);
    await chrome.storage.local.set({
      import_count: (stats.import_count || 0) + 1,
      import_today: (stats.import_today || 0) + 1
    });
    await loadStats();

    // Show request ID briefly
    if (result._requestId) {
      setTimeout(() => {
        safeSetText(elements.importBtn, `ID: ${result._requestId}`);
      }, 1500);
    }

    setTimeout(() => {
      elements.importBtn.disabled = false;
      safeSetText(elements.importBtn, '⬇ Importer ce produit');
      elements.importBtn.style.background = '';
    }, 4000);

  } else {
    // [MUST] Show specific error + request ID
    const errorText = result?.error || 'Erreur inconnue';
    const reqId = result?._requestId ? ` [${result._requestId}]` : '';
    safeSetText(elements.importBtn, `✗ ${errorText.substring(0, 35)}`);
    elements.importBtn.style.background = '#EF4444';

    // Show retry button if retryable
    if (result?.canRetry) {
      setTimeout(() => {
        elements.importBtn.disabled = false;
        safeSetText(elements.importBtn, '↻ Réessayer l\'import');
        elements.importBtn.style.background = '#F59E0B';
      }, 2000);
      setTimeout(() => {
        safeSetText(elements.importBtn, '⬇ Importer ce produit');
        elements.importBtn.style.background = '';
      }, 8000);
    } else {
      elements.importBtn.disabled = false;
      setTimeout(() => {
        safeSetText(elements.importBtn, '⬇ Importer ce produit');
        elements.importBtn.style.background = '';
      }, 4000);
    }
  }
});

// Navigation buttons
elements.settingsBtn?.addEventListener('click', () => {
  loadSettingsScreen();
});

elements.logoutBtn?.addEventListener('click', async () => {
  await sendMessage('logout');
  state.user = null;
  showScreen('login');
});

elements.openDashboard?.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://drop-craft-ai.lovable.app/dashboard' });
});

elements.viewProducts?.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://drop-craft-ai.lovable.app/products' });
});

// ============================================
// Settings Screen
// ============================================
function loadSettingsScreen() {
  showScreen('settings');

  if (state.settings) {
    if (elements.settingAutoImport) elements.settingAutoImport.checked = state.settings.autoImport || false;
    if (elements.settingMargin) elements.settingMargin.value = state.settings.priceMargin || 30;
    if (elements.settingRounding) elements.settingRounding.value = state.settings.roundingRule || 'ceil_99';
    if (elements.settingNotifications) elements.settingNotifications.checked = state.settings.notifications !== false;
  }
}

elements.backBtn?.addEventListener('click', () => {
  showScreen('main');
});

elements.saveSettingsBtn?.addEventListener('click', async () => {
  const settings = {
    autoImport: elements.settingAutoImport?.checked || false,
    priceMargin: parseInt(elements.settingMargin?.value) || 30,
    roundingRule: elements.settingRounding?.value || 'ceil_99',
    notifications: elements.settingNotifications?.checked !== false
  };

  await sendMessage('save_settings', settings);
  state.settings = settings;

  safeSetText(elements.saveSettingsBtn, 'Sauvegardé ✓');
  setTimeout(() => {
    safeSetText(elements.saveSettingsBtn, 'Sauvegarder les paramètres');
  }, 2000);
});

elements.syncSettingsBtn?.addEventListener('click', async () => {
  if (elements.syncSettingsBtn) {
    elements.syncSettingsBtn.disabled = true;
    safeSetText(elements.syncSettingsBtn, 'Synchronisation...');
  }

  const result = await sendMessage('sync_settings');

  if (elements.syncSettingsBtn) {
    elements.syncSettingsBtn.disabled = false;
    safeSetText(elements.syncSettingsBtn, result?.success ? 'Synchronisé ✓' : 'Erreur de sync');
    setTimeout(() => {
      safeSetText(elements.syncSettingsBtn, 'Synchroniser avec ShopOpti');
    }, 2000);
  }
});

// ============================================
// Debug Panel
// ============================================
let debugVisible = false;

elements.debugBtn?.addEventListener('click', async () => {
  debugVisible = !debugVisible;
  if (elements.debugPanel) {
    elements.debugPanel.style.display = debugVisible ? 'block' : 'none';
  }
  if (debugVisible) {
    await loadDiagnostics();
  }
});

elements.debugRefresh?.addEventListener('click', loadDiagnostics);

elements.debugLogs?.addEventListener('click', async () => {
  const result = await sendMessage('get_debug_logs', {});
  if (result?.success && elements.debugContent) {
    const lines = result.logs.slice(-30).map(l => `[${l.level}] ${l.timestamp.split('T')[1]?.split('.')[0] || ''} ${l.message}`).join('\n');
    elements.debugContent.textContent = lines || 'Aucun log';
  }
});

elements.debugErrors?.addEventListener('click', async () => {
  const result = await sendMessage('get_debug_logs', { filter: 'ERROR' });
  if (result?.success && elements.debugContent) {
    const lines = result.logs.slice(-20).map(l => `[${l.timestamp.split('T')[1]?.split('.')[0] || ''}] ${l.message}`).join('\n');
    elements.debugContent.textContent = lines || '✓ Aucune erreur';
  }
});

elements.debugApi?.addEventListener('click', async () => {
  const result = await sendMessage('get_debug_logs', { filter: 'API' });
  if (result?.success && elements.debugContent) {
    const lines = result.logs.slice(-20).map(l => `${l.timestamp.split('T')[1]?.split('.')[0] || ''} ${l.message}`).join('\n');
    elements.debugContent.textContent = lines || 'Aucun appel API';
  }
});

async function loadDiagnostics() {
  if (!elements.debugContent) return;
  elements.debugContent.textContent = 'Chargement...';
  
  const result = await sendMessage('get_diagnostics');
  if (result?.success) {
    const d = result.diagnostics;
    const lines = [
      `═══ ShopOpti+ v${d.version} ═══`,
      `Heure: ${d.timestamp}`,
      ``,
      `── Auth ──`,
      `Session: ${d.auth.hasSession ? '✓' : '✗'}`,
      `Access Token: ${d.auth.hasAccessToken ? '✓' : '✗'}`,
      `Refresh Token: ${d.auth.hasRefreshToken ? '✓' : '✗'}`,
      `Extension Token: ${d.auth.hasExtensionToken ? '✓' : '✗'}`,
      `Token Status: ${d.auth.tokenStatus}`,
      `Token Expiry: ${d.auth.tokenExpiry || 'N/A'}`,
      `Session Expiry: ${d.auth.sessionExpiresAt || 'N/A'}`,
      `User ID: ${d.auth.tokenUser || 'N/A'}`,
      ``,
      `── API ──`,
      `URL: ${d.api.baseUrl}`,
      `Reachable: ${d.api.reachable ? '✓' : '✗'}`,
      `Latency: ${d.api.latencyMs}ms`,
      ``,
      `── Settings ──`,
      `Auto-Import: ${d.settings.autoImport}`,
      `Marge: ${d.settings.priceMargin}%`,
      `Debug Logs: ${d.settings.debugLogs}`,
      ``,
      `── Erreurs récentes (${d.recentErrors.length}) ──`,
      ...d.recentErrors.map(e => `  ${e.timestamp.split('T')[1]?.split('.')[0] || ''} ${e.message.substring(0, 80)}`)
    ];
    elements.debugContent.textContent = lines.join('\n');
  } else {
    elements.debugContent.textContent = 'Erreur: impossible de charger les diagnostics';
  }
}

// ============================================
// Import Logs Panel
// ============================================
let importLogsVisible = false;

elements.importLogsBtn?.addEventListener('click', async () => {
  importLogsVisible = !importLogsVisible;
  if (elements.importLogsPanel) {
    elements.importLogsPanel.style.display = importLogsVisible ? 'block' : 'none';
  }
  // Hide debug panel when showing import logs
  if (importLogsVisible && elements.debugPanel) {
    elements.debugPanel.style.display = 'none';
    debugVisible = false;
  }
  if (importLogsVisible) await loadImportLogs();
});

elements.importLogsClear?.addEventListener('click', async () => {
  await sendMessage('clear_import_logs');
  if (elements.importLogsList) elements.importLogsList.textContent = 'Historique vidé.';
});

async function loadImportLogs() {
  if (!elements.importLogsList) return;
  elements.importLogsList.textContent = 'Chargement...';

  const result = await sendMessage('get_import_logs');
  if (!result?.success || !result.logs?.length) {
    elements.importLogsList.textContent = 'Aucun import enregistré.';
    return;
  }

  // Clear and build DOM
  elements.importLogsList.innerHTML = '';
  result.logs.forEach(log => {
    const entry = document.createElement('div');
    entry.style.cssText = 'padding:4px 0;border-bottom:1px solid #2a2a4a;';

    const statusIcon = log.status === 'success' ? '✅' : '❌';
    const time = log.timestamp?.split('T')[1]?.split('.')[0] || '';

    const line1 = document.createElement('div');
    line1.textContent = `${statusIcon} ${time} — ${log.title || 'Sans titre'}`;
    line1.style.cssText = 'font-weight:bold;color:#f0f0f0;';

    const line2 = document.createElement('div');
    line2.style.cssText = 'color:#888;font-size:10px;margin-top:2px;';
    const parts = [`📍 ${log.platform || '?'}`];
    if (log.requestId && log.requestId !== 'N/A') parts.push(`🔗 ${log.requestId}`);
    if (log.code) parts.push(`⚙️ ${log.code}`);
    line2.textContent = parts.join('  ');

    entry.appendChild(line1);
    entry.appendChild(line2);

    if (log.error) {
      const line3 = document.createElement('div');
      line3.style.cssText = 'color:#f87171;font-size:10px;margin-top:1px;';
      line3.textContent = `⚠ ${log.error}`;
      entry.appendChild(line3);
    }

    elements.importLogsList.appendChild(entry);
  });
}

// ============================================
// Initialize
// ============================================
init();
