// Ads Spy Module v1.0
// Detect and analyze competitor ads - AutoDS/AdSpy parity feature

(function() {
  'use strict';

  const AdsSpy = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    
    // Detected ads storage
    detectedAds: [],
    
    // Platform-specific ad selectors
    AD_SELECTORS: {
      facebook: {
        container: '[data-ad-preview="message"], [data-testid="fbfeed_story"]',
        sponsored: 'a[href*="ads/about"], span:contains("Sponsored")',
        productLink: 'a[data-lynx-mode="asynclazy"]',
        image: 'img[src*="scontent"]',
        video: 'video'
      },
      instagram: {
        container: 'article[role="presentation"]',
        sponsored: 'span:contains("Sponsored"), span:contains("Sponsorisé")',
        productLink: 'a[href*="/p/"]',
        image: 'img[srcset]',
        video: 'video'
      },
      tiktok: {
        container: '[data-e2e="recommend-list-item-container"]',
        sponsored: '[class*="sponsored"], [class*="ad-badge"]',
        productLink: 'a[href*="/video/"]',
        video: 'video'
      },
      youtube: {
        container: 'ytd-ad-slot-renderer, .ytp-ad-player-overlay',
        sponsored: '.ytp-ad-badge',
        productLink: 'a.ytp-ad-button',
        video: 'video'
      }
    },

    // Initialize ads detection
    init() {
      this.detectPlatform();
      if (this.currentPlatform) {
        this.startDetection();
      }
    },

    // Detect current platform
    detectPlatform() {
      const hostname = window.location.hostname;
      
      if (hostname.includes('facebook.com')) {
        this.currentPlatform = 'facebook';
      } else if (hostname.includes('instagram.com')) {
        this.currentPlatform = 'instagram';
      } else if (hostname.includes('tiktok.com')) {
        this.currentPlatform = 'tiktok';
      } else if (hostname.includes('youtube.com')) {
        this.currentPlatform = 'youtube';
      }
    },

    // Start ad detection
    startDetection() {
      const selectors = this.AD_SELECTORS[this.currentPlatform];
      if (!selectors) return;

      // Initial scan
      this.scanForAds();

      // Watch for new ads (infinite scroll)
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length) {
            this.scanForAds();
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    },

    // Scan page for ads
    scanForAds() {
      const selectors = this.AD_SELECTORS[this.currentPlatform];
      if (!selectors) return;

      const adContainers = document.querySelectorAll(selectors.container);
      
      adContainers.forEach(container => {
        // Check if it's sponsored
        const sponsoredElement = container.querySelector(selectors.sponsored) ||
          this.containsSponsored(container);
        
        if (sponsoredElement && !container.dataset.dcScanned) {
          container.dataset.dcScanned = 'true';
          
          const adData = this.extractAdData(container, selectors);
          if (adData) {
            this.detectedAds.push(adData);
            this.injectAdOverlay(container, adData);
          }
        }
      });
    },

    // Check if element contains "Sponsored" text
    containsSponsored(element) {
      const text = element.textContent.toLowerCase();
      return text.includes('sponsored') || 
             text.includes('sponsorisé') ||
             text.includes('publicité') ||
             text.includes('ad ');
    },

    // Extract ad data from container
    extractAdData(container, selectors) {
      try {
        const ad = {
          id: `ad_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          platform: this.currentPlatform,
          detectedAt: new Date().toISOString(),
          url: window.location.href
        };

        // Extract image
        const img = container.querySelector(selectors.image);
        if (img) {
          ad.image = img.src || img.srcset?.split(' ')[0];
        }

        // Extract video
        const video = container.querySelector(selectors.video);
        if (video) {
          ad.hasVideo = true;
          ad.videoUrl = video.src;
        }

        // Extract product link
        const link = container.querySelector(selectors.productLink);
        if (link) {
          ad.productLink = link.href;
        }

        // Extract text content
        const textContent = container.innerText.slice(0, 500);
        ad.description = textContent;

        // Try to extract brand name
        ad.brand = this.extractBrandName(container);

        return ad;
      } catch (error) {
        console.warn('[AdsSpy] Error extracting ad data:', error);
        return null;
      }
    },

    // Extract brand name from ad
    extractBrandName(container) {
      // Look for common brand name patterns
      const brandElements = container.querySelectorAll('a[role="link"], strong, h1, h2, h3');
      
      for (const el of brandElements) {
        const text = el.textContent?.trim();
        if (text && text.length > 2 && text.length < 50 && !text.includes('Sponsored')) {
          return text;
        }
      }
      
      return null;
    },

    // Inject overlay on detected ads
    injectAdOverlay(container, adData) {
      // Check if overlay already exists
      if (container.querySelector('.dc-ad-overlay')) return;

      container.style.position = 'relative';
      
      const overlay = document.createElement('div');
      overlay.className = 'dc-ad-overlay';
      overlay.innerHTML = `
        <div class="dc-ad-badge">
          <span class="dc-ad-icon">🎯</span>
          <span class="dc-ad-text">Pub détectée</span>
        </div>
        <div class="dc-ad-actions">
          <button class="dc-ad-btn dc-analyze-btn" title="Analyser cette pub">
            📊 Analyser
          </button>
          <button class="dc-ad-btn dc-find-product-btn" title="Trouver le produit">
            🔍 Trouver produit
          </button>
          <button class="dc-ad-btn dc-save-btn" title="Sauvegarder">
            💾 Sauver
          </button>
        </div>
      `;

      // Style overlay
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        right: 0;
        z-index: 9999;
        background: linear-gradient(135deg, rgba(0,0,0,0.8), rgba(0,0,0,0.6));
        padding: 8px 12px;
        border-radius: 0 0 0 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      `;

      // Bind events
      overlay.querySelector('.dc-analyze-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.analyzeAd(adData);
      });

      overlay.querySelector('.dc-find-product-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.findProduct(adData);
      });

      overlay.querySelector('.dc-save-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.saveAd(adData);
      });

      container.appendChild(overlay);
    },

    // Analyze detected ad
    async analyzeAd(adData) {
      console.log('[AdsSpy] Analyzing ad:', adData);
      
      // Show analysis panel
      const panel = document.createElement('div');
      panel.className = 'dc-ad-analysis-panel';
      panel.innerHTML = `
        <div class="dc-analysis-header">
          <h3>📊 Analyse de la publicité</h3>
          <button class="dc-close-analysis">✕</button>
        </div>
        <div class="dc-analysis-content">
          <div class="dc-analysis-loading">
            <div class="dc-spinner"></div>
            <span>Analyse en cours...</span>
          </div>
        </div>
      `;

      panel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #1a1a2e;
        border-radius: 16px;
        padding: 24px;
        z-index: 10000;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        min-width: 400px;
        max-width: 600px;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      `;

      document.body.appendChild(panel);

      panel.querySelector('.dc-close-analysis')?.addEventListener('click', () => {
        panel.remove();
      });

      // Perform analysis
      try {
        const analysis = await this.performAnalysis(adData);
        
        panel.querySelector('.dc-analysis-content').innerHTML = `
          <div class="dc-analysis-results">
            <div class="dc-analysis-section">
              <h4>📱 Plateforme</h4>
              <p>${adData.platform}</p>
            </div>
            ${adData.brand ? `
              <div class="dc-analysis-section">
                <h4>🏷️ Marque</h4>
                <p>${adData.brand}</p>
              </div>
            ` : ''}
            <div class="dc-analysis-section">
              <h4>📝 Description</h4>
              <p>${adData.description?.slice(0, 200) || 'Non disponible'}...</p>
            </div>
            ${adData.hasVideo ? `
              <div class="dc-analysis-section">
                <h4>🎬 Média</h4>
                <p>Vidéo détectée ✓</p>
              </div>
            ` : ''}
            <div class="dc-analysis-section">
              <h4>🎯 Recommandations</h4>
              <ul>
                <li>Recherchez ce produit sur AliExpress/Temu</li>
                <li>Analysez les commentaires pour valider la demande</li>
                <li>Vérifiez les marges potentielles</li>
              </ul>
            </div>
          </div>
          <div class="dc-analysis-actions">
            <button class="dc-btn-primary dc-find-product-from-analysis">🔍 Trouver le produit</button>
            <button class="dc-btn-secondary dc-copy-info">📋 Copier infos</button>
          </div>
        `;

        panel.querySelector('.dc-find-product-from-analysis')?.addEventListener('click', () => {
          this.findProduct(adData);
          panel.remove();
        });

        panel.querySelector('.dc-copy-info')?.addEventListener('click', () => {
          navigator.clipboard.writeText(JSON.stringify(adData, null, 2));
          alert('Informations copiées!');
        });

      } catch (error) {
        panel.querySelector('.dc-analysis-content').innerHTML = `
          <div class="dc-analysis-error">
            <span>❌ Erreur d'analyse: ${error.message}</span>
          </div>
        `;
      }
    },

    // Perform ad analysis
    async performAnalysis(adData) {
      // In a full implementation, this would call an AI service
      return {
        category: 'E-commerce',
        estimatedEngagement: 'High',
        targetAudience: 'General',
        potentialProducts: []
      };
    },

    // Find product from ad
    async findProduct(adData) {
      // Extract search terms from ad description
      const searchTerms = this.extractSearchTerms(adData.description);
      
      // Open search in new tabs
      const searchUrls = [
        `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(searchTerms)}`,
        `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(searchTerms)}`
      ];

      // Open first search
      window.open(searchUrls[0], '_blank');
      
      // Notify user
      console.log('[AdsSpy] Searching for product:', searchTerms);
    },

    // Extract search terms from ad description
    extractSearchTerms(description) {
      if (!description) return '';
      
      // Remove common ad phrases
      let clean = description
        .replace(/shop now|buy now|limited time|free shipping|achetez|livraison gratuite/gi, '')
        .replace(/[^\\w\\s]/g, ' ')
        .replace(/\\s+/g, ' ')
        .trim();
      
      // Take first meaningful words
      const words = clean.split(' ').filter(w => w.length > 3);
      return words.slice(0, 5).join(' ');
    },

    // Save ad to collection
    async saveAd(adData) {
      // Save to chrome storage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await new Promise(resolve => {
          chrome.storage.local.get(['savedAds'], resolve);
        });
        
        const savedAds = result.savedAds || [];
        savedAds.unshift(adData);
        
        // Keep only last 100 ads
        const trimmedAds = savedAds.slice(0, 100);
        
        await new Promise(resolve => {
          chrome.storage.local.set({ savedAds: trimmedAds }, resolve);
        });
        
        console.log('[AdsSpy] Ad saved!');
        alert('✅ Publicité sauvegardée!');
      }
    },

    // Get saved ads
    async getSavedAds() {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        return new Promise(resolve => {
          chrome.storage.local.get(['savedAds'], (result) => {
            resolve(result.savedAds || []);
          });
        });
      }
      return [];
    },

    // Create Ads Spy panel UI
    createSpyPanelUI() {
      const container = document.createElement('div');
      container.className = 'dc-ads-spy-panel';
      container.innerHTML = `
        <div class="dc-spy-header">
          <h3>🎯 Ads Spy - Détecteur de Publicités</h3>
          <p class="dc-spy-subtitle">Détectez et analysez les publicités de vos concurrents</p>
        </div>
        
        <div class="dc-spy-stats">
          <div class="dc-spy-stat">
            <span class="dc-stat-value">${this.detectedAds.length}</span>
            <span class="dc-stat-label">Pubs détectées</span>
          </div>
          <div class="dc-spy-stat">
            <span class="dc-stat-value">0</span>
            <span class="dc-stat-label">Sauvegardées</span>
          </div>
        </div>
        
        <div class="dc-spy-instructions">
          <h4>📖 Comment utiliser</h4>
          <ol>
            <li>Naviguez sur Facebook, Instagram, TikTok ou YouTube</li>
            <li>Les publicités seront automatiquement détectées</li>
            <li>Cliquez sur "Analyser" pour obtenir des insights</li>
            <li>Utilisez "Trouver produit" pour rechercher sur AliExpress</li>
          </ol>
        </div>
        
        <div class="dc-spy-platforms">
          <h4>Plateformes supportées</h4>
          <div class="dc-platform-badges">
            <span class="dc-platform-badge facebook">📘 Facebook</span>
            <span class="dc-platform-badge instagram">📸 Instagram</span>
            <span class="dc-platform-badge tiktok">🎵 TikTok</span>
            <span class="dc-platform-badge youtube">🎬 YouTube</span>
          </div>
        </div>
        
        <div class="dc-saved-ads-section">
          <h4>💾 Publicités sauvegardées</h4>
          <div class="dc-saved-ads-list" id="dc-saved-ads-list">
            <div class="dc-empty-state">
              <span>Aucune pub sauvegardée</span>
            </div>
          </div>
        </div>
      `;

      // Load saved ads
      this.getSavedAds().then(ads => {
        const list = container.querySelector('#dc-saved-ads-list');
        if (list && ads.length > 0) {
          list.innerHTML = ads.slice(0, 10).map(ad => `
            <div class="dc-saved-ad-item">
              <span class="dc-ad-platform">${ad.platform}</span>
              <span class="dc-ad-brand">${ad.brand || 'Unknown'}</span>
              <span class="dc-ad-date">${new Date(ad.detectedAt).toLocaleDateString()}</span>
            </div>
          `).join('');
        }
      });

      return container;
    }
  };

  // Export for use in other modules
  window.AdsSpy = AdsSpy;

  // Auto-initialize if on supported platform
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AdsSpy.init());
  } else {
    AdsSpy.init();
  }

})();
