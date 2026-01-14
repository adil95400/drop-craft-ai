// ShopOpti+ Chrome Extension - Authentication v3.0

const API_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';

document.addEventListener('DOMContentLoaded', async () => {
  const tokenInput = document.getElementById('tokenInput');
  const saveBtn = document.getElementById('saveBtn');
  const messageDiv = document.getElementById('message');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const disconnectBtn = document.getElementById('disconnectBtn');
  const getDashboard = document.getElementById('getDashboard');
  const statsConnected = document.getElementById('statsConnected');
  const authForm = document.getElementById('authForm');

  // Load existing token
  const result = await chrome.storage.local.get(['extensionToken', 'connectedAt']);
  
  if (result.extensionToken) {
    tokenInput.value = result.extensionToken;
    await verifyAndUpdateStatus(result.extensionToken);
  }

  // Form submit
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await connectExtension();
  });

  // Open dashboard
  getDashboard.addEventListener('click', () => {
    chrome.tabs.create({ 
      url: 'https://drop-craft-ai.lovable.app/integrations/extensions' 
    });
  });

  // Disconnect
  disconnectBtn.addEventListener('click', async () => {
    await chrome.storage.local.remove([
      'extensionToken', 
      'connectedAt', 
      'lastSync', 
      'userPlan',
      'stats'
    ]);
    
    tokenInput.value = '';
    updateStatus('disconnected');
    showMessage('Extension déconnectée', 'info');
    disconnectBtn.style.display = 'none';
    statsConnected.classList.remove('show');
  });

  async function connectExtension() {
    const token = tokenInput.value.trim();
    
    if (!token) {
      showMessage('Veuillez entrer un token', 'error');
      return;
    }

    // Validate token format
    if (!isValidToken(token)) {
      showMessage('Format de token invalide. Vérifiez votre token.', 'error');
      return;
    }

    try {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner"></span> Connexion...';
      updateStatus('connecting');

      const response = await fetch(`${API_URL}/extension-sync-realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': token
        },
        body: JSON.stringify({ action: 'sync_status' })
      });

      if (response.ok) {
        const data = await response.json();

        // Save token and connection info
        await chrome.storage.local.set({
          extensionToken: token,
          connectedAt: new Date().toISOString(),
          lastSync: new Date().toISOString(),
          userPlan: data.userPlan || 'free',
          stats: data.todayStats || { products: 0, reviews: 0, monitored: 0 }
        });

        updateStatus('connected');
        showMessage('✓ Connexion établie avec succès!', 'success');
        disconnectBtn.style.display = 'flex';

        // Show stats
        if (data.todayStats) {
          document.getElementById('statImports').textContent = data.todayStats.imports || 0;
          document.getElementById('statReviews').textContent = data.todayStats.reviews || 0;
          document.getElementById('statMonitored').textContent = data.todayStats.monitored || 0;
          statsConnected.classList.add('show');
        }

        // Close after delay
        setTimeout(() => window.close(), 2500);
      } else {
        const error = await response.json().catch(() => ({ error: 'Erreur serveur' }));
        updateStatus('disconnected');
        showMessage('Erreur: ' + (error.error || 'Token invalide ou expiré'), 'error');
      }
    } catch (error) {
      updateStatus('disconnected');
      showMessage('Erreur réseau: ' + error.message, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span>🔗</span><span>Connecter l\'Extension</span>';
    }
  }

  async function verifyAndUpdateStatus(token) {
    try {
      updateStatus('connecting');

      const response = await fetch(`${API_URL}/extension-sync-realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': token
        },
        body: JSON.stringify({ action: 'sync_status' })
      });

      if (response.ok) {
        const data = await response.json();
        
        updateStatus('connected');
        disconnectBtn.style.display = 'flex';

        // Update stats
        if (data.todayStats) {
          document.getElementById('statImports').textContent = data.todayStats.imports || 0;
          document.getElementById('statReviews').textContent = data.todayStats.reviews || 0;
          document.getElementById('statMonitored').textContent = data.todayStats.monitored || 0;
          statsConnected.classList.add('show');
        }

        // Update stored plan
        if (data.userPlan) {
          await chrome.storage.local.set({ userPlan: data.userPlan });
        }
      } else {
        updateStatus('disconnected');
      }
    } catch (error) {
      console.error('Verification error:', error);
      updateStatus('disconnected');
    }
  }

  function isValidToken(token) {
    // Accept multiple token formats:
    // 1. ext_ prefixed tokens: ext_xxxxx...
    // 2. Standard UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    // 3. UUID with suffix: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-timestamp
    // 4. Simple alphanumeric tokens (32+ chars)
    
    if (!token || token.length < 20) return false;

    // ext_ prefix
    if (token.startsWith('ext_')) return true;

    // UUID pattern (with optional suffix)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    if (uuidPattern.test(token)) return true;

    // Alphanumeric token (32+ chars)
    if (/^[a-zA-Z0-9_-]{32,}$/.test(token)) return true;

    return false;
  }

  function updateStatus(status) {
    if (!statusIndicator) return;

    statusIndicator.className = 'status-indicator';
    
    const statusMessages = {
      'connected': { text: 'Connecté', class: 'connected' },
      'connecting': { text: 'Connexion...', class: '' },
      'disconnected': { text: 'Déconnecté', class: '' }
    };

    const statusInfo = statusMessages[status] || statusMessages.disconnected;
    
    if (statusInfo.class) {
      statusIndicator.classList.add(statusInfo.class);
    }
    
    if (statusText) {
      statusText.textContent = statusInfo.text;
    }
  }

  function showMessage(text, type) {
    if (!messageDiv) return;

    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;

    if (type !== 'error') {
      setTimeout(() => {
        messageDiv.className = 'message';
      }, 5000);
    }
  }
});
