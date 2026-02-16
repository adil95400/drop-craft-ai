/**
 * ShopOpti+ Pro - Popup Script
 * Version: 6.0.0
 * 
 * P3 Features: Preview Pro, Deduplication, AI Merge, Dashboard Sync
 */

// ============================================
// DOM Elements
// ============================================
const screens = {
  loading: document.getElementById('loading'),
  login: document.getElementById('login-screen'),
  main: document.getElementById('main-screen'),
  settings: document.getElementById('settings-screen'),
  preview: document.getElementById('preview-screen')
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
  previewBtn: document.getElementById('preview-btn'),
  dedupBadge: document.getElementById('dedup-badge'),
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

  // Preview Pro elements
  previewBackBtn: document.getElementById('preview-back-btn'),
  previewTitle: document.getElementById('preview-title'),
  previewDescription: document.getElementById('preview-description'),
  previewImages: document.getElementById('preview-images'),
  previewCost: document.getElementById('preview-cost'),
  previewMargin: document.getElementById('preview-margin'),
  previewSellPrice: document.getElementById('preview-sell-price'),
  previewPlatformTag: document.getElementById('preview-platform-tag'),
  previewBrandTag: document.getElementById('preview-brand-tag'),
  previewCategoryTag: document.getElementById('preview-category-tag'),
  previewVariantsSection: document.getElementById('preview-variants-section'),
  previewVariants: document.getElementById('preview-variants'),
  previewVariantCount: document.getElementById('preview-variant-count'),
  previewDedupStatus: document.getElementById('preview-dedup-status'),
  previewConfirmBtn: document.getElementById('preview-confirm-btn'),
  previewCancelBtn: document.getElementById('preview-cancel-btn'),
  previewMergeSection: document.getElementById('preview-merge-section'),
  previewMergeBtn: document.getElementById('preview-merge-btn'),

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
  previewProduct: null,
  dedupResult: null,
  settings: null
};

