/**
 * ShopOpti+ Pre-Import Dialog v5.7.0
 * Shows validation results and missing data before import
 * Provides clear feedback: "Ce produit sera importé sans..."
 */

(function() {
  'use strict';

  const DIALOG_STYLES = `
    .shopopti-dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 2147483646;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: shopopti-fade-in 0.2s ease;
    }

    .shopopti-dialog {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-width: 480px;
      width: 90%;
      max-height: 80vh;
      overflow: hidden;
      animation: shopopti-slide-up 0.3s ease;
    }

    .shopopti-dialog-header {
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .shopopti-dialog-header img {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      object-fit: cover;
    }

    .shopopti-dialog-header-text {
      flex: 1;
      min-width: 0;
    }

    .shopopti-dialog-title {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .shopopti-dialog-platform {
      font-size: 12px;
      color: #6b7280;
      margin-top: 2px;
    }

    .shopopti-dialog-body {
      padding: 20px 24px;
      max-height: 400px;
      overflow-y: auto;
    }

    .shopopti-score-section {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 12px;
    }

    .shopopti-score-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 700;
      color: white;
    }

    .shopopti-score-details {
      flex: 1;
    }

    .shopopti-score-label {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }

    .shopopti-score-message {
      font-size: 13px;
      color: #6b7280;
      margin-top: 4px;
    }

    .shopopti-validation-section {
      margin-bottom: 16px;
    }

    .shopopti-validation-title {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .shopopti-validation-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .shopopti-validation-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #f9fafb;
      border-radius: 8px;
      margin-bottom: 6px;
      font-size: 13px;
      color: #374151;
    }

    .shopopti-validation-item.error {
      background: #fef2f2;
      color: #dc2626;
    }

    .shopopti-validation-item.warning {
      background: #fffbeb;
      color: #d97706;
    }

    .shopopti-validation-item.success {
      background: #f0fdf4;
      color: #16a34a;
    }

    .shopopti-validation-item.info {
      background: #eff6ff;
      color: #2563eb;
    }

    .shopopti-validation-icon {
      font-size: 14px;
      flex-shrink: 0;
    }

    .shopopti-missing-summary {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #f59e0b;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .shopopti-missing-title {
      font-size: 14px;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .shopopti-missing-text {
      font-size: 13px;
      color: #78350f;
      line-height: 1.5;
    }

    .shopopti-dialog-footer {
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .shopopti-btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .shopopti-btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .shopopti-btn-secondary:hover {
      background: #e5e7eb;
    }

    .shopopti-btn-primary {
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
      color: white;
    }

    .shopopti-btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }

    .shopopti-btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .shopopti-btn-danger {
      background: #ef4444;
      color: white;
    }

    .shopopti-data-preview {
      margin-top: 16px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
    }

    .shopopti-data-preview-header {
      background: #f9fafb;
      padding: 12px 16px;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .shopopti-data-preview-content {
      padding: 16px;
      display: none;
    }

    .shopopti-data-preview-content.expanded {
      display: block;
    }

    .shopopti-data-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f3f4f6;
      font-size: 13px;
    }

    .shopopti-data-row:last-child {
      border-bottom: none;
    }

    .shopopti-data-label {
      color: #6b7280;
    }

    .shopopti-data-value {
      color: #111827;
      font-weight: 500;
      text-align: right;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    @keyframes shopopti-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes shopopti-slide-up {
      from { 
        opacity: 0;
        transform: translateY(20px);
      }
      to { 
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  class PreImportDialog {
    constructor() {
      this.dialog = null;
      this.callbacks = {};
      this.injectStyles();
    }

    /**
     * Inject CSS styles into page
     */
    injectStyles() {
      if (document.getElementById('shopopti-dialog-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'shopopti-dialog-styles';
      style.textContent = DIALOG_STYLES;
      document.head.appendChild(style);
    }

    /**
     * Show pre-import dialog
     * @param {Object} product - Normalized product data
     * @param {Object} validation - Validation report
     * @returns {Promise<boolean>} User decision (true = import, false = cancel)
     */
    show(product, validation) {
      return new Promise((resolve) => {
        this.callbacks.resolve = resolve;
        this.render(product, validation);
      });
    }

    /**
     * Render dialog
     */
    render(product, validation) {
      // Remove existing dialog
      this.close();

      const overlay = document.createElement('div');
      overlay.className = 'shopopti-dialog-overlay';
      overlay.id = 'shopopti-pre-import-dialog';

      const scoreColor = this.getScoreColor(validation.score);
      const badge = window.ShopOptiValidator?.getQualityBadge(validation.score) || 
                    { text: 'N/A', color: '#6b7280', icon: '?' };

      overlay.innerHTML = `
        <div class="shopopti-dialog">
          <!-- Header -->
          <div class="shopopti-dialog-header">
            ${product.images?.[0] ? 
              `<img src="${product.images[0]}" alt="Product" onerror="this.style.display='none'">` : 
              ''
            }
            <div class="shopopti-dialog-header-text">
              <h3 class="shopopti-dialog-title">${this.escapeHtml(product.title || 'Produit')}</h3>
              <div class="shopopti-dialog-platform">
                ${this.capitalizeFirst(product.platform || 'Inconnu')} • ${this.formatPrice(product.price, product.currency)}
              </div>
            </div>
          </div>

          <!-- Body -->
          <div class="shopopti-dialog-body">
            <!-- Score Section -->
            <div class="shopopti-score-section">
              <div class="shopopti-score-circle" style="background: ${scoreColor}">
                ${validation.score}%
              </div>
              <div class="shopopti-score-details">
                <div class="shopopti-score-label">${badge.text}</div>
                <div class="shopopti-score-message">${validation.summary || validation.userMessage}</div>
              </div>
            </div>

            <!-- Missing Data Warning -->
            ${this.renderMissingSummary(validation)}

            <!-- Validation Details -->
            ${this.renderValidationDetails(validation)}

            <!-- Data Preview -->
            ${this.renderDataPreview(product, validation)}
          </div>

          <!-- Footer -->
          <div class="shopopti-dialog-footer">
            <button class="shopopti-btn shopopti-btn-secondary" id="shopopti-cancel-btn">
              Annuler
            </button>
            <button class="shopopti-btn ${validation.canImport ? 'shopopti-btn-primary' : 'shopopti-btn-danger'}" 
                    id="shopopti-import-btn"
                    ${!validation.canImport ? 'disabled' : ''}>
              ${validation.canImport ? 'Importer quand même' : 'Import impossible'}
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      this.dialog = overlay;

      // Event listeners
      overlay.querySelector('#shopopti-cancel-btn').addEventListener('click', () => {
        this.close();
        this.callbacks.resolve?.(false);
      });

      overlay.querySelector('#shopopti-import-btn').addEventListener('click', () => {
        if (validation.canImport) {
          this.close();
          this.callbacks.resolve?.(true);
        }
      });

      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.close();
          this.callbacks.resolve?.(false);
        }
      });

      // Close on Escape
      document.addEventListener('keydown', this.handleKeydown.bind(this));

      // Toggle data preview
      overlay.querySelector('.shopopti-data-preview-header')?.addEventListener('click', () => {
        const content = overlay.querySelector('.shopopti-data-preview-content');
        content?.classList.toggle('expanded');
      });
    }

    /**
     * Render missing data summary
     */
    renderMissingSummary(validation) {
      if (validation.missingFields.length === 0) {
        return `
          <div class="shopopti-missing-summary" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-color: #10b981;">
            <div class="shopopti-missing-title" style="color: #065f46;">
              ✅ Données complètes
            </div>
            <div class="shopopti-missing-text" style="color: #047857;">
              Toutes les données du produit ont été extraites avec succès.
            </div>
          </div>
        `;
      }

      const missingList = validation.missingFields.slice(0, 5).join(', ');
      const moreCount = validation.missingFields.length > 5 ? 
        ` et ${validation.missingFields.length - 5} autre(s)` : '';

      return `
        <div class="shopopti-missing-summary">
          <div class="shopopti-missing-title">
            ⚠️ Données manquantes
          </div>
          <div class="shopopti-missing-text">
            Ce produit sera importé <strong>sans</strong> : ${missingList}${moreCount}
          </div>
        </div>
      `;
    }

    /**
     * Render validation details
     */
    renderValidationDetails(validation) {
      const sections = [];

      // Errors (critical)
      if (validation.critical?.failed?.length > 0) {
        sections.push(`
          <div class="shopopti-validation-section">
            <div class="shopopti-validation-title">
              <span style="color: #dc2626;">❌</span> Données critiques manquantes
            </div>
            <ul class="shopopti-validation-list">
              ${validation.critical.failed.map(f => `
                <li class="shopopti-validation-item error">
                  <span class="shopopti-validation-icon">✗</span>
                  ${this.escapeHtml(f.label)}: ${this.escapeHtml(f.message)}
                </li>
              `).join('')}
            </ul>
          </div>
        `);
      }

      // Warnings (important)
      if (validation.important?.failed?.length > 0) {
        sections.push(`
          <div class="shopopti-validation-section">
            <div class="shopopti-validation-title">
              <span style="color: #d97706;">⚠️</span> Données importantes manquantes
            </div>
            <ul class="shopopti-validation-list">
              ${validation.important.failed.map(f => `
                <li class="shopopti-validation-item warning">
                  <span class="shopopti-validation-icon">!</span>
                  ${this.escapeHtml(f.label)}
                </li>
              `).join('')}
            </ul>
          </div>
        `);
      }

      // Success items (collapsed by default - shown in data preview)
      const passedCount = (validation.critical?.passed?.length || 0) + 
                         (validation.important?.passed?.length || 0) +
                         (validation.optional?.passed?.length || 0);

      if (passedCount > 0) {
        sections.push(`
          <div class="shopopti-validation-section">
            <div class="shopopti-validation-title">
              <span style="color: #16a34a;">✓</span> ${passedCount} données extraites avec succès
            </div>
          </div>
        `);
      }

      return sections.join('');
    }

    /**
     * Render data preview section
     */
    renderDataPreview(product, validation) {
      const previewData = [
        { label: 'Titre', value: product.title },
        { label: 'Prix', value: this.formatPrice(product.price, product.currency) },
        { label: 'Images', value: `${product.images?.length || 0} image(s)` },
        { label: 'Variantes', value: `${product.variants?.length || 0} variante(s)` },
        { label: 'Avis', value: `${product.reviews?.length || 0} avis` },
        { label: 'Vidéos', value: `${product.videos?.length || 0} vidéo(s)` },
        { label: 'Marque', value: product.brand || '-' },
        { label: 'Catégorie', value: product.category || '-' }
      ].filter(d => d.value && d.value !== '-' && d.value !== '0 image(s)');

      return `
        <div class="shopopti-data-preview">
          <div class="shopopti-data-preview-header">
            <span>📦 Aperçu des données</span>
            <span>▼</span>
          </div>
          <div class="shopopti-data-preview-content">
            ${previewData.map(d => `
              <div class="shopopti-data-row">
                <span class="shopopti-data-label">${d.label}</span>
                <span class="shopopti-data-value">${this.escapeHtml(String(d.value))}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    /**
     * Close dialog
     */
    close() {
      if (this.dialog) {
        this.dialog.remove();
        this.dialog = null;
      }
      document.removeEventListener('keydown', this.handleKeydown.bind(this));
    }

    /**
     * Handle keyboard events
     */
    handleKeydown(e) {
      if (e.key === 'Escape') {
        this.close();
        this.callbacks.resolve?.(false);
      }
    }

    /**
     * Get color for score
     */
    getScoreColor(score) {
      if (score >= 90) return '#22c55e';
      if (score >= 75) return '#84cc16';
      if (score >= 60) return '#eab308';
      if (score >= 40) return '#f97316';
      return '#ef4444';
    }

    /**
     * Format price
     */
    formatPrice(price, currency = 'EUR') {
      if (!price) return '-';
      const symbols = { EUR: '€', USD: '$', GBP: '£' };
      return `${price.toFixed(2)} ${symbols[currency] || currency}`;
    }

    /**
     * Capitalize first letter
     */
    capitalizeFirst(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Escape HTML
     */
    escapeHtml(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  }

  // Singleton instance
  const dialog = new PreImportDialog();

  // Export
  if (typeof window !== 'undefined') {
    window.ShopOptiPreImportDialog = dialog;
    window.PreImportDialog = PreImportDialog;
  }

  console.log('[ShopOpti+] PreImportDialog v5.7.0 loaded');
})();
