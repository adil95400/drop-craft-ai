// ShopOpti+ Chrome Extension - Options Script v5.7.2
// P0/P1 Security Hardening - XSS Prevention

const API_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';
const APP_URL = 'https://shopopti.io';
const VERSION = '5.7.2';

const DEFAULT_SETTINGS = {
  apiUrl: API_URL,
  extensionToken: '',
  autoPriceMonitoring: false,
  autoStockAlerts: false,
  autoInjectButtons: true,
  autoShowSidebar: false,
  pushNotifications: true,
  minMargin: 30,
  maxPrice: 100,
  minRating: 4,
  excludeKeywords: '',
  includeCategories: '',
  importDelay: 2,
  maxConcurrent: 5,
  debugMode: false,
  powerSaveMode: false
};

function getElement(id) {
  return document.getElementById(id);
}

function setElementValue(id, value) {
  const el = getElement(id);
  if (el) {
    if (el.type === 'checkbox') {
      el.checked = Boolean(value);
    } else {
      el.value = value ?? '';
    }
  }
}

function getElementValue(id, defaultValue = '') {
  const el = getElement(id);
  if (!el) return defaultValue;

  if (el.type === 'checkbox') {
    return el.checked;
  } else if (el.type === 'number') {
    return el.value === '' ? defaultValue : parseFloat(el.value);
  }
  return el.value || defaultValue;
}

function storageGet(defaults) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(defaults, (items) => {
        const err = chrome.runtime?.lastError;
        if (err) reject(err);
        else resolve(items || {});
      });
    } catch (e) {
      reject(e);
    }
  });
}

function storageSet(items) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set(items, () => {
        const err = chrome.runtime?.lastError;
        if (err) reject(err);
        else resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
}

function storageRemove(keys) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.remove(keys, () => {
        const err = chrome.runtime?.lastError;
        if (err) reject(err);
        else resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
}

function storageClear() {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.clear(() => {
        const err = chrome.runtime?.lastError;
        if (err) reject(err);
        else resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
}

function alarmsCreate(name, info) {
  return new Promise((resolve, reject) => {
    try {
      chrome.alarms.create(name, info);
      const err = chrome.runtime?.lastError;
      if (err) reject(err);
      else resolve();
    } catch (e) {
      reject(e);
    }
  });
}

function alarmsClear(name) {
  return new Promise((resolve, reject) => {
    try {
      chrome.alarms.clear(name, () => {
        const err = chrome.runtime?.lastError;
        if (err) reject(err);
        else resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadStats();
  setupEventListeners();
  setupTabs();
  setupDashboardButton();
  setupClearCacheButton();
  setupResetAllButton();
  setupPlatformToggles();
  setupSelectInputs();
});

// Tab switching functionality
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const targetContent = document.getElementById(`tab-${targetTab}`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
      
      console.log('[ShopOpti+] Switched to tab:', targetTab);
    });
  });
}

// Open Dashboard button
function setupDashboardButton() {
  const openDashboardBtn = getElement('openDashboard');
  if (openDashboardBtn) {
    openDashboardBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: APP_URL });
    });
  }
}

// Clear cache button
function setupClearCacheButton() {
  const clearCacheBtn = getElement('clearCache');
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', async () => {
      try {
        // Clear only cache data, not settings
        const settings = await storageGet(DEFAULT_SETTINGS);
        await storageClear();
        await storageSet(settings);
        showNotification('Cache vidé avec succès', 'success');
      } catch (error) {
        console.error('[ShopOpti+] Error clearing cache:', error);
        showNotification('Erreur lors du vidage du cache', 'error');
      }
    });
  }
}

// Reset all button
function setupResetAllButton() {
  const resetAllBtn = getElement('resetAll');
  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', async () => {
      if (confirm('⚠️ Êtes-vous sûr de vouloir réinitialiser TOUS les paramètres? Cette action est irréversible.')) {
        try {
          await storageClear();
          await storageSet(DEFAULT_SETTINGS);
          await loadSettings();
          await loadStats();
          showNotification('Tous les paramètres réinitialisés', 'info');
        } catch (error) {
          console.error('[ShopOpti+] Error resetting all:', error);
          showNotification('Erreur lors de la réinitialisation', 'error');
        }
      }
    });
  }
}