// ============================================
// Utilities
// ============================================
function showScreen(screenName) {
  Object.values(screens).forEach(screen => { if (screen) screen.style.display = 'none'; });
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

function safeSetText(element, text) {
  if (element) element.textContent = text || '';
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
// Login
// ============================================
elements.loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = elements.emailInput?.value?.trim();
  const password = elements.passwordInput?.value;
  if (!email || !password) { showError('Veuillez remplir tous les champs'); return; }

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
  if (elements.loginError) { elements.loginError.textContent = message; elements.loginError.style.display = 'block'; }
}
function hideError() {
  if (elements.loginError) elements.loginError.style.display = 'none';
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
    // P3: Auto-check for duplicates
    checkDedupForProduct(current_product);
  } else {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract_product' });
        if (response?.success && response.product) {
          state.currentProduct = response.product;
          displayProduct(response.product);
          checkDedupForProduct(response.product);
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
  safeSetText(elements.productTitle, (product.title || 'Produit sans titre').substring(0, 80));
  safeSetText(elements.productPrice, formatPrice(product.price || 0));
  safeSetText(elements.productPlatform, product.platform || 'Unknown');
}

// ============================================
// P3: Deduplication Check
// ============================================
async function checkDedupForProduct(product) {
  if (!elements.dedupBadge) return;
  elements.dedupBadge.style.display = 'none';

  const result = await sendMessage('check_duplicate', {
    title: product.title,
    url: product.url,
    sku: product.sku,
    platform: product.platform
  });

  if (!result?.success) return;
  state.dedupResult = result;

  if (result.status === 'new') {
    elements.dedupBadge.style.display = 'flex';
    elements.dedupBadge.className = 'dedup-badge dedup-new';
    elements.dedupBadge.textContent = '✨ Nouveau produit';
  } else if (result.status === 'conflict') {
    elements.dedupBadge.style.display = 'flex';
    elements.dedupBadge.className = 'dedup-badge dedup-conflict';
    elements.dedupBadge.textContent = `⚠️ Conflit (${result.similarity || '?'}% similaire)`;
  } else if (result.status === 'duplicate') {
    elements.dedupBadge.style.display = 'flex';
    elements.dedupBadge.className = 'dedup-badge dedup-duplicate';
    elements.dedupBadge.textContent = '🔴 Dupliqué — déjà importé';
  }
}

// ============================================
// P3: Preview Pro
// ============================================
elements.previewBtn?.addEventListener('click', async () => {
  if (elements.previewBtn) { elements.previewBtn.disabled = true; safeSetText(elements.previewBtn, '⏳ Extraction...'); }

  const result = await sendMessage('preview_product');

  if (elements.previewBtn) { elements.previewBtn.disabled = false; safeSetText(elements.previewBtn, '👁 Preview Pro'); }

  if (!result?.success || !result.product) {
    alert(result?.error || 'Impossible d\'extraire le produit');
    return;
  }

  state.previewProduct = result.product;
  openPreviewScreen(result.product);
});

function openPreviewScreen(product) {
  showScreen('preview');

  // Title
  if (elements.previewTitle) elements.previewTitle.value = product.title || '';

  // Description
  if (elements.previewDescription) elements.previewDescription.value = product.description || '';

  // Prices
  safeSetText(elements.previewCost, formatPrice(product.cost_price || 0));
  safeSetText(elements.previewMargin, `${product.margin_percent || 30}%`);
  if (elements.previewSellPrice) elements.previewSellPrice.value = (product.price || 0).toFixed(2);

  // Images gallery
  if (elements.previewImages) {
    elements.previewImages.innerHTML = '';
    const images = product.images || [];
    images.slice(0, 8).forEach((url, i) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'preview-image-item';

      const img = document.createElement('img');
      img.src = url;
      img.alt = `Image ${i + 1}`;
      img.className = 'preview-image-thumb';
      img.onerror = () => { img.style.display = 'none'; };

      const badge = document.createElement('span');
      badge.className = 'preview-image-badge';
      badge.textContent = i === 0 ? 'Principale' : `#${i + 1}`;

      wrapper.appendChild(img);
      wrapper.appendChild(badge);
      elements.previewImages.appendChild(wrapper);
    });

    if (images.length === 0) {
      elements.previewImages.textContent = 'Aucune image détectée';
    }
  }

  // Platform/Brand/Category tags
  safeSetText(elements.previewPlatformTag, product.platform ? `📍 ${product.platform}` : '');
  safeSetText(elements.previewBrandTag, product.brand ? `🏷 ${product.brand}` : '');
  safeSetText(elements.previewCategoryTag, product.category ? `📂 ${product.category}` : '');

  // Variants
  const variants = product.variants || [];
  if (variants.length > 0 && elements.previewVariantsSection) {
    elements.previewVariantsSection.style.display = 'block';
    safeSetText(elements.previewVariantCount, String(variants.length));
    if (elements.previewVariants) {
      elements.previewVariants.innerHTML = '';
      variants.slice(0, 20).forEach(v => {
        const tag = document.createElement('span');
        tag.className = 'variant-tag';
        tag.textContent = typeof v === 'string' ? v : (v.name || v.title || JSON.stringify(v).substring(0, 30));
        elements.previewVariants.appendChild(tag);
      });
    }
  } else if (elements.previewVariantsSection) {
    elements.previewVariantsSection.style.display = 'none';
  }

  // Dedup status in preview
  if (elements.previewDedupStatus && state.dedupResult) {
    elements.previewDedupStatus.style.display = 'block';
    if (state.dedupResult.status === 'new') {
      elements.previewDedupStatus.className = 'preview-dedup-status dedup-new';
      elements.previewDedupStatus.textContent = '✨ Nouveau produit — aucun doublon trouvé';
    } else if (state.dedupResult.status === 'conflict') {
      elements.previewDedupStatus.className = 'preview-dedup-status dedup-conflict';
      elements.previewDedupStatus.textContent = `⚠️ Similaire à "${state.dedupResult.existing_title}" (${state.dedupResult.similarity}%)`;
      // Show merge option
      if (elements.previewMergeSection) elements.previewMergeSection.style.display = 'block';
    } else if (state.dedupResult.status === 'duplicate') {
      elements.previewDedupStatus.className = 'preview-dedup-status dedup-duplicate';
      elements.previewDedupStatus.textContent = `🔴 Dupliqué — importé le ${state.dedupResult.imported_at?.split('T')[0] || '?'}`;
      if (elements.previewMergeSection) elements.previewMergeSection.style.display = 'block';
    }
  } else if (elements.previewDedupStatus) {
    elements.previewDedupStatus.style.display = 'none';
  }

  // Hide merge section for new products
  if (state.dedupResult?.status === 'new' && elements.previewMergeSection) {
    elements.previewMergeSection.style.display = 'none';
  }
}

// Preview: Cancel
elements.previewCancelBtn?.addEventListener('click', () => {
  state.previewProduct = null;
  showScreen('main');
});

elements.previewBackBtn?.addEventListener('click', () => {
  state.previewProduct = null;
  showScreen('main');
});

// Preview: Confirm Import
elements.previewConfirmBtn?.addEventListener('click', async () => {
  if (!state.previewProduct) return;

  // Apply edits from preview
  const editedProduct = {
    ...state.previewProduct,
    title: elements.previewTitle?.value || state.previewProduct.title,
    description: elements.previewDescription?.value || state.previewProduct.description,
    price: parseFloat(elements.previewSellPrice?.value) || state.previewProduct.price
  };

  elements.previewConfirmBtn.disabled = true;
  safeSetText(elements.previewConfirmBtn, '⏳ Importation...');

  const result = await sendMessage('confirm_import', { product: editedProduct });

  if (result?.success) {
    safeSetText(elements.previewConfirmBtn, '✅ Importé !');
    elements.previewConfirmBtn.style.background = '#10B981';

    // Update stats
    const stats = await chrome.storage.local.get(['import_count', 'import_today']);
    await chrome.storage.local.set({
      import_count: (stats.import_count || 0) + 1,
      import_today: (stats.import_today || 0) + 1
    });

    setTimeout(() => {
      state.previewProduct = null;
      state.dedupResult = null;
      showScreen('main');
      loadStats();
      elements.previewConfirmBtn.disabled = false;
      safeSetText(elements.previewConfirmBtn, '✓ Confirmer l\'import');
      elements.previewConfirmBtn.style.background = '';
    }, 2000);
  } else {
    safeSetText(elements.previewConfirmBtn, `✗ ${(result?.error || 'Erreur').substring(0, 30)}`);
    elements.previewConfirmBtn.style.background = '#EF4444';
    setTimeout(() => {
      elements.previewConfirmBtn.disabled = false;
      safeSetText(elements.previewConfirmBtn, '✓ Confirmer l\'import');
      elements.previewConfirmBtn.style.background = '';
    }, 3000);
  }
});

// Preview: AI Merge
elements.previewMergeBtn?.addEventListener('click', async () => {
  if (!state.previewProduct || !state.dedupResult?.existing_product_id) {
    // Fallback: import normally since we don't have an existing product ID from local check
    alert('Le merge IA nécessite une connexion au backend. Import normal recommandé.');
    return;
  }

  elements.previewMergeBtn.disabled = true;
  safeSetText(elements.previewMergeBtn, '🤖 Fusion en cours...');

  const result = await sendMessage('ai_merge', {
    existing_product_id: state.dedupResult.existing_product_id,
    new_product: state.previewProduct
  });

  if (result?.success) {
    safeSetText(elements.previewMergeBtn, '✅ Fusionné !');
    setTimeout(() => {
      state.previewProduct = null;
      state.dedupResult = null;
      showScreen('main');
      loadStats();
      elements.previewMergeBtn.disabled = false;
      safeSetText(elements.previewMergeBtn, '🔀 Fusionner avec IA');
    }, 2000);
  } else {
    safeSetText(elements.previewMergeBtn, `✗ ${(result?.error || 'Erreur').substring(0, 25)}`);
    setTimeout(() => {
      elements.previewMergeBtn.disabled = false;
      safeSetText(elements.previewMergeBtn, '🔀 Fusionner avec IA');
    }, 3000);
  }
});

// ============================================
// Direct Import (without preview)
// ============================================
elements.importBtn?.addEventListener('click', async () => {
  if (!state.currentProduct) return;

  elements.importBtn.disabled = true;
  safeSetText(elements.importBtn, '⏳...');

  const result = await sendMessage('import_product', state.currentProduct);

  if (result?.success) {
    safeSetText(elements.importBtn, '✓ OK');
    elements.importBtn.style.background = '#10B981';
    const stats = await chrome.storage.local.get(['import_count', 'import_today']);
    await chrome.storage.local.set({
      import_count: (stats.import_count || 0) + 1,
      import_today: (stats.import_today || 0) + 1
    });
    await loadStats();
    setTimeout(() => {
      elements.importBtn.disabled = false;
      safeSetText(elements.importBtn, '⬇ Importer');
      elements.importBtn.style.background = '';
    }, 3000);
  } else {
    safeSetText(elements.importBtn, '✗ Erreur');
    elements.importBtn.style.background = '#EF4444';
    setTimeout(() => {
      elements.importBtn.disabled = false;
      safeSetText(elements.importBtn, '⬇ Importer');
      elements.importBtn.style.background = '';
    }, 3000);
  }
});

// ============================================
// Navigation
// ============================================
elements.settingsBtn?.addEventListener('click', () => loadSettingsScreen());
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

elements.backBtn?.addEventListener('click', () => showScreen('main'));

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
  setTimeout(() => safeSetText(elements.saveSettingsBtn, 'Sauvegarder les paramètres'), 2000);
});

