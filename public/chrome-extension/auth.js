// ShopOpti+ - Chrome Extension Authentication

document.addEventListener('DOMContentLoaded', async () => {
  const tokenInput = document.getElementById('tokenInput');
  const saveBtn = document.getElementById('saveBtn');
  const messageDiv = document.getElementById('message');
  const statusIndicator = document.getElementById('statusIndicator');
  const disconnectBtn = document.getElementById('disconnectBtn');
  const todayStats = document.getElementById('todayStats');
  
  // Load existing token
  const result = await chrome.storage.local.get(['extensionToken', 'userEmail', 'connectedAt']);
  if (result.extensionToken) {
    tokenInput.value = result.extensionToken;
    updateStatus('connected');
    showMessage('✓ Extension connectée', 'success');
    if (disconnectBtn) disconnectBtn.style.display = 'block';
    if (todayStats) todayStats.style.display = 'flex';
  }
  
  saveBtn.addEventListener('click', async () => {
    const token = tokenInput.value.trim();
    
    if (!token) {
      showMessage('Veuillez entrer un token', 'error');
      return;
    }
    
    // Accept multiple token formats:
    // 1. Standard UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    // 2. UUID with timestamp suffix: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-timestamp
    // 3. ext_ prefixed tokens: ext_xxxxx
    // More permissive regex to handle various formats
    const isValidToken = (t) => {
      // Check ext_ prefix
      if (t.startsWith('ext_')) return true;
      
      // Check UUID pattern (with optional suffix)
      const parts = t.split('-');
      if (parts.length >= 5) {
        // At least 5 parts for a valid UUID
        const uuidPart = parts.slice(0, 5).join('-');
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuidPart);
      }
      
      return false;
    };
    
    if (!isValidToken(token)) {
      showMessage('Format de token invalide. Le token doit être un UUID valide.', 'error');
      return;
    }
    
    try {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner"></span> Connexion...';
      updateStatus('connecting');
      
      // Test the token with the API
      const response = await fetch('https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/extension-sync-realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': token
        },
        body: JSON.stringify({
          action: 'sync_status'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Save token
        await chrome.storage.local.set({ 
          extensionToken: token,
          connectedAt: new Date().toISOString(),
          lastSync: new Date().toISOString()
        });
        
        updateStatus('connected');
        showMessage('✓ Connexion établie avec succès!', 'success');
        
        if (disconnectBtn) disconnectBtn.style.display = 'block';
        
        // Update stats display if available
        if (data.todayStats && todayStats) {
          updateStats(data.todayStats);
          todayStats.style.display = 'flex';
        }
        
        // Close after 2 seconds
        setTimeout(() => {
          window.close();
        }, 2000);
      } else {
        const error = await response.json().catch(() => ({ error: 'Erreur serveur' }));
        updateStatus('disconnected');
        showMessage('Erreur de connexion: ' + (error.error || 'Vérifiez votre token'), 'error');
      }
    } catch (error) {
      updateStatus('disconnected');
      showMessage('Erreur réseau: ' + error.message, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '🔗 Connecter l\'extension';
    }
  });
  
  // Disconnect button
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', async () => {
      await chrome.storage.local.remove(['extensionToken', 'connectedAt', 'lastSync', 'userEmail']);
      tokenInput.value = '';
      updateStatus('disconnected');
      showMessage('Extension déconnectée', 'info');
      disconnectBtn.style.display = 'none';
      if (todayStats) todayStats.style.display = 'none';
    });
  }
  
  function showMessage(text, type) {
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
    messageDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds for non-error messages
    if (type !== 'error') {
      setTimeout(() => {
        messageDiv.style.display = 'none';
      }, 5000);
    }
  }
  
  function updateStatus(status) {
    if (!statusIndicator) return;
    
    statusIndicator.className = `status-indicator ${status}`;
    
    const statusText = {
      'connected': '🟢 Connecté',
      'connecting': '🟡 Connexion...',
      'disconnected': '🔴 Déconnecté'
    };
    
    statusIndicator.textContent = statusText[status] || statusText.disconnected;
  }
  
  function updateStats(stats) {
    if (!todayStats || !stats) return;
    
    todayStats.innerHTML = `
      <div class="stat-item">
        <span class="stat-value">${stats.imports || 0}</span>
        <span class="stat-label">Imports</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${stats.successful || 0}</span>
        <span class="stat-label">Réussis</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${stats.pending || 0}</span>
        <span class="stat-label">En attente</span>
      </div>
    `;
  }
});
