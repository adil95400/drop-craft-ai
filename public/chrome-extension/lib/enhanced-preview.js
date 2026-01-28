/**
 * ShopOpti+ Enhanced Preview v5.7.0
 * Pré-visualisation enrichie avant import
 * Affiche score qualité, warnings, données manquantes, et aperçu détaillé
 */

(function() {
  'use strict';

  const PREVIEW_STYLES = `
    .shopopti-enhanced-preview {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: previewFadeIn 0.25s ease;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .shopopti-preview-panel {
      background: #ffffff;
      border-radius: 20px;
      width: 95%;
      max-width: 560px;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 32px 64px rgba(0, 0, 0, 0.3);
      animation: previewSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Header with product image */
    .preview-header {
      position: relative;
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #06b6d4 100%);
      padding: 24px;
      color: white;
    }

    .preview-header-bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      opacity: 0.2;
      filter: blur(20px);
    }

    .preview-header-content {
      position: relative;
      z-index: 1;
      display: flex;
      gap: 16px;
    }

    .preview-product-image {
      width: 80px;
      height: 80px;
      border-radius: 12px;
      object-fit: cover;
      border: 3px solid rgba(255, 255, 255, 0.3);
      flex-shrink: 0;
    }

    .preview-product-info {
      flex: 1;
      min-width: 0;
    }

    .preview-product-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 6px 0;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .preview-product-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      opacity: 0.9;
    }

    .preview-platform-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .preview-price {
      font-size: 20px;
      font-weight: 700;
    }

    /* Quality Score Ring */
    .preview-score-section {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 24px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .score-ring {
      position: relative;
      width: 72px;
      height: 72px;
    }

    .score-ring svg {
      transform: rotate(-90deg);
    }

    .score-ring-bg {
      fill: none;
      stroke: #e5e7eb;
      stroke-width: 6;
    }

    .score-ring-progress {
      fill: none;
      stroke-width: 6;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.8s ease;
    }

    .score-ring-value {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 700;
    }

    .score-details {
      flex: 1;
    }

    .score-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 6px;
    }

    .score-message {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.4;
    }

    /* Warnings Section */
    .preview-warnings {
      padding: 16px 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .warning-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      border-radius: 12px;
      margin-bottom: 8px;
    }

    .warning-item:last-child {
      margin-bottom: 0;
    }

    .warning-item.critical {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border: 1px solid #fecaca;
    }

    .warning-item.warning {
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border: 1px solid #fde68a;
    }

    .warning-item.info {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border: 1px solid #bfdbfe;
    }

    .warning-item.success {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 1px solid #bbf7d0;
    }

    .warning-icon {
      font-size: 18px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .warning-content {
      flex: 1;
    }

    .warning-title {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .warning-item.critical .warning-title { color: #dc2626; }
    .warning-item.warning .warning-title { color: #d97706; }
    .warning-item.info .warning-title { color: #2563eb; }
    .warning-item.success .warning-title { color: #16a34a; }

    .warning-text {
      font-size: 12px;
      color: #6b7280;
    }

    /* Data Preview Grid */
    .preview-data {
      padding: 20px 24px;
      max-height: 200px;
      overflow-y: auto;
    }

    .data-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .data-item {
      background: #f9fafb;
      border-radius: 10px;
      padding: 12px;
    }

    .data-item.full-width {
      grid-column: 1 / -1;
    }

    .data-label {
      font-size: 11px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .data-value {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .data-value.missing {
      color: #d97706;
      font-weight: 500;
    }

    .data-check {
      color: #10b981;
    }

    .data-cross {
      color: #ef4444;
    }

    /* Image Preview Strip */
    .preview-images {
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .images-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .images-label {
      font-size: 12px;
      font-weight: 600;
      color: #374151;
    }

    .images-count {
      font-size: 12px;
      color: #6b7280;
    }

    .images-strip {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 4px;
    }

    .images-strip::-webkit-scrollbar {
      height: 4px;
    }

    .images-strip::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 2px;
    }

    .preview-thumb {
      width: 56px;
      height: 56px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.2s;
    }

    .preview-thumb:hover {
      border-color: #8b5cf6;
      transform: scale(1.05);
    }

    .preview-thumb.video {
      position: relative;
    }

    .preview-thumb.video::after {
      content: '▶';
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.4);
      color: white;
      font-size: 16px;
      border-radius: 6px;
    }

    /* Footer Actions */
    .preview-footer {
      padding: 20px 24px;
      display: flex;
      gap: 12px;
      background: #ffffff;
      border-top: 1px solid #e5e7eb;
    }

    .preview-btn {
      flex: 1;
      padding: 14px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .preview-btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .preview-btn-secondary:hover {
      background: #e5e7eb;
    }

    .preview-btn-primary {
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
      color: white;
    }

    .preview-btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
    }

    .preview-btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .preview-btn-quick {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .preview-btn-quick:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
    }

    @keyframes previewFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes previewSlideUp {
      from { 
        opacity: 0;
        transform: translateY(40px) scale(0.95);
      }
      to { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `;

  class EnhancedPreview {
    constructor() {
      this.overlay = null;
      this.callbacks = {};
      this.injectStyles();
    }

    /**
     * Inject styles
     */
    injectStyles() {
      if (document.getElementById('shopopti-enhanced-preview-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'shopopti-enhanced-preview-styles';
      style.textContent = PREVIEW_STYLES;
      document.head.appendChild(style);
    }

    /**
     * Show enhanced preview
     * @param {Object} product - Normalized product data
     * @param {Object} validation - Validation result from ShopOptiValidator
     * @param {Object} options - Display options
     * @returns {Promise<{action: string, options: Object}>}
     */
    show(product, validation, options = {}) {
      return new Promise((resolve) => {
        this.callbacks.resolve = resolve;
        this.render(product, validation, options);
      });
    }

    /**
     * Render preview
     */
    render(product, validation, options) {
      this.close();

      const overlay = document.createElement('div');
      overlay.className = 'shopopti-enhanced-preview';
      overlay.id = 'shopopti-enhanced-preview';

      const scoreColor = this.getScoreColor(validation.score);
      const circumference = 2 * Math.PI * 30;
      const offset = circumference - (validation.score / 100) * circumference;

      overlay.innerHTML = `
        <div class="shopopti-preview-panel">
          <!-- Header -->
          <div class="preview-header">
            ${product.images?.[0] ? `<div class="preview-header-bg" style="background-image: url('${product.images[0]}')"></div>` : ''}
            <div class="preview-header-content">
              ${product.images?.[0] ? 
                `<img src="${product.images[0]}" class="preview-product-image" alt="Product" onerror="this.style.display='none'">` : 
                ''
              }
              <div class="preview-product-info">
                <h2 class="preview-product-title">${this.escapeHtml(product.title || 'Produit sans titre')}</h2>
                <div class="preview-product-meta">
                  <span class="preview-platform-badge">${this.capitalizeFirst(product.platform || 'Inconnu')}</span>
                  <span class="preview-price">${this.formatPrice(product.price, product.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Score Section -->
          <div class="preview-score-section">
            <div class="score-ring">
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle class="score-ring-bg" cx="36" cy="36" r="30"/>
                <circle class="score-ring-progress" cx="36" cy="36" r="30"
                  stroke="${scoreColor}"
                  stroke-dasharray="${circumference}"
                  stroke-dashoffset="${offset}"/>
              </svg>
              <div class="score-ring-value" style="color: ${scoreColor}">${validation.score}%</div>
            </div>
            <div class="score-details">
              <div class="score-badge" style="background: ${scoreColor}20; color: ${scoreColor}">
                ${this.getScoreEmoji(validation.score)} ${this.getScoreLabel(validation.score)}
              </div>
              <p class="score-message">${validation.summary || validation.userMessage}</p>
            </div>
          </div>

          <!-- Warnings -->
          ${this.renderWarnings(validation)}

          <!-- Data Preview -->
          ${this.renderDataGrid(product, validation)}

          <!-- Image Strip -->
          ${this.renderImageStrip(product)}

          <!-- Footer -->
          <div class="preview-footer">
            <button class="preview-btn preview-btn-secondary" id="previewCancelBtn">
              Annuler
            </button>
            ${options.showQuickImport && validation.canImport ? `
              <button class="preview-btn preview-btn-quick" id="previewQuickBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                Rapide
              </button>
            ` : ''}
            <button class="preview-btn preview-btn-primary" id="previewImportBtn" ${!validation.canImport ? 'disabled' : ''}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              ${validation.canImport ? 'Importer' : 'Impossible'}
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      this.overlay = overlay;

      // Event listeners
      overlay.querySelector('#previewCancelBtn').addEventListener('click', () => {
        this.close();
        this.callbacks.resolve?.({ action: 'cancel' });
      });

      overlay.querySelector('#previewImportBtn').addEventListener('click', () => {
        if (validation.canImport) {
          this.close();
          this.callbacks.resolve?.({ action: 'import', mode: 'standard' });
        }
      });

      const quickBtn = overlay.querySelector('#previewQuickBtn');
      if (quickBtn) {
        quickBtn.addEventListener('click', () => {
          this.close();
          this.callbacks.resolve?.({ action: 'import', mode: 'quick' });
        });
      }

      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.close();
          this.callbacks.resolve?.({ action: 'cancel' });
        }
      });

      // Escape key
      this.handleKeydown = (e) => {
        if (e.key === 'Escape') {
          this.close();
          this.callbacks.resolve?.({ action: 'cancel' });
        }
      };
      document.addEventListener('keydown', this.handleKeydown);
    }

    /**
     * Render warnings section
     */
    renderWarnings(validation) {
      const items = [];

      // Critical errors
      if (validation.critical?.failed?.length > 0) {
        items.push({
          type: 'critical',
          icon: '🚫',
          title: 'Données critiques manquantes',
          text: validation.critical.failed.join(', ')
        });
      }

      // Warnings
      if (validation.issues?.length > 0) {
        const warnings = validation.issues.filter(i => i.severity === 'warning').slice(0, 2);
        warnings.forEach(w => {
          items.push({
            type: 'warning',
            icon: '⚠️',
            title: w.message,
            text: w.suggestion || ''
          });
        });
      }

      // Info about missing fields
      if (validation.missingFields?.length > 0 && items.length < 3) {
        items.push({
          type: 'info',
          icon: 'ℹ️',
          title: 'Champs optionnels manquants',
          text: `${validation.missingFields.slice(0, 3).join(', ')}${validation.missingFields.length > 3 ? ` +${validation.missingFields.length - 3}` : ''}`
        });
      }

      // Success if all good
      if (items.length === 0 && validation.score >= 70) {
        items.push({
          type: 'success',
          icon: '✅',
          title: 'Produit prêt pour l\'import',
          text: 'Toutes les données essentielles sont présentes'
        });
      }

      if (items.length === 0) return '';

      return `
        <div class="preview-warnings">
          ${items.map(item => `
            <div class="warning-item ${item.type}">
              <span class="warning-icon">${item.icon}</span>
              <div class="warning-content">
                <div class="warning-title">${item.title}</div>
                ${item.text ? `<div class="warning-text">${item.text}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    /**
     * Render data grid
     */
    renderDataGrid(product, validation) {
      const items = [
        { label: 'Images', value: product.images?.length || 0, icon: product.images?.length >= 3 ? '✓' : '!' },
        { label: 'Variantes', value: product.variants?.length || 0, icon: product.variants?.length > 0 ? '✓' : '–' },
        { label: 'Prix original', value: this.formatPrice(product.originalPrice || product.price, product.currency), icon: '' },
        { label: 'Stock', value: product.stock ?? 'N/A', icon: product.stock ? '✓' : '–' }
      ];

      // Add variants summary if present
      if (product.variants?.length > 0) {
        const variantTypes = [...new Set(product.variants.map(v => v.option1).filter(Boolean))];
        if (variantTypes.length > 0) {
          items.push({
            label: 'Options',
            value: variantTypes.slice(0, 3).join(', '),
            icon: '✓',
            fullWidth: true
          });
        }
      }

      return `
        <div class="preview-data">
          <div class="data-grid">
            ${items.map(item => `
              <div class="data-item ${item.fullWidth ? 'full-width' : ''}">
                <div class="data-label">${item.label}</div>
                <div class="data-value ${item.icon === '!' ? 'missing' : ''}">
                  ${item.icon === '✓' ? '<span class="data-check">✓</span>' : ''}
                  ${item.icon === '!' ? '<span class="data-cross">!</span>' : ''}
                  ${item.value}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    /**
     * Render image strip
     */
    renderImageStrip(product) {
      const images = product.images?.slice(0, 8) || [];
      const videos = product.videos?.slice(0, 2) || [];

      if (images.length === 0 && videos.length === 0) return '';

      return `
        <div class="preview-images">
          <div class="images-header">
            <span class="images-label">Médias</span>
            <span class="images-count">${images.length} images${videos.length > 0 ? `, ${videos.length} vidéos` : ''}</span>
          </div>
          <div class="images-strip">
            ${images.map(img => `
              <img src="${img}" class="preview-thumb" alt="Product" onerror="this.style.display='none'">
            `).join('')}
            ${videos.map(() => `
              <div class="preview-thumb video"></div>
            `).join('')}
          </div>
        </div>
      `;
    }

    /**
     * Helper methods
     */
    getScoreColor(score) {
      if (score >= 80) return '#10b981';
      if (score >= 60) return '#f59e0b';
      if (score >= 40) return '#f97316';
      return '#ef4444';
    }

    getScoreEmoji(score) {
      if (score >= 80) return '🌟';
      if (score >= 60) return '👍';
      if (score >= 40) return '⚠️';
      return '❌';
    }

    getScoreLabel(score) {
      if (score >= 80) return 'Excellente qualité';
      if (score >= 60) return 'Bonne qualité';
      if (score >= 40) return 'Qualité acceptable';
      return 'Qualité insuffisante';
    }

    formatPrice(price, currency = 'EUR') {
      if (!price) return 'N/A';
      const num = parseFloat(price);
      if (isNaN(num)) return price;
      
      const symbols = { EUR: '€', USD: '$', GBP: '£' };
      return `${num.toFixed(2)} ${symbols[currency] || currency}`;
    }

    capitalizeFirst(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    escapeHtml(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    /**
     * Close preview
     */
    close() {
      if (this.handleKeydown) {
        document.removeEventListener('keydown', this.handleKeydown);
      }
      this.overlay?.remove();
      this.overlay = null;
    }
  }

  // Export globally
  window.ShopOptiEnhancedPreview = new EnhancedPreview();

})();
