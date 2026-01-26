/**
 * ShopOpti+ Token Refresh Manager v5.7.0
 * Automatic token validation and refresh with expiry warnings
 */

const TokenRefresh = {
  VERSION: '5.7.0',
  
  // Configuration
  config: {
    checkIntervalMs: 60000, // Check every minute
    warningBeforeExpiryMs: 5 * 60 * 1000, // Warn 5 minutes before expiry
    refreshThresholdMs: 10 * 60 * 1000, // Refresh if < 10 minutes left
    apiUrl: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1'
  },
  
  // State
  intervalId: null,
  isRefreshing: false,
  lastCheck: null,
  expiryWarningShown: false,
  
  /**
   * Initialize token refresh system
   */
  init() {
    console.log('[ShopOpti+ Token] Initializing token refresh manager...');
    this.startPeriodicCheck();
    this.checkNow();
    return this;
  },
  
  /**
   * Start periodic token validation
   */
  startPeriodicCheck() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = setInterval(() => {
      this.checkNow();
    }, this.config.checkIntervalMs);
    
    console.log('[ShopOpti+ Token] Periodic check started');
  },
  
  /**
   * Stop periodic checks
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  },
  
  /**
   * Check token status now
   */
  async checkNow() {
    this.lastCheck = new Date().toISOString();
    
    try {
      const status = await this.getTokenStatus();
      
      if (!status.hasToken) {
        this.notifyListeners('no_token', { message: 'Aucun token configuré' });
        return { valid: false, reason: 'no_token' };
      }
      
      if (status.isExpired) {
        this.notifyListeners('expired', { message: 'Session expirée' });
        return { valid: false, reason: 'expired' };
      }
      
      // Check if expiry warning needed
      if (status.timeToExpiry <= this.config.warningBeforeExpiryMs && !this.expiryWarningShown) {
        this.expiryWarningShown = true;
        const minutesLeft = Math.round(status.timeToExpiry / 60000);
        this.notifyListeners('expiring_soon', { 
          message: `Session expire dans ${minutesLeft} minute(s)`,
          minutesLeft
        });
      }
      
      // Check if refresh needed
      if (status.timeToExpiry <= this.config.refreshThresholdMs) {
        const refreshResult = await this.attemptRefresh();
        if (refreshResult.success) {
          this.expiryWarningShown = false;
          this.notifyListeners('refreshed', { message: 'Token renouvelé' });
        }
      }
      
      return { valid: true, timeToExpiry: status.timeToExpiry };
      
    } catch (error) {
      console.error('[ShopOpti+ Token] Check error:', error);
      return { valid: false, reason: 'error', error: error.message };
    }
  },
  
  /**
   * Get current token status from storage
   */
  async getTokenStatus() {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return { hasToken: false };
    }
    
    const data = await chrome.storage.local.get(['extensionToken', 'tokenExpiry', 'user']);
    
    if (!data.extensionToken) {
      return { hasToken: false };
    }
    
    const now = Date.now();
    const expiryTime = data.tokenExpiry ? new Date(data.tokenExpiry).getTime() : 0;
    const isExpired = expiryTime > 0 && expiryTime <= now;
    const timeToExpiry = expiryTime > 0 ? expiryTime - now : Infinity;
    
    return {
      hasToken: true,
      token: data.extensionToken,
      user: data.user,
      expiresAt: data.tokenExpiry,
      isExpired,
      timeToExpiry
    };
  },
  
  /**
   * Attempt to refresh the token
   */
  async attemptRefresh() {
    if (this.isRefreshing) {
      return { success: false, reason: 'already_refreshing' };
    }
    
    this.isRefreshing = true;
    console.log('[ShopOpti+ Token] Attempting token refresh...');
    
    try {
      const status = await this.getTokenStatus();
      if (!status.hasToken) {
        return { success: false, reason: 'no_token' };
      }
      
      const response = await fetch(`${this.config.apiUrl}/extension-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': status.token
        },
        body: JSON.stringify({
          action: 'refresh_token'
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success && data.token) {
        // Update stored token
        await chrome.storage.local.set({
          extensionToken: data.token,
          tokenExpiry: data.expiresAt,
          user: data.user || status.user
        });
        
        console.log('[ShopOpti+ Token] Token refreshed successfully');
        return { success: true, newExpiry: data.expiresAt };
      }
      
      return { success: false, reason: data.error || 'refresh_failed' };
      
    } catch (error) {
      console.error('[ShopOpti+ Token] Refresh error:', error);
      return { success: false, reason: 'network_error', error: error.message };
    } finally {
      this.isRefreshing = false;
    }
  },
  
  /**
   * Validate token with backend
   */
  async validateWithBackend() {
    try {
      const status = await this.getTokenStatus();
      if (!status.hasToken) {
        return { valid: false, reason: 'no_token' };
      }
      
      const response = await fetch(`${this.config.apiUrl}/extension-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': status.token
        },
        body: JSON.stringify({
          action: 'validate_token'
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Update user data if returned
        if (data.user) {
          await chrome.storage.local.set({ user: data.user });
        }
        return { valid: true, user: data.user };
      }
      
      // Token invalid - clear it
      if (response.status === 401) {
        await this.clearToken();
      }
      
      return { valid: false, reason: data.error || 'validation_failed' };
      
    } catch (error) {
      console.error('[ShopOpti+ Token] Validation error:', error);
      return { valid: false, reason: 'network_error' };
    }
  },
  
  /**
   * Clear stored token
   */
  async clearToken() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.remove(['extensionToken', 'tokenExpiry', 'user', 'userPlan']);
    }
    this.expiryWarningShown = false;
    console.log('[ShopOpti+ Token] Token cleared');
  },
  
  // Event listeners
  listeners: [],
  
  /**
   * Add event listener
   */
  addListener(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  },
  
  /**
   * Remove event listener
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  },
  
  /**
   * Notify all listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (e) {
        console.error('[ShopOpti+ Token] Listener error:', e);
      }
    });
  },
  
  /**
   * Get human-readable time until expiry
   */
  getTimeUntilExpiryText(ms) {
    if (ms <= 0) return 'Expiré';
    if (ms === Infinity) return 'Jamais';
    
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} jour(s)`;
    if (hours > 0) return `${hours} heure(s)`;
    return `${minutes} minute(s)`;
  },
  
  /**
   * Create expiry warning banner HTML
   */
  createExpiryWarningBanner(minutesLeft, onReconnect) {
    const banner = document.createElement('div');
    banner.className = 'sho-token-warning-banner';
    banner.innerHTML = `
      <div class="sho-warning-content">
        <span class="sho-warning-icon">⚠️</span>
        <span class="sho-warning-message">
          Session expire dans ${minutesLeft} minute(s)
        </span>
        <button class="sho-reconnect-btn">
          <span>🔄</span>
          Reconnecter
        </button>
        <button class="sho-dismiss-btn">×</button>
      </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .sho-token-warning-banner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #f97316, #ea580c);
        color: white;
        padding: 10px 16px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        animation: sho-slide-down 0.3s ease;
      }
      @keyframes sho-slide-down {
        from { transform: translateY(-100%); }
        to { transform: translateY(0); }
      }
      .sho-warning-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        max-width: 800px;
        margin: 0 auto;
      }
      .sho-warning-icon { font-size: 18px; }
      .sho-warning-message { font-size: 14px; font-weight: 500; }
      .sho-reconnect-btn {
        background: white;
        color: #ea580c;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: transform 0.2s;
      }
      .sho-reconnect-btn:hover { transform: scale(1.05); }
      .sho-dismiss-btn {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
      }
    `;
    
    banner.insertBefore(style, banner.firstChild);
    
    // Event handlers
    banner.querySelector('.sho-reconnect-btn').addEventListener('click', () => {
      if (onReconnect) onReconnect();
      banner.remove();
    });
    
    banner.querySelector('.sho-dismiss-btn').addEventListener('click', () => {
      banner.remove();
    });
    
    return banner;
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TokenRefresh;
}

if (typeof window !== 'undefined') {
  window.ShopOptiTokenRefresh = TokenRefresh;
}
