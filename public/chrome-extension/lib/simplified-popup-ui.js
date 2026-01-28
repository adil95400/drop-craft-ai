/**
 * ShopOpti+ Simplified Popup UI Manager v5.7.0
 * Gère les états visuels et la navigation intuitive du popup
 * Centralise la logique d'affichage pour une UX claire
 */

(function() {
  'use strict';

  /**
   * UI State Manager
   * Gère les différents états du popup et les transitions
   */
  class PopupUIManager {
    constructor() {
      this.currentState = 'idle';
      this.previousState = null;
      this.activePanel = 'main';
      this.toastQueue = [];
      this.isProcessing = false;
      
      // State machine
      this.states = {
        idle: { next: ['detecting', 'importing', 'settings'], icon: '🏠' },
        detecting: { next: ['detected', 'unsupported', 'error'], icon: '🔍' },
        detected: { next: ['importing', 'idle'], icon: '✅' },
        unsupported: { next: ['idle'], icon: '❌' },
        importing: { next: ['success', 'error', 'idle'], icon: '⏳' },
        success: { next: ['idle', 'importing'], icon: '🎉' },
        error: { next: ['idle', 'importing'], icon: '❌' },
        settings: { next: ['idle'], icon: '⚙️' }
      };

      // Animation timings
      this.timing = {
        stateTransition: 300,
        toastDuration: 4000,
        fadeIn: 200,
        fadeOut: 150
      };
    }

    /**
     * Initialize UI manager
     */
    init() {
      this.injectStyles();
      this.setupPanelNavigation();
      this.setupActionFeedback();
      console.log('[UI Manager] Initialized');
    }

    /**
     * Inject simplified UI styles
     */
    injectStyles() {
      if (document.getElementById('shopopti-ui-manager-styles')) return;

      const styles = `
        /* ============================================
           SIMPLIFIED STATE INDICATORS
           ============================================ */
        
        .so-state-indicator {
          position: fixed;
          top: 60px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          padding: 10px 20px;
          border-radius: 30px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          animation: soSlideDown 0.3s ease;
          pointer-events: none;
        }

        .so-state-indicator.detecting {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
        }

        .so-state-indicator.detected {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .so-state-indicator.importing {
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          color: white;
        }

        .so-state-indicator.success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .so-state-indicator.error {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .so-state-indicator .so-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: soSpin 0.8s linear infinite;
        }

        @keyframes soSlideDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        @keyframes soSpin {
          to { transform: rotate(360deg); }
        }

        /* ============================================
           ENHANCED TOAST SYSTEM
           ============================================ */

        .so-toast-container {
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 8px;
          pointer-events: none;
          max-width: 90%;
        }

        .so-toast {
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          animation: soToastIn 0.3s ease;
          pointer-events: auto;
        }

        .so-toast.hiding {
          animation: soToastOut 0.2s ease forwards;
        }

        .so-toast-success {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%);
          color: white;
        }

        .so-toast-error {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%);
          color: white;
        }

        .so-toast-warning {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(217, 119, 6, 0.95) 100%);
          color: white;
        }

        .so-toast-info {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.95) 100%);
          color: white;
        }

        .so-toast-icon {
          font-size: 16px;
        }

        .so-toast-close {
          margin-left: auto;
          background: none;
          border: none;
          color: inherit;
          opacity: 0.7;
          cursor: pointer;
          padding: 4px;
          font-size: 16px;
        }

        .so-toast-close:hover {
          opacity: 1;
        }

        @keyframes soToastIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes soToastOut {
          to { opacity: 0; transform: translateY(-10px) scale(0.95); }
        }

        /* ============================================
           ACTION BUTTON STATES
           ============================================ */

        .so-action-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .so-action-btn.loading {
          pointer-events: none;
        }

        .so-action-btn.loading::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .so-action-btn.loading .action-content {
          opacity: 0.6;
        }

        .so-action-btn.success {
          animation: soPulseSuccess 0.4s ease;
        }

        .so-action-btn.error {
          animation: soShakeError 0.4s ease;
        }

        @keyframes soPulseSuccess {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); box-shadow: 0 0 20px rgba(16, 185, 129, 0.5); }
        }

        @keyframes soShakeError {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        /* ============================================
           PANEL TRANSITIONS
           ============================================ */

        .so-panel {
          animation: soPanelIn 0.25s ease;
        }

        .so-panel.hidden {
          display: none !important;
        }

        .so-panel.exiting {
          animation: soPanelOut 0.2s ease forwards;
        }

        @keyframes soPanelIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes soPanelOut {
          to { opacity: 0; transform: translateY(-10px); }
        }

        /* ============================================
           SKELETON LOADING
           ============================================ */

        .so-skeleton {
          background: linear-gradient(
            90deg,
            var(--so-bg-elevated) 25%,
            var(--so-bg-hover) 50%,
            var(--so-bg-elevated) 75%
          );
          background-size: 200% 100%;
          animation: soSkeleton 1.5s infinite;
          border-radius: 6px;
        }

        @keyframes soSkeleton {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ============================================
           QUICK ACTIONS BAR
           ============================================ */

        .so-quick-actions {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          background: var(--so-bg-secondary);
          border-top: 1px solid var(--so-border);
          position: sticky;
          bottom: 0;
          z-index: 100;
        }

        .so-quick-action {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          background: var(--so-bg-elevated);
          border: 1px solid var(--so-border);
          color: var(--so-text);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .so-quick-action:hover {
          border-color: var(--so-primary);
          background: rgba(139, 92, 246, 0.1);
        }

        .so-quick-action-icon {
          font-size: 18px;
        }

        .so-quick-action.primary {
          background: var(--so-gradient);
          border-color: transparent;
          color: white;
        }

        .so-quick-action.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }

        /* ============================================
           PROGRESS INDICATOR (INLINE)
           ============================================ */

        .so-progress-inline {
          height: 4px;
          background: var(--so-bg-elevated);
          border-radius: 2px;
          overflow: hidden;
          margin: 8px 0;
        }

        .so-progress-bar {
          height: 100%;
          background: var(--so-gradient);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        /* ============================================
           CONNECTION STATUS ENHANCED
           ============================================ */

        .status-bar.connected .status-dot-inner {
          background: #10b981;
          animation: soPulse 2s infinite;
        }

        .status-bar.disconnected .status-dot-inner {
          background: #ef4444;
        }

        @keyframes soPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `;

      const styleEl = document.createElement('style');
      styleEl.id = 'shopopti-ui-manager-styles';
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);
    }

    /**
     * Transition to a new state
     * @param {string} newState - Target state
     * @param {Object} options - Transition options
     */
    async setState(newState, options = {}) {
      const currentDef = this.states[this.currentState];
      
      if (!currentDef?.next?.includes(newState) && this.currentState !== 'idle') {
        console.warn(`[UI Manager] Invalid transition: ${this.currentState} -> ${newState}`);
      }

      this.previousState = this.currentState;
      this.currentState = newState;

      // Show state indicator for transient states
      if (['detecting', 'importing'].includes(newState)) {
        this.showStateIndicator(newState, options.message);
      } else {
        this.hideStateIndicator();
      }

      // Emit event
      document.dispatchEvent(new CustomEvent('shopopti:stateChange', {
        detail: { from: this.previousState, to: newState, options }
      }));

      return newState;
    }

    /**
     * Show floating state indicator
     */
    showStateIndicator(state, message) {
      this.hideStateIndicator();

      const indicator = document.createElement('div');
      indicator.className = `so-state-indicator ${state}`;
      indicator.id = 'soStateIndicator';

      const messages = {
        detecting: 'Détection en cours...',
        importing: 'Import en cours...'
      };

      indicator.innerHTML = `
        <span class="so-spinner"></span>
        <span>${message || messages[state] || state}</span>
      `;

      document.body.appendChild(indicator);
    }

    /**
     * Hide state indicator
     */
    hideStateIndicator() {
      document.getElementById('soStateIndicator')?.remove();
    }

    /**
     * Enhanced toast notification
     * @param {string} message - Toast message
     * @param {string} type - success, error, warning, info
     * @param {Object} options - Additional options
     */
    toast(message, type = 'info', options = {}) {
      // Get or create container
      let container = document.querySelector('.so-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.className = 'so-toast-container';
        document.body.appendChild(container);
      }

      const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
      };

      const toast = document.createElement('div');
      toast.className = `so-toast so-toast-${type}`;
      toast.innerHTML = `
        <span class="so-toast-icon">${icons[type]}</span>
        <span>${message}</span>
        ${options.dismissible !== false ? '<button class="so-toast-close">×</button>' : ''}
      `;

      container.appendChild(toast);

      // Auto dismiss
      const duration = options.duration || this.timing.toastDuration;
      const timer = setTimeout(() => this.dismissToast(toast), duration);

      // Manual dismiss
      toast.querySelector('.so-toast-close')?.addEventListener('click', () => {
        clearTimeout(timer);
        this.dismissToast(toast);
      });

      return toast;
    }

    /**
     * Dismiss toast with animation
     */
    dismissToast(toast) {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), this.timing.fadeOut);
    }

    /**
     * Set button loading state
     * @param {HTMLElement|string} button - Button element or ID
     * @param {boolean} loading - Loading state
     */
    setButtonLoading(button, loading) {
      const el = typeof button === 'string' ? document.getElementById(button) : button;
      if (!el) return;

      if (loading) {
        el.classList.add('loading', 'so-action-btn');
        el.dataset.originalContent = el.innerHTML;
        const text = el.querySelector('.action-title')?.textContent || 'Chargement';
        el.innerHTML = `
          <div class="action-icon-wrapper">
            <span class="so-spinner"></span>
          </div>
          <div class="action-content">
            <span class="action-title">${text}...</span>
          </div>
        `;
      } else {
        el.classList.remove('loading');
        if (el.dataset.originalContent) {
          el.innerHTML = el.dataset.originalContent;
          delete el.dataset.originalContent;
        }
      }
    }

    /**
     * Flash button with result
     * @param {HTMLElement|string} button - Button element or ID
     * @param {string} result - success or error
     */
    flashButton(button, result) {
      const el = typeof button === 'string' ? document.getElementById(button) : button;
      if (!el) return;

      el.classList.add(result, 'so-action-btn');
      setTimeout(() => el.classList.remove(result), 400);
    }

    /**
     * Setup panel navigation
     */
    setupPanelNavigation() {
      // Tab switching with animations
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetTab = btn.dataset.tab;
          this.switchPanel(targetTab);
        });
      });
    }

    /**
     * Switch to panel with animation
     */
    switchPanel(panelId) {
      const currentPanel = document.querySelector('.tab-content:not(.hidden)');
      const targetPanel = document.getElementById(`${panelId}Tab`) || 
                          document.querySelector(`[data-tab-content="${panelId}"]`);

      if (!targetPanel || currentPanel === targetPanel) return;

      // Animate out
      if (currentPanel) {
        currentPanel.classList.add('exiting', 'so-panel');
        setTimeout(() => {
          currentPanel.classList.add('hidden');
          currentPanel.classList.remove('exiting', 'so-panel');
        }, this.timing.fadeOut);
      }

      // Animate in
      setTimeout(() => {
        targetPanel.classList.remove('hidden');
        targetPanel.classList.add('so-panel');
      }, this.timing.fadeOut);

      this.activePanel = panelId;
    }

    /**
     * Setup action feedback
     */
    setupActionFeedback() {
      // Add ripple effect to clickable elements
      document.querySelectorAll('.action-card, .stat-card, .platform-btn').forEach(el => {
        el.addEventListener('click', (e) => {
          this.createRipple(el, e);
        });
      });
    }

    /**
     * Create ripple effect
     */
    createRipple(element, event) {
      const ripple = document.createElement('span');
      const rect = element.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: soRipple 0.6s ease-out;
        pointer-events: none;
      `;

      element.style.position = 'relative';
      element.style.overflow = 'hidden';
      element.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    }

    /**
     * Show inline progress
     * @param {HTMLElement|string} container - Container element or ID
     * @param {number} percent - Progress percentage (0-100)
     */
    showProgress(container, percent) {
      const el = typeof container === 'string' ? document.getElementById(container) : container;
      if (!el) return;

      let progress = el.querySelector('.so-progress-inline');
      if (!progress) {
        progress = document.createElement('div');
        progress.className = 'so-progress-inline';
        progress.innerHTML = '<div class="so-progress-bar" style="width: 0%"></div>';
        el.appendChild(progress);
      }

      progress.querySelector('.so-progress-bar').style.width = `${percent}%`;

      if (percent >= 100) {
        setTimeout(() => progress.remove(), 500);
      }
    }

    /**
     * Show skeleton loading
     * @param {HTMLElement|string} container - Container element or ID
     * @param {number} count - Number of skeleton items
     */
    showSkeleton(container, count = 3) {
      const el = typeof container === 'string' ? document.getElementById(container) : container;
      if (!el) return;

      el.innerHTML = Array(count).fill(0).map((_, i) => `
        <div class="so-skeleton" style="height: ${20 + (i % 2) * 10}px; margin-bottom: 8px;"></div>
      `).join('');
    }

    /**
     * Render quick actions bar
     * @param {Array} actions - Action definitions
     */
    renderQuickActions(actions) {
      const existing = document.querySelector('.so-quick-actions');
      if (existing) existing.remove();

      const bar = document.createElement('div');
      bar.className = 'so-quick-actions';
      bar.innerHTML = actions.map(action => `
        <button class="so-quick-action ${action.primary ? 'primary' : ''}" data-action="${action.id}">
          <span class="so-quick-action-icon">${action.icon}</span>
          <span>${action.label}</span>
        </button>
      `).join('');

      // Bind events
      bar.querySelectorAll('.so-quick-action').forEach(btn => {
        btn.addEventListener('click', () => {
          const actionId = btn.dataset.action;
          document.dispatchEvent(new CustomEvent('shopopti:quickAction', { detail: { action: actionId } }));
        });
      });

      document.querySelector('.popup-container')?.appendChild(bar);
      return bar;
    }
  }

  // Initialize and export
  const uiManager = new PopupUIManager();
  
  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => uiManager.init());
  } else {
    uiManager.init();
  }

  window.ShopOptiUI = uiManager;

})();
