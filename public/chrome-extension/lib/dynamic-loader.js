// ============================================
// ShopOpti+ Dynamic Script Loader v5.7.2
// P1: Charge uniquement les scripts nécessaires par plateforme
// Réduit l'empreinte mémoire et le temps de chargement
// ============================================

const ShopOptiLoader = {
  VERSION: '5.7.2',
  
  // Mapping plateforme → extracteur spécifique
  PLATFORM_EXTRACTORS: {
    'amazon': 'extractors/amazon-extractor.js',
    'aliexpress': 'extractors/aliexpress-extractor.js',
    'ebay': 'extractors/ebay-extractor.js',
    'temu': 'extractors/temu-extractor.js',
    'shein': 'extractors/shein-extractor.js',
    'etsy': 'extractors/etsy-extractor.js',
    'walmart': 'extractors/walmart-extractor.js',
    'cdiscount': 'extractors/cdiscount-extractor.js',
    'fnac': 'extractors/fnac-extractor.js',
    'rakuten': 'extractors/rakuten-extractor.js',
    'cjdropshipping': 'extractors/cjdropshipping-extractor.js',
    'banggood': 'extractors/banggood-extractor.js',
    'dhgate': 'extractors/dhgate-extractor.js',
    'wish': 'extractors/wish-extractor.js',
    'homedepot': 'extractors/homedepot-extractor.js',
    'tiktok': 'extractors/tiktok-extractor.js',
    'shopify': 'extractors/shopify-extractor.js'
  },
  
  // Scripts de base toujours chargés (minimal footprint)
  CORE_SCRIPTS: [
    'lib/security.js',
    'lib/base-extractor.js',
    'lib/platform-detector.js',
    'lib/data-normalizer.js',
    'lib/feedback-system.js'
  ],
  
  // Scripts chargés à la demande (on-action)
  LAZY_SCRIPTS: {
    bulk: [
      'lib/bulk-import-queue.js',
      'lib/bulk-import-state-machine.js'
    ],
    preview: [
      'lib/enhanced-preview.js',
      'lib/pre-import-dialog.js'
    ],
    validation: [
      'lib/product-validator.js',
      'lib/quality-scorer.js',
      'lib/variant-mapper.js'
    ],
    ai: [
      'lib/supplier-detection-engine.js',
      'lib/margin-suggestion-engine.js',
      'lib/auto-translation-service.js'
    ],
    advanced: [
      'lib/extraction-orchestrator.js',
      'lib/import-pipeline.js',
      'lib/cost-calculator.js'
    ]
  },
  
  // Scripts déjà chargés
  loadedScripts: new Set(),
  
  // Platform détectée
  currentPlatform: null,
  
  /**
   * Détecte la plateforme actuelle depuis l'URL
   */
  detectPlatform() {
    const hostname = window.location.hostname.toLowerCase();
    
    const platformMap = {
      'amazon': ['amazon.com', 'amazon.fr', 'amazon.de', 'amazon.co.uk', 'amazon.es', 'amazon.it', 'amazon.ca', 'amazon.co.jp'],
      'aliexpress': ['aliexpress.com', 'aliexpress.fr', 'aliexpress.us'],
      'ebay': ['ebay.com', 'ebay.fr', 'ebay.de', 'ebay.co.uk'],
      'temu': ['temu.com'],
      'shein': ['shein.com', 'shein.fr'],
      'etsy': ['etsy.com'],
      'walmart': ['walmart.com'],
      'cdiscount': ['cdiscount.com'],
      'fnac': ['fnac.com'],
      'rakuten': ['rakuten.fr', 'rakuten.com'],
      'cjdropshipping': ['cjdropshipping.com'],
      'banggood': ['banggood.com'],
      'dhgate': ['dhgate.com'],
      'wish': ['wish.com'],
      'homedepot': ['homedepot.com'],
      'tiktok': ['tiktok.com'],
      'shopify': ['myshopify.com']
    };
    
    for (const [platform, domains] of Object.entries(platformMap)) {
      if (domains.some(d => hostname.includes(d))) {
        this.currentPlatform = platform;
        return platform;
      }
    }
    
    return null;
  },
  
  /**
   * Charge un script dynamiquement
   */
  async loadScript(scriptPath) {
    if (this.loadedScripts.has(scriptPath)) {
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      try {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL(scriptPath);
        script.async = true;
        
        script.onload = () => {
          this.loadedScripts.add(scriptPath);
          console.log(`[ShopOpti+ Loader] Loaded: ${scriptPath}`);
          resolve();
        };
        
        script.onerror = () => {
          console.warn(`[ShopOpti+ Loader] Failed to load: ${scriptPath}`);
          // Ne pas rejeter, continuer sans ce script
          resolve();
        };
        
        document.head.appendChild(script);
      } catch (e) {
        console.warn(`[ShopOpti+ Loader] Error loading ${scriptPath}:`, e);
        resolve();
      }
    });
  },
  
  /**
   * Charge plusieurs scripts en parallèle
   */
  async loadScripts(scripts) {
    return Promise.all(scripts.map(s => this.loadScript(s)));
  },
  
  /**
   * Charge l'extracteur spécifique à la plateforme
   */
  async loadPlatformExtractor() {
    const platform = this.detectPlatform();
    
    if (!platform) {
      console.log('[ShopOpti+ Loader] Unknown platform, skipping extractor');
      return;
    }
    
    const extractor = this.PLATFORM_EXTRACTORS[platform];
    if (extractor) {
      await this.loadScript(extractor);
    }
    
    // Toujours charger le registre et le core
    await this.loadScripts([
      'extractors/core-extractor.js',
      'extractors/extractor-registry.js'
    ]);
  },
  
  /**
   * Charge un groupe de scripts lazy
   */
  async loadLazyGroup(groupName) {
    const scripts = this.LAZY_SCRIPTS[groupName];
    if (scripts) {
      console.log(`[ShopOpti+ Loader] Loading lazy group: ${groupName}`);
      await this.loadScripts(scripts);
    }
  },
  
  /**
   * Charge les scripts nécessaires pour une action spécifique
   */
  async loadForAction(action) {
    switch (action) {
      case 'import':
        await this.loadLazyGroup('validation');
        await this.loadLazyGroup('advanced');
        break;
        
      case 'bulk-import':
        await this.loadLazyGroup('bulk');
        await this.loadLazyGroup('validation');
        break;
        
      case 'preview':
        await this.loadLazyGroup('preview');
        break;
        
      case 'ai-suggestions':
        await this.loadLazyGroup('ai');
        break;
        
      case 'full':
        // Tout charger pour les power users
        await Promise.all(
          Object.keys(this.LAZY_SCRIPTS).map(g => this.loadLazyGroup(g))
        );
        break;
    }
  },
  
  /**
   * Initialisation minimale (appelée au chargement de la page)
   */
  async init() {
    console.log(`[ShopOpti+ Loader] Initializing v${this.VERSION}`);
    
    const platform = this.detectPlatform();
    
    if (!platform) {
      console.log('[ShopOpti+ Loader] Not on a supported marketplace');
      return { loaded: false, platform: null };
    }
    
    console.log(`[ShopOpti+ Loader] Platform detected: ${platform}`);
    
    // Charger uniquement l'extracteur de la plateforme
    await this.loadPlatformExtractor();
    
    // Charger le feedback system pour les toasts
    await this.loadScript('lib/feedback-system.js');
    
    // Charger le button injector
    await this.loadScript('lib/unified-button-injector.js');
    
    return { loaded: true, platform };
  },
  
  /**
   * Prépare un import (charge tous les scripts nécessaires)
   */
  async prepareForImport() {
    await this.loadForAction('import');
    await this.loadForAction('preview');
  },
  
  /**
   * Status du loader
   */
  getStatus() {
    return {
      version: this.VERSION,
      platform: this.currentPlatform,
      loadedScripts: Array.from(this.loadedScripts),
      scriptCount: this.loadedScripts.size
    };
  }
};

// Auto-init si on est sur une marketplace supportée
if (typeof window !== 'undefined') {
  window.ShopOptiLoader = ShopOptiLoader;
  
  // Initialisation automatique au chargement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ShopOptiLoader.init());
  } else {
    ShopOptiLoader.init();
  }
}
