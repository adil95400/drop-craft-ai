// ============================================
// ShopOpti+ Extension Authentication Module v5.7.2
// Sprint 1: SSO avec JWT, refresh automatique, permissions
// ============================================

const ShopOptiAuth = {
  API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
  APP_URL: 'https://shopopti.io',
  VERSION: '5.7.2',
  
  // State
  isAuthenticated: false,
  user: null,
  token: null,
  refreshToken: null,
  permissions: [],
  tokenExpiry: null,
  
  /**
   * Initialize auth state from storage
   */
  async init() {
    try {
      const data = await chrome.storage.local.get([
        'extensionToken', 
        'refreshToken',
        'user', 
        'tokenExpiry',
        'refreshExpiry',
        'permissions'
      ]);
      
      if (data.extensionToken && data.tokenExpiry) {
        const expiryDate = new Date(data.tokenExpiry);
        const now = new Date();
        
        // Token still valid
        if (expiryDate > now) {
          this.token = data.extensionToken;
          this.refreshToken = data.refreshToken || null;
          this.user = data.user || null;
          this.permissions = data.permissions || [];
          this.tokenExpiry = expiryDate;
          this.isAuthenticated = true;
          
          // Schedule auto-refresh if token expires in less than 7 days
          const daysUntilExpiry = (expiryDate - now) / (1000 * 60 * 60 * 24);
          if (daysUntilExpiry < 7 && data.refreshToken) {
            console.log('[ShopOpti+ Auth] Token expiring soon, scheduling refresh');
            this.scheduleTokenRefresh();
          }
          
          return true;
        } 
        // Token expired but refresh token exists
        else if (data.refreshToken && data.refreshExpiry) {
          const refreshExpiry = new Date(data.refreshExpiry);
          if (refreshExpiry > now) {
            console.log('[ShopOpti+ Auth] Token expired, attempting refresh');
            const refreshed = await this.refreshAccessToken(data.refreshToken);
            return refreshed;
          }
        }
        
        // All tokens expired
        await this.logout();
      }
      
      return false;
    } catch (error) {
      console.error('[ShopOpti+ Auth] Init error:', error);
      return false;
    }
  },
  
  /**
   * Login with email/password (legacy - redirects to web auth)
   */
  async login(email, password) {
    try {
      // Authenticate with Supabase Auth first
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
      
      // Generate extension token
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
            deviceInfo: this.getDeviceInfo(),
            permissions: ['import', 'sync', 'logs', 'bulk']
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
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.expiresAt,
        refreshExpiresAt: tokenData.refreshExpiresAt,
        permissions: tokenData.permissions,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          plan: tokenData.user?.plan || 'free',
          firstName: tokenData.user?.firstName,
          lastName: tokenData.user?.lastName,
          avatarUrl: tokenData.user?.avatarUrl
        }
      });
      
      return { success: true, user: this.user };
      
    } catch (error) {
      console.error('[ShopOpti+ Auth] Login error:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Login with token (generated from SaaS)
   */
  async loginWithToken(token) {
    try {
      // Validate token with backend
      const response = await fetch(`${this.API_URL}/extension-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': token
        },
        body: JSON.stringify({ action: 'validate_token' })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Token invalide');
      }
      
      // Save session
      await this.saveSession({
        token: token,
        expiresAt: data.expiresAt,
        permissions: data.permissions || ['import', 'sync', 'logs'],
        user: data.user
      });
      
      return { success: true, user: data.user };
      
    } catch (error) {
      console.error('[ShopOpti+ Auth] Token login error:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Login via OAuth redirect (opens shopopti.io)
   */
  async loginWithOAuth() {
    try {
      const loginUrl = `${this.APP_URL}/auth?redirect=extension&source=chrome&v=${this.VERSION}`;
      chrome.tabs.create({ url: loginUrl });
      return { success: true, pending: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Handle OAuth callback from website
   */
  async handleOAuthCallback(tokenData) {
    try {
      await this.saveSession({
        token: tokenData.token,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.expiresAt,
        refreshExpiresAt: tokenData.refreshExpiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        permissions: tokenData.permissions || ['import', 'sync', 'logs'],
        user: tokenData.user
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken) {
    try {
      const response = await fetch(`${this.API_URL}/extension-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refresh_token',
          data: { refreshToken }
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Update token
        this.token = data.token;
        this.tokenExpiry = new Date(data.expiresAt);
        
        await chrome.storage.local.set({
          extensionToken: data.token,
          tokenExpiry: data.expiresAt
        });
        
        this.isAuthenticated = true;
        console.log('[ShopOpti+ Auth] Token refreshed successfully');
        return true;
      }
      
      // Refresh failed - logout
      await this.logout();
      return false;
      
    } catch (error) {
      console.error('[ShopOpti+ Auth] Refresh error:', error);
      return false;
    }
  },
  
  /**
   * Schedule automatic token refresh
   */
  scheduleTokenRefresh() {
    if (!this.refreshToken) return;
    
    // Refresh 3 days before expiry
    const refreshTime = new Date(this.tokenExpiry.getTime() - (3 * 24 * 60 * 60 * 1000));
    const now = new Date();
    const delay = Math.max(0, refreshTime - now);
    
    setTimeout(() => {
      this.refreshAccessToken(this.refreshToken);
    }, delay);
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
        this.permissions = data.permissions || [];
        this.isAuthenticated = true;
        return true;
      } else {
        // Token invalid - try refresh
        if (this.refreshToken) {
          return await this.refreshAccessToken(this.refreshToken);
        }
        await this.logout();
        return false;
      }
    } catch (error) {
      console.error('[ShopOpti+ Auth] Validation error:', error);
      return false;
    }
  },
  
  /**
   * Send heartbeat to server
   */
  async sendHeartbeat() {
    if (!this.token) return;
    
    try {
      await fetch(`${this.API_URL}/extension-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': this.token
        },
        body: JSON.stringify({
          action: 'heartbeat',
          data: {
            version: this.VERSION,
            platform: navigator.platform,
            browser: 'Chrome',
            browserVersion: navigator.userAgent.match(/Chrome\/([0-9.]+)/)?.[1],
            os: navigator.platform.includes('Win') ? 'Windows' : 
                navigator.platform.includes('Mac') ? 'macOS' : 'Linux'
          }
        })
      });
    } catch (error) {
      console.error('[ShopOpti+ Auth] Heartbeat error:', error);
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'revoke_token',
            data: { token: this.token }
          })
        }).catch(() => {});
      }
    } catch (e) {}
    
    // Clear local state
    this.token = null;
    this.refreshToken = null;
    this.user = null;
    this.permissions = [];
    this.tokenExpiry = null;
    this.isAuthenticated = false;
    
    await chrome.storage.local.remove([
      'extensionToken', 
      'refreshToken',
      'user', 
      'tokenExpiry', 
      'refreshExpiry',
      'permissions',
      'userPlan'
    ]);
    
    return { success: true };
  },
  
  /**
   * Save session to storage
   */
  async saveSession({ token, refreshToken, expiresAt, refreshExpiresAt, permissions, user }) {
    this.token = token;
    this.refreshToken = refreshToken || null;
    this.user = user;
    this.permissions = permissions || [];
    this.tokenExpiry = new Date(expiresAt);
    this.isAuthenticated = true;
    
    const storageData = {
      extensionToken: token,
      tokenExpiry: expiresAt,
      user: user,
      permissions: permissions,
      userPlan: user?.plan || 'free'
    };
    
    if (refreshToken) {
      storageData.refreshToken = refreshToken;
      storageData.refreshExpiry = refreshExpiresAt;
    }
    
    await chrome.storage.local.set(storageData);
    
    // Schedule refresh
    if (refreshToken) {
      this.scheduleTokenRefresh();
    }
    
    // Send initial heartbeat
    this.sendHeartbeat();
  },
  
  /**
   * Get device info for token generation
   */
  getDeviceInfo() {
    return {
      browser: 'Chrome',
      platform: navigator.platform || 'Unknown',
      version: this.VERSION,
      userAgent: navigator.userAgent.substring(0, 200),
      os: navigator.platform.includes('Win') ? 'Windows' : 
          navigator.platform.includes('Mac') ? 'macOS' : 'Linux',
      screenWidth: screen.width,
      screenHeight: screen.height
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
  },
  
  /**
   * Check if user has permission
   */
  hasPermission(permission) {
    return this.permissions.includes(permission);
  },
  
  /**
   * Get user plan
   */
  getUserPlan() {
    return this.user?.plan || 'free';
  }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.ShopOptiAuth = ShopOptiAuth;
}