// Platform toggle setup
function setupPlatformToggles() {
  const platformItems = document.querySelectorAll('.platform-item');
  platformItems.forEach(item => {
    item.addEventListener('click', async () => {
      item.classList.toggle('active');
      
      const platform = item.dataset.platform;
      const isActive = item.classList.contains('active');
      
      // Save platform state
      const data = await storageGet({ enabledPlatforms: {} });
      const platforms = data.enabledPlatforms || {};
      platforms[platform] = isActive;
      await storageSet({ enabledPlatforms: platforms });
      
      console.log(`[ShopOpti+] Platform ${platform} ${isActive ? 'enabled' : 'disabled'}`);
    });
  });
  
  // Load saved platform states
  storageGet({ enabledPlatforms: {} }).then(data => {
    const platforms = data.enabledPlatforms || {};
    platformItems.forEach(item => {
      const platform = item.dataset.platform;
      if (platforms[platform] === false) {
        item.classList.remove('active');
      }
    });
  });
}

// Select input handlers
function setupSelectInputs() {
  const selects = ['defaultCurrency', 'productStatus', 'priceCheckInterval', 'stockCheckInterval'];
  selects.forEach(id => {
    const el = getElement(id);
    if (el) {
      el.addEventListener('change', saveSettings);
    }
  });
}


async function loadSettings() {
  try {
    const settings = await storageGet({
      ...DEFAULT_SETTINGS,
      extensionToken: '',
      // Import settings
      marginMin: 30,
      marginMax: 100,
      defaultCurrency: 'EUR',
      productStatus: 'draft',
      autoImages: true,
      autoVariants: true,
      cleanTitles: true,
      // Automation settings
      autoImportBtn: true,
      priceMonitoring: true,
      stockAlerts: true,
      autoOrder: false,
      aiOptimization: false,
      priceCheckInterval: '30',
      stockCheckInterval: '60',
      // Advanced settings
      showExtraction: false
    });

    // Connection tab
    setElementValue('apiUrl', settings.apiUrl || DEFAULT_SETTINGS.apiUrl);
    setElementValue('extensionToken', settings.extensionToken || '');
    
    // Import tab
    setElementValue('marginMin', settings.marginMin || 30);
    setElementValue('marginMax', settings.marginMax || 100);
    setElementValue('defaultCurrency', settings.defaultCurrency || 'EUR');
    setElementValue('productStatus', settings.productStatus || 'draft');
    setElementValue('autoImages', settings.autoImages !== false);
    setElementValue('autoVariants', settings.autoVariants !== false);
    setElementValue('cleanTitles', settings.cleanTitles !== false);
    
    // Automation tab
    setElementValue('autoImportBtn', settings.autoImportBtn !== false);
    setElementValue('priceMonitoring', settings.priceMonitoring !== false);
    setElementValue('stockAlerts', settings.stockAlerts !== false);
    setElementValue('pushNotifications', settings.pushNotifications !== false);
    setElementValue('autoOrder', settings.autoOrder);
    setElementValue('aiOptimization', settings.aiOptimization);
    setElementValue('priceCheckInterval', settings.priceCheckInterval || '30');
    setElementValue('stockCheckInterval', settings.stockCheckInterval || '60');
    
    // Advanced tab
    setElementValue('debugMode', settings.debugMode);
    setElementValue('showExtraction', settings.showExtraction);
    
    // Legacy support
    setElementValue('autoPriceMonitoring', settings.autoPriceMonitoring || settings.priceMonitoring);
    setElementValue('autoStockAlerts', settings.autoStockAlerts || settings.stockAlerts);
    setElementValue('autoInjectButtons', settings.autoInjectButtons !== false);
    setElementValue('minMargin', settings.minMargin || settings.marginMin || 30);
    setElementValue('maxPrice', settings.maxPrice || settings.marginMax || 100);

    updateConnectionStatus(!!settings.extensionToken);
    console.log('[ShopOpti+] Settings loaded');
  } catch (error) {
    console.error('[ShopOpti+] Error loading settings:', error);
    showNotification(`Erreur chargement: ${error?.message || String(error)}`, 'error');
  }
}

