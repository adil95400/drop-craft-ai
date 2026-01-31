/**
 * ShopOpti+ Feedback System v5.7.2
 * Standardized UX feedback for all import operations
 * PHASE 2: Clear, consistent feedback with explicit success/failure states
 * SECURITY FIX v5.7.2: XSS-safe DOM manipulation (no innerHTML with user data)
 */

(function() {
  'use strict';

  // Feedback types with styling
  const FEEDBACK_TYPES = {
    success: {
      icon: '✓',
      bgColor: '#10b981',
      borderColor: '#059669',
      textColor: '#ffffff'
    },
    draft: {
      icon: '📝',
      bgColor: '#f59e0b',
      borderColor: '#d97706',
      textColor: '#ffffff'
    },
    blocked: {
      icon: '🚫',
      bgColor: '#ef4444',
      borderColor: '#dc2626',
      textColor: '#ffffff'
    },
    error: {
      icon: '❌',
      bgColor: '#dc2626',
      borderColor: '#b91c1c',
      textColor: '#ffffff'
    },
    info: {
      icon: 'ℹ️',
      bgColor: '#3b82f6',
      borderColor: '#2563eb',
      textColor: '#ffffff'
    },
    warning: {
      icon: '⚠️',
      bgColor: '#f97316',
      borderColor: '#ea580c',
      textColor: '#ffffff'
    }
  };

  // Import result templates
  const FEEDBACK_TEMPLATES = {
    // Success scenarios
    import_success: {
      type: 'success',
      title: 'Produit importé',
      getMessage: (data) => {
        const parts = [];
        if (data.score) parts.push(`Score: ${data.score}%`);
        if (data.images) parts.push(`${data.images} images`);
        if (data.variants) parts.push(`${data.variants} variantes`);
        return parts.join(' • ') || 'Import complet';
      }
    },
    
    import_success_with_reviews: {
      type: 'success',
      title: 'Produit + avis importés',
      getMessage: (data) => `${data.reviews || 0} avis importés`
    },
    
    import_success_ai: {
      type: 'success',
      title: 'Produit optimisé par IA',
      getMessage: () => 'Titre et description améliorés'
    },

    // Draft scenarios
    import_draft: {
      type: 'draft',
      title: 'Créé en brouillon',
      getMessage: (data) => data.reason || 'Données incomplètes → À traiter'
    },
    
    import_draft_missing_data: {
      type: 'draft',
      title: 'Brouillon créé',
      getMessage: (data) => {
        const missing = data.missingFields || [];
        if (missing.length > 0) {
          return `Manque: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}`;
        }
        return 'Complétez depuis "À traiter"';
      }
    },

    // Blocked scenarios
    import_blocked: {
      type: 'blocked',
      title: 'Import bloqué',
      getMessage: (data) => {
        const criticalMissing = data.criticalMissing || [];
        if (criticalMissing.includes('images')) {
          return 'Aucune image détectée - Import impossible';
        }
        if (criticalMissing.includes('price')) {
          return 'Prix invalide ou absent';
        }
        if (criticalMissing.includes('title')) {
          return 'Titre absent ou trop court';
        }
        return data.reason || 'Données critiques manquantes';
      }
    },

    // Error scenarios
    import_error: {
      type: 'error',
      title: 'Erreur d\'import',
      getMessage: (data) => data.message || 'Une erreur technique est survenue'
    },
    
    network_error: {
      type: 'error',
      title: 'Erreur réseau',
      getMessage: () => 'Vérifiez votre connexion'
    },
    
    auth_required: {
      type: 'info',
      title: 'Connexion requise',
      getMessage: () => 'Connectez-vous sur ShopOpti pour importer'
    },
    
    session_expired: {
      type: 'warning',
      title: 'Session expirée',
      getMessage: () => 'Reconnexion nécessaire'
    },

    // Bulk import scenarios
    bulk_complete: {
      type: 'success',
      title: 'Import en masse terminé',
      getMessage: (data) => {
        const parts = [];
        if (data.successful > 0) parts.push(`✓ ${data.successful} importés`);
        if (data.drafted > 0) parts.push(`📝 ${data.drafted} brouillons`);
        if (data.blocked > 0) parts.push(`🚫 ${data.blocked} bloqués`);
        if (data.failed > 0) parts.push(`❌ ${data.failed} erreurs`);
        return parts.join(' • ');
      }
    },
    
    bulk_partial: {
      type: 'warning',
      title: 'Import partiellement réussi',
      getMessage: (data) => {
        return `${data.successful || 0}/${data.total} produits importés`;
      }
    },
    
    bulk_failed: {
      type: 'error',
      title: 'Import échoué',
      getMessage: (data) => data.reason || 'Tous les imports ont échoué'
    }
  };

  class FeedbackSystem {
    constructor() {
      this.toastContainer = null;
      this.activeToasts = new Map();
      this.maxToasts = 4;
      this.defaultDuration = 5000;
      this.init();
    }

    init() {
      // Create toast container if not exists
      if (!document.querySelector('.shopopti-toast-container')) {
        this.createToastContainer();
      }
      this.injectStyles();
    }

    createToastContainer() {
      this.toastContainer = document.createElement('div');
      this.toastContainer.className = 'shopopti-toast-container';
      document.body.appendChild(this.toastContainer);
    }

    injectStyles() {
      if (document.querySelector('#shopopti-feedback-styles')) return;

      const styles = document.createElement('style');
      styles.id = 'shopopti-feedback-styles';
      styles.textContent = `
        .shopopti-toast-container {
          position: fixed;
          top: 16px;
          right: 16px;
          z-index: 2147483647;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 380px;
          pointer-events: none;
        }

        .shopopti-toast {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
          animation: shopopti-toast-in 0.3s ease-out;
          pointer-events: auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          backdrop-filter: blur(8px);
          border: 1px solid;
          min-width: 300px;
        }

        .shopopti-toast.exiting {
          animation: shopopti-toast-out 0.3s ease-in forwards;
        }

        @keyframes shopopti-toast-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes shopopti-toast-out {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }

        .shopopti-toast-icon {
          font-size: 20px;
          line-height: 1;
          flex-shrink: 0;
        }

        .shopopti-toast-content {
          flex: 1;
          min-width: 0;
        }

        .shopopti-toast-title {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 2px;
          line-height: 1.3;
        }

        .shopopti-toast-message {
          font-size: 13px;
          opacity: 0.9;
          line-height: 1.4;
          word-wrap: break-word;
        }

        .shopopti-toast-actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }

        .shopopti-toast-action {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          color: inherit;
          transition: background 0.2s;
        }

        .shopopti-toast-action:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .shopopti-toast-action.primary {
          background: rgba(255, 255, 255, 0.95);
          color: #1a1a1a;
        }

        .shopopti-toast-close {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: rgba(0, 0, 0, 0.1);
          color: inherit;
          border-radius: 50%;
          cursor: pointer;
          font-size: 12px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .shopopti-toast-close:hover {
          opacity: 1;
        }

        .shopopti-toast-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 0 0 12px 12px;
          transition: width linear;
        }

        /* Bulk report modal */
        .shopopti-bulk-report-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 2147483646;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: shopopti-fade-in 0.2s ease-out;
        }

        @keyframes shopopti-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .shopopti-bulk-report {
          background: #ffffff;
          border-radius: 16px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: shopopti-slide-up 0.3s ease-out;
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

        .shopopti-bulk-report-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .shopopti-bulk-report-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .shopopti-bulk-report-header-text h3 {
          margin: 0 0 4px;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }

        .shopopti-bulk-report-header-text p {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        }

        .shopopti-bulk-report-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: #e5e7eb;
        }

        .shopopti-bulk-report-stat {
          background: #f9fafb;
          padding: 16px;
          text-align: center;
        }

        .shopopti-bulk-report-stat-value {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .shopopti-bulk-report-stat-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .shopopti-bulk-report-stat.success .shopopti-bulk-report-stat-value { color: #10b981; }
        .shopopti-bulk-report-stat.draft .shopopti-bulk-report-stat-value { color: #f59e0b; }
        .shopopti-bulk-report-stat.blocked .shopopti-bulk-report-stat-value { color: #ef4444; }
        .shopopti-bulk-report-stat.error .shopopti-bulk-report-stat-value { color: #dc2626; }

        .shopopti-bulk-report-details {
          padding: 16px 24px;
          max-height: 200px;
          overflow-y: auto;
        }

        .shopopti-bulk-report-details-title {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .shopopti-bulk-report-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
          font-size: 13px;
        }

        .shopopti-bulk-report-item:last-child {
          border-bottom: none;
        }

        .shopopti-bulk-report-item-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          flex-shrink: 0;
        }

        .shopopti-bulk-report-item-icon.success { background: #d1fae5; color: #059669; }
        .shopopti-bulk-report-item-icon.draft { background: #fef3c7; color: #d97706; }
        .shopopti-bulk-report-item-icon.blocked { background: #fee2e2; color: #dc2626; }
        .shopopti-bulk-report-item-icon.error { background: #fee2e2; color: #b91c1c; }

        .shopopti-bulk-report-item-text {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #374151;
        }

        .shopopti-bulk-report-item-reason {
          font-size: 12px;
          color: #9ca3af;
        }

        .shopopti-bulk-report-footer {
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .shopopti-bulk-report-btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .shopopti-bulk-report-btn.secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .shopopti-bulk-report-btn.secondary:hover {
          background: #e5e7eb;
        }

        .shopopti-bulk-report-btn.primary {
          background: #10b981;
          color: white;
        }

        .shopopti-bulk-report-btn.primary:hover {
          background: #059669;
        }
      `;
      document.head.appendChild(styles);
    }

    /**
     * Show feedback based on template
     */
    showFeedback(templateId, data = {}, options = {}) {
      const template = FEEDBACK_TEMPLATES[templateId];
      if (!template) {
        console.warn('[Feedback] Unknown template:', templateId);
        return this.showToast(data.message || 'Notification', 'info');
      }

      const feedbackType = FEEDBACK_TYPES[template.type];
      const message = template.getMessage(data);

      return this.showToast(message, template.type, {
        title: template.title,
        duration: options.duration || this.defaultDuration,
        actions: options.actions,
        ...options
      });
    }

    /**
     * Show a toast notification
     * SECURITY: Uses safe DOM manipulation instead of innerHTML to prevent XSS
     */
    showToast(message, type = 'info', options = {}) {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const feedbackType = FEEDBACK_TYPES[type] || FEEDBACK_TYPES.info;
      const duration = options.duration || this.defaultDuration;

      // Create toast element safely
      const toast = document.createElement('div');
      toast.className = 'shopopti-toast';
      toast.id = id;
      toast.style.background = feedbackType.bgColor;
      toast.style.borderColor = feedbackType.borderColor;
      toast.style.color = feedbackType.textColor;
      toast.style.position = 'relative';

      // Icon (safe - from predefined constants)
      const iconSpan = document.createElement('span');
      iconSpan.className = 'shopopti-toast-icon';
      iconSpan.textContent = feedbackType.icon;
      toast.appendChild(iconSpan);

      // Content container
      const contentDiv = document.createElement('div');
      contentDiv.className = 'shopopti-toast-content';

      // Title (if provided - sanitized)
      if (options.title) {
        const titleDiv = document.createElement('div');
        titleDiv.className = 'shopopti-toast-title';
        titleDiv.textContent = options.title; // SAFE: textContent escapes HTML
        contentDiv.appendChild(titleDiv);
      }

      // Message (sanitized)
      const messageDiv = document.createElement('div');
      messageDiv.className = 'shopopti-toast-message';
      messageDiv.textContent = message; // SAFE: textContent escapes HTML
      contentDiv.appendChild(messageDiv);

      // Actions (if provided)
      if (options.actions && options.actions.length > 0) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'shopopti-toast-actions';
        
        options.actions.forEach(action => {
          const btn = document.createElement('button');
          btn.className = `shopopti-toast-action ${action.primary ? 'primary' : ''}`;
          btn.dataset.action = action.id;
          btn.textContent = action.label; // SAFE: textContent
          btn.addEventListener('click', () => {
            if (action.onClick) action.onClick();
            this.dismissToast(id);
          });
          actionsDiv.appendChild(btn);
        });
        
        contentDiv.appendChild(actionsDiv);
      }

      toast.appendChild(contentDiv);

      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.className = 'shopopti-toast-close';
      closeBtn.setAttribute('aria-label', 'Fermer');
      closeBtn.textContent = '×';
      closeBtn.addEventListener('click', () => this.dismissToast(id));
      toast.appendChild(closeBtn);

      // Progress bar
      const progressBar = document.createElement('div');
      progressBar.className = 'shopopti-toast-progress';
      progressBar.style.width = '100%';
      toast.appendChild(progressBar);

      // Limit number of toasts
      while (this.activeToasts.size >= this.maxToasts) {
        const oldestId = this.activeToasts.keys().next().value;
        this.dismissToast(oldestId, true);
      }

      // Add to container
      if (!this.toastContainer) {
        this.createToastContainer();
      }
      this.toastContainer.appendChild(toast);
      this.activeToasts.set(id, toast);

      // Animate progress bar
      progressBar.style.transition = `width ${duration}ms linear`;
      requestAnimationFrame(() => {
        progressBar.style.width = '0%';
      });

      // Auto-dismiss
      const timeout = setTimeout(() => {
        this.dismissToast(id);
      }, duration);

      // Store timeout for cleanup
      toast.dataset.timeout = timeout;

      return id;
    }

    /**
     * Dismiss a toast
     */
    dismissToast(id, immediate = false) {
      const toast = this.activeToasts.get(id);
      if (!toast) return;

      if (toast.dataset.timeout) {
        clearTimeout(parseInt(toast.dataset.timeout));
      }

      if (immediate) {
        toast.remove();
      } else {
        toast.classList.add('exiting');
        setTimeout(() => toast.remove(), 300);
      }

      this.activeToasts.delete(id);
    }

    /**
     * Show bulk import report modal
     * SECURITY: Uses safe DOM manipulation to prevent XSS
     */
    showBulkReport(results) {
      // Remove existing report
      const existing = document.querySelector('.shopopti-bulk-report-overlay');
      if (existing) existing.remove();

      const total = results.total || 0;
      const successful = results.successful || 0;
      const drafted = results.drafted || 0;
      const blocked = results.blocked || 0;
      const failed = results.failed || 0;

      // Determine overall status
      let headerBg = '#10b981';
      let headerIcon = '✓';
      let headerTitle = 'Import terminé';
      
      if (failed + blocked > successful + drafted) {
        headerBg = '#ef4444';
        headerIcon = '⚠️';
        headerTitle = 'Import avec erreurs';
      } else if (drafted > successful) {
        headerBg = '#f59e0b';
        headerIcon = '📝';
        headerTitle = 'Import partiel';
      }

      // Create overlay
      const overlay = document.createElement('div');
      overlay.className = 'shopopti-bulk-report-overlay';

      // Create report container
      const report = document.createElement('div');
      report.className = 'shopopti-bulk-report';

      // Header
      const header = document.createElement('div');
      header.className = 'shopopti-bulk-report-header';

      const headerIconEl = document.createElement('div');
      headerIconEl.className = 'shopopti-bulk-report-header-icon';
      headerIconEl.style.background = headerBg;
      headerIconEl.style.color = 'white';
      headerIconEl.textContent = headerIcon;

      const headerTextEl = document.createElement('div');
      headerTextEl.className = 'shopopti-bulk-report-header-text';

      const h3 = document.createElement('h3');
      h3.textContent = headerTitle;

      const p = document.createElement('p');
      p.textContent = `${total} produit(s) traité(s)`;

      headerTextEl.appendChild(h3);
      headerTextEl.appendChild(p);
      header.appendChild(headerIconEl);
      header.appendChild(headerTextEl);
      report.appendChild(header);

      // Stats grid
      const statsGrid = document.createElement('div');
      statsGrid.className = 'shopopti-bulk-report-stats';

      const statsData = [
        { value: successful, label: 'Importés', type: 'success' },
        { value: drafted, label: 'Brouillons', type: 'draft' },
        { value: blocked, label: 'Bloqués', type: 'blocked' },
        { value: failed, label: 'Erreurs', type: 'error' }
      ];

      statsData.forEach(stat => {
        const statDiv = document.createElement('div');
        statDiv.className = `shopopti-bulk-report-stat ${stat.type}`;

        const valueDiv = document.createElement('div');
        valueDiv.className = 'shopopti-bulk-report-stat-value';
        valueDiv.textContent = stat.value;

        const labelDiv = document.createElement('div');
        labelDiv.className = 'shopopti-bulk-report-stat-label';
        labelDiv.textContent = stat.label;

        statDiv.appendChild(valueDiv);
        statDiv.appendChild(labelDiv);
        statsGrid.appendChild(statDiv);
      });

      report.appendChild(statsGrid);

      // Details section (blocked/errors)
      const hasDetails = (results.blockedProducts?.length > 0) || (results.errors?.length > 0);
      if (hasDetails) {
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'shopopti-bulk-report-details';

        // Blocked products
        if (results.blockedProducts?.length > 0) {
          const blockedTitle = document.createElement('div');
          blockedTitle.className = 'shopopti-bulk-report-details-title';
          blockedTitle.textContent = `Produits bloqués (${results.blockedProducts.length})`;
          detailsDiv.appendChild(blockedTitle);

          results.blockedProducts.slice(0, 5).forEach(prod => {
            const item = this.createReportItem('blocked', '🚫', this.truncateUrl(prod.url), prod.reason || 'Données critiques manquantes');
            detailsDiv.appendChild(item);
          });
        }

        // Errors
        if (results.errors?.length > 0) {
          const errorsTitle = document.createElement('div');
          errorsTitle.className = 'shopopti-bulk-report-details-title';
          errorsTitle.textContent = `Erreurs (${results.errors.length})`;
          detailsDiv.appendChild(errorsTitle);

          results.errors.slice(0, 5).forEach(err => {
            const item = this.createReportItem('error', '❌', this.truncateUrl(err.url), err.error || 'Erreur technique');
            detailsDiv.appendChild(item);
          });
        }

        report.appendChild(detailsDiv);
      }

      // Footer
      const footer = document.createElement('div');
      footer.className = 'shopopti-bulk-report-footer';

      if (drafted > 0) {
        const viewDraftsBtn = document.createElement('button');
        viewDraftsBtn.className = 'shopopti-bulk-report-btn secondary';
        viewDraftsBtn.dataset.action = 'view-drafts';
        viewDraftsBtn.textContent = 'Voir les brouillons';
        viewDraftsBtn.addEventListener('click', () => {
          window.open('https://shopopti.io/products/backlog', '_blank');
          overlay.remove();
        });
        footer.appendChild(viewDraftsBtn);
      }

      const closeBtn = document.createElement('button');
      closeBtn.className = 'shopopti-bulk-report-btn primary';
      closeBtn.dataset.action = 'close';
      closeBtn.textContent = 'Fermer';
      closeBtn.addEventListener('click', () => overlay.remove());
      footer.appendChild(closeBtn);

      report.appendChild(footer);
      overlay.appendChild(report);

      // Click outside to close
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
      });

      document.body.appendChild(overlay);
      return overlay;
    }

    /**
     * Helper to create a report item (used by showBulkReport)
     * SECURITY: Uses textContent for all user-provided data
     */
    createReportItem(type, icon, text, reason) {
      const item = document.createElement('div');
      item.className = 'shopopti-bulk-report-item';

      const iconSpan = document.createElement('span');
      iconSpan.className = `shopopti-bulk-report-item-icon ${type}`;
      iconSpan.textContent = icon;

      const textSpan = document.createElement('span');
      textSpan.className = 'shopopti-bulk-report-item-text';
      textSpan.textContent = text; // SAFE

      const reasonSpan = document.createElement('span');
      reasonSpan.className = 'shopopti-bulk-report-item-reason';
      reasonSpan.textContent = reason; // SAFE

      item.appendChild(iconSpan);
      item.appendChild(textSpan);
      item.appendChild(reasonSpan);
      return item;
    }

    /**
     * Helper to truncate URLs for display
     */
    truncateUrl(url) {
      if (!url) return 'URL inconnue';
      try {
        const parsed = new URL(url);
        const path = parsed.pathname;
        if (path.length > 30) {
          return parsed.hostname + '/...' + path.slice(-20);
        }
        return parsed.hostname + path;
      } catch {
        return url.length > 40 ? url.slice(0, 40) + '...' : url;
      }
    }

    /**
     * Convenience methods
     */
    success(message, options = {}) {
      return this.showToast(message, 'success', options);
    }

    error(message, options = {}) {
      return this.showToast(message, 'error', options);
    }

    warning(message, options = {}) {
      return this.showToast(message, 'warning', options);
    }

    info(message, options = {}) {
      return this.showToast(message, 'info', options);
    }

    /**
     * Import-specific feedback methods
     */
    importSuccess(data) {
      return this.showFeedback('import_success', data);
    }

    importDraft(data) {
      return this.showFeedback('import_draft', data, {
        duration: 7000,
        actions: [{
          id: 'view',
          label: 'Voir le brouillon',
          primary: true,
          onClick: () => {
            window.open('https://shopopti.io/products/backlog', '_blank');
          }
        }]
      });
    }

    importBlocked(data) {
      return this.showFeedback('import_blocked', data, {
        duration: 8000
      });
    }

    bulkComplete(results) {
      // Show toast summary first
      const total = results.total || 0;
      const successful = results.successful || 0;
      
      if (successful === total) {
        this.showFeedback('bulk_complete', results);
      } else if (successful > 0) {
        this.showFeedback('bulk_partial', results, {
          duration: 6000,
          actions: [{
            id: 'details',
            label: 'Voir le rapport',
            primary: true,
            onClick: () => this.showBulkReport(results)
          }]
        });
      } else {
        this.showFeedback('bulk_failed', results);
      }

      // Show detailed report for any issues
      if (results.blocked > 0 || results.failed > 0 || results.drafted > 0) {
        setTimeout(() => this.showBulkReport(results), 500);
      }
    }
  }

  // Singleton instance
  const feedback = new FeedbackSystem();

  // Export
  if (typeof window !== 'undefined') {
    window.ShopOptiFeedback = feedback;
    window.FeedbackSystem = FeedbackSystem;
  }

  console.log('[ShopOpti+] FeedbackSystem v5.7.1 loaded - Phase 2 UX');
})();
