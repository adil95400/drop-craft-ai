// ============================================
// ShopOpti+ Extension Authentication Module v5.6.1
// Handles login, token management, session persistence
// ============================================

const ShopOptiAuth = {
  API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
  APP_URL: 'https://shopopti.io',
  
  // State
  isAuthenticated: false,
  user: null,
  token: null,
  
  /**
   * Initialize auth state from storage
   */
  async init() {
    try {
      const data = await chrome.storage.local.get(['extensionToken', 'user', 'tokenExpiry']);
      
      if (data.extensionToken && data.tokenExpiry) {
        // Check if token is expired
        if (new Date(data.tokenExpiry) > new Date()) {
          this.token = data.extensionToken;
          this.user = data.user || null;
          this.isAuthenticated = true;
          return true;
        } else {
          // Token expired, clean up
          await this.logout();
        }
      }
      
      return false;
    } catch (error) {
      console.error('[ShopOpti+ Auth] Init error:', error);
      return false;
    }
  },
  
  /**
   * Login with email/password
   */
  async login(email, password) {
    try {
      // First authenticate with Supabase Auth
      const authResponse = await fetch(`${this.API_URL.replace('/functions/v1', '')}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzbXdja3pybXFlY3d3cnN3d3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjY0NDEsImV4cCI6MjA4MTc0MjQ0MX0.jhrwOY7-tKeNF54E3Ec6yRzjmTW8zJyKuE9R4rvi41I'
        },
        body: JSON.stringify({ email, password })
      });
      
      const authData = await authResponse.json();
      
      if (!authResponse.ok || authData.error) {
        throw new Error(authData.error_description || authData.error?.message || 'Identifiants invalides');
      }
      
      // Now generate extension token
      const tokenResponse = await fetch(`${this.API_URL}/extension-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.access_token}`
        },
        body: JSON.stringify({
          action: 'generate_token',
          data: {
            userId: authData.user.id,
            deviceInfo: this.getDeviceInfo()
          }
        })
      });
      
      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok || !tokenData.success) {
        throw new Error(tokenData.error || 'Échec génération token extension');
      }
      
      // Store credentials
      await this.saveSession({
        token: tokenData.token,
        expiresAt: tokenData.expiresAt,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          plan: authData.user.user_metadata?.subscription_plan || 'free'
        }
      });
      
      return { success: true, user: this.user };
      
    } catch (error) {
      console.error('[ShopOpti+ Auth] Login error:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Login via OAuth redirect (opens shopopti.io)
   */
  async loginWithOAuth() {
    try {
      // Open login page with extension callback
      const loginUrl = `${this.APP_URL}/auth?redirect=extension&source=chrome`;
      
      chrome.tabs.create({ url: loginUrl });
      
      return { success: true, pending: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Handle OAuth callback from website
   */
  async handleOAuthCallback(token, user) {
    try {
      await this.saveSession({
        token,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        user
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Validate current token with backend
   */
  async validateToken() {
    if (!this.token) return false;
    
    try {
      const response = await fetch(`${this.API_URL}/extension-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': this.token
        },
        body: JSON.stringify({ action: 'validate_token' })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        this.user = data.user;
        this.isAuthenticated = true;
        return true;
      } else {
        await this.logout();
        return false;
      }
    } catch (error) {
      console.error('[ShopOpti+ Auth] Validation error:', error);
      return false;
    }
  },
  
  /**
   * Logout and revoke token
   */
  async logout() {
    try {
      if (this.token) {
        // Revoke token on server
        await fetch(`${this.API_URL}/extension-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'revoke_token',
            data: { token: this.token }
          })
        }).catch(() => {}); // Ignore errors
      }
    } catch (e) {}
    
    // Clear local state
    this.token = null;
    this.user = null;
    this.isAuthenticated = false;
    
    await chrome.storage.local.remove(['extensionToken', 'user', 'tokenExpiry', 'userPlan']);
    
    return { success: true };
  },
  
  /**
   * Save session to storage
   */
  async saveSession({ token, expiresAt, user }) {
    this.token = token;
    this.user = user;
    this.isAuthenticated = true;
    
    await chrome.storage.local.set({
      extensionToken: token,
      tokenExpiry: expiresAt,
      user: user,
      userPlan: user?.plan || 'free'
    });
  },
  
  /**
   * Get device info for token generation
   */
  getDeviceInfo() {
    return {
      browser: 'Chrome',
      platform: navigator.platform || 'Unknown',
      version: chrome.runtime.getManifest().version,
      userAgent: navigator.userAgent.substring(0, 200)
    };
  },
  
  /**
   * Get current auth header
   */
  getAuthHeader() {
    if (!this.token) return {};
    return { 'x-extension-token': this.token };
  },
  
  /**
   * Check if authenticated
   */
  isLoggedIn() {
    return this.isAuthenticated && !!this.token;
  }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.ShopOptiAuth = ShopOptiAuth;
}
