// Options Page Script
const DEFAULT_SETTINGS = {
  apiUrl: 'https://dtozyrmmekdnvekissuh.supabase.co',
  apiKey: '',
  autoPriceMonitoring: false,
  autoStockAlerts: false,
  autoOrderEnabled: false,
  pushNotifications: true,
  minMargin: 30,
  maxPrice: 100,
  minRating: 4,
  excludeKeywords: '',
  importDelay: 2,
  maxConcurrent: 5,
  debugMode: false
};

// Load settings on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
});

// Load settings from storage
async function loadSettings() {
  try {
    const settings = await chrome.storage.local.get(DEFAULT_SETTINGS);
    
    // Populate form fields
    document.getElementById('apiUrl').value = settings.apiUrl || DEFAULT_SETTINGS.apiUrl;
    document.getElementById('apiKey').value = settings.apiKey || '';
    document.getElementById('autoPriceMonitoring').checked = settings.autoPriceMonitoring || false;
    document.getElementById('autoStockAlerts').checked = settings.autoStockAlerts || false;
    document.getElementById('autoOrderEnabled').checked = settings.autoOrderEnabled || false;
    document.getElementById('pushNotifications').checked = settings.pushNotifications !== false;
    document.getElementById('minMargin').value = settings.minMargin || 30;
    document.getElementById('maxPrice').value = settings.maxPrice || 100;
    document.getElementById('minRating').value = settings.minRating || 4;
    document.getElementById('excludeKeywords').value = settings.excludeKeywords || '';
    document.getElementById('importDelay').value = settings.importDelay || 2;
    document.getElementById('maxConcurrent').value = settings.maxConcurrent || 5;
    document.getElementById('debugMode').checked = settings.debugMode || false;
    
    console.log('Settings loaded');
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('resetSettings').addEventListener('click', resetSettings);
  document.getElementById('exportSettings').addEventListener('click', exportSettings);
  document.getElementById('testConnection').addEventListener('click', testConnection);
  
  // Auto-save on change for toggles
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', saveSettings);
  });
}

// Save settings
async function saveSettings() {
  try {
    const settings = {
      apiUrl: document.getElementById('apiUrl').value,
      apiKey: document.getElementById('apiKey').value,
      autoPriceMonitoring: document.getElementById('autoPriceMonitoring').checked,
      autoStockAlerts: document.getElementById('autoStockAlerts').checked,
      autoOrderEnabled: document.getElementById('autoOrderEnabled').checked,
      pushNotifications: document.getElementById('pushNotifications').checked,
      minMargin: parseFloat(document.getElementById('minMargin').value) || 30,
      maxPrice: parseFloat(document.getElementById('maxPrice').value) || 100,
      minRating: parseFloat(document.getElementById('minRating').value) || 4,
      excludeKeywords: document.getElementById('excludeKeywords').value,
      importDelay: parseInt(document.getElementById('importDelay').value) || 2,
      maxConcurrent: parseInt(document.getElementById('maxConcurrent').value) || 5,
      debugMode: document.getElementById('debugMode').checked
    };
    
    await chrome.storage.local.set(settings);
    
    // Send message to background script to update alarms
    await chrome.runtime.sendMessage({ 
      action: 'updateSettings', 
      settings 
    });
    
    showNotification('✅ Configuration sauvegardée avec succès!', 'success');
    console.log('Settings saved:', settings);
  } catch (error) {
    console.error('Error saving settings:', error);
    showNotification('❌ Erreur lors de la sauvegarde', 'error');
  }
}

// Reset settings
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

// Export settings
async function exportSettings() {
  try {
    const settings = await chrome.storage.local.get(DEFAULT_SETTINGS);
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dropcraft-ai-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('📥 Configuration exportée', 'success');
  } catch (error) {
    console.error('Error exporting settings:', error);
    showNotification('❌ Erreur lors de l\'export', 'error');
  }
}

// Test connection
async function testConnection() {
  const btn = document.getElementById('testConnection');
  const originalText = btn.textContent;
  
  try {
    btn.textContent = 'Test en cours...';
    btn.disabled = true;
    
    const apiUrl = document.getElementById('apiUrl').value;
    const apiKey = document.getElementById('apiKey').value;
    
    if (!apiUrl || !apiKey) {
      throw new Error('URL et Clé API requises');
    }
    
    const response = await fetch(`${apiUrl}/functions/v1/extension-sync-realtime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({ action: 'ping' })
    });
    
    if (response.ok) {
      showNotification('✅ Connexion réussie!', 'success');
    } else {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
  } catch (error) {
    console.error('Connection test error:', error);
    showNotification(`❌ Échec de connexion: ${error.message}`, 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

console.log('Options page loaded');
