// Shopopti+ Chrome Extension - Authentication v4.3.6
// Connexion 100% dans l'extension (email/password + token)

const CONFIG = {
  SUPABASE_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzbXdja3pybXFlY3d3cnN3d3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjY0NDEsImV4cCI6MjA4MTc0MjQ0MX0.jhrwOY7-tKeNF54E3Ec6yRzjmTW8zJyKuE9R4rvi41I',
  API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
  APP_URL: 'https://drop-craft-ai.lovable.app',
  VERSION: chrome.runtime?.getManifest?.()?.version || '4.3.6'
};

class ShopoptiAuth {
  constructor() {
    this.elements = {};
    this.isConnected = false;
    this.token = null;
    this.currentTab = 'email';
    
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.cacheElements();
      this.bindEvents();
      this.loadStoredData();
      this.updateVersion();
    });
  }

  updateVersion() {
    const badge = document.getElementById('versionBadge');
    if (badge) badge.textContent = `v${CONFIG.VERSION}`;
  }

  cacheElements() {
    this.elements = {
      statusCard: document.getElementById('statusCard'),
      statusText: document.getElementById('statusText'),
      statusInfo: document.getElementById('statusInfo'),
      statsGrid: document.getElementById('statsGrid'),
      messageToast: document.getElementById('messageToast'),
      authTabs: document.getElementById('authTabs'),
      panelEmail: document.getElementById('panelEmail'),
      panelToken: document.getElementById('panelToken'),
      emailInput: document.getElementById('emailInput'),
      passwordInput: document.getElementById('passwordInput'),
      loginBtn: document.getElementById('loginBtn'),
      signupBtn: document.getElementById('signupBtn'),
      tokenInput: document.getElementById('tokenInput'),
      connectBtn: document.getElementById('connectBtn'),
      connectedActions: document.getElementById('connectedActions'),
      dashboardBtn: document.getElementById('dashboardBtn'),
      settingsBtn: document.getElementById('settingsBtn'),
      disconnectBtn: document.getElementById('disconnectBtn'),
      statImports: document.getElementById('statImports'),
      statReviews: document.getElementById('statReviews'),
      statMonitored: document.getElementById('statMonitored')
    };
  }

  bindEvents() {
    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
    
    // Login button
    this.elements.loginBtn?.addEventListener('click', () => this.loginWithEmail());
    
    // Signup button
    this.elements.signupBtn?.addEventListener('click', () => this.signupWithEmail());
    
    // Connect with token button
    this.elements.connectBtn?.addEventListener('click', () => this.connectWithToken());
    
    // Enter key on inputs
    this.elements.emailInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.elements.passwordInput?.focus();
    });
    
    this.elements.passwordInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.loginWithEmail();
    });
    
    this.elements.tokenInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.connectWithToken();
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
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Update panels
    this.elements.panelEmail?.classList.toggle('active', tabName === 'email');
    this.elements.panelToken?.classList.toggle('active', tabName === 'token');
  }

  async loadStoredData() {
    try {
      const result = await chrome.storage.local.get([
        'extensionToken',
        'connectedAt',
        'lastSync',
        'userEmail',
        'stats'
      ]);
      
      if (result.extensionToken) {
        this.token = result.extensionToken;
        await this.verifyConnection();
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  }

  // ===== Email/Password Authentication =====
  
  async loginWithEmail() {
    const email = this.elements.emailInput?.value.trim();
    const password = this.elements.passwordInput?.value;
    
    if (!email || !password) {
      this.showMessage('Veuillez remplir tous les champs', 'error');
      return;
    }
    
    this.setLoading(this.elements.loginBtn, true, 'Connexion...');
    this.updateStatus('connecting', 'Connexion en cours...', 'Vérification des identifiants...');
    
    try {
      // Call Supabase Auth directly
      const response = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error_description || data.msg || 'Identifiants invalides');
      }
      
      // We have a valid session, now get or create extension token
      const accessToken = data.access_token;
      const userId = data.user?.id;
      
      if (!userId) {
        throw new Error('Impossible de récupérer l\'utilisateur');
      }
      
      // Get or create extension token via edge function
      const tokenResponse = await fetch(`${CONFIG.API_URL}/extension-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ action: 'get_or_create_token' })
      });
      
      if (!tokenResponse.ok) {
        // Fallback: use the access token as extension token temporarily
        console.warn('Extension auth endpoint not available, using access token');
        await this.saveConnectionData(accessToken, email);
        return;
      }
      
      const tokenData = await tokenResponse.json();
      await this.saveConnectionData(tokenData.token || accessToken, email);
      
    } catch (error) {
      console.error('Login error:', error);
      this.showMessage(`Erreur: ${error.message}`, 'error');
      this.updateStatus('disconnected', 'Échec de connexion', error.message);
    } finally {
      this.setLoading(this.elements.loginBtn, false, '🔗 Se connecter');
    }
  }
  
  async signupWithEmail() {
    const email = this.elements.emailInput?.value.trim();
    const password = this.elements.passwordInput?.value;
    
    if (!email || !password) {
      this.showMessage('Veuillez remplir tous les champs', 'error');
      return;
    }
    
    if (password.length < 6) {
      this.showMessage('Le mot de passe doit contenir au moins 6 caractères', 'error');
      return;
    }
    
    this.setLoading(this.elements.signupBtn, true, 'Création...');
    this.updateStatus('connecting', 'Création du compte...', 'Veuillez patienter...');
    
    try {
      // Call Supabase Auth signup
      const response = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${CONFIG.APP_URL}/extensions/chrome`
          }
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error_description || data.msg || 'Erreur lors de l\'inscription');
      }
      
      // Check if email confirmation is required
      if (data.user && !data.session) {
        this.showMessage('✓ Compte créé ! Vérifiez votre email pour confirmer.', 'success');
        this.updateStatus('disconnected', 'Confirmation requise', 'Vérifiez votre boîte email');
        return;
      }
      
      // Auto-confirmed, proceed with login
      if (data.session?.access_token) {
        const accessToken = data.session.access_token;
        await this.saveConnectionData(accessToken, email);
      } else {
        this.showMessage('✓ Compte créé ! Vous pouvez maintenant vous connecter.', 'success');
      }
      
    } catch (error) {
      console.error('Signup error:', error);
      this.showMessage(`Erreur: ${error.message}`, 'error');
      this.updateStatus('disconnected', 'Échec inscription', error.message);
    } finally {
      this.setLoading(this.elements.signupBtn, false, '✨ Créer un compte');
    }
  }
  
  // ===== Token Authentication =====
  
  async connectWithToken() {
    const token = this.elements.tokenInput?.value.trim();
    
    if (!token) {
      this.showMessage('Veuillez entrer votre clé d\'extension', 'error');
      this.shakeInput(this.elements.tokenInput);
      return;
    }
    
    if (!this.isValidToken(token)) {
      this.showMessage('Format de clé invalide. Vérifiez votre clé.', 'error');
      this.shakeInput(this.elements.tokenInput);
      return;
    }
    
    this.setLoading(this.elements.connectBtn, true, 'Connexion...');
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
        await this.saveConnectionData(token, data.email || null, data.todayStats);
      } else {
        const error = await response.json().catch(() => ({ error: 'Erreur serveur' }));
        throw new Error(error.error || 'Clé invalide ou expirée');
      }
    } catch (error) {
      console.error('Token connect error:', error);
      this.showMessage(`Erreur: ${error.message}`, 'error');
      this.updateStatus('disconnected', 'Échec de connexion', error.message);
    } finally {
      this.setLoading(this.elements.connectBtn, false, '🔗 Connecter avec la clé');
    }
  }
  
  // ===== Common Methods =====
  
  async saveConnectionData(token, email = null, stats = null) {
    await chrome.storage.local.set({
      extensionToken: token,
      connectedAt: new Date().toISOString(),
      lastSync: new Date().toISOString(),
      userEmail: email,
      stats: stats || { imports: 0, reviews: 0, monitored: 0 }
    });
    
    this.token = token;
    this.isConnected = true;
    
    this.showMessage('✓ Connexion réussie!', 'success');
    this.updateUI(true, stats);
    this.celebrateConnection();
    
    // Auto close after success
    setTimeout(() => window.close(), 2000);
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
        
        await chrome.storage.local.set({
          lastSync: new Date().toISOString(),
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
        'userEmail',
        'stats'
      ]);
      
      this.token = null;
      this.isConnected = false;
      this.elements.tokenInput.value = '';
      this.elements.emailInput.value = '';
      this.elements.passwordInput.value = '';
      
      this.showMessage('Extension déconnectée', 'info');
      this.updateUI(false);
    } catch (error) {
      this.showMessage('Erreur lors de la déconnexion', 'error');
    }
  }

  updateUI(connected, stats = null) {
    const { 
      statusCard, authTabs, panelEmail, panelToken, 
      connectedActions, statsGrid 
    } = this.elements;
    
    if (connected) {
      statusCard?.classList.add('connected');
      statusCard?.classList.remove('connecting');
      authTabs?.classList.add('hidden');
      panelEmail?.classList.remove('active');
      panelToken?.classList.remove('active');
      connectedActions?.classList.remove('hidden');
      statsGrid?.classList.add('show');
      
      this.updateStatus('connected', 'Connecté', 'Extension active');
      
      if (stats) {
        if (this.elements.statImports) this.elements.statImports.textContent = stats.imports || 0;
        if (this.elements.statReviews) this.elements.statReviews.textContent = stats.reviews || 0;
        if (this.elements.statMonitored) this.elements.statMonitored.textContent = stats.monitored || 0;
      }
    } else {
      statusCard?.classList.remove('connected', 'connecting');
      authTabs?.classList.remove('hidden');
      panelEmail?.classList.add('active');
      panelToken?.classList.remove('active');
      connectedActions?.classList.add('hidden');
      statsGrid?.classList.remove('show');
      
      this.updateStatus('disconnected', 'Non connecté', 'Connectez-vous pour démarrer');
    }
  }

  updateStatus(status, text, info) {
    const { statusCard, statusText, statusInfo } = this.elements;
    
    statusCard?.classList.remove('connected', 'connecting');
    
    if (status === 'connected') {
      statusCard?.classList.add('connected');
    } else if (status === 'connecting') {
      statusCard?.classList.add('connecting');
    }
    
    if (text && statusText) statusText.textContent = text;
    if (info && statusInfo) statusInfo.textContent = info;
  }

  showMessage(text, type = 'info') {
    const { messageToast } = this.elements;
    if (!messageToast) return;
    
    messageToast.textContent = text;
    messageToast.className = `message-toast show ${type}`;
    
    if (type !== 'error') {
      setTimeout(() => {
        messageToast.classList.remove('show');
      }, 5000);
    }
  }

  setLoading(button, loading, text) {
    if (!button) return;
    
    if (loading) {
      button.disabled = true;
      button.innerHTML = `<span class="spinner"></span><span>${text}</span>`;
    } else {
      button.disabled = false;
      button.innerHTML = `<span>${text.split(' ')[0]}</span><span>${text.split(' ').slice(1).join(' ')}</span>`;
    }
  }

  isValidToken(token) {
    if (!token || token.length < 20) return false;
    if (token.startsWith('ext_')) return true;
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    if (uuidPattern.test(token)) return true;
    if (/^[a-zA-Z0-9_-]{32,}$/.test(token)) return true;
    return false;
  }

  shakeInput(input) {
    if (!input) return;
    input.style.animation = 'shake 0.5s ease';
    setTimeout(() => {
      input.style.animation = '';
    }, 500);
  }

  celebrateConnection() {
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
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(celebration);
    
    setTimeout(() => celebration.remove(), 1000);
  }
}

// Initialize
new ShopoptiAuth();
