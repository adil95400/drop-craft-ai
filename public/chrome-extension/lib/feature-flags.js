// ============================================
// ShopOpti+ Feature Flags System v5.7.2
// Enables/disables features at runtime
// Reduces attack surface and improves performance
// ============================================

const ShopOptiFeatures = {
  VERSION: '5.7.2',
  
  // Storage key
  STORAGE_KEY: 'featureFlags',
  
  // Default feature states
  DEFAULTS: {
    // Core features (always on)
    productImport: true,
    variantExtraction: true,
    imageExtraction: true,
    
    // Premium features (plan-gated)
    bulkImport: true,
    reviewsImport: true,
    priceMonitoring: true,
    stockAlerts: true,
    
    // Advanced features (opt-in)
    adsSpy: false,
    autoOrder: false,
    aiOptimization: false,
    supplierCompare: false,
    
    // UI features
    sidebar: true,
    quickImportButtons: true,
    enhancedPreview: true,
    profitCalculator: true,
    
    // Experimental features
    networkInterception: true,
    apiFirstExtraction: true,
    multiStoreSync: false,
    
    // Debug features
    showExtraction: false,
    verboseLogs: false
  },
  
  // Current flags (will be loaded from storage)
  flags: {},
  
  // User's subscription plan
  userPlan: 'free',
  
  // Plan-based feature restrictions
  PLAN_FEATURES: {
    free: ['productImport', 'variantExtraction', 'imageExtraction', 'quickImportButtons', 'sidebar'],
    starter: ['bulkImport', 'reviewsImport', 'priceMonitoring', 'enhancedPreview', 'profitCalculator'],
    pro: ['stockAlerts', 'adsSpy', 'supplierCompare', 'multiStoreSync'],
    enterprise: ['autoOrder', 'aiOptimization']
  },
  
  /**
   * Initialize feature flags from storage
   */
  async init() {
    // Start with defaults
    this.flags = { ...this.DEFAULTS };
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      try {
        const result = await new Promise(resolve => {
          chrome.storage.local.get([this.STORAGE_KEY, 'userPlan'], resolve);
        });
        
        // Load user plan
        this.userPlan = result.userPlan || 'free';
        
        // Merge stored flags
        if (result[this.STORAGE_KEY]) {
          this.flags = { ...this.flags, ...result[this.STORAGE_KEY] };
        }
        
        // Apply plan restrictions
        this.applyPlanRestrictions();
        
      } catch (e) {
        console.warn('[ShopOpti+] Failed to load feature flags:', e);
      }
    }
    
    return this;
  },
  
  /**
   * Apply plan-based feature restrictions
   */
  applyPlanRestrictions() {
    const planHierarchy = ['free', 'starter', 'pro', 'enterprise'];
    const userPlanIndex = planHierarchy.indexOf(this.userPlan);
    
    // Build allowed features set
    const allowedFeatures = new Set();
    
    for (let i = 0; i <= userPlanIndex; i++) {
      const planName = planHierarchy[i];
      const features = this.PLAN_FEATURES[planName] || [];
      features.forEach(f => allowedFeatures.add(f));
    }
    
    // Disable features not in plan (except those in DEFAULTS that are core)
    const coreFeatures = ['productImport', 'variantExtraction', 'imageExtraction'];
    
    for (const [feature, enabled] of Object.entries(this.flags)) {
      if (enabled && !coreFeatures.includes(feature) && !allowedFeatures.has(feature)) {
        // Feature requires higher plan
        this.flags[feature] = false;
      }
    }
  },
  
  /**
   * Check if a feature is enabled
   * @param {string} featureName - Name of the feature
   * @returns {boolean}
   */
  isEnabled(featureName) {
    return this.flags[featureName] === true;
  },
  
  /**
   * Enable a feature
   * @param {string} featureName - Name of the feature
   */
  async enable(featureName) {
    if (featureName in this.DEFAULTS) {
      this.flags[featureName] = true;
      await this._save();
    }
  },
  
  /**
   * Disable a feature
   * @param {string} featureName - Name of the feature
   */
  async disable(featureName) {
    if (featureName in this.DEFAULTS) {
      this.flags[featureName] = false;
      await this._save();
    }
  },
  
  /**
   * Toggle a feature
   * @param {string} featureName - Name of the feature
   */
  async toggle(featureName) {
    if (featureName in this.DEFAULTS) {
      this.flags[featureName] = !this.flags[featureName];
      await this._save();
    }
  },
  
  /**
   * Set multiple flags at once
   * @param {Object} flags - Object with feature names and boolean values
   */
  async setFlags(flags) {
    for (const [name, value] of Object.entries(flags)) {
      if (name in this.DEFAULTS && typeof value === 'boolean') {
        this.flags[name] = value;
      }
    }
    await this._save();
  },
  
  /**
   * Reset all flags to defaults
   */
  async reset() {
    this.flags = { ...this.DEFAULTS };
    await this._save();
  },
  
  /**
   * Update user plan and reapply restrictions
   * @param {string} plan - User's subscription plan
   */
  async setUserPlan(plan) {
    this.userPlan = plan;
    this.applyPlanRestrictions();
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ userPlan: plan });
    }
  },
  
  /**
   * Get all enabled features
   * @returns {string[]}
   */
  getEnabledFeatures() {
    return Object.entries(this.flags)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name);
  },
  
  /**
   * Get all disabled features
   * @returns {string[]}
   */
  getDisabledFeatures() {
    return Object.entries(this.flags)
      .filter(([_, enabled]) => !enabled)
      .map(([name]) => name);
  },
  
  /**
   * Check if feature requires higher plan
   * @param {string} featureName - Name of the feature
   * @returns {string|null} - Required plan or null if accessible
   */
  getRequiredPlan(featureName) {
    const planHierarchy = ['free', 'starter', 'pro', 'enterprise'];
    
    for (const plan of planHierarchy) {
      if (this.PLAN_FEATURES[plan]?.includes(featureName)) {
        const requiredIndex = planHierarchy.indexOf(plan);
        const userIndex = planHierarchy.indexOf(this.userPlan);
        
        if (userIndex < requiredIndex) {
          return plan;
        }
        return null;
      }
    }
    
    return null; // Core feature, always accessible
  },
  
  /**
   * Save flags to storage
   */
  async _save() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      try {
        await chrome.storage.local.set({ [this.STORAGE_KEY]: this.flags });
      } catch (e) {
        console.warn('[ShopOpti+] Failed to save feature flags:', e);
      }
    }
  },
  
  /**
   * Get feature status summary
   * @returns {Object}
   */
  getStatus() {
    return {
      plan: this.userPlan,
      enabled: this.getEnabledFeatures(),
      disabled: this.getDisabledFeatures(),
      total: Object.keys(this.flags).length
    };
  }
};

// Auto-initialize
ShopOptiFeatures.init();

// Export
if (typeof window !== 'undefined') {
  window.ShopOptiFeatures = ShopOptiFeatures;
  // Convenience alias
  window.Features = ShopOptiFeatures;
}
