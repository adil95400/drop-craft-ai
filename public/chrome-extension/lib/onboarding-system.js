// ============================================
// ShopOpti+ Onboarding System v5.7.2
// Guided tours and interactive documentation
// For new users and feature discovery
// ============================================

const ShopOptiOnboarding = {
  VERSION: '5.7.2',
  
  // Current onboarding state
  state: {
    completed: false,
    currentStep: 0,
    tourActive: false,
    seenFeatures: new Set()
  },
  
  // ============================================
  // TOUR DEFINITIONS
  // ============================================
  tours: {
    welcome: {
      id: 'welcome',
      name: 'Bienvenue sur ShopOpti+',
      steps: [
        {
          target: '.shopopti-fab, .dc-toggle-fab, [class*="shopopti"]',
          title: '🚀 Bienvenue sur ShopOpti+',
          content: 'Votre assistant dropshipping intelligent. Importez des produits en 1 clic depuis 45+ marketplaces.',
          position: 'left'
        },
        {
          target: null,
          title: '🔐 Connexion requise',
          content: 'Connectez-vous avec votre clé d\'extension depuis shopopti.io/extensions/chrome pour débloquer toutes les fonctionnalités.',
          position: 'center'
        },
        {
          target: null,
          title: '⚡ Import rapide',
          content: 'Survolez un produit et cliquez sur le bouton "+" pour l\'importer instantanément.',
          position: 'center'
        },
        {
          target: null,
          title: '📦 Import en masse',
          content: 'Sélectionnez plusieurs produits et importez-les tous en une seule fois.',
          position: 'center'
        }
      ]
    },
    
    quickImport: {
      id: 'quickImport',
      name: 'Import rapide',
      steps: [
        {
          target: '.shopopti-quick-import, .dc-import-btn',
          title: '⚡ Import en 1 clic',
          content: 'Cliquez sur ce bouton pour importer le produit directement dans votre catalogue.',
          position: 'bottom'
        },
        {
          target: null,
          title: '🎯 Options avancées',
          content: 'Maintenez Shift + clic pour ouvrir les options avancées (variantes, prix, SEO IA).',
          position: 'center'
        }
      ]
    },
    
    bulkImport: {
      id: 'bulkImport',
      name: 'Import en masse',
      steps: [
        {
          target: '.shopopti-fab',
          title: '📦 Sélection multiple',
          content: 'Activez le mode sélection pour choisir plusieurs produits à importer.',
          position: 'left'
        },
        {
          target: '.shopopti-selection-overlay',
          title: '✅ Sélectionnez vos produits',
          content: 'Cliquez sur les produits que vous souhaitez importer. Une coche apparaîtra.',
          position: 'top'
        },
        {
          target: '.shopopti-fab-btn-primary',
          title: '🚀 Lancez l\'import',
          content: 'Une fois vos produits sélectionnés, cliquez sur "Importer" pour les ajouter à votre catalogue.',
          position: 'left'
        }
      ]
    },
    
    aiFeatures: {
      id: 'aiFeatures',
      name: 'Fonctionnalités IA',
      steps: [
        {
          target: '[data-feature="aiOptimization"]',
          title: '🤖 Optimisation IA',
          content: 'L\'IA optimise automatiquement vos titres, descriptions et SEO pour maximiser vos conversions.',
          position: 'bottom'
        },
        {
          target: '[data-feature="findSuppliers"]',
          title: '🔍 Recherche de fournisseurs',
          content: 'Trouvez des fournisseurs alternatifs moins chers automatiquement.',
          position: 'bottom'
        },
        {
          target: '[data-feature="translateReviews"]',
          title: '🌐 Traduction automatique',
          content: 'Les avis clients sont traduits automatiquement pour votre marché cible.',
          position: 'bottom'
        }
      ]
    },
    
    priceMonitor: {
      id: 'priceMonitor',
      name: 'Surveillance des prix',
      steps: [
        {
          target: '#dc-monitor-btn, .monitor-btn',
          title: '📊 Surveillance des prix',
          content: 'Surveillez les variations de prix et de stock de vos produits sources.',
          position: 'bottom'
        },
        {
          target: null,
          title: '🔔 Alertes automatiques',
          content: 'Recevez des notifications quand un prix change significativement.',
          position: 'center'
        }
      ]
    }
  },
  
  // ============================================
  // INITIALIZATION
  // ============================================
  async init() {
    await this.loadState();
    
    // Show welcome tour for new users
    if (!this.state.completed && !this.state.seenFeatures.has('welcome')) {
      setTimeout(() => this.startTour('welcome'), 2000);
    }
  },
  
  async loadState() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['onboardingState'], (result) => {
          if (result.onboardingState) {
            this.state = {
              ...this.state,
              ...result.onboardingState,
              seenFeatures: new Set(result.onboardingState.seenFeatures || [])
            };
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  },
  
  async saveState() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({
          onboardingState: {
            ...this.state,
            seenFeatures: Array.from(this.state.seenFeatures)
          }
        }, resolve);
      } else {
        resolve();
      }
    });
  },
  
  // ============================================
  // TOUR ENGINE
  // ============================================
  startTour(tourId) {
    const tour = this.tours[tourId];
    if (!tour) {
      console.warn('[ShopOpti+ Onboarding] Tour not found:', tourId);
      return;
    }
    
    this.state.tourActive = true;
    this.state.currentStep = 0;
    this.currentTour = tour;
    
    this.injectStyles();
    this.showStep(0);
  },
  
  showStep(stepIndex) {
    const tour = this.currentTour;
    if (!tour || stepIndex >= tour.steps.length) {
      this.endTour();
      return;
    }
    
    this.state.currentStep = stepIndex;
    const step = tour.steps[stepIndex];
    
    // Remove previous tooltip
    this.removeTooltip();
    
    // Create new tooltip
    const tooltip = this.createTooltip(step, stepIndex, tour.steps.length);
    document.body.appendChild(tooltip);
    
    // Position tooltip
    this.positionTooltip(tooltip, step);
    
    // Highlight target if exists
    if (step.target) {
      this.highlightTarget(step.target);
    }
  },
  
  createTooltip(step, currentIndex, totalSteps) {
    const tooltip = document.createElement('div');
    tooltip.className = 'shopopti-onboarding-tooltip';
    tooltip.id = 'shopopti-onboarding-tooltip';
    
    // Title
    const title = document.createElement('h3');
    title.className = 'shopopti-onboarding-title';
    title.textContent = step.title;
    tooltip.appendChild(title);
    
    // Content
    const content = document.createElement('p');
    content.className = 'shopopti-onboarding-content';
    content.textContent = step.content;
    tooltip.appendChild(content);
    
    // Progress
    const progress = document.createElement('div');
    progress.className = 'shopopti-onboarding-progress';
    progress.textContent = `${currentIndex + 1} / ${totalSteps}`;
    tooltip.appendChild(progress);
    
    // Buttons
    const buttons = document.createElement('div');
    buttons.className = 'shopopti-onboarding-buttons';
    
    if (currentIndex > 0) {
      const prevBtn = document.createElement('button');
      prevBtn.className = 'shopopti-onboarding-btn secondary';
      prevBtn.textContent = '← Précédent';
      prevBtn.onclick = () => this.showStep(currentIndex - 1);
      buttons.appendChild(prevBtn);
    }
    
    const skipBtn = document.createElement('button');
    skipBtn.className = 'shopopti-onboarding-btn skip';
    skipBtn.textContent = 'Passer';
    skipBtn.onclick = () => this.endTour();
    buttons.appendChild(skipBtn);
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'shopopti-onboarding-btn primary';
    nextBtn.textContent = currentIndex === totalSteps - 1 ? 'Terminer ✓' : 'Suivant →';
    nextBtn.onclick = () => this.showStep(currentIndex + 1);
    buttons.appendChild(nextBtn);
    
    tooltip.appendChild(buttons);
    
    return tooltip;
  },
  
  positionTooltip(tooltip, step) {
    const target = step.target ? document.querySelector(step.target) : null;
    
    if (!target || step.position === 'center') {
      // Center in viewport
      tooltip.style.position = 'fixed';
      tooltip.style.top = '50%';
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translate(-50%, -50%)';
      return;
    }
    
    const rect = target.getBoundingClientRect();
    tooltip.style.position = 'fixed';
    
    switch (step.position) {
      case 'top':
        tooltip.style.top = `${rect.top - 10}px`;
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.transform = 'translate(-50%, -100%)';
        break;
      case 'bottom':
        tooltip.style.top = `${rect.bottom + 10}px`;
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.transform = 'translateX(-50%)';
        break;
      case 'left':
        tooltip.style.top = `${rect.top + rect.height / 2}px`;
        tooltip.style.left = `${rect.left - 10}px`;
        tooltip.style.transform = 'translate(-100%, -50%)';
        break;
      case 'right':
        tooltip.style.top = `${rect.top + rect.height / 2}px`;
        tooltip.style.left = `${rect.right + 10}px`;
        tooltip.style.transform = 'translateY(-50%)';
        break;
    }
  },
  
  highlightTarget(selector) {
    const target = document.querySelector(selector);
    if (!target) return;
    
    // Remove previous highlight
    document.querySelectorAll('.shopopti-onboarding-highlight').forEach(el => {
      el.classList.remove('shopopti-onboarding-highlight');
    });
    
    target.classList.add('shopopti-onboarding-highlight');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },
  
  removeTooltip() {
    const existing = document.getElementById('shopopti-onboarding-tooltip');
    if (existing) existing.remove();
    
    document.querySelectorAll('.shopopti-onboarding-highlight').forEach(el => {
      el.classList.remove('shopopti-onboarding-highlight');
    });
  },
  
  endTour() {
    this.removeTooltip();
    this.state.tourActive = false;
    
    if (this.currentTour) {
      this.state.seenFeatures.add(this.currentTour.id);
    }
    
    // Check if all main tours completed
    if (this.state.seenFeatures.has('welcome')) {
      this.state.completed = true;
    }
    
    this.saveState();
    this.currentTour = null;
  },
  
  // ============================================
  // FEATURE HINTS (contextual tips)
  // ============================================
  showFeatureHint(featureId, message, targetSelector) {
    if (this.state.seenFeatures.has(featureId)) return;
    
    const target = targetSelector ? document.querySelector(targetSelector) : null;
    
    const hint = document.createElement('div');
    hint.className = 'shopopti-feature-hint';
    hint.id = `shopopti-hint-${featureId}`;
    
    const text = document.createElement('span');
    text.textContent = message;
    hint.appendChild(text);
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.onclick = () => {
      hint.remove();
      this.state.seenFeatures.add(featureId);
      this.saveState();
    };
    hint.appendChild(closeBtn);
    
    if (target) {
      const rect = target.getBoundingClientRect();
      hint.style.position = 'fixed';
      hint.style.top = `${rect.bottom + 8}px`;
      hint.style.left = `${rect.left}px`;
    } else {
      hint.style.position = 'fixed';
      hint.style.bottom = '80px';
      hint.style.right = '20px';
    }
    
    document.body.appendChild(hint);
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (document.getElementById(`shopopti-hint-${featureId}`)) {
        hint.remove();
      }
    }, 10000);
  },
  
  // ============================================
  // STYLES INJECTION
  // ============================================
  injectStyles() {
    if (document.getElementById('shopopti-onboarding-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'shopopti-onboarding-styles';
    style.textContent = `
      .shopopti-onboarding-tooltip {
        position: fixed;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 1px solid rgba(139, 92, 246, 0.4);
        border-radius: 16px;
        padding: 20px 24px;
        max-width: 360px;
        z-index: 2147483647;
        box-shadow: 0 20px 60px rgba(139, 92, 246, 0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        animation: shopopti-tooltip-appear 0.3s ease;
      }
      
      @keyframes shopopti-tooltip-appear {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
      
      .shopopti-onboarding-title {
        color: white;
        font-size: 18px;
        font-weight: 700;
        margin: 0 0 12px 0;
      }
      
      .shopopti-onboarding-content {
        color: rgba(255, 255, 255, 0.8);
        font-size: 14px;
        line-height: 1.6;
        margin: 0 0 16px 0;
      }
      
      .shopopti-onboarding-progress {
        color: rgba(139, 92, 246, 0.8);
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 16px;
      }
      
      .shopopti-onboarding-buttons {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
      
      .shopopti-onboarding-btn {
        padding: 10px 16px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
      }
      
      .shopopti-onboarding-btn.primary {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
      }
      
      .shopopti-onboarding-btn.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
      }
      
      .shopopti-onboarding-btn.secondary {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }
      
      .shopopti-onboarding-btn.skip {
        background: transparent;
        color: rgba(255, 255, 255, 0.5);
      }
      
      .shopopti-onboarding-highlight {
        position: relative;
        z-index: 2147483640 !important;
        box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.3) !important;
        border-radius: 8px !important;
      }
      
      .shopopti-feature-hint {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 2147483645;
        box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
        animation: shopopti-hint-appear 0.3s ease;
      }
      
      @keyframes shopopti-hint-appear {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .shopopti-feature-hint button {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `;
    document.head.appendChild(style);
  },
  
  // ============================================
  // RESET (for testing)
  // ============================================
  async reset() {
    this.state = {
      completed: false,
      currentStep: 0,
      tourActive: false,
      seenFeatures: new Set()
    };
    await this.saveState();
    console.log('[ShopOpti+ Onboarding] State reset');
  }
};

// Auto-init on page load
if (typeof window !== 'undefined') {
  window.ShopOptiOnboarding = ShopOptiOnboarding;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShopOptiOnboarding;
}