elements.syncSettingsBtn?.addEventListener('click', async () => {
  if (elements.syncSettingsBtn) { elements.syncSettingsBtn.disabled = true; safeSetText(elements.syncSettingsBtn, 'Synchronisation...'); }
  const result = await sendMessage('sync_settings');
  if (elements.syncSettingsBtn) {
    elements.syncSettingsBtn.disabled = false;
    safeSetText(elements.syncSettingsBtn, result?.success ? 'Synchronisé ✓' : 'Erreur de sync');
    setTimeout(() => safeSetText(elements.syncSettingsBtn, 'Synchroniser avec ShopOpti'), 2000);
  }
});

// ============================================
// Debug Panel
// ============================================
let debugVisible = false;
elements.debugBtn?.addEventListener('click', async () => {
  debugVisible = !debugVisible;
  if (elements.debugPanel) elements.debugPanel.style.display = debugVisible ? 'block' : 'none';
  if (debugVisible) await loadDiagnostics();
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
    elements.debugContent.textContent = [
      `═══ ShopOpti+ v${d.version} ═══`,
      `Heure: ${d.timestamp}`,
      '', '── Auth ──',
      `Session: ${d.auth.hasSession ? '✓' : '✗'}`,
      `Token Status: ${d.auth.tokenStatus}`,
      `Token Expiry: ${d.auth.tokenExpiry || 'N/A'}`,
      `User ID: ${d.auth.tokenUser || 'N/A'}`,
      '', '── API ──',
      `Reachable: ${d.api.reachable ? '✓' : '✗'}`,
      `Latency: ${d.api.latencyMs}ms`,
      '', `── Erreurs (${d.recentErrors.length}) ──`,
      ...d.recentErrors.map(e => `  ${e.timestamp.split('T')[1]?.split('.')[0] || ''} ${e.message.substring(0, 80)}`)
    ].join('\n');
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
  if (elements.importLogsPanel) elements.importLogsPanel.style.display = importLogsVisible ? 'block' : 'none';
  if (importLogsVisible && elements.debugPanel) { elements.debugPanel.style.display = 'none'; debugVisible = false; }
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

  elements.importLogsList.innerHTML = '';
  result.logs.forEach(log => {
    const entry = document.createElement('div');
    entry.style.cssText = 'padding:4px 0;border-bottom:1px solid #2a2a4a;';

    const statusIcon = log.status === 'success' ? '✅' : log.status === 'merged' ? '🔀' : '❌';
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
