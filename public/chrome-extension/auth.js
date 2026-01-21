// Drop Craft AI Chrome Extension - Authentication v4.0
// Professional authentication with enhanced UX

const CONFIG = {
  API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
  APP_URL: 'https://shopopti.io',
  VERSION: '4.0.0'
};

class DropCraftAuth {
  constructor() {
    this.elements = {};
    this.isConnected = false;
    this.token = null;
    
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.cacheElements();
      this.bindEvents();
      this.loadStoredData();
    });
  }

  cacheElements() {
    this.elements = {
      statusCard: document.getElementById('statusCard'),
      statusText: document.getElementById('statusText'),
      statusInfo: document.getElementById('statusInfo'),
      statsGrid: document.getElementById('statsGrid'),
      featuresGrid: document.getElementById('featuresGrid'),
      messageToast: document.getElementById('messageToast'),
      tokenInput: document.getElementById('tokenInput'),
      connectBtn: document.getElementById('connectBtn'),
      formSection: document.getElementById('formSection'),
      connectedActions: document.getElementById('connectedActions'),
      dashboardBtn: document.getElementById('dashboardBtn'),
      settingsBtn: document.getElementById('settingsBtn'),
      disconnectBtn: document.getElementById('disconnectBtn'),
      helpSection: document.getElementById('helpSection'),
      statImports: document.getElementById('statImports'),
      statReviews: document.getElementById('statReviews'),
      statMonitored: document.getElementById('statMonitored')
    };
  }

  bindEvents() {
    // Connect button
    this.elements.connectBtn?.addEventListener('click', () => this.connect());
    
    // Enter key on input
    this.elements.tokenInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.connect();
    });
    
    // Dashboard button
    this.elements.dashboardBtn?.addEventListener('click', () => {
      chrome.tabs.create({ url: `${CONFIG.APP_URL}/dashboard` });
    });
    
    // Settings button
    this.elements.settingsBtn?.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
    
    // Disconnect button
    this.elements.disconnectBtn?.addEventListener('click', () => this.disconnect());
    
    // Real-time validation
    this.elements.tokenInput?.addEventListener('input', (e) => {
      this.validateTokenFormat(e.target.value);
    });
  }

  async loadStoredData() {
    try {
      const result = await chrome.storage.local.get([
        'extensionToken',
        'connectedAt',
        'lastSync',
        'userPlan',
        'stats'
      ]);
      
      if (result.extensionToken) {
        this.token = result.extensionToken;
        this.elements.tokenInput.value = this.token;
        await this.verifyConnection();
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  }

  async connect() {
    const token = this.elements.tokenInput?.value.trim();
    
    if (!token) {
      this.showMessage('Veuillez entrer votre clé d\'extension', 'error');
      this.shakeInput();
      return;
    }
    
    if (!this.isValidToken(token)) {
      this.showMessage('Format de clé invalide. Vérifiez votre clé.', 'error');
      this.shakeInput();
      return;
    }
    
    this.setLoading(true);
    this.updateStatus('connecting', 'Connexion en cours...', 'Vérification de la clé...');
    
    try {
      const response = await fetch(`${CONFIG.API_URL}/extension-sync-realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': token
        },
        body: JSON.stringify({ action: 'sync_status' })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Save token and data
        await chrome.storage.local.set({
          extensionToken: token,
          connectedAt: new Date().toISOString(),
          lastSync: new Date().toISOString(),
          userPlan: data.userPlan || 'free',
          stats: data.todayStats || { imports: 0, reviews: 0, monitored: 0 }
        });
        
        this.token = token;
        this.isConnected = true;
        
        this.showMessage('✓ Connexion réussie!', 'success');
        this.updateUI(true, data.todayStats);
        
        // Animate success
        this.celebrateConnection();
        
        // Auto close after success
        setTimeout(() => window.close(), 2000);
      } else {
        const error = await response.json().catch(() => ({ error: 'Erreur serveur' }));
        throw new Error(error.error || 'Clé invalide ou expirée');
      }
    } catch (error) {
      this.showMessage(`Erreur: ${error.message}`, 'error');
      this.updateStatus('disconnected', 'Échec de connexion', error.message);
    } finally {
      this.setLoading(false);
    }
  }

  async verifyConnection() {
    this.updateStatus('connecting', 'Vérification...', 'Connexion au serveur...');
    
    try {
      const response = await fetch(`${CONFIG.API_URL}/extension-sync-realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': this.token
        },
        body: JSON.stringify({ action: 'sync_status' })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Update stored data
        await chrome.storage.local.set({
          lastSync: new Date().toISOString(),
          userPlan: data.userPlan || 'free',
          stats: data.todayStats || { imports: 0, reviews: 0, monitored: 0 }
        });
        
        this.isConnected = true;
        this.updateUI(true, data.todayStats);
      } else {
        throw new Error('Token expired');
      }
    } catch (error) {
      console.error('Verification failed:', error);
      this.updateUI(false);
    }
  }

  async disconnect() {
    try {
      await chrome.storage.local.remove([
        'extensionToken',
        'connectedAt',
        'lastSync',
        'userPlan',
        'stats'
      ]);
      
      this.token = null;
      this.isConnected = false;
      this.elements.tokenInput.value = '';
      
      this.showMessage('Extension déconnectée', 'info');
      this.updateUI(false);
    } catch (error) {
      this.showMessage('Erreur lors de la déconnexion', 'error');
    }
  }

  updateUI(connected, stats = null) {
    const { 
      statusCard, formSection, connectedActions, 
      helpSection, statsGrid, featuresGrid 
    } = this.elements;
    
    if (connected) {
      statusCard.classList.add('connected');
      statusCard.classList.remove('connecting');
      formSection.style.display = 'none';
      connectedActions.style.display = 'flex';
      helpSection.style.display = 'none';
      statsGrid.classList.add('show');
      featuresGrid.style.display = 'none';
      
      this.updateStatus('connected', 'Connecté', 'Extension active');
      
      if (stats) {
        this.elements.statImports.textContent = stats.imports || 0;
        this.elements.statReviews.textContent = stats.reviews || 0;
        this.elements.statMonitored.textContent = stats.monitored || 0;
      }
    } else {
      statusCard.classList.remove('connected', 'connecting');
      formSection.style.display = 'flex';
      connectedActions.style.display = 'none';
      helpSection.style.display = 'block';
      statsGrid.classList.remove('show');
      featuresGrid.style.display = 'grid';
      
      this.updateStatus('disconnected', 'Non connecté', 'Entrez votre clé pour démarrer');
    }
  }

  updateStatus(status, text, info) {
    const { statusCard, statusText, statusInfo } = this.elements;
    
    statusCard.classList.remove('connected', 'connecting');
    
    if (status === 'connected') {
      statusCard.classList.add('connected');
    } else if (status === 'connecting') {
      statusCard.classList.add('connecting');
    }
    
    if (text) statusText.textContent = text;
    if (info) statusInfo.textContent = info;
  }

  showMessage(text, type = 'info') {
    const { messageToast } = this.elements;
    
    messageToast.textContent = text;
    messageToast.className = `message-toast show ${type}`;
    
    // Auto-hide after 5 seconds (except for errors)
    if (type !== 'error') {
      setTimeout(() => {
        messageToast.classList.remove('show');
      }, 5000);
    }
  }

  setLoading(loading) {
    const { connectBtn } = this.elements;
    
    if (loading) {
      connectBtn.disabled = true;
      connectBtn.innerHTML = '<span class="spinner"></span><span>Connexion...</span>';
    } else {
      connectBtn.disabled = false;
      connectBtn.innerHTML = '<span>🔗</span><span>Connecter l\'extension</span>';
    }
  }

  isValidToken(token) {
    if (!token || token.length < 20) return false;
    
    // ext_ prefix
    if (token.startsWith('ext_')) return true;
    
    // UUID pattern
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    if (uuidPattern.test(token)) return true;
    
    // Alphanumeric token (32+ chars)
    if (/^[a-zA-Z0-9_-]{32,}$/.test(token)) return true;
    
    return false;
  }

  validateTokenFormat(token) {
    const input = this.elements.tokenInput;
    
    if (!token) {
      input.style.borderColor = '';
      return;
    }
    
    if (this.isValidToken(token)) {
      input.style.borderColor = 'var(--dc-success)';
    } else if (token.length > 10) {
      input.style.borderColor = 'var(--dc-error)';
    } else {
      input.style.borderColor = '';
    }
  }

  shakeInput() {
    const input = this.elements.tokenInput;
    input.style.animation = 'shake 0.5s ease';
    setTimeout(() => {
      input.style.animation = '';
    }, 500);
  }

  celebrateConnection() {
    // Add confetti or celebration effect
    const celebration = document.createElement('div');
    celebration.innerHTML = '🎉';
    celebration.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 80px;
      animation: celebrate 1s ease forwards;
      pointer-events: none;
      z-index: 9999;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes celebrate {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-5px); }
        40%, 80% { transform: translateX(5px); }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(celebration);
    
    setTimeout(() => {
      celebration.remove();
    }, 1000);
  }
}

// Initialize
new DropCraftAuth();
