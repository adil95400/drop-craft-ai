// Drop Craft AI Chrome Extension - Options Script v4.0

const API_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';
const APP_URL = 'https://drop-craft-ai.lovable.app';

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

// Safe element getter
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
    return parseFloat(el.value) || defaultValue;
  }
  return el.value || defaultValue;
}

// Load settings on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadStats();
  setupEventListeners();
});

async function loadSettings() {
  try {
    const settings = await chrome.storage.local.get({
      ...DEFAULT_SETTINGS,
      extensionToken: ''
    });
    
    // Populate form fields safely
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
    
    // Update connection status
    updateConnectionStatus(!!settings.extensionToken);
    
    console.log('[DropCraft] Settings loaded');
  } catch (error) {
    console.error('[DropCraft] Error loading settings:', error);
  }
}

async function loadStats() {
  try {
    const { stats } = await chrome.storage.local.get(['stats']);
    
    const statProducts = getElement('statProducts');
    const statReviews = getElement('statReviews');
    const statMonitored = getElement('statMonitored');
    
    if (statProducts) statProducts.textContent = stats?.products || 0;
    if (statReviews) statReviews.textContent = stats?.reviews || 0;
    if (statMonitored) statMonitored.textContent = stats?.monitored || 0;
  } catch (error) {
    console.error('[DropCraft] Error loading stats:', error);
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
  // Safe event listener attachment
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
  
  // Auto-save on toggle change
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', saveSettings);
  });
}

async function toggleConnection() {
  const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
  
  if (extensionToken) {
    // Disconnect
    await chrome.storage.local.remove(['extensionToken']);
    setElementValue('extensionToken', '');
    updateConnectionStatus(false);
    showNotification('Déconnecté', 'info');
  } else {
    // Open app to connect
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
      minMargin: getElementValue('minMargin', 30),
      maxPrice: getElementValue('maxPrice', 100),
      minRating: getElementValue('minRating', 4),
      excludeKeywords: getElementValue('excludeKeywords', ''),
      includeCategories: getElementValue('includeCategories', ''),
      importDelay: parseInt(getElementValue('importDelay', 2)) || 2,
      maxConcurrent: parseInt(getElementValue('maxConcurrent', 5)) || 5,
      debugMode: getElementValue('debugMode', false),
      powerSaveMode: getElementValue('powerSaveMode', false)
    };
    
    await chrome.storage.local.set(settings);
    
    // Update alarms based on settings
    if (settings.autoPriceMonitoring) {
      chrome.alarms.create('priceMonitoring', { periodInMinutes: 30 });
    } else {
      chrome.alarms.clear('priceMonitoring');
    }
    
    if (settings.autoStockAlerts) {
      chrome.alarms.create('stockAlerts', { periodInMinutes: 15 });
    } else {
      chrome.alarms.clear('stockAlerts');
    }
    
    // Update connection status
    updateConnectionStatus(!!settings.extensionToken);
    
    showNotification('Configuration sauvegardée!', 'success');
    console.log('[DropCraft] Settings saved:', settings);
  } catch (error) {
    console.error('[DropCraft] Error saving settings:', error);
    showNotification('Erreur lors de la sauvegarde', 'error');
  }
}

async function resetSettings() {
  if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les configurations?')) {
    try {
      await chrome.storage.local.set(DEFAULT_SETTINGS);
      await loadSettings();
      showNotification('Configuration réinitialisée', 'info');
    } catch (error) {
      console.error('[DropCraft] Error resetting settings:', error);
      showNotification('Erreur lors de la réinitialisation', 'error');
    }
  }
}

async function clearAllData() {
  if (confirm('Êtes-vous sûr de vouloir effacer TOUTES les données? Cette action est irréversible.')) {
    try {
      await chrome.storage.local.clear();
      await chrome.storage.local.set(DEFAULT_SETTINGS);
      await loadSettings();
      await loadStats();
      showNotification('Toutes les données effacées', 'info');
    } catch (error) {
      console.error('[DropCraft] Error clearing data:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  }
}

async function exportSettings() {
  try {
    const settings = await chrome.storage.local.get(null);
    
    // Remove sensitive data
    const exportData = { ...settings };
    delete exportData.extensionToken;
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dropcraft-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification('Configuration exportée', 'success');
  } catch (error) {
    console.error('[DropCraft] Error exporting settings:', error);
    showNotification('Erreur lors de l\'export', 'error');
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
    console.error('[DropCraft] Connection test error:', error);
    showNotification(`Échec: ${error.message}`, 'error');
  } finally {
    btn.innerHTML = originalContent;
    btn.disabled = false;
  }
}

function showNotification(message, type = 'info') {
  // Remove existing notifications
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
  
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add spinner animation
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

console.log('[DropCraft] Options page loaded');
