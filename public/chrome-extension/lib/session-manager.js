/**
 * ShopOpti+ Session Manager v5.7.0
 * Handles authentication, session persistence, and auto-reconnection
 */

const SessionManager = {
  VERSION: '5.7.0',
  API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
  APP_URL: 'https://shopopti.io',
  
  // Session state
  state: {
    isAuthenticated: false,
    token: null,
    user: null,
    expiresAt: null,
    lastCheck: null
  },
  
  // Callbacks
  callbacks: {
    onAuthChange: null,
    onSessionExpired: null,
    onError: null
  },
  
  /**
   * Initialize session manager
   */
  async init() {
    console.log('[ShopOpti+ Session] Initializing...');
    
    await this.loadSession();
    
    // Set up periodic session check (every 5 minutes)
    if (typeof chrome !== 'undefined' && chrome.alarms) {
      chrome.alarms.create('session-check', { periodInMinutes: 5 });
    }
    
    return this.state;
  },
  
  /**
   * Load session from storage
   */
  async loadSession() {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        resolve(false);
        return;
      }
      
      chrome.storage.local.get([
        'extensionToken',
        'tokenExpiry',
        'user',
        'lastValidation'
      ], (result) => {
        if (result.extensionToken) {
          this.state.token = result.extensionToken;
          this.state.expiresAt = result.tokenExpiry ? new Date(result.tokenExpiry) : null;
          this.state.user = result.user || null;
          this.state.lastCheck = result.lastValidation;
          
          // Check if expired
          if (this.state.expiresAt && new Date() > this.state.expiresAt) {
            this.state.isAuthenticated = false;
            this.onSessionExpired();
          } else {
            this.state.isAuthenticated = true;
          }
        }
        
        resolve(this.state.isAuthenticated);
      });
    });
  },
  
  /**
   * Save session to storage
   */
  async saveSession(token, user = null, expiresAt = null) {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        resolve(false);
        return;
      }
      
      const data = {
        extensionToken: token,
        tokenExpiry: expiresAt ? expiresAt.toISOString() : null,
        user: user,
        lastValidation: new Date().toISOString()
      };
      
      chrome.storage.local.set(data, () => {
        this.state.token = token;
        this.state.user = user;
        this.state.expiresAt = expiresAt;
        this.state.isAuthenticated = true;
        this.state.lastCheck = data.lastValidation;
        
        this.notifyAuthChange(true);
        resolve(true);
      });
    });
  },
  
  /**
   * Clear session
   */
  async clearSession() {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        resolve(false);
        return;
      }
      
      chrome.storage.local.remove([
        'extensionToken',
        'tokenExpiry',
        'user',
        'lastValidation'
      ], () => {
        this.state = {
          isAuthenticated: false,
          token: null,
          user: null,
          expiresAt: null,
          lastCheck: null
        };
        
        this.notifyAuthChange(false);
        resolve(true);
      });
    });
  },
  
  /**
   * Validate token with backend
   */
  async validateToken(token = null) {
    const tokenToValidate = token || this.state.token;
    
    if (!tokenToValidate) {
      return { valid: false, error: 'No token provided' };
    }
    
    try {
      const response = await fetch(`${this.API_URL}/extension-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': tokenToValidate
        },
        body: JSON.stringify({ action: 'validate' })
      });
      
      const data = await response.json();
      
      if (data.valid || data.success) {
        // Update last check time
        this.state.lastCheck = new Date().toISOString();
        
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ lastValidation: this.state.lastCheck });
        }
        
        return { 
          valid: true, 
          user: data.user,
          plan: data.plan || 'starter',
          expiresAt: data.expiresAt
        };
      }
      
      return { valid: false, error: data.error || 'Invalid token' };
    } catch (error) {
      console.error('[ShopOpti+ Session] Validation error:', error);
      return { valid: false, error: error.message };
    }
  },
  
  /**
   * Login with token
   */
  async login(token) {
    if (!token || token.length < 10) {
      return { success: false, error: 'Token invalide (minimum 10 caractères)' };
    }
    
    try {
      const response = await fetch(`${this.API_URL}/extension-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          token,
          deviceInfo: this.getDeviceInfo()
        })
      });
      
      const data = await response.json();
      
      if (data.success || data.valid) {
        // Calculate expiry (1 year from now by default)
        const expiresAt = data.expiresAt 
          ? new Date(data.expiresAt) 
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        
        await this.saveSession(token, data.user, expiresAt);
        
        return { 
          success: true, 
          user: data.user,
          plan: data.plan
        };
      }
      
      return { success: false, error: data.error || 'Connexion échouée' };
    } catch (error) {
      console.error('[ShopOpti+ Session] Login error:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Logout
   */
  async logout() {
    try {
      // Notify backend (optional)
      if (this.state.token) {
        fetch(`${this.API_URL}/extension-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': this.state.token
          },
          body: JSON.stringify({ action: 'logout' })
        }).catch(() => {});
      }
      
      await this.clearSession();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Check session status
   */
  async checkSession() {
    await this.loadSession();
    
    if (!this.state.isAuthenticated) {
      return { authenticated: false };
    }
    
    // If last check was recent (within 5 min), skip validation
    if (this.state.lastCheck) {
      const lastCheckDate = new Date(this.state.lastCheck);
      const now = new Date();
      const diffMinutes = (now - lastCheckDate) / (1000 * 60);
      
      if (diffMinutes < 5) {
        return {
          authenticated: true,
          user: this.state.user,
          cachedResult: true
        };
      }
    }
    
    // Validate with backend
    const validation = await this.validateToken();
    
    if (!validation.valid) {
      await this.clearSession();
      this.onSessionExpired();
      return { authenticated: false, error: validation.error };
    }
    
    return {
      authenticated: true,
      user: validation.user || this.state.user,
      plan: validation.plan
    };
  },
  
  /**
   * Get device info for session tracking
   */
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timestamp: new Date().toISOString()
    };
  },
  
  /**
   * Handle session expiry
   */
  onSessionExpired() {
    console.log('[ShopOpti+ Session] Session expired');
    
    if (this.callbacks.onSessionExpired) {
      this.callbacks.onSessionExpired();
    }
    
    // Show notification
    if (typeof chrome !== 'undefined' && chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ShopOpti+ - Session expirée',
        message: 'Veuillez vous reconnecter pour continuer à utiliser l\'extension.'
      });
    }
  },
  
  /**
   * Notify auth state change
   */
  notifyAuthChange(isAuthenticated) {
    if (this.callbacks.onAuthChange) {
      this.callbacks.onAuthChange(isAuthenticated, this.state.user);
    }
    
    // Send message to all tabs
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            type: 'AUTH_STATE_CHANGED',
            authenticated: isAuthenticated,
            user: this.state.user
          }).catch(() => {});
        });
      });
    }
  },
  
  /**
   * Set callbacks
   */
  setCallbacks(callbacks) {
    Object.assign(this.callbacks, callbacks);
  },
  
  /**
   * Get login URL
   */
  getLoginUrl() {
    return `${this.APP_URL}/auth/extension`;
  },
  
  /**
   * Open login page
   */
  openLoginPage() {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: this.getLoginUrl() });
    } else {
      window.open(this.getLoginUrl(), '_blank');
    }
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionManager;
}

if (typeof window !== 'undefined') {
  window.ShopOptiSession = SessionManager;
}
