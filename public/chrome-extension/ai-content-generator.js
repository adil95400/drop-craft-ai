/**
 * Drop Craft AI - Content Generator v4.2.0
 * AI-powered title, description, and SEO optimization
 * Competitive with Cartifind & AutoDS AI features
 */

(function() {
  'use strict';

  if (window.__dropCraftAIContentLoaded) return;
  window.__dropCraftAIContentLoaded = true;

  const CONFIG = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    LANGUAGES: ['en', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'zh'],
    TONES: ['professional', 'casual', 'luxury', 'urgency', 'friendly', 'technical'],
    MAX_TITLE_LENGTH: 80,
    MAX_DESCRIPTION_LENGTH: 5000
  };

  class DropCraftAIContentGenerator {
    constructor() {
      this.currentProduct = null;
      this.generatedContent = {};
      this.settings = {
        language: 'fr',
        tone: 'professional',
        includeEmojis: false,
        seoOptimized: true,
        addBulletPoints: true,
        generateTags: true
      };
      this.init();
    }

    async init() {
      await this.loadSettings();
      this.injectStyles();
      this.injectPanel();
      this.bindEvents();
      console.log('🤖 DropCraft AI Content Generator v4.2 initialized');
    }

    async loadSettings() {
      return new Promise(resolve => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['dc_ai_content_settings'], (result) => {
            if (result.dc_ai_content_settings) {
              this.settings = { ...this.settings, ...result.dc_ai_content_settings };
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
    }

    async saveSettings() {
      return new Promise(resolve => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ dc_ai_content_settings: this.settings }, resolve);
        } else {
          resolve();
        }
      });
    }

    injectStyles() {
      if (document.getElementById('dc-ai-content-styles')) return;

      const style = document.createElement('style');
      style.id = 'dc-ai-content-styles';
      style.textContent = `
        .dc-ai-btn {
          position: fixed;
          bottom: 320px;
          right: 20px;
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 6px 24px rgba(139, 92, 246, 0.5);
          z-index: 999992;
          transition: all 0.3s ease;
        }

        .dc-ai-btn:hover {
          transform: scale(1.1) rotate(10deg);
          box-shadow: 0 8px 32px rgba(139, 92, 246, 0.6);
        }

        .dc-ai-panel {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.95);
          width: 700px;
          max-width: 95vw;
          max-height: 90vh;
          background: linear-gradient(180deg, #1a1f2e 0%, #0f1419 100%);
          border-radius: 20px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
          z-index: 999999;
          display: none;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(139, 92, 246, 0.3);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .dc-ai-panel.open {
          display: flex;
          animation: dc-ai-open 0.3s ease forwards;
        }

        @keyframes dc-ai-open {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        .dc-ai-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: 999998;
          display: none;
        }

        .dc-ai-backdrop.open { display: block; }

        .dc-ai-header {
          padding: 24px;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          color: white;
          position: relative;
        }

        .dc-ai-header h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dc-ai-header p {
          margin: 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .dc-ai-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.2s ease;
        }

        .dc-ai-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        .dc-ai-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .dc-ai-section {
          margin-bottom: 24px;
        }

        .dc-ai-section-title {
          color: #e2e8f0;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dc-ai-input-group {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .dc-ai-input-group.single {
          grid-template-columns: 1fr;
        }

        .dc-ai-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .dc-ai-label {
          color: #94a3b8;
          font-size: 12px;
          font-weight: 500;
        }

        .dc-ai-select, .dc-ai-input, .dc-ai-textarea {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 12px 14px;
          color: white;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .dc-ai-select:focus, .dc-ai-input:focus, .dc-ai-textarea:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
        }

        .dc-ai-select option {
          background: #1a1f2e;
          color: white;
        }

        .dc-ai-textarea {
          min-height: 120px;
          resize: vertical;
          font-family: inherit;
        }

        .dc-ai-output {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 12px;
          padding: 16px;
          margin-top: 12px;
        }

        .dc-ai-output-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .dc-ai-output-label {
          color: #8b5cf6;
          font-size: 13px;
          font-weight: 600;
        }

        .dc-ai-output-actions {
          display: flex;
          gap: 8px;
        }

        .dc-ai-output-btn {
          background: rgba(139, 92, 246, 0.2);
          border: none;
          color: #a78bfa;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dc-ai-output-btn:hover {
          background: rgba(139, 92, 246, 0.3);
        }

        .dc-ai-output-text {
          color: #e2e8f0;
          font-size: 14px;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .dc-ai-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .dc-ai-tag {
          background: rgba(139, 92, 246, 0.15);
          border: 1px solid rgba(139, 92, 246, 0.3);
          color: #a78bfa;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
        }

        .dc-ai-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .dc-ai-toggle-label {
          color: #e2e8f0;
          font-size: 13px;
        }

        .dc-ai-toggle-switch {
          position: relative;
          width: 48px;
          height: 26px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 13px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .dc-ai-toggle-switch.active {
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
        }

        .dc-ai-toggle-switch::after {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          transition: all 0.3s ease;
        }

        .dc-ai-toggle-switch.active::after {
          left: 25px;
        }

        .dc-ai-actions {
          padding: 20px 24px;
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          gap: 12px;
        }

        .dc-ai-action-btn {
          flex: 1;
          padding: 14px 20px;
          border-radius: 12px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .dc-ai-action-btn.primary {
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          color: white;
        }

        .dc-ai-action-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
        }

        .dc-ai-action-btn.primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .dc-ai-action-btn.secondary {
          background: rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .dc-ai-action-btn.secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .dc-ai-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: dc-ai-spin 0.8s linear infinite;
        }

        @keyframes dc-ai-spin {
          to { transform: rotate(360deg); }
        }

        .dc-ai-preview {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-top: 16px;
        }

        .dc-ai-preview-title {
          color: #1a1f2e;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .dc-ai-preview-desc {
          color: #475569;
          font-size: 14px;
          line-height: 1.7;
        }

        .dc-ai-seo-score {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 12px;
          margin-top: 16px;
        }

        .dc-ai-seo-score-value {
          font-size: 32px;
          font-weight: 800;
          color: #10b981;
        }

        .dc-ai-seo-score-info {
          flex: 1;
        }

        .dc-ai-seo-score-label {
          color: #e2e8f0;
          font-size: 14px;
          font-weight: 600;
        }

        .dc-ai-seo-score-tips {
          color: #94a3b8;
          font-size: 12px;
          margin-top: 4px;
        }
      `;
      document.head.appendChild(style);
    }

    injectPanel() {
      // Floating button
      const btn = document.createElement('button');
      btn.className = 'dc-ai-btn';
      btn.id = 'dc-ai-btn';
      btn.innerHTML = '🤖';
      btn.title = 'Générateur IA de contenu';
      document.body.appendChild(btn);

      // Backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'dc-ai-backdrop';
      backdrop.id = 'dc-ai-backdrop';
      document.body.appendChild(backdrop);

      // Panel
      const panel = document.createElement('div');
      panel.className = 'dc-ai-panel';
      panel.id = 'dc-ai-panel';
      panel.innerHTML = this.renderPanel();
      document.body.appendChild(panel);
    }

    renderPanel() {
      const languageOptions = CONFIG.LANGUAGES.map(l => {
        const names = { en: 'English', fr: 'Français', de: 'Deutsch', es: 'Español', it: 'Italiano', pt: 'Português', nl: 'Nederlands', pl: 'Polski', ru: 'Русский', ja: '日本語', zh: '中文' };
        return `<option value="${l}" ${this.settings.language === l ? 'selected' : ''}>${names[l]}</option>`;
      }).join('');

      const toneOptions = CONFIG.TONES.map(t => {
        const names = { professional: 'Professionnel', casual: 'Décontracté', luxury: 'Luxe', urgency: 'Urgence', friendly: 'Amical', technical: 'Technique' };
        return `<option value="${t}" ${this.settings.tone === t ? 'selected' : ''}>${names[t]}</option>`;
      }).join('');

      return `
        <div class="dc-ai-header">
          <h3>🤖 Générateur IA de Contenu</h3>
          <p>Créez des titres, descriptions et tags optimisés SEO avec l'IA</p>
          <button class="dc-ai-close" id="dc-ai-close">✕</button>
        </div>

        <div class="dc-ai-content">
          <div class="dc-ai-section">
            <div class="dc-ai-section-title">⚙️ Paramètres de génération</div>
            <div class="dc-ai-input-group">
              <div class="dc-ai-field">
                <label class="dc-ai-label">Langue cible</label>
                <select class="dc-ai-select" id="dc-ai-language">${languageOptions}</select>
              </div>
              <div class="dc-ai-field">
                <label class="dc-ai-label">Ton du texte</label>
                <select class="dc-ai-select" id="dc-ai-tone">${toneOptions}</select>
              </div>
            </div>

            <div class="dc-ai-toggle">
              <span class="dc-ai-toggle-label">🔍 Optimisation SEO</span>
              <div class="dc-ai-toggle-switch ${this.settings.seoOptimized ? 'active' : ''}" id="dc-ai-toggle-seo"></div>
            </div>
            <div class="dc-ai-toggle">
              <span class="dc-ai-toggle-label">📋 Format liste à puces</span>
              <div class="dc-ai-toggle-switch ${this.settings.addBulletPoints ? 'active' : ''}" id="dc-ai-toggle-bullets"></div>
            </div>
            <div class="dc-ai-toggle">
              <span class="dc-ai-toggle-label">🏷️ Générer tags automatiquement</span>
              <div class="dc-ai-toggle-switch ${this.settings.generateTags ? 'active' : ''}" id="dc-ai-toggle-tags"></div>
            </div>
            <div class="dc-ai-toggle">
              <span class="dc-ai-toggle-label">😀 Inclure des emojis</span>
              <div class="dc-ai-toggle-switch ${this.settings.includeEmojis ? 'active' : ''}" id="dc-ai-toggle-emojis"></div>
            </div>
          </div>

          <div class="dc-ai-section">
            <div class="dc-ai-section-title">📦 Produit source</div>
            <div class="dc-ai-input-group single">
              <div class="dc-ai-field">
                <label class="dc-ai-label">Titre original</label>
                <input type="text" class="dc-ai-input" id="dc-ai-original-title" placeholder="Titre du produit...">
              </div>
            </div>
            <div class="dc-ai-input-group single" style="margin-top: 12px;">
              <div class="dc-ai-field">
                <label class="dc-ai-label">Description originale</label>
                <textarea class="dc-ai-textarea" id="dc-ai-original-desc" placeholder="Description du produit..."></textarea>
              </div>
            </div>
            <div class="dc-ai-input-group" style="margin-top: 12px;">
              <div class="dc-ai-field">
                <label class="dc-ai-label">Catégorie</label>
                <input type="text" class="dc-ai-input" id="dc-ai-category" placeholder="ex: Électronique, Mode...">
              </div>
              <div class="dc-ai-field">
                <label class="dc-ai-label">Mots-clés cibles (optionnel)</label>
                <input type="text" class="dc-ai-input" id="dc-ai-keywords" placeholder="ex: premium, qualité...">
              </div>
            </div>
          </div>

          <div class="dc-ai-section" id="dc-ai-results" style="display: none;">
            <div class="dc-ai-section-title">✨ Contenu généré</div>
            
            <div class="dc-ai-output" id="dc-ai-output-title">
              <div class="dc-ai-output-header">
                <span class="dc-ai-output-label">🏷️ Titre optimisé</span>
                <div class="dc-ai-output-actions">
                  <button class="dc-ai-output-btn" data-copy="title">📋 Copier</button>
                  <button class="dc-ai-output-btn" data-regenerate="title">🔄 Régénérer</button>
                </div>
              </div>
              <div class="dc-ai-output-text" id="dc-ai-gen-title"></div>
            </div>

            <div class="dc-ai-output" id="dc-ai-output-desc">
              <div class="dc-ai-output-header">
                <span class="dc-ai-output-label">📝 Description optimisée</span>
                <div class="dc-ai-output-actions">
                  <button class="dc-ai-output-btn" data-copy="desc">📋 Copier</button>
                  <button class="dc-ai-output-btn" data-regenerate="desc">🔄 Régénérer</button>
                </div>
              </div>
              <div class="dc-ai-output-text" id="dc-ai-gen-desc"></div>
            </div>

            <div class="dc-ai-output" id="dc-ai-output-tags">
              <div class="dc-ai-output-header">
                <span class="dc-ai-output-label">🏷️ Tags SEO</span>
                <div class="dc-ai-output-actions">
                  <button class="dc-ai-output-btn" data-copy="tags">📋 Copier</button>
                </div>
              </div>
              <div class="dc-ai-tags" id="dc-ai-gen-tags"></div>
            </div>

            <div class="dc-ai-seo-score" id="dc-ai-seo-score">
              <div class="dc-ai-seo-score-value" id="dc-ai-score-value">--</div>
              <div class="dc-ai-seo-score-info">
                <div class="dc-ai-seo-score-label">Score SEO</div>
                <div class="dc-ai-seo-score-tips" id="dc-ai-seo-tips">Génère du contenu pour voir le score</div>
              </div>
            </div>
          </div>
        </div>

        <div class="dc-ai-actions">
          <button class="dc-ai-action-btn secondary" id="dc-ai-extract">
            📥 Extraire de la page
          </button>
          <button class="dc-ai-action-btn primary" id="dc-ai-generate">
            ✨ Générer le contenu
          </button>
        </div>
      `;
    }

    bindEvents() {
      // Toggle panel
      document.getElementById('dc-ai-btn')?.addEventListener('click', () => this.toggle());
      document.getElementById('dc-ai-close')?.addEventListener('click', () => this.close());
      document.getElementById('dc-ai-backdrop')?.addEventListener('click', () => this.close());

      // Settings toggles
      document.getElementById('dc-ai-toggle-seo')?.addEventListener('click', (e) => this.toggleSetting(e, 'seoOptimized'));
      document.getElementById('dc-ai-toggle-bullets')?.addEventListener('click', (e) => this.toggleSetting(e, 'addBulletPoints'));
      document.getElementById('dc-ai-toggle-tags')?.addEventListener('click', (e) => this.toggleSetting(e, 'generateTags'));
      document.getElementById('dc-ai-toggle-emojis')?.addEventListener('click', (e) => this.toggleSetting(e, 'includeEmojis'));

      document.getElementById('dc-ai-language')?.addEventListener('change', (e) => {
        this.settings.language = e.target.value;
        this.saveSettings();
      });

      document.getElementById('dc-ai-tone')?.addEventListener('change', (e) => {
        this.settings.tone = e.target.value;
        this.saveSettings();
      });

      // Actions
      document.getElementById('dc-ai-extract')?.addEventListener('click', () => this.extractFromPage());
      document.getElementById('dc-ai-generate')?.addEventListener('click', () => this.generateContent());

      // Copy/regenerate buttons
      document.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', (e) => this.copyContent(e.target.dataset.copy));
      });
      document.querySelectorAll('[data-regenerate]').forEach(btn => {
        btn.addEventListener('click', (e) => this.regenerate(e.target.dataset.regenerate));
      });
    }

    toggleSetting(e, setting) {
      this.settings[setting] = !this.settings[setting];
      e.target.classList.toggle('active', this.settings[setting]);
      this.saveSettings();
    }

    toggle() {
      const panel = document.getElementById('dc-ai-panel');
      const backdrop = document.getElementById('dc-ai-backdrop');
      panel?.classList.toggle('open');
      backdrop?.classList.toggle('open');
    }

    close() {
      document.getElementById('dc-ai-panel')?.classList.remove('open');
      document.getElementById('dc-ai-backdrop')?.classList.remove('open');
    }

    async extractFromPage() {
      const product = await this.scrapeCurrentProduct();
      
      document.getElementById('dc-ai-original-title').value = product.title || '';
      document.getElementById('dc-ai-original-desc').value = product.description || '';
      document.getElementById('dc-ai-category').value = product.category || '';
    }

    async scrapeCurrentProduct() {
      const product = { title: '', description: '', category: '', images: [] };

      // Try JSON-LD first
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const json = JSON.parse(script.textContent);
          if (json['@type'] === 'Product') {
            product.title = json.name || '';
            product.description = json.description || '';
            product.category = json.category || '';
          }
        } catch (e) {}
      }

      // Fallback to DOM
      if (!product.title) {
        product.title = document.querySelector('h1')?.textContent?.trim() || 
                       document.querySelector('[class*="product-title"]')?.textContent?.trim() || '';
      }

      if (!product.description) {
        const descEl = document.querySelector('[class*="description"], [class*="detail"], #product-description, .product-description');
        product.description = descEl?.textContent?.trim() || '';
      }

      return product;
    }

    async generateContent() {
      const generateBtn = document.getElementById('dc-ai-generate');
      const originalContent = generateBtn.innerHTML;
      generateBtn.innerHTML = '<div class="dc-ai-spinner"></div> Génération...';
      generateBtn.disabled = true;

      try {
        const originalTitle = document.getElementById('dc-ai-original-title').value;
        const originalDesc = document.getElementById('dc-ai-original-desc').value;
        const category = document.getElementById('dc-ai-category').value;
        const keywords = document.getElementById('dc-ai-keywords').value;

        if (!originalTitle && !originalDesc) {
          alert('Veuillez entrer un titre ou une description à optimiser');
          return;
        }

        const result = await this.callAIAPI({
          title: originalTitle,
          description: originalDesc,
          category,
          keywords,
          settings: this.settings
        });

        this.generatedContent = result;
        this.displayResults(result);

      } catch (error) {
        console.error('AI generation error:', error);
        alert('Erreur lors de la génération. Veuillez réessayer.');
      } finally {
        generateBtn.innerHTML = originalContent;
        generateBtn.disabled = false;
      }
    }

    async callAIAPI(data) {
      // Get extension token
      const token = await this.getToken();

      const response = await fetch(`${CONFIG.API_URL}/ai-generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'x-extension-token': token })
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        // Fallback to local generation
        return this.generateLocally(data);
      }

      return response.json();
    }

    generateLocally(data) {
      // Local fallback AI generation
      const { title, description, settings } = data;
      
      // Generate optimized title
      let optimizedTitle = this.optimizeTitle(title, settings);
      
      // Generate optimized description
      let optimizedDesc = this.optimizeDescription(description, settings);

      // Generate tags
      const tags = this.generateTags(title, description, data.category, data.keywords);

      // Calculate SEO score
      const seoScore = this.calculateSEOScore(optimizedTitle, optimizedDesc, tags);

      return {
        title: optimizedTitle,
        description: optimizedDesc,
        tags,
        seoScore
      };
    }

    optimizeTitle(title, settings) {
      if (!title) return '';
      
      let result = title.trim();
      
      // Remove excessive caps
      if (result === result.toUpperCase()) {
        result = result.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
      }
      
      // Clean up special characters
      result = result.replace(/[^\w\s\-,]/g, ' ').replace(/\s+/g, ' ').trim();
      
      // Truncate if too long
      if (result.length > CONFIG.MAX_TITLE_LENGTH) {
        result = result.substring(0, CONFIG.MAX_TITLE_LENGTH - 3) + '...';
      }

      // Add emoji if enabled
      if (settings.includeEmojis) {
        const emojis = ['✨', '🔥', '⭐', '💎', '🎁', '🌟'];
        result = emojis[Math.floor(Math.random() * emojis.length)] + ' ' + result;
      }

      return result;
    }

    optimizeDescription(description, settings) {
      if (!description) return '';
      
      let result = description.trim();
      
      // Clean HTML
      const div = document.createElement('div');
      div.innerHTML = result;
      result = div.textContent || div.innerText;
      
      // Add bullet points if enabled
      if (settings.addBulletPoints) {
        const sentences = result.split(/[.!?]+/).filter(s => s.trim().length > 20);
        if (sentences.length > 3) {
          const bullets = sentences.slice(0, 5).map(s => `• ${s.trim()}`).join('\n');
          const remaining = sentences.slice(5).join('. ');
          result = bullets + (remaining ? '\n\n' + remaining : '');
        }
      }

      // Add emojis if enabled
      if (settings.includeEmojis) {
        result = result
          .replace(/qualité/gi, '⭐ Qualité')
          .replace(/livraison/gi, '🚚 Livraison')
          .replace(/garantie/gi, '✅ Garantie');
      }

      return result;
    }

    generateTags(title, description, category, keywords) {
      const allText = `${title} ${description} ${category} ${keywords}`.toLowerCase();
      const words = allText.split(/\s+/).filter(w => w.length > 3);
      
      // Count word frequency
      const freq = {};
      words.forEach(w => {
        const clean = w.replace(/[^a-zàâäéèêëïîôùûüç]/g, '');
        if (clean.length > 3) {
          freq[clean] = (freq[clean] || 0) + 1;
        }
      });

      // Get top words as tags
      const sorted = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([word]) => word);

      return sorted;
    }

    calculateSEOScore(title, description, tags) {
      let score = 0;
      const tips = [];

      // Title checks
      if (title.length >= 30 && title.length <= 70) {
        score += 20;
      } else {
        tips.push('Titre: 30-70 caractères recommandés');
      }

      // Description checks
      if (description.length >= 150) {
        score += 20;
      } else {
        tips.push('Description: min 150 caractères recommandés');
      }

      if (description.includes('•') || description.includes('-')) {
        score += 10;
      }

      // Tags check
      if (tags.length >= 5) {
        score += 20;
      } else {
        tips.push('Ajoutez plus de tags');
      }

      // Keywords in title
      if (title.split(' ').length >= 3) {
        score += 15;
      }

      // Formatting
      if (description.split('\n').length >= 2) {
        score += 15;
      }

      return { score: Math.min(100, score), tips };
    }

    displayResults(result) {
      document.getElementById('dc-ai-results').style.display = 'block';
      
      document.getElementById('dc-ai-gen-title').textContent = result.title || 'Aucun titre généré';
      document.getElementById('dc-ai-gen-desc').textContent = result.description || 'Aucune description générée';
      
      const tagsContainer = document.getElementById('dc-ai-gen-tags');
      tagsContainer.innerHTML = (result.tags || [])
        .map(tag => `<span class="dc-ai-tag">${tag}</span>`)
        .join('');

      if (result.seoScore) {
        document.getElementById('dc-ai-score-value').textContent = result.seoScore.score;
        document.getElementById('dc-ai-seo-tips').textContent = result.seoScore.tips?.join(' • ') || 'Excellent!';
      }
    }

    async copyContent(type) {
      let text = '';
      if (type === 'title') {
        text = this.generatedContent.title || '';
      } else if (type === 'desc') {
        text = this.generatedContent.description || '';
      } else if (type === 'tags') {
        text = (this.generatedContent.tags || []).join(', ');
      }

      try {
        await navigator.clipboard.writeText(text);
        // Show feedback
        const btn = document.querySelector(`[data-copy="${type}"]`);
        const original = btn.textContent;
        btn.textContent = '✓ Copié!';
        setTimeout(() => btn.textContent = original, 2000);
      } catch (e) {
        console.error('Copy failed:', e);
      }
    }

    async regenerate(type) {
      // Re-generate specific content type
      await this.generateContent();
    }

    async getToken() {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['extensionToken'], (result) => {
            resolve(result.extensionToken || null);
          });
        } else {
          resolve(null);
        }
      });
    }
  }

  // Initialize
  window.DropCraftAIContent = new DropCraftAIContentGenerator();
})();
