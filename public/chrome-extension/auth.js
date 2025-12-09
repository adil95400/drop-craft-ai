// Drop Craft AI - Chrome Extension Authentication

document.addEventListener('DOMContentLoaded', async () => {
  const tokenInput = document.getElementById('tokenInput');
  const saveBtn = document.getElementById('saveBtn');
  const messageDiv = document.getElementById('message');
  const statusIndicator = document.getElementById('statusIndicator');
  
  // Load existing token
  const result = await chrome.storage.local.get(['extensionToken', 'userEmail']);
  if (result.extensionToken) {
    tokenInput.value = result.extensionToken;
    updateStatus('connected');
    showMessage('✓ Token déjà configuré', 'success');
  }
  
  saveBtn.addEventListener('click', async () => {
    const token = tokenInput.value.trim();
    
    if (!token) {
      showMessage('Veuillez entrer un token', 'error');
      return;
    }
    
    // Accept UUID format (standard) and ext_ format
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(-\d+)?$/i;
    const extPattern = /^ext_/;
    
    if (!uuidPattern.test(token) && !extPattern.test(token)) {
      showMessage('Format de token invalide. Utilisez le token généré depuis l\'application.', 'error');
      return;
    }
    
    try {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner"></span> Vérification...';
      updateStatus('connecting');
      
      // Test the token
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
        
        // Update stats display if available
        if (data.todayStats) {
          updateStats(data.todayStats);
        }
        
        // Close after 2 seconds
        setTimeout(() => {
          window.close();
        }, 2000);
      } else {
        const error = await response.json().catch(() => ({ error: 'Erreur serveur' }));
        updateStatus('disconnected');
        showMessage('Token invalide: ' + (error.error || 'Erreur inconnue'), 'error');
      }
    } catch (error) {
      updateStatus('disconnected');
      showMessage('Erreur de connexion: ' + error.message, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '🔗 Connecter l\'extension';
    }
  });
  
  // Disconnect button
  const disconnectBtn = document.getElementById('disconnectBtn');
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', async () => {
      await chrome.storage.local.remove(['extensionToken', 'connectedAt', 'lastSync']);
      tokenInput.value = '';
      updateStatus('disconnected');
      showMessage('Extension déconnectée', 'info');
    });
  }
  
  function showMessage(text, type) {
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
    messageDiv.style.display = 'block';
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
    const statsContainer = document.getElementById('todayStats');
    if (statsContainer && stats) {
      statsContainer.innerHTML = `
        <div class="stat-item">
          <span class="stat-value">${stats.imports || 0}</span>
          <span class="stat-label">Imports aujourd'hui</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.successful || 0}</span>
          <span class="stat-label">Réussis</span>
        </div>
      `;
    }
  }
});
