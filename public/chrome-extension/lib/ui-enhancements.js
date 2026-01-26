/**
 * ShopOpti+ UI Enhancements v5.7.0
 * Tooltips, collapsible sections, and visual improvements
 */

const ShopOptiUIEnhancements = {
  VERSION: '5.7.0',
  
  // Tooltip configuration
  tooltips: {
    'importPageBtn': 'Importez le produit de cette page vers votre boutique en un clic',
    'importAllBtn': 'Sélectionnez et importez plusieurs produits depuis cette page',
    'importReviewsBtn': 'Importez uniquement les avis clients de ce produit',
    'priceMonitorBtn': 'Surveillez les variations de prix de ce produit',
    'settingsBtn': 'Paramètres de l\'extension (boutiques, règles de prix, thème)',
    'syncBtn': 'Synchroniser avec ShopOpti pour récupérer vos boutiques et paramètres',
    'dashboardBtn': 'Ouvrir le tableau de bord ShopOpti dans un nouvel onglet',
    'historyBtn': 'Voir l\'historique des imports et les logs d\'erreurs',
    'themeToggleBtn': 'Basculer entre le mode clair et le mode sombre',
    'lightModeBtn': 'Activer le mode léger pour améliorer les performances'
  },

  // Collapsible sections state
  collapsedSections: {},

  /**
   * Initialize UI enhancements
   */
  async init() {
    await this.loadPreferences();
    this.injectStyles();
    this.setupTooltips();
    this.setupCollapsibleSections();
    this.enhanceInputs();
    return this;
  },

  /**
   * Load saved preferences
   */
  async loadPreferences() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(['collapsedSections', 'showTooltips']);
      this.collapsedSections = result.collapsedSections || {
        'advanced-options': true,  // Collapsed by default
        'margin-rules': true,      // Collapsed by default
        'ai-optimization': true,   // Collapsed by default
        'supplier-search': false,
        'quick-actions': false
      };
      this.showTooltips = result.showTooltips !== false;
    }
  },

  /**
   * Inject enhancement styles
   */
  injectStyles() {
    if (document.getElementById('uiEnhancementStyles')) return;

    const styles = document.createElement('style');
    styles.id = 'uiEnhancementStyles';
    styles.textContent = `
      /* Tooltip styles */
      .so-tooltip {
        position: relative;
      }
      
      .so-tooltip::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%) translateY(-8px);
        padding: 8px 12px;
        background: var(--so-bg-elevated, #1e2438);
        color: var(--so-text, #f1f5f9);
        font-size: 12px;
        font-weight: 400;
        line-height: 1.4;
        white-space: nowrap;
        max-width: 250px;
        white-space: normal;
        border-radius: 8px;
        box-shadow: var(--so-shadow, 0 4px 20px rgba(0, 0, 0, 0.4));
        border: 1px solid var(--so-border, #2a3148);
        opacity: 0;
        visibility: hidden;
        transition: all 0.2s ease;
        z-index: 99999;
        pointer-events: none;
      }
      
      .so-tooltip::before {
        content: '';
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%) translateY(4px);
        border: 6px solid transparent;
        border-top-color: var(--so-border, #2a3148);
        opacity: 0;
        visibility: hidden;
        transition: all 0.2s ease;
        z-index: 99999;
      }
      
      .so-tooltip:hover::after,
      .so-tooltip:hover::before {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(-4px);
      }
      
      .so-tooltip:hover::before {
        transform: translateX(-50%) translateY(0);
      }
      
      /* Collapsible section styles */
      .so-collapsible {
        margin-bottom: 12px;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--so-border, #2a3148);
        background: var(--so-bg-secondary, #151929);
      }
      
      .so-collapsible-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        cursor: pointer;
        background: var(--so-bg-secondary, #151929);
        transition: background 0.2s;
        user-select: none;
      }
      
      .so-collapsible-header:hover {
        background: var(--so-bg-hover, #252b40);
      }
      
      .so-collapsible-title {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--so-text, #f1f5f9);
        font-size: 13px;
        font-weight: 600;
      }
      
      .so-collapsible-title svg {
        width: 16px;
        height: 16px;
        color: var(--so-primary, #8b5cf6);
      }
      
      .so-collapsible-badge {
        padding: 2px 8px;
        background: var(--so-primary, #8b5cf6);
        color: white;
        font-size: 10px;
        font-weight: 600;
        border-radius: 10px;
      }
      
      .so-collapsible-toggle {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--so-text-muted, #64748b);
        transition: transform 0.3s ease;
      }
      
      .so-collapsible.collapsed .so-collapsible-toggle {
        transform: rotate(-90deg);
      }
      
      .so-collapsible-content {
        padding: 16px;
        border-top: 1px solid var(--so-border, #2a3148);
        background: var(--so-bg-elevated, #1e2438);
        animation: expandIn 0.3s ease;
      }
      
      .so-collapsible.collapsed .so-collapsible-content {
        display: none;
      }
      
      @keyframes expandIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      /* Enhanced input styles */
      .so-input-group {
        position: relative;
        margin-bottom: 12px;
      }
      
      .so-input-label {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 6px;
        color: var(--so-text-secondary, #94a3b8);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .so-input-label .so-help-icon {
        width: 14px;
        height: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--so-border, #2a3148);
        color: var(--so-text-muted, #64748b);
        border-radius: 50%;
        font-size: 10px;
        cursor: help;
      }
      
      .so-input {
        width: 100%;
        padding: 10px 14px;
        background: var(--so-bg-elevated, #1e2438);
        border: 1px solid var(--so-border, #2a3148);
        border-radius: 8px;
        color: var(--so-text, #f1f5f9);
        font-size: 13px;
        transition: all 0.2s;
      }
      
      .so-input:focus {
        border-color: var(--so-primary, #8b5cf6);
        outline: none;
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
      }
      
      .so-input::placeholder {
        color: var(--so-text-muted, #64748b);
      }
      
      /* Quick tip badge */
      .so-quick-tip {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px 14px;
        background: rgba(139, 92, 246, 0.1);
        border: 1px solid rgba(139, 92, 246, 0.2);
        border-radius: 10px;
        margin-bottom: 16px;
      }
      
      .so-quick-tip-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        color: var(--so-primary, #8b5cf6);
      }
      
      .so-quick-tip-content {
        flex: 1;
      }
      
      .so-quick-tip-title {
        color: var(--so-primary, #8b5cf6);
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 2px;
      }
      
      .so-quick-tip-text {
        color: var(--so-text-secondary, #94a3b8);
        font-size: 11px;
        line-height: 1.4;
      }
      
      /* Dismiss button for tips */
      .so-quick-tip-dismiss {
        background: none;
        border: none;
        color: var(--so-text-muted, #64748b);
        cursor: pointer;
        padding: 4px;
      }
      
      .so-quick-tip-dismiss:hover {
        color: var(--so-text, #f1f5f9);
      }
    `;
    document.head.appendChild(styles);
  },

  /**
   * Setup tooltips on elements
   */
  setupTooltips() {
    if (!this.showTooltips) return;

    Object.entries(this.tooltips).forEach(([id, text]) => {
      const element = document.getElementById(id);
      if (element) {
        element.classList.add('so-tooltip');
        element.setAttribute('data-tooltip', text);
      }
    });
  },

  /**
   * Setup collapsible sections
   */
  setupCollapsibleSections() {
    document.querySelectorAll('.so-collapsible').forEach(section => {
      const id = section.dataset.sectionId;
      const header = section.querySelector('.so-collapsible-header');
      
      if (id && this.collapsedSections[id]) {
        section.classList.add('collapsed');
      }
      
      if (header) {
        header.addEventListener('click', () => {
          this.toggleSection(section, id);
        });
      }
    });
  },

  /**
   * Toggle a collapsible section
   */
  async toggleSection(section, id) {
    section.classList.toggle('collapsed');
    
    if (id) {
      this.collapsedSections[id] = section.classList.contains('collapsed');
      await this.savePreferences();
    }
  },

  /**
   * Create a collapsible section
   */
  createCollapsibleSection(options) {
    const { id, title, icon, badge, content, collapsed = false } = options;
    
    return `
      <div class="so-collapsible ${collapsed ? 'collapsed' : ''}" data-section-id="${id}">
        <div class="so-collapsible-header">
          <div class="so-collapsible-title">
            ${icon || ''}
            <span>${title}</span>
            ${badge ? `<span class="so-collapsible-badge">${badge}</span>` : ''}
          </div>
          <div class="so-collapsible-toggle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>
        <div class="so-collapsible-content">
          ${content}
        </div>
      </div>
    `;
  },

  /**
   * Create a quick tip
   */
  createQuickTip(options) {
    const { id, title, text, dismissible = true } = options;
    
    return `
      <div class="so-quick-tip" data-tip-id="${id}">
        <svg class="so-quick-tip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        <div class="so-quick-tip-content">
          <div class="so-quick-tip-title">${title}</div>
          <div class="so-quick-tip-text">${text}</div>
        </div>
        ${dismissible ? `
          <button class="so-quick-tip-dismiss" onclick="ShopOptiUIEnhancements.dismissTip('${id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        ` : ''}
      </div>
    `;
  },

  /**
   * Dismiss a tip
   */
  async dismissTip(tipId) {
    const tip = document.querySelector(`[data-tip-id="${tipId}"]`);
    if (tip) {
      tip.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => tip.remove(), 300);
      
      // Save dismissed state
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['dismissedTips']);
        const dismissedTips = result.dismissedTips || [];
        dismissedTips.push(tipId);
        await chrome.storage.local.set({ dismissedTips });
      }
    }
  },

  /**
   * Enhance form inputs
   */
  enhanceInputs() {
    document.querySelectorAll('input:not(.so-input)').forEach(input => {
      input.classList.add('so-input');
    });
    
    document.querySelectorAll('select:not(.so-input)').forEach(select => {
      select.classList.add('so-input');
    });
  },

  /**
   * Add tooltip to element
   */
  addTooltip(element, text) {
    if (element && text) {
      element.classList.add('so-tooltip');
      element.setAttribute('data-tooltip', text);
    }
  },

  /**
   * Remove tooltip from element
   */
  removeTooltip(element) {
    if (element) {
      element.classList.remove('so-tooltip');
      element.removeAttribute('data-tooltip');
    }
  },

  /**
   * Save preferences
   */
  async savePreferences() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({
        collapsedSections: this.collapsedSections,
        showTooltips: this.showTooltips
      });
    }
  },

  /**
   * Toggle tooltips visibility
   */
  async toggleTooltips() {
    this.showTooltips = !this.showTooltips;
    
    if (this.showTooltips) {
      this.setupTooltips();
    } else {
      document.querySelectorAll('.so-tooltip').forEach(el => {
        this.removeTooltip(el);
      });
    }
    
    await this.savePreferences();
    return this.showTooltips;
  }
};

// Export
if (typeof window !== 'undefined') {
  window.ShopOptiUIEnhancements = ShopOptiUIEnhancements;
}
