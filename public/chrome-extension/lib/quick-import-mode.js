/**
 * ShopOpti+ Quick Import Mode v5.7.0
 * Import en 1-clic pour utilisateurs expérimentés
 * Bypass le dialog de pré-import avec settings personnalisés
 */

(function() {
  'use strict';

  /**
   * Quick Import Manager
   * Gère le mode rapide pour les power users
   */
  class QuickImportMode {
    constructor() {
      this.enabled = false;
      this.settings = {
        autoApplyPriceRules: true,
        skipLowQualityWarning: false,
        minQualityScore: 50,
        autoSelectStore: true,
        defaultStore: null,
        autoOptimizeContent: true,
        importWithReviews: false,
        maxReviewsToImport: 20,
        showSuccessNotification: true,
        autoCloseAfterImport: false
      };
      this.importHistory = [];
      this.maxHistoryItems = 50;
    }

    /**
     * Initialize from storage
     */
    async init() {
      try {
        const chrome = typeof window.chrome !== 'undefined' ? window.chrome : null;
        if (!chrome?.storage) return;

        const result = await chrome.storage.local.get([
          'quickImportEnabled',
          'quickImportSettings',
          'quickImportHistory'
        ]);

        this.enabled = result.quickImportEnabled ?? false;
        if (result.quickImportSettings) {
          this.settings = { ...this.settings, ...result.quickImportSettings };
        }
        this.importHistory = result.quickImportHistory || [];

        console.log('[QuickImport] Initialized:', { 
          enabled: this.enabled, 
          historyCount: this.importHistory.length 
        });
      } catch (error) {
        console.error('[QuickImport] Init error:', error);
      }
    }

    /**
     * Save settings to storage
     */
    async saveSettings() {
      try {
        const chrome = typeof window.chrome !== 'undefined' ? window.chrome : null;
        if (!chrome?.storage) return;

        await chrome.storage.local.set({
          quickImportEnabled: this.enabled,
          quickImportSettings: this.settings,
          quickImportHistory: this.importHistory.slice(0, this.maxHistoryItems)
        });
      } catch (error) {
        console.error('[QuickImport] Save error:', error);
      }
    }

    /**
     * Toggle quick import mode
     */
    async toggle() {
      this.enabled = !this.enabled;
      await this.saveSettings();
      return this.enabled;
    }

    /**
     * Update specific setting
     */
    async updateSetting(key, value) {
      if (key in this.settings) {
        this.settings[key] = value;
        await this.saveSettings();
        return true;
      }
      return false;
    }

    /**
     * Check if product can be quick-imported
     * @param {Object} validation - Validation result from ShopOptiValidator
     * @returns {Object} { canQuickImport, reason }
     */
    canQuickImport(validation) {
      if (!this.enabled) {
        return { canQuickImport: false, reason: 'Mode rapide désactivé' };
      }

      if (!validation.canImport) {
        return { canQuickImport: false, reason: 'Données critiques manquantes' };
      }

      if (validation.score < this.settings.minQualityScore && !this.settings.skipLowQualityWarning) {
        return { 
          canQuickImport: false, 
          reason: `Score qualité insuffisant (${validation.score}% < ${this.settings.minQualityScore}%)`
        };
      }

      return { canQuickImport: true, reason: null };
    }

    /**
     * Apply quick import settings to product
     * @param {Object} product - Normalized product data
     * @param {Object} priceRules - User's price rules
     * @returns {Object} Modified product ready for import
     */
    applyQuickSettings(product, priceRules = null) {
      const modified = { ...product };

      // Apply price rules automatically
      if (this.settings.autoApplyPriceRules && priceRules) {
        modified.price = this.calculatePrice(product.price, priceRules);
        modified.compareAtPrice = this.calculateComparePrice(modified.price, priceRules);
      }

      // Auto-select default store
      if (this.settings.autoSelectStore && this.settings.defaultStore) {
        modified.targetStore = this.settings.defaultStore;
      }

      // Flag for content optimization
      modified.autoOptimize = this.settings.autoOptimizeContent;

      // Reviews settings
      if (this.settings.importWithReviews) {
        modified.importReviews = true;
        modified.maxReviews = this.settings.maxReviewsToImport;
      }

      return modified;
    }

    /**
     * Calculate selling price based on rules
     */
    calculatePrice(costPrice, rules) {
      if (!costPrice || !rules) return costPrice;

      const cost = parseFloat(costPrice);
      if (isNaN(cost)) return costPrice;

      // Apply margin
      if (rules.marginType === 'percentage') {
        return (cost * (1 + (rules.marginValue || 30) / 100)).toFixed(2);
      } else if (rules.marginType === 'fixed') {
        return (cost + (rules.marginValue || 10)).toFixed(2);
      }

      // Default 30% margin
      return (cost * 1.3).toFixed(2);
    }

    /**
     * Calculate compare-at price (crossed out price)
     */
    calculateComparePrice(sellingPrice, rules) {
      if (!rules?.showComparePrice) return null;

      const price = parseFloat(sellingPrice);
      if (isNaN(price)) return null;

      const markup = rules.comparePriceMarkup || 20;
      return (price * (1 + markup / 100)).toFixed(2);
    }

    /**
     * Record successful import
     */
    async recordImport(product, platform) {
      const record = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        title: product.title?.substring(0, 60),
        platform,
        price: product.price,
        score: product.qualityScore || 0,
        timestamp: new Date().toISOString(),
        mode: 'quick'
      };

      this.importHistory.unshift(record);
      if (this.importHistory.length > this.maxHistoryItems) {
        this.importHistory = this.importHistory.slice(0, this.maxHistoryItems);
      }

      await this.saveSettings();
      return record;
    }

    /**
     * Get import statistics
     */
    getStats() {
      const today = new Date().toDateString();
      const todayImports = this.importHistory.filter(
        h => new Date(h.timestamp).toDateString() === today
      );

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekImports = this.importHistory.filter(
        h => new Date(h.timestamp) >= weekAgo
      );

      const avgScore = this.importHistory.length > 0
        ? Math.round(this.importHistory.reduce((sum, h) => sum + (h.score || 0), 0) / this.importHistory.length)
        : 0;

      return {
        today: todayImports.length,
        thisWeek: weekImports.length,
        total: this.importHistory.length,
        avgQualityScore: avgScore,
        topPlatform: this.getTopPlatform()
      };
    }

    /**
     * Get most used platform
     */
    getTopPlatform() {
      if (this.importHistory.length === 0) return null;

      const counts = {};
      this.importHistory.forEach(h => {
        counts[h.platform] = (counts[h.platform] || 0) + 1;
      });

      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    }

    /**
     * Clear import history
     */
    async clearHistory() {
      this.importHistory = [];
      await this.saveSettings();
    }

    /**
     * Render Quick Import toggle UI
     * @returns {string} HTML string
     */
    renderToggleUI() {
      return `
        <div class="quick-import-toggle ${this.enabled ? 'active' : ''}" id="quickImportToggle">
          <div class="quick-import-toggle-header">
            <div class="quick-import-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div class="quick-import-info">
              <span class="quick-import-label">Mode Rapide</span>
              <span class="quick-import-status">${this.enabled ? 'Activé' : 'Désactivé'}</span>
            </div>
            <label class="quick-import-switch">
              <input type="checkbox" ${this.enabled ? 'checked' : ''} id="quickImportCheck">
              <span class="quick-import-slider"></span>
            </label>
          </div>
          ${this.enabled ? this.renderQuickStats() : ''}
        </div>
      `;
    }

    /**
     * Render quick stats when enabled
     */
    renderQuickStats() {
      const stats = this.getStats();
      return `
        <div class="quick-import-stats">
          <div class="quick-stat">
            <span class="quick-stat-value">${stats.today}</span>
            <span class="quick-stat-label">Aujourd'hui</span>
          </div>
          <div class="quick-stat">
            <span class="quick-stat-value">${stats.avgQualityScore}%</span>
            <span class="quick-stat-label">Score moyen</span>
          </div>
          <div class="quick-stat">
            <span class="quick-stat-value">${stats.total}</span>
            <span class="quick-stat-label">Total</span>
          </div>
        </div>
      `;
    }

    /**
     * Render settings panel
     */
    renderSettingsPanel() {
      return `
        <div class="quick-import-settings" id="quickImportSettings">
          <h4 class="settings-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42"/>
            </svg>
            Paramètres Mode Rapide
          </h4>
          
          <div class="setting-group">
            <label class="setting-item">
              <span>Score qualité minimum</span>
              <select id="minQualityScore">
                <option value="30" ${this.settings.minQualityScore === 30 ? 'selected' : ''}>30% (Bas)</option>
                <option value="50" ${this.settings.minQualityScore === 50 ? 'selected' : ''}>50% (Moyen)</option>
                <option value="70" ${this.settings.minQualityScore === 70 ? 'selected' : ''}>70% (Élevé)</option>
              </select>
            </label>
            
            <label class="setting-item checkbox">
              <input type="checkbox" id="autoApplyPriceRules" 
                ${this.settings.autoApplyPriceRules ? 'checked' : ''}>
              <span>Appliquer les règles de prix auto</span>
            </label>
            
            <label class="setting-item checkbox">
              <input type="checkbox" id="autoOptimizeContent"
                ${this.settings.autoOptimizeContent ? 'checked' : ''}>
              <span>Optimiser le contenu (IA)</span>
            </label>
            
            <label class="setting-item checkbox">
              <input type="checkbox" id="importWithReviews"
                ${this.settings.importWithReviews ? 'checked' : ''}>
              <span>Inclure les avis automatiquement</span>
            </label>
            
            <label class="setting-item checkbox">
              <input type="checkbox" id="showSuccessNotification"
                ${this.settings.showSuccessNotification ? 'checked' : ''}>
              <span>Notification de succès</span>
            </label>
          </div>
        </div>
      `;
    }
  }

  // CSS for Quick Import Mode
  const QUICK_IMPORT_STYLES = `
    .quick-import-toggle {
      background: var(--so-bg-elevated);
      border: 1px solid var(--so-border);
      border-radius: var(--so-radius-sm);
      padding: 12px;
      margin: 12px 16px;
      transition: var(--so-transition);
    }
    
    .quick-import-toggle.active {
      border-color: var(--so-primary);
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%);
    }
    
    .quick-import-toggle-header {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .quick-import-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--so-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    
    .quick-import-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .quick-import-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--so-text);
    }
    
    .quick-import-status {
      font-size: 11px;
      color: var(--so-text-muted);
    }
    
    .quick-import-switch {
      position: relative;
      width: 44px;
      height: 24px;
    }
    
    .quick-import-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .quick-import-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--so-border);
      transition: 0.3s;
      border-radius: 24px;
    }
    
    .quick-import-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }
    
    .quick-import-switch input:checked + .quick-import-slider {
      background: var(--so-gradient);
    }
    
    .quick-import-switch input:checked + .quick-import-slider:before {
      transform: translateX(20px);
    }
    
    .quick-import-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--so-border);
    }
    
    .quick-stat {
      text-align: center;
    }
    
    .quick-stat-value {
      display: block;
      font-size: 16px;
      font-weight: 700;
      color: var(--so-primary);
    }
    
    .quick-stat-label {
      font-size: 10px;
      color: var(--so-text-muted);
      text-transform: uppercase;
    }
    
    .quick-import-settings {
      background: var(--so-bg-secondary);
      border-radius: var(--so-radius-sm);
      padding: 16px;
      margin: 12px 16px;
    }
    
    .settings-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      color: var(--so-text);
      margin-bottom: 12px;
    }
    
    .setting-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .setting-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: var(--so-text-secondary);
    }
    
    .setting-item.checkbox {
      justify-content: flex-start;
      gap: 10px;
    }
    
    .setting-item select {
      background: var(--so-bg-elevated);
      border: 1px solid var(--so-border);
      border-radius: 6px;
      padding: 6px 10px;
      color: var(--so-text);
      font-size: 12px;
    }
    
    .setting-item input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: var(--so-primary);
    }
  `;

  // Inject styles
  function injectQuickImportStyles() {
    if (document.getElementById('shopopti-quick-import-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'shopopti-quick-import-styles';
    style.textContent = QUICK_IMPORT_STYLES;
    document.head.appendChild(style);
  }

  // Initialize
  injectQuickImportStyles();

  // Export globally
  window.ShopOptiQuickImport = new QuickImportMode();
  window.ShopOptiQuickImport.init();

})();
