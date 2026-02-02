/**
 * ShopOpti+ Pro - Popup Script
 * Version: 5.7.3
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
  // Login
  loginForm: document.getElementById('login-form'),
  emailInput: document.getElementById('email'),
  passwordInput: document.getElementById('password'),
  loginError: document.getElementById('login-error'),
  loginText: document.getElementById('login-text'),
  loginLoading: document.getElementById('login-loading'),

  // Main
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

  // Settings
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
    screen.style.display = 'none';
  });
  screens[screenName].style.display = 'flex';
}

function sendMessage(action, data = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action, data }, resolve);
  });
}

function formatPrice(price, currency = '€') {
  return `${parseFloat(price).toFixed(2)} ${currency}`;
}

// ============================================
// Initialization
// ============================================
async function init() {
  showScreen('loading');

  try {
    // Check authentication
    const authResult = await sendMessage('check_auth');
    
    if (authResult.authenticated && authResult.user) {
      state.user = authResult.user;
      await loadMainScreen();
    } else {
      showScreen('login');
    }

    // Load settings
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
  
  const email = elements.emailInput.value.trim();
  const password = elements.passwordInput.value;

  if (!email || !password) {
    showError('Veuillez remplir tous les champs');
    return;
  }

  // Show loading state
  elements.loginText.style.display = 'none';
  elements.loginLoading.style.display = 'inline';
  elements.loginForm.querySelector('button').disabled = true;
  hideError();

  const result = await sendMessage('login', { email, password });

  // Reset button
  elements.loginText.style.display = 'inline';
  elements.loginLoading.style.display = 'none';
  elements.loginForm.querySelector('button').disabled = false;

  if (result.success) {
    state.user = result.user;
    await loadMainScreen();
  } else {
    showError(result.error || 'Erreur de connexion');
  }
});

function showError(message) {
  elements.loginError.textContent = message;
  elements.loginError.style.display = 'block';
}

function hideError() {
  elements.loginError.style.display = 'none';
}

// ============================================
// Main Screen
// ============================================
async function loadMainScreen() {
  showScreen('main');

  // Update user info
  if (state.user) {
    const initial = (state.user.email?.[0] || 'U').toUpperCase();
    elements.userAvatar.textContent = initial;
    elements.userName.textContent = state.user.user_metadata?.full_name || 'Utilisateur';
    elements.userEmail.textContent = state.user.email;
    elements.userPlan.textContent = state.user.user_metadata?.plan || 'Free';
  }

  // Load stats
  await loadStats();

  // Check for current product
  await checkCurrentProduct();
}

async function loadStats() {
  const stats = await chrome.storage.local.get(['import_count', 'import_today', 'sync_count']);
  
  elements.statImported.textContent = stats.import_count || 0;
  elements.statToday.textContent = stats.import_today || 0;
  elements.statSynced.textContent = stats.sync_count || 0;
}

async function checkCurrentProduct() {
  const { current_product } = await chrome.storage.local.get(['current_product']);
  
  if (current_product && current_product.title) {
    state.currentProduct = current_product;
    displayProduct(current_product);
  } else {
    // Try to get from active tab
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
      // Content script not loaded on this page
      console.log('No content script on this page');
    }
  }
}

function displayProduct(product) {
  elements.noProduct.style.display = 'none';
  elements.currentProduct.style.display = 'block';

  elements.productImage.src = product.images?.[0] || 'icons/icon48.png';
  elements.productTitle.textContent = product.title?.substring(0, 80) || 'Produit sans titre';
  elements.productPrice.textContent = formatPrice(product.price || 0);
  elements.productPlatform.textContent = product.platform || 'Unknown';
}

// Import button
elements.importBtn?.addEventListener('click', async () => {
  if (!state.currentProduct) return;

  elements.importBtn.disabled = true;
  elements.importBtn.innerHTML = '<span>Importation...</span>';

  const result = await sendMessage('import_product', state.currentProduct);

  if (result.success) {
    elements.importBtn.innerHTML = '<span>✓ Importé</span>';
    elements.importBtn.style.background = '#10B981';

    // Update stats
    const stats = await chrome.storage.local.get(['import_count', 'import_today']);
    await chrome.storage.local.set({
      import_count: (stats.import_count || 0) + 1,
      import_today: (stats.import_today || 0) + 1
    });
    await loadStats();

    // Reset after delay
    setTimeout(() => {
      elements.importBtn.disabled = false;
      elements.importBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        Importer ce produit
      `;
      elements.importBtn.style.background = '';
    }, 3000);

  } else {
    elements.importBtn.innerHTML = `<span>Erreur: ${result.error}</span>`;
    elements.importBtn.disabled = false;

    setTimeout(() => {
      elements.importBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        Importer ce produit
      `;
    }, 3000);
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
    elements.settingAutoImport.checked = state.settings.autoImport || false;
    elements.settingMargin.value = state.settings.priceMargin || 30;
    elements.settingRounding.value = state.settings.roundingRule || 'ceil_99';
    elements.settingNotifications.checked = state.settings.notifications !== false;
  }
}

elements.backBtn?.addEventListener('click', () => {
  showScreen('main');
});

elements.saveSettingsBtn?.addEventListener('click', async () => {
  const settings = {
    autoImport: elements.settingAutoImport.checked,
    priceMargin: parseInt(elements.settingMargin.value) || 30,
    roundingRule: elements.settingRounding.value,
    notifications: elements.settingNotifications.checked
  };

  await sendMessage('save_settings', settings);
  state.settings = settings;

  elements.saveSettingsBtn.textContent = 'Sauvegardé ✓';
  setTimeout(() => {
    elements.saveSettingsBtn.textContent = 'Sauvegarder les paramètres';
  }, 2000);
});

elements.syncSettingsBtn?.addEventListener('click', async () => {
  elements.syncSettingsBtn.disabled = true;
  elements.syncSettingsBtn.textContent = 'Synchronisation...';

  const result = await sendMessage('sync_settings');

  elements.syncSettingsBtn.disabled = false;
  elements.syncSettingsBtn.textContent = result.success 
    ? 'Synchronisé ✓' 
    : 'Erreur de sync';

  setTimeout(() => {
    elements.syncSettingsBtn.textContent = 'Synchroniser avec ShopOpti';
  }, 2000);
});

// ============================================
// Initialize
// ============================================
init();