async function loadStats() {
  try {
    const data = await storageGet({ stats: undefined });
    const stats = data?.stats;

    const statProducts = getElement('statProducts');
    const statReviews = getElement('statReviews');
    const statMonitored = getElement('statMonitored');
    const statOrders = getElement('statOrders');

    if (statProducts) statProducts.textContent = stats?.products || 0;
    if (statReviews) statReviews.textContent = stats?.reviews || 0;
    if (statMonitored) statMonitored.textContent = stats?.monitored || 0;
    if (statOrders) statOrders.textContent = stats?.autoOrders || 0;
  } catch (error) {
    console.error('[ShopOpti+] Error loading stats:', error);
  }
}

function updateConnectionStatus(isConnected) {
  const statusEl = getElement('connectionStatus');
  const statusTitle = getElement('statusTitle');
  const statusSub = getElement('statusSub');
  const connectBtn = getElement('connectBtn');
  
  if (statusEl) {
    if (isConnected) {
      statusEl.classList.remove('disconnected');
      if (statusTitle) statusTitle.textContent = 'Connecté';
      if (statusSub) statusSub.textContent = 'Synchronisation active';
      if (connectBtn) connectBtn.textContent = 'Déconnecter';
    } else {
      statusEl.classList.add('disconnected');
      if (statusTitle) statusTitle.textContent = 'Non connecté';
      if (statusSub) statusSub.textContent = 'Connectez-vous pour synchroniser';
      if (connectBtn) connectBtn.textContent = 'Connecter';
    }
  }
}

function setupEventListeners() {
  const saveBtn = getElement('saveSettings');
  const resetBtn = getElement('resetSettings');
  const exportBtn = getElement('exportSettings');
  const testBtn = getElement('testConnection');
  const clearBtn = getElement('clearData');
  const connectBtn = getElement('connectBtn');
  
  if (saveBtn) saveBtn.addEventListener('click', saveSettings);
  if (resetBtn) resetBtn.addEventListener('click', resetSettings);
  if (exportBtn) exportBtn.addEventListener('click', exportSettings);
  if (testBtn) testBtn.addEventListener('click', testConnection);
  if (clearBtn) clearBtn.addEventListener('click', clearAllData);
  if (connectBtn) connectBtn.addEventListener('click', toggleConnection);
  
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', saveSettings);
  });
}

async function toggleConnection() {
  const data = await storageGet({ extensionToken: '' });
  const extensionToken = data.extensionToken;

  if (extensionToken) {
    await storageRemove(['extensionToken']);
    setElementValue('extensionToken', '');
    updateConnectionStatus(false);
    showNotification('Déconnecté', 'info');
  } else {
    chrome.tabs.create({ url: `${APP_URL}/extensions/chrome` });
  }
}

async function saveSettings() {
  try {
    const settings = {
      apiUrl: getElementValue('apiUrl', DEFAULT_SETTINGS.apiUrl),
      extensionToken: getElementValue('extensionToken', ''),
      
      // Import tab settings
      marginMin: Number(getElementValue('marginMin', 30)) || 30,
      marginMax: Number(getElementValue('marginMax', 100)) || 100,
      defaultCurrency: getElementValue('defaultCurrency', 'EUR'),
      productStatus: getElementValue('productStatus', 'draft'),
      autoImages: getElementValue('autoImages', true),
      autoVariants: getElementValue('autoVariants', true),
      cleanTitles: getElementValue('cleanTitles', true),
      
      // Automation tab settings
      autoImportBtn: getElementValue('autoImportBtn', true),
      priceMonitoring: getElementValue('priceMonitoring', true),
      stockAlerts: getElementValue('stockAlerts', true),
      pushNotifications: getElementValue('pushNotifications', true),
      autoOrder: getElementValue('autoOrder', false),
      aiOptimization: getElementValue('aiOptimization', false),
      priceCheckInterval: getElementValue('priceCheckInterval', '30'),
      stockCheckInterval: getElementValue('stockCheckInterval', '60'),
      
      // Advanced tab settings
      debugMode: getElementValue('debugMode', false),
      showExtraction: getElementValue('showExtraction', false),
      
      // Legacy support (map to new names)
      autoPriceMonitoring: getElementValue('priceMonitoring', true),
      autoStockAlerts: getElementValue('stockAlerts', true),
      autoInjectButtons: getElementValue('autoImportBtn', true),
      minMargin: Number(getElementValue('marginMin', 30)) || 30,
      maxPrice: Number(getElementValue('marginMax', 100)) || 100
    };

    await storageSet(settings);

    try {
      if (settings.priceMonitoring) {
        const interval = parseInt(settings.priceCheckInterval) || 30;
        await alarmsCreate('priceMonitoring', { periodInMinutes: interval });
      } else {
        await alarmsClear('priceMonitoring');
      }

      if (settings.stockAlerts) {
        const interval = parseInt(settings.stockCheckInterval) || 60;
        await alarmsCreate('stockAlerts', { periodInMinutes: interval });
      } else {
        await alarmsClear('stockAlerts');
      }
    } catch (alarmError) {
      console.warn('[ShopOpti+] Alarm update warning:', alarmError);
    }

    updateConnectionStatus(!!settings.extensionToken);

    showNotification('Configuration sauvegardée!', 'success');
    console.log('[ShopOpti+] Settings saved:', settings);
  } catch (error) {
    console.error('[ShopOpti+] Error saving settings:', error);
    showNotification(`Erreur sauvegarde: ${error?.message || String(error)}`, 'error');
  }
}

