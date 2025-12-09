// ShopOpti+ Chrome Extension - Options Script v3.0

const DEFAULT_SETTINGS = {
  apiUrl: 'https://dtozyrmmekdnvekissuh.supabase.co',
  extensionToken: '',
  autoPriceMonitoring: false,
  autoStockAlerts: false,
  autoInjectButtons: true,
  pushNotifications: true,
  minMargin: 30,
  maxPrice: 100,
  minRating: 4,
  excludeKeywords: '',
  importDelay: 2,
  debugMode: false
};

// Load settings on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
});

async function loadSettings() {
  try {
    const settings = await chrome.storage.local.get({
      ...DEFAULT_SETTINGS,
      extensionToken: ''
    });
    
    // Populate form fields
    document.getElementById('apiUrl').value = settings.apiUrl || DEFAULT_SETTINGS.apiUrl;
    document.getElementById('extensionToken').value = settings.extensionToken || '';
    document.getElementById('autoPriceMonitoring').checked = settings.autoPriceMonitoring || false;
    document.getElementById('autoStockAlerts').checked = settings.autoStockAlerts || false;
    document.getElementById('autoInjectButtons').checked = settings.autoInjectButtons !== false;
    document.getElementById('pushNotifications').checked = settings.pushNotifications !== false;
    document.getElementById('minMargin').value = settings.minMargin || 30;
    document.getElementById('maxPrice').value = settings.maxPrice || 100;
    document.getElementById('minRating').value = settings.minRating || 4;
    document.getElementById('excludeKeywords').value = settings.excludeKeywords || '';
    document.getElementById('importDelay').value = settings.importDelay || 2;
    document.getElementById('debugMode').checked = settings.debugMode || false;
    
    console.log('Settings loaded');
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

function setupEventListeners() {
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('resetSettings').addEventListener('click', resetSettings);
  document.getElementById('exportSettings').addEventListener('click', exportSettings);
  document.getElementById('testConnection').addEventListener('click', testConnection);
  
  // Auto-save on toggle change
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', saveSettings);
  });
}

async function saveSettings() {
  try {
    const settings = {
      apiUrl: document.getElementById('apiUrl').value,
      extensionToken: document.getElementById('extensionToken').value,
      autoPriceMonitoring: document.getElementById('autoPriceMonitoring').checked,
      autoStockAlerts: document.getElementById('autoStockAlerts').checked,
      autoInjectButtons: document.getElementById('autoInjectButtons').checked,
      pushNotifications: document.getElementById('pushNotifications').checked,
      minMargin: parseFloat(document.getElementById('minMargin').value) || 30,
      maxPrice: parseFloat(document.getElementById('maxPrice').value) || 100,
      minRating: parseFloat(document.getElementById('minRating').value) || 4,
      excludeKeywords: document.getElementById('excludeKeywords').value,
      importDelay: parseInt(document.getElementById('importDelay').value) || 2,
      debugMode: document.getElementById('debugMode').checked
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
    
    showNotification('✅ Configuration sauvegardée!', 'success');
    console.log('Settings saved:', settings);
  } catch (error) {
    console.error('Error saving settings:', error);
    showNotification('❌ Erreur lors de la sauvegarde', 'error');
  }
}

async function resetSettings() {
  if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les configurations?')) {
    try {
      await chrome.storage.local.set(DEFAULT_SETTINGS);
      await loadSettings();
      showNotification('🔄 Configuration réinitialisée', 'info');
    } catch (error) {
      console.error('Error resetting settings:', error);
      showNotification('❌ Erreur lors de la réinitialisation', 'error');
    }
  }
}

async function exportSettings() {
  try {
    const settings = await chrome.storage.local.get(DEFAULT_SETTINGS);
    
    // Remove sensitive data
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
    
    showNotification('📥 Configuration exportée', 'success');
  } catch (error) {
    console.error('Error exporting settings:', error);
    showNotification('❌ Erreur lors de l\'export', 'error');
  }
}

async function testConnection() {
  const btn = document.getElementById('testConnection');
  const originalContent = btn.innerHTML;
  
  try {
    btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.8s linear infinite;"></span> Test...';
    btn.disabled = true;
    
    const token = document.getElementById('extensionToken').value;
    
    if (!token) {
      throw new Error('Token d\'extension requis');
    }
    
    const response = await fetch('https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/extension-sync-realtime', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-extension-token': token
      },
      body: JSON.stringify({ action: 'sync_status' })
    });
    
    if (response.ok) {
      showNotification('✅ Connexion réussie!', 'success');
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Erreur HTTP: ${response.status}`);
    }
  } catch (error) {
    console.error('Connection test error:', error);
    showNotification(`❌ Échec: ${error.message}`, 'error');
  } finally {
    btn.innerHTML = originalContent;
    btn.disabled = false;
  }
}

function showNotification(message, type = 'info') {
  // Remove existing notifications
  document.querySelectorAll('.notification').forEach(n => n.remove());
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
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
`;
document.head.appendChild(style);

console.log('ShopOpti+ Options page loaded');
