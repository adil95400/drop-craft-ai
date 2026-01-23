// ShopOpti+ Chrome Extension - Options Script v4.3.9

const API_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';
const APP_URL = 'https://shopopti.io';

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
});

async function loadSettings() {
  try {
    const settings = await storageGet({
      ...DEFAULT_SETTINGS,
      extensionToken: ''
    });

    setElementValue('apiUrl', settings.apiUrl || DEFAULT_SETTINGS.apiUrl);
    setElementValue('extensionToken', settings.extensionToken || '');
    setElementValue('autoPriceMonitoring', settings.autoPriceMonitoring);
    setElementValue('autoStockAlerts', settings.autoStockAlerts);
    setElementValue('autoInjectButtons', settings.autoInjectButtons !== false);
    setElementValue('autoShowSidebar', settings.autoShowSidebar);
    setElementValue('pushNotifications', settings.pushNotifications !== false);
    setElementValue('minMargin', settings.minMargin || 30);
    setElementValue('maxPrice', settings.maxPrice || 100);
    setElementValue('minRating', settings.minRating || 4);
    setElementValue('excludeKeywords', settings.excludeKeywords || '');
    setElementValue('includeCategories', settings.includeCategories || '');
    setElementValue('importDelay', settings.importDelay || 2);
    setElementValue('maxConcurrent', settings.maxConcurrent || 5);
    setElementValue('debugMode', settings.debugMode);
    setElementValue('powerSaveMode', settings.powerSaveMode);

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

    if (statProducts) statProducts.textContent = stats?.products || 0;
    if (statReviews) statReviews.textContent = stats?.reviews || 0;
    if (statMonitored) statMonitored.textContent = stats?.monitored || 0;
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
      autoPriceMonitoring: getElementValue('autoPriceMonitoring', false),
      autoStockAlerts: getElementValue('autoStockAlerts', false),
      autoInjectButtons: getElementValue('autoInjectButtons', true),
      autoShowSidebar: getElementValue('autoShowSidebar', false),
      pushNotifications: getElementValue('pushNotifications', true),
      minMargin: Number(getElementValue('minMargin', 30)) || 30,
      maxPrice: Number(getElementValue('maxPrice', 100)) || 100,
      minRating: Number(getElementValue('minRating', 4)) || 4,
      excludeKeywords: getElementValue('excludeKeywords', ''),
      includeCategories: getElementValue('includeCategories', ''),
      importDelay: parseInt(String(getElementValue('importDelay', 2)), 10) || 2,
      maxConcurrent: parseInt(String(getElementValue('maxConcurrent', 5)), 10) || 5,
      debugMode: getElementValue('debugMode', false),
      powerSaveMode: getElementValue('powerSaveMode', false)
    };

    await storageSet(settings);

    try {
      if (settings.autoPriceMonitoring) {
        await alarmsCreate('priceMonitoring', { periodInMinutes: 30 });
      } else {
        await alarmsClear('priceMonitoring');
      }

      if (settings.autoStockAlerts) {
        await alarmsCreate('stockAlerts', { periodInMinutes: 15 });
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
  
  const originalContent = btn.innerHTML;
  
  try {
    btn.innerHTML = '<span class="spinner"></span> Test...';
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
    btn.innerHTML = originalContent;
    btn.disabled = false;
  }
}

function showNotification(message, type = 'info') {
  document.querySelectorAll('.notification').forEach(n => n.remove());

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
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