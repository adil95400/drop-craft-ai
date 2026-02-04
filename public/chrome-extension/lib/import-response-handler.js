/**
 * ShopOpti+ Import Response Handler v1.0
 * 
 * Handles all gateway responses with appropriate UI feedback:
 * - ok=true → Show success with job tracking
 * - 426 → Force update modal
 * - QUOTA_EXCEEDED → Upgrade CTA
 * - UNAUTHORIZED → Auth redirect
 * - NETWORK_ERROR → Retry option
 */

;(function() {
  'use strict';

  if (window.__shopoptiImportResponseHandlerLoaded) return;
  window.__shopoptiImportResponseHandlerLoaded = true;

  const APP_URL = 'https://shopopti.io';

  /**
   * Response Handler - Standardized UI responses for all gateway results
   */
  class ImportResponseHandler {
    constructor() {
      this.activeToasts = [];
      this.jobPollingIntervals = new Map();
      this.injectStyles();
    }

    /**
     * Inject CSS for response UI components
     */
    injectStyles() {
      if (document.getElementById('shopopti-response-handler-styles')) return;

      const style = document.createElement('style');
      style.id = 'shopopti-response-handler-styles';
      style.textContent = `
        .shopopti-response-toast {
          position: fixed !important;
          bottom: 24px !important;
          right: 24px !important;
          min-width: 320px !important;
          max-width: 420px !important;
          background: #1f2937 !important;
          color: white !important;
          padding: 16px 20px !important;
          border-radius: 12px !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          font-size: 14px !important;
          z-index: 2147483647 !important;
          animation: shopopti-toast-slide-in 0.3s ease !important;
          box-shadow: 0 10px 40px rgba(0,0,0,0.4) !important;
        }

        .shopopti-response-toast.success {
          background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
        }

        .shopopti-response-toast.error {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
        }

        .shopopti-response-toast.warning {
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%) !important;
        }

        .shopopti-response-toast.info {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
        }

        .shopopti-toast-header {
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          margin-bottom: 8px !important;
        }

        .shopopti-toast-icon {
          width: 24px !important;
          height: 24px !important;
          flex-shrink: 0 !important;
        }

        .shopopti-toast-title {
          font-weight: 600 !important;
          font-size: 15px !important;
        }

        .shopopti-toast-message {
          opacity: 0.9 !important;
          line-height: 1.4 !important;
        }

        .shopopti-toast-actions {
          display: flex !important;
          gap: 8px !important;
          margin-top: 12px !important;
        }

        .shopopti-toast-btn {
          padding: 8px 16px !important;
          border-radius: 8px !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          border: none !important;
          transition: all 0.2s !important;
        }

        .shopopti-toast-btn-primary {
          background: white !important;
          color: #1f2937 !important;
        }

        .shopopti-toast-btn-primary:hover {
          background: #f3f4f6 !important;
        }

        .shopopti-toast-btn-secondary {
          background: rgba(255,255,255,0.2) !important;
          color: white !important;
        }

        .shopopti-toast-btn-secondary:hover {
          background: rgba(255,255,255,0.3) !important;
        }

        .shopopti-toast-close {
          position: absolute !important;
          top: 8px !important;
          right: 8px !important;
          background: none !important;
          border: none !important;
          color: rgba(255,255,255,0.6) !important;
          cursor: pointer !important;
          padding: 4px !important;
        }

        .shopopti-toast-close:hover {
          color: white !important;
        }

        .shopopti-job-progress {
          margin-top: 10px !important;
          background: rgba(255,255,255,0.2) !important;
          border-radius: 4px !important;
          height: 6px !important;
          overflow: hidden !important;
        }

        .shopopti-job-progress-bar {
          height: 100% !important;
          background: white !important;
          border-radius: 4px !important;
          transition: width 0.3s ease !important;
        }

        .shopopti-job-status {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          margin-top: 8px !important;
          font-size: 12px !important;
          opacity: 0.9 !important;
        }

        .shopopti-job-status-dot {
          width: 8px !important;
          height: 8px !important;
          border-radius: 50% !important;
          background: #22c55e !important;
          animation: shopopti-pulse 1s ease infinite !important;
        }

        @keyframes shopopti-toast-slide-in {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes shopopti-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Force Update Modal */
        .shopopti-update-modal {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: rgba(0,0,0,0.7) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 2147483647 !important;
        }

        .shopopti-update-modal-content {
          background: white !important;
          border-radius: 16px !important;
          padding: 32px !important;
          max-width: 400px !important;
          text-align: center !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3) !important;
        }

        .shopopti-update-icon {
          font-size: 48px !important;
          margin-bottom: 16px !important;
        }

        .shopopti-update-title {
          font-size: 20px !important;
          font-weight: 700 !important;
          color: #1f2937 !important;
          margin-bottom: 8px !important;
        }

        .shopopti-update-message {
          color: #6b7280 !important;
          margin-bottom: 20px !important;
          line-height: 1.5 !important;
        }

        .shopopti-update-btn {
          width: 100% !important;
          padding: 14px 24px !important;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%) !important;
          color: white !important;
          border: none !important;
          border-radius: 10px !important;
          font-size: 15px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
        }

        .shopopti-update-btn:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4) !important;
        }
      `;
      document.head.appendChild(style);
    }

    /**
     * Handle import response and show appropriate UI
     */
    handleResponse(response, button = null) {
      if (response.ok) {
        return this.handleSuccess(response, button);
      }

      switch (response.code) {
        case 'VERSION_OUTDATED':
          return this.handleVersionOutdated(response);
        
        case 'QUOTA_EXCEEDED':
          return this.handleQuotaExceeded(response);
        
        case 'UNAUTHORIZED':
          return this.handleUnauthorized(response);
        
        case 'RATE_LIMITED':
          return this.handleRateLimited(response);
        
        case 'NETWORK_ERROR':
          return this.handleNetworkError(response);
        
        default:
          return this.handleGenericError(response);
      }
    }

    /**
     * Handle successful import - Show job tracking
     */
    handleSuccess(response, button = null) {
      const jobId = response.job_id;
      
      if (button) {
        this.setButtonState(button, 'success', 'Import lancé');
      }

      const toast = this.showToast({
        type: 'success',
        title: '✅ Import lancé',
        message: `Job #${jobId?.substring(0, 8) || 'N/A'} en cours de traitement...`,
        showProgress: true,
        jobId: jobId,
        autoClose: false,
      });

      // Start polling for job status
      if (jobId) {
        this.startJobPolling(jobId, toast);
      }

      return { handled: true, toast, jobId };
    }

    /**
     * Handle 426 - Force update required
     */
    handleVersionOutdated(response) {
      this.showUpdateModal(response);
      return { handled: true, requiresUpdate: true };
    }

    /**
     * Handle quota exceeded - Show upgrade CTA
     */
    handleQuotaExceeded(response) {
      this.showToast({
        type: 'warning',
        title: '⚠️ Quota épuisé',
        message: `${response.message}. Limite: ${response.limit} imports/mois.`,
        actions: [
          {
            label: 'Passer à Pro',
            primary: true,
            onClick: () => {
              window.open(`${APP_URL}/pricing?source=extension&reason=quota`, '_blank');
            },
          },
          {
            label: 'Fermer',
            onClick: (toast) => this.closeToast(toast),
          },
        ],
        autoClose: false,
      });

      return { handled: true, quotaExceeded: true };
    }

    /**
     * Handle unauthorized - Redirect to auth
     */
    handleUnauthorized(response) {
      this.showToast({
        type: 'info',
        title: '🔒 Connexion requise',
        message: 'Connectez-vous pour importer des produits.',
        actions: [
          {
            label: 'Se connecter',
            primary: true,
            onClick: () => {
              window.open(`${APP_URL}/auth/extension`, '_blank');
            },
          },
        ],
        autoClose: 8000,
      });

      return { handled: true, requiresAuth: true };
    }

    /**
     * Handle rate limiting
     */
    handleRateLimited(response) {
      const retryAfter = response.retryAfter || 60;
      
      this.showToast({
        type: 'warning',
        title: '⏳ Trop de requêtes',
        message: `Réessayez dans ${retryAfter} secondes.`,
        autoClose: 5000,
      });

      return { handled: true, retryAfter };
    }

    /**
     * Handle network error with retry option
     */
    handleNetworkError(response) {
      this.showToast({
        type: 'error',
        title: '❌ Erreur réseau',
        message: response.message || 'Impossible de contacter le serveur.',
        actions: [
          {
            label: 'Réessayer',
            primary: true,
            onClick: () => {
              // Trigger retry via event
              window.dispatchEvent(new CustomEvent('shopopti:retry-import'));
            },
          },
        ],
        autoClose: 10000,
      });

      return { handled: true, canRetry: true };
    }

    /**
     * Handle generic error
     */
    handleGenericError(response) {
      this.showToast({
        type: 'error',
        title: '❌ Erreur',
        message: response.message || 'Une erreur est survenue.',
        autoClose: 5000,
      });

      return { handled: true };
    }

    /**
     * Show toast notification
     */
    showToast(options) {
      const {
        type = 'info',
        title,
        message,
        actions = [],
        autoClose = 5000,
        showProgress = false,
        jobId = null,
      } = options;

      const toast = document.createElement('div');
      toast.className = `shopopti-response-toast ${type}`;
      toast.style.position = 'relative';

      let html = `
        <button class="shopopti-toast-close">✕</button>
        <div class="shopopti-toast-header">
          <span class="shopopti-toast-title">${title}</span>
        </div>
        <div class="shopopti-toast-message">${message}</div>
      `;

      if (showProgress) {
        html += `
          <div class="shopopti-job-progress">
            <div class="shopopti-job-progress-bar" style="width: 0%"></div>
          </div>
          <div class="shopopti-job-status">
            <span class="shopopti-job-status-dot"></span>
            <span class="shopopti-job-status-text">Réception en cours...</span>
          </div>
        `;
      }

      if (actions.length > 0) {
        html += `<div class="shopopti-toast-actions">`;
        actions.forEach((action, i) => {
          const btnClass = action.primary ? 'shopopti-toast-btn-primary' : 'shopopti-toast-btn-secondary';
          html += `<button class="shopopti-toast-btn ${btnClass}" data-action="${i}">${action.label}</button>`;
        });
        html += `</div>`;
      }

      toast.innerHTML = html;

      // Event handlers
      toast.querySelector('.shopopti-toast-close').addEventListener('click', () => {
        this.closeToast(toast);
      });

      actions.forEach((action, i) => {
        const btn = toast.querySelector(`[data-action="${i}"]`);
        if (btn) {
          btn.addEventListener('click', () => action.onClick(toast));
        }
      });

      // Store reference
      toast._jobId = jobId;

      // Add to DOM
      document.body.appendChild(toast);
      this.activeToasts.push(toast);

      // Auto close
      if (autoClose && autoClose > 0) {
        setTimeout(() => this.closeToast(toast), autoClose);
      }

      return toast;
    }

    /**
     * Close toast
     */
    closeToast(toast) {
      if (!toast || !toast.parentNode) return;
      
      toast.style.animation = 'none';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100px)';
      toast.style.transition = 'all 0.3s ease';
      
      setTimeout(() => {
        toast.remove();
        this.activeToasts = this.activeToasts.filter(t => t !== toast);
        
        // Stop job polling
        if (toast._jobId && this.jobPollingIntervals.has(toast._jobId)) {
          clearInterval(this.jobPollingIntervals.get(toast._jobId));
          this.jobPollingIntervals.delete(toast._jobId);
        }
      }, 300);
    }

    /**
     * Show force update modal
     */
    showUpdateModal(response) {
      const modal = document.createElement('div');
      modal.className = 'shopopti-update-modal';
      modal.innerHTML = `
        <div class="shopopti-update-modal-content">
          <div class="shopopti-update-icon">🔄</div>
          <div class="shopopti-update-title">Mise à jour requise</div>
          <div class="shopopti-update-message">
            Une nouvelle version de ShopOpti+ est disponible et requise pour continuer.
            ${response.minVersion ? `<br><br>Version minimale: <strong>v${response.minVersion}</strong>` : ''}
          </div>
          <button class="shopopti-update-btn">Mettre à jour maintenant</button>
        </div>
      `;

      modal.querySelector('.shopopti-update-btn').addEventListener('click', () => {
        const updateUrl = response.updateUrl || 'https://chrome.google.com/webstore/detail/shopopti/...';
        window.open(updateUrl, '_blank');
        modal.remove();
      });

      document.body.appendChild(modal);
    }

    /**
     * Start polling for job status updates
     */
    startJobPolling(jobId, toast) {
      const statusMap = {
        received: { progress: 10, text: 'Réception...' },
        scraping: { progress: 40, text: 'Extraction des données...' },
        enriching: { progress: 70, text: 'Enrichissement IA...' },
        ready: { progress: 100, text: 'Terminé ✓' },
        error: { progress: 100, text: 'Erreur' },
        error_incomplete: { progress: 100, text: 'Données incomplètes' },
      };

      const poll = async () => {
        if (!window.BackendImportClient) return;

        try {
          const result = await window.BackendImportClient.getJobStatus(jobId);
          
          if (result.ok && result.job) {
            const status = result.job.status || 'received';
            const statusInfo = statusMap[status] || statusMap.received;

            // Update progress bar
            const progressBar = toast.querySelector('.shopopti-job-progress-bar');
            const statusText = toast.querySelector('.shopopti-job-status-text');
            
            if (progressBar) {
              progressBar.style.width = `${statusInfo.progress}%`;
            }
            if (statusText) {
              statusText.textContent = statusInfo.text;
            }

            // Stop polling on terminal states
            if (['ready', 'error', 'error_incomplete'].includes(status)) {
              clearInterval(this.jobPollingIntervals.get(jobId));
              this.jobPollingIntervals.delete(jobId);

              if (status === 'ready') {
                toast.classList.remove('info');
                toast.classList.add('success');
                setTimeout(() => this.closeToast(toast), 3000);
              } else {
                toast.classList.remove('info');
                toast.classList.add('error');
              }
            }
          }
        } catch (e) {
          console.error('[ResponseHandler] Polling error:', e);
        }
      };

      // Poll every 2 seconds
      const interval = setInterval(poll, 2000);
      this.jobPollingIntervals.set(jobId, interval);
      
      // Initial poll
      poll();
    }

    /**
     * Set button state
     */
    setButtonState(button, state, text = null) {
      if (!button) return;

      button.classList.remove('loading', 'success', 'error');
      
      const textEl = button.querySelector('.shopopti-btn-text');
      const spinner = button.querySelector('.shopopti-spinner');

      switch (state) {
        case 'loading':
          button.classList.add('loading');
          if (spinner) spinner.style.display = 'block';
          if (textEl) textEl.style.opacity = '0';
          break;
        
        case 'success':
          button.classList.add('success');
          if (spinner) spinner.style.display = 'none';
          if (textEl) {
            textEl.style.opacity = '1';
            textEl.textContent = text || '✓ Importé';
          }
          break;
        
        case 'error':
          button.classList.add('error');
          if (spinner) spinner.style.display = 'none';
          if (textEl) {
            textEl.style.opacity = '1';
            textEl.textContent = text || 'Erreur';
          }
          break;
        
        default:
          if (spinner) spinner.style.display = 'none';
          if (textEl) {
            textEl.style.opacity = '1';
            textEl.textContent = text || 'Importer ShopOpti';
          }
      }
    }
  }

  // Export singleton
  window.ImportResponseHandler = new ImportResponseHandler();

  console.log('[ShopOpti+] ImportResponseHandler v1.0 loaded');

})();