async function resetSettings() {
  if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les configurations?')) {
    try {
      await storageSet(DEFAULT_SETTINGS);
      await loadSettings();
      showNotification('Configuration réinitialisée', 'info');
    } catch (error) {
      console.error('[ShopOpti+] Error resetting settings:', error);
      showNotification(`Erreur réinit: ${error?.message || String(error)}`, 'error');
    }
  }
}

async function clearAllData() {
  if (confirm('Êtes-vous sûr de vouloir effacer TOUTES les données? Cette action est irréversible.')) {
    try {
      await storageClear();
      await storageSet(DEFAULT_SETTINGS);
      await loadSettings();
      await loadStats();
      showNotification('Toutes les données effacées', 'info');
    } catch (error) {
      console.error('[ShopOpti+] Error clearing data:', error);
      showNotification(`Erreur suppression: ${error?.message || String(error)}`, 'error');
    }
  }
}

async function exportSettings() {
  try {
    const settings = await storageGet(null);
    const exportData = { ...settings };
    delete exportData.extensionToken;

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shopopti-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    showNotification('Configuration exportée', 'success');
  } catch (error) {
    console.error('[ShopOpti+] Error exporting settings:', error);
    showNotification(`Erreur export: ${error?.message || String(error)}`, 'error');
  }
}

async function testConnection() {
  const btn = getElement('testConnection');
  if (!btn) return;
  
  const originalText = btn.textContent;
  
  try {
    // SECURITY: Avoid innerHTML - use safe DOM construction
    btn.textContent = '';
    const spinner = document.createElement('span');
    spinner.className = 'spinner';
    btn.appendChild(spinner);
    btn.appendChild(document.createTextNode(' Test...'));
    btn.disabled = true;
    
    const token = getElementValue('extensionToken', '');
    
    if (!token) {
      throw new Error('Token d\'extension requis');
    }
    
    const response = await fetch(`${API_URL}/extension-sync-realtime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-extension-token': token
      },
      body: JSON.stringify({ action: 'sync_status' })
    });
    
    if (response.ok) {
      updateConnectionStatus(true);
      showNotification('Connexion réussie!', 'success');
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Erreur HTTP: ${response.status}`);
    }
  } catch (error) {
    console.error('[ShopOpti+] Connection test error:', error);
    showNotification(`Échec: ${error.message}`, 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

// SAFE: Using textContent only - no innerHTML XSS risk
function showNotification(message, type = 'info') {
  document.querySelectorAll('.notification').forEach(n => n.remove());

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  // SECURITY: Use textContent to prevent XSS
  notification.textContent = `${icons[type] || ''} ${message}`;

  document.body.appendChild(notification);

  const ttl = type === 'error' ? 6000 : 3000;

  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => notification.remove(), 300);
  }, ttl);
}

const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
`;
document.head.appendChild(style);

console.log('[ShopOpti+] Options page loaded');