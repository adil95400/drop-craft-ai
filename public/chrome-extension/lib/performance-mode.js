/**
 * ShopOpti+ Performance Mode Manager v5.7.0
 * Light mode for optimal performance on dynamic pages
 */

const ShopOptiPerformanceMode = {
  VERSION: '5.7.0',
  
  // Feature flags for performance mode
  features: {
    adsSpy: { name: 'Ads Spy', enabled: true, heavyWeight: true },
    trendAnalyzer: { name: 'Analyseur de tendances', enabled: true, heavyWeight: true },
    priceMonitor: { name: 'Surveillance des prix', enabled: true, heavyWeight: false },
    reviewImporter: { name: 'Import d\'avis', enabled: true, heavyWeight: false },
    floatingSidebar: { name: 'Barre latérale', enabled: true, heavyWeight: false },
    animations: { name: 'Animations', enabled: true, heavyWeight: false },
    autoRefresh: { name: 'Actualisation auto', enabled: true, heavyWeight: true },
    videoExtraction: { name: 'Extraction vidéos', enabled: true, heavyWeight: true }
  },
  
  isLightMode: false,
  observers: [],

  /**
   * Initialize performance mode manager
   */
  async init() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get([
        'performanceMode', 
        'disabledFeatures',
        'autoLightMode'
      ]);
      
      this.isLightMode = result.performanceMode === 'light';
      this.autoLightMode = result.autoLightMode !== false;
      
      if (result.disabledFeatures) {
        Object.keys(result.disabledFeatures).forEach(key => {
          if (this.features[key]) {
            this.features[key].enabled = !result.disabledFeatures[key];
          }
        });
      }
    }
    
    // Auto-detect if light mode should be enabled
    if (this.autoLightMode) {
      this.detectPerformanceNeeds();
    }
    
    if (this.isLightMode) {
      this.applyLightMode();
    }
    
    return this;
  },

  /**
   * Detect if performance optimizations are needed
   */
  detectPerformanceNeeds() {
    // Check for signs of performance issues
    const memoryInfo = performance?.memory;
    const isLowMemory = memoryInfo && memoryInfo.usedJSHeapSize > memoryInfo.jsHeapSizeLimit * 0.7;
    
    // Check connection speed
    const connection = navigator?.connection;
    const isSlowConnection = connection && (
      connection.effectiveType === '2g' || 
      connection.effectiveType === 'slow-2g'
    );
    
    // Check device capability
    const hardwareConcurrency = navigator?.hardwareConcurrency || 4;
    const isLowEndDevice = hardwareConcurrency <= 2;
    
    if (isLowMemory || isSlowConnection || isLowEndDevice) {
      console.log('[ShopOpti+] Auto-enabling light mode for better performance');
      this.enableLightMode();
    }
  },

  /**
   * Enable light mode
   */
  async enableLightMode() {
    this.isLightMode = true;
    
    // Disable heavy features
    Object.keys(this.features).forEach(key => {
      if (this.features[key].heavyWeight) {
        this.features[key].enabled = false;
      }
    });
    
    this.applyLightMode();
    await this.saveSettings();
    
    // Notify listeners
    this.notifyChange();
  },

  /**
   * Disable light mode
   */
  async disableLightMode() {
    this.isLightMode = false;
    
    // Re-enable all features
    Object.keys(this.features).forEach(key => {
      this.features[key].enabled = true;
    });
    
    this.removeLightMode();
    await this.saveSettings();
    
    // Notify listeners
    this.notifyChange();
  },

  /**
   * Toggle light mode
   */
  async toggle() {
    if (this.isLightMode) {
      await this.disableLightMode();
    } else {
      await this.enableLightMode();
    }
    return this.isLightMode;
  },

  /**
   * Toggle a specific feature
   */
  async toggleFeature(featureKey) {
    if (this.features[featureKey]) {
      this.features[featureKey].enabled = !this.features[featureKey].enabled;
      await this.saveSettings();
      this.notifyChange();
      return this.features[featureKey].enabled;
    }
    return null;
  },

  /**
   * Apply light mode optimizations
   */
  applyLightMode() {
    // Add light mode class
    document.body.classList.add('so-light-mode');
    
    // Reduce animations
    if (!this.features.animations.enabled) {
      document.body.style.setProperty('--so-transition-duration', '0s');
    }
    
    // Disconnect heavy observers
    this.disconnectHeavyObservers();
    
    // Reduce DOM updates frequency
    this.throttleUpdates();
    
    console.log('[ShopOpti+] Light mode enabled');
  },

  /**
   * Remove light mode
   */
  removeLightMode() {
    document.body.classList.remove('so-light-mode');
    document.body.style.removeProperty('--so-transition-duration');
    console.log('[ShopOpti+] Light mode disabled');
  },

  /**
   * Disconnect heavy mutation observers
   */
  disconnectHeavyObservers() {
    if (window.__shopoptiObservers) {
      window.__shopoptiObservers.forEach(obs => {
        if (obs.isHeavy) {
          obs.disconnect();
        }
      });
    }
  },

  /**
   * Throttle DOM update frequency
   */
  throttleUpdates() {
    // Increase debounce delays for light mode
    if (window.SHOPOPTI_CONFIG) {
      window.SHOPOPTI_CONFIG.DEBOUNCE_MS = 1000; // Increase from default
      window.SHOPOPTI_CONFIG.MAX_REINJECT_ATTEMPTS = 3; // Reduce attempts
    }
  },

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(featureKey) {
    return this.features[featureKey]?.enabled ?? true;
  },

  /**
   * Get all feature states
   */
  getFeatureStates() {
    return { ...this.features };
  },

  /**
   * Save settings to storage
   */
  async saveSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const disabledFeatures = {};
      Object.keys(this.features).forEach(key => {
        if (!this.features[key].enabled) {
          disabledFeatures[key] = true;
        }
      });
      
      await chrome.storage.local.set({
        performanceMode: this.isLightMode ? 'light' : 'normal',
        disabledFeatures
      });
    }
  },

  /**
   * Add change listener
   */
  onChange(callback) {
    this.observers.push(callback);
  },

  /**
   * Notify all observers
   */
  notifyChange() {
    this.observers.forEach(cb => cb(this.isLightMode, this.features));
  },

  /**
   * Create settings UI HTML
   */
  createSettingsUI() {
    const featuresHTML = Object.entries(this.features).map(([key, feature]) => `
      <div class="so-perf-feature">
        <label class="so-perf-toggle">
          <input type="checkbox" data-feature="${key}" ${feature.enabled ? 'checked' : ''}>
          <span class="so-perf-slider"></span>
        </label>
        <div class="so-perf-feature-info">
          <span class="so-perf-feature-name">${feature.name}</span>
          ${feature.heavyWeight ? '<span class="so-perf-heavy-badge">Gourmand</span>' : ''}
        </div>
      </div>
    `).join('');

    return `
      <div class="so-performance-settings">
        <div class="so-perf-header">
          <h4>Mode Performance</h4>
          <button id="toggleLightMode" class="so-perf-mode-btn ${this.isLightMode ? 'active' : ''}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            <span>${this.isLightMode ? 'Mode Léger Actif' : 'Activer Mode Léger'}</span>
          </button>
        </div>
        <p class="so-perf-desc">Désactivez les fonctionnalités gourmandes pour améliorer les performances sur les sites dynamiques.</p>
        <div class="so-perf-features">
          ${featuresHTML}
        </div>
      </div>
    `;
  },

  /**
   * Inject settings panel styles
   */
  injectStyles() {
    if (document.getElementById('performanceModeStyles')) return;

    const styles = document.createElement('style');
    styles.id = 'performanceModeStyles';
    styles.textContent = `
      .so-performance-settings {
        padding: 16px;
        background: var(--so-bg-secondary, #151929);
        border-radius: 12px;
        margin: 12px 0;
      }
      
      .so-perf-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      
      .so-perf-header h4 {
        color: var(--so-text, #f1f5f9);
        font-size: 14px;
        font-weight: 600;
        margin: 0;
      }
      
      .so-perf-mode-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: var(--so-bg-elevated, #1e2438);
        border: 1px solid var(--so-border, #2a3148);
        border-radius: 8px;
        color: var(--so-text-secondary, #94a3b8);
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .so-perf-mode-btn:hover {
        border-color: var(--so-primary, #8b5cf6);
        color: var(--so-primary, #8b5cf6);
      }
      
      .so-perf-mode-btn.active {
        background: var(--so-success, #10b981);
        border-color: var(--so-success, #10b981);
        color: white;
      }
      
      .so-perf-desc {
        color: var(--so-text-muted, #64748b);
        font-size: 12px;
        margin-bottom: 16px;
      }
      
      .so-perf-features {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .so-perf-feature {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        background: var(--so-bg-elevated, #1e2438);
        border-radius: 8px;
      }
      
      .so-perf-toggle {
        position: relative;
        width: 36px;
        height: 20px;
        cursor: pointer;
      }
      
      .so-perf-toggle input {
        display: none;
      }
      
      .so-perf-slider {
        position: absolute;
        inset: 0;
        background: var(--so-border, #2a3148);
        border-radius: 10px;
        transition: 0.2s;
      }
      
      .so-perf-slider::before {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        left: 2px;
        top: 2px;
        background: white;
        border-radius: 50%;
        transition: 0.2s;
      }
      
      .so-perf-toggle input:checked + .so-perf-slider {
        background: var(--so-success, #10b981);
      }
      
      .so-perf-toggle input:checked + .so-perf-slider::before {
        transform: translateX(16px);
      }
      
      .so-perf-feature-info {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .so-perf-feature-name {
        color: var(--so-text, #f1f5f9);
        font-size: 13px;
      }
      
      .so-perf-heavy-badge {
        padding: 2px 6px;
        background: rgba(245, 158, 11, 0.15);
        color: var(--so-warning, #f59e0b);
        font-size: 10px;
        border-radius: 4px;
        font-weight: 500;
      }
      
      /* Light mode active styles */
      .so-light-mode .so-perf-heavy-badge {
        background: rgba(239, 68, 68, 0.15);
        color: var(--so-error, #ef4444);
      }
    `;
    document.head.appendChild(styles);
  }
};

// Export
if (typeof window !== 'undefined') {
  window.ShopOptiPerformanceMode = ShopOptiPerformanceMode;
}
