/**
 * ShopOpti+ Extraction Orchestrator v5.7.0
 * Orchestrates the complete extraction flow from URL to validated product
 * 
 * Flow: URL → Platform Detection → Extractor Selection → Extraction → 
 *       Normalization → Validation → Pre-import Dialog → Import
 */

(function() {
  'use strict';

  if (window.__shopoptiExtractionOrchestratorLoaded) return;
  window.__shopoptiExtractionOrchestratorLoaded = true;

  /**
   * Extraction status codes
   */
  const STATUS = {
    PENDING: 'pending',
    DETECTING: 'detecting',
    EXTRACTING: 'extracting',
    NORMALIZING: 'normalizing',
    VALIDATING: 'validating',
    AWAITING_CONFIRMATION: 'awaiting_confirmation',
    IMPORTING: 'importing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  };

  /**
   * Error codes for specific failure scenarios
   */
  const ERROR_CODES = {
    UNSUPPORTED_PLATFORM: 'UNSUPPORTED_PLATFORM',
    NO_EXTRACTOR: 'NO_EXTRACTOR',
    EXTRACTION_FAILED: 'EXTRACTION_FAILED',
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    IMPORT_FAILED: 'IMPORT_FAILED',
    NETWORK_ERROR: 'NETWORK_ERROR',
    AUTH_ERROR: 'AUTH_ERROR',
    USER_CANCELLED: 'USER_CANCELLED'
  };

  class ExtractionOrchestrator {
    constructor() {
      this.activeJobs = new Map();
      this.completedJobs = new Map();
      this.listeners = new Set();
    }

    /**
     * Start a new extraction job
     * @param {string} url - URL to extract from
     * @param {object} options - Extraction options
     * @returns {Promise<ExtractionResult>}
     */
    async extract(url, options = {}) {
      const jobId = this.generateJobId();
      
      const job = {
        id: jobId,
        url,
        options,
        status: STATUS.PENDING,
        progress: 0,
        startedAt: new Date().toISOString(),
        steps: [],
        result: null,
        error: null
      };

      this.activeJobs.set(jobId, job);
      this.notifyListeners('job_started', job);

      try {
        // Step 1: Platform Detection
        await this.executeStep(job, 'platform_detection', async () => {
          const detector = window.PlatformDetector;
          if (!detector) {
            throw this.createError(ERROR_CODES.NO_EXTRACTOR, 'PlatformDetector not available');
          }

          const detection = detector.detect(url);
          job.platform = detection;

          if (!detection.supported) {
            throw this.createError(
              ERROR_CODES.UNSUPPORTED_PLATFORM,
              `Platform not supported: ${detection.name || 'Unknown'}`
            );
          }

          if (!detection.isProductPage) {
            console.warn('[Orchestrator] URL may not be a product page');
          }

          return detection;
        });

        // Step 2: Extraction
        await this.executeStep(job, 'extraction', async () => {
          const bridge = window.ExtractorBridge;
          if (!bridge) {
            // Fallback to ExtractorRegistry
            const registry = window.ExtractorRegistry;
            if (!registry) {
              throw this.createError(ERROR_CODES.NO_EXTRACTOR, 'No extraction engine available');
            }
            return registry.extract({ preferAPI: options.preferAPI !== false });
          }

          return bridge.extract(url, {
            bypassCache: options.bypassCache,
            preferAPI: options.preferAPI !== false
          });
        });

        // Step 3: Normalization
        await this.executeStep(job, 'normalization', async () => {
          const normalizer = window.ShopOptiNormalizer;
          if (!normalizer) {
            console.warn('[Orchestrator] Normalizer not available, using raw data');
            return job.steps[1].result; // Return raw extraction
          }

          const rawData = job.steps[1].result;
          return normalizer.normalize(rawData, job.platform?.key);
        });

        // Step 4: Validation
        await this.executeStep(job, 'validation', async () => {
          const validator = window.ShopOptiValidator;
          if (!validator) {
            console.warn('[Orchestrator] Validator not available, skipping validation');
            return { valid: true, score: 100, issues: [], warnings: [] };
          }

          const normalizedData = job.steps[2].result;
          return validator.validate(normalizedData);
        });

        // Step 5: Intelligence Analysis (Phase C)
        await this.executeStep(job, 'intelligence', async () => {
          const normalizedProduct = job.steps[2].result;
          const intelligence = {};

          // Supplier detection
          if (window.ShopOptiSupplierDetection) {
            try {
              intelligence.suppliers = await window.ShopOptiSupplierDetection.detectSuppliers(
                normalizedProduct,
                { bypassCache: options.bypassCache }
              );
            } catch (e) {
              console.warn('[Orchestrator] Supplier detection failed:', e);
              intelligence.suppliers = [];
            }
          }

          // Margin suggestions
          if (window.ShopOptiMarginEngine) {
            try {
              intelligence.marginSuggestions = window.ShopOptiMarginEngine.getSuggestions(
                normalizedProduct,
                options.marginOptions
              );
            } catch (e) {
              console.warn('[Orchestrator] Margin suggestion failed:', e);
              intelligence.marginSuggestions = null;
            }
          }

          // Auto-translation (if target language specified)
          if (window.ShopOptiTranslation && options.translateTo) {
            try {
              const translated = await window.ShopOptiTranslation.translateProduct(
                normalizedProduct,
                { targetLang: options.translateTo, mode: options.translationMode || 'balanced' }
              );
              intelligence.translatedProduct = translated;
            } catch (e) {
              console.warn('[Orchestrator] Translation failed:', e);
              intelligence.translatedProduct = null;
            }
          }

          return intelligence;
        });

        // Compile final result
        const validation = job.steps[3].result;
        const normalizedProduct = job.steps[2].result;
        const intelligence = job.steps[4]?.result || {};

        job.result = {
          product: intelligence.translatedProduct || normalizedProduct,
          originalProduct: intelligence.translatedProduct ? normalizedProduct : null,
          validation,
          intelligence: {
            suppliers: intelligence.suppliers || [],
            marginSuggestions: intelligence.marginSuggestions,
            translated: !!intelligence.translatedProduct
          },
          platform: job.platform,
          metadata: {
            jobId,
            url,
            extractedAt: new Date().toISOString(),
            processingTime: Date.now() - new Date(job.startedAt).getTime()
          }
        };

        // Determine final status
        if (!validation.valid && validation.score < 30) {
          job.status = STATUS.FAILED;
          job.error = this.createError(
            ERROR_CODES.VALIDATION_FAILED,
            `Product quality too low (score: ${validation.score}%)`
          );
        } else if (validation.warnings.length > 0 || validation.issues.length > 0) {
          job.status = STATUS.AWAITING_CONFIRMATION;
        } else {
          job.status = STATUS.COMPLETED;
        }

        job.progress = 100;
        this.moveToCompleted(job);
        this.notifyListeners('job_completed', job);

        return job.result;

      } catch (error) {
        job.status = STATUS.FAILED;
        job.error = error.code ? error : this.createError(ERROR_CODES.EXTRACTION_FAILED, error.message);
        job.progress = 100;
        
        this.moveToCompleted(job);
        this.notifyListeners('job_failed', job);
        
        throw job.error;
      }
    }

    /**
     * Execute a single extraction step with tracking
     */
    async executeStep(job, stepName, executor) {
      const stepIndex = job.steps.length;
      const step = {
        name: stepName,
        startedAt: new Date().toISOString(),
        completedAt: null,
        result: null,
        error: null
      };

      job.steps.push(step);
      job.status = this.getStatusForStep(stepName);
      job.progress = this.getProgressForStep(stepIndex);

      this.notifyListeners('step_started', { job, step: stepName });

      try {
        step.result = await executor();
        step.completedAt = new Date().toISOString();
        
        this.notifyListeners('step_completed', { job, step: stepName, result: step.result });
        
        return step.result;
      } catch (error) {
        step.error = error;
        step.completedAt = new Date().toISOString();
        throw error;
      }
    }

    /**
     * Get status for a step name
     */
    getStatusForStep(stepName) {
      const statusMap = {
        'platform_detection': STATUS.DETECTING,
        'extraction': STATUS.EXTRACTING,
        'normalization': STATUS.NORMALIZING,
        'validation': STATUS.VALIDATING
      };
      return statusMap[stepName] || STATUS.EXTRACTING;
    }

    /**
     * Get progress percentage for step index
     */
    getProgressForStep(stepIndex) {
      const progressMap = [20, 50, 75, 90];
      return progressMap[stepIndex] || 50;
    }

    /**
     * Show enhanced preview before import
     * Integrates with Quick Import mode if available
     * @param {string} jobId - Job ID to show preview for
     * @returns {Promise<{action: string, mode: string}>}
     */
    async showPreview(jobId) {
      const job = this.completedJobs.get(jobId) || this.activeJobs.get(jobId);
      
      if (!job || !job.result) {
        throw this.createError('JOB_NOT_FOUND', `Job ${jobId} not found or not ready`);
      }

      const product = job.result.product;
      const validation = job.result.validation;

      // Check Quick Import availability
      const quickImport = window.ShopOptiQuickImport;
      const canQuickImport = quickImport?.canQuickImport(validation)?.canQuickImport || false;

      // Use Enhanced Preview if available
      if (window.ShopOptiEnhancedPreview) {
        const result = await window.ShopOptiEnhancedPreview.show(product, validation, {
          showQuickImport: canQuickImport
        });

        if (result.action === 'import') {
          return this.confirmImport(jobId, { mode: result.mode });
        }

        return result;
      }

      // Fallback to basic PreImportDialog
      if (window.ShopOptiPreImportDialog) {
        const confirmed = await window.ShopOptiPreImportDialog.show(product, validation);
        if (confirmed) {
          return this.confirmImport(jobId);
        }
        return { action: 'cancel' };
      }

      // No dialog available, auto-confirm if valid
      if (validation.canImport) {
        return this.confirmImport(jobId);
      }

      throw this.createError('NO_DIALOG', 'No preview dialog available and product requires confirmation');
    }

    /**
     * Quick import (bypass preview for power users)
     * @param {string} url - URL to import
     * @param {Object} options - Import options
     * @returns {Promise<Object>}
     */
    async quickImport(url, options = {}) {
      const quickImport = window.ShopOptiQuickImport;
      
      if (!quickImport?.enabled) {
        throw this.createError('QUICK_IMPORT_DISABLED', 'Quick import mode is not enabled');
      }

      // Notify UI manager if available
      window.ShopOptiUI?.setState('importing', { message: 'Import rapide...' });

      try {
        // Extract product
        const result = await this.extract(url, { ...options, skipPreview: true });

        // Check if can quick import
        const canQuick = quickImport.canQuickImport(result.validation);
        if (!canQuick.canQuickImport) {
          // Fall back to preview
          window.ShopOptiUI?.toast(canQuick.reason, 'warning');
          return this.showPreview(result.metadata.jobId);
        }

        // Apply quick settings and import
        const modifiedProduct = quickImport.applyQuickSettings(result.product, options.priceRules);
        const importResult = await this.executeImport(modifiedProduct, options);

        // Record in history
        await quickImport.recordImport(modifiedProduct, result.platform?.key);

        // Show success
        if (quickImport.settings.showSuccessNotification) {
          window.ShopOptiUI?.toast('Produit importé avec succès !', 'success');
        }

        window.ShopOptiUI?.setState('success');

        return {
          success: true,
          product: modifiedProduct,
          importResult,
          mode: 'quick'
        };

      } catch (error) {
        window.ShopOptiUI?.setState('error');
        window.ShopOptiUI?.toast(error.message, 'error');
        throw error;
      }
    }

    /**
     * Confirm import after validation warnings
     */
    async confirmImport(jobId, options = {}) {
      const job = this.completedJobs.get(jobId) || this.activeJobs.get(jobId);
      
      if (!job) {
        throw this.createError('JOB_NOT_FOUND', `Job ${jobId} not found`);
      }

      if (job.status !== STATUS.AWAITING_CONFIRMATION && job.status !== STATUS.COMPLETED) {
        throw this.createError('INVALID_STATE', `Job ${jobId} is not ready for import`);
      }

      job.status = STATUS.IMPORTING;
      this.notifyListeners('import_started', job);

      // Notify UI
      window.ShopOptiUI?.setState('importing', { message: 'Import en cours...' });

      try {
        // Apply quick import settings if in quick mode
        let productToImport = job.result.product;
        if (options.mode === 'quick' && window.ShopOptiQuickImport) {
          productToImport = window.ShopOptiQuickImport.applyQuickSettings(productToImport, options.priceRules);
        }

        // Proceed with import
        const importResult = await this.executeImport(productToImport, options);
        
        job.status = STATUS.COMPLETED;
        job.importResult = importResult;
        
        this.notifyListeners('import_completed', job);
        window.ShopOptiUI?.setState('success');
        window.ShopOptiUI?.toast('Import réussi !', 'success');

        // Record in quick import history
        if (options.mode === 'quick' && window.ShopOptiQuickImport) {
          await window.ShopOptiQuickImport.recordImport(productToImport, job.platform?.key);
        }
        
        return importResult;

      } catch (error) {
        job.status = STATUS.FAILED;
        job.error = this.createError(ERROR_CODES.IMPORT_FAILED, error.message);
        
        this.notifyListeners('import_failed', job);
        window.ShopOptiUI?.setState('error');
        window.ShopOptiUI?.toast(`Erreur: ${error.message}`, 'error');
        
        throw job.error;
      }
    }

    /**
     * Cancel a pending job
     */
    cancel(jobId) {
      const job = this.activeJobs.get(jobId);
      
      if (job) {
        job.status = STATUS.CANCELLED;
        job.error = this.createError(ERROR_CODES.USER_CANCELLED, 'Extraction cancelled by user');
        
        this.moveToCompleted(job);
        this.notifyListeners('job_cancelled', job);
      }
    }

    /**
     * Execute the actual import to ShopOpti backend
     */
    async executeImport(product, options) {
      // Use existing pipeline if available
      if (window.ShopOptiPipeline) {
        return window.ShopOptiPipeline.importProduct(product, options);
      }

      // Direct API call fallback
      const API_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';
      
      const response = await fetch(`${API_URL}/product-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          product,
          options,
          source: 'extension'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }

      return response.json();
    }

    /**
     * Get auth token from storage
     */
    async getAuthToken() {
      return new Promise((resolve) => {
        if (chrome?.storage?.local) {
          chrome.storage.local.get(['shopopti_token'], (result) => {
            resolve(result.shopopti_token || '');
          });
        } else {
          resolve('');
        }
      });
    }

    /**
     * Generate unique job ID
     */
    generateJobId() {
      return `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Create structured error
     */
    createError(code, message) {
      return {
        code,
        message,
        timestamp: new Date().toISOString()
      };
    }

    /**
     * Move job from active to completed
     */
    moveToCompleted(job) {
      this.activeJobs.delete(job.id);
      this.completedJobs.set(job.id, job);
      
      // Keep only last 100 completed jobs
      if (this.completedJobs.size > 100) {
        const oldestKey = this.completedJobs.keys().next().value;
        this.completedJobs.delete(oldestKey);
      }
    }

    /**
     * Add event listener
     */
    addListener(callback) {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }

    /**
     * Notify all listeners
     */
    notifyListeners(event, data) {
      this.listeners.forEach(callback => {
        try {
          callback(event, data);
        } catch (e) {
          console.error('[Orchestrator] Listener error:', e);
        }
      });
    }

    /**
     * Get job by ID
     */
    getJob(jobId) {
      return this.activeJobs.get(jobId) || this.completedJobs.get(jobId);
    }

    /**
     * Get all active jobs
     */
    getActiveJobs() {
      return Array.from(this.activeJobs.values());
    }

    /**
     * Get statistics
     */
    getStats() {
      const completed = Array.from(this.completedJobs.values());
      const successful = completed.filter(j => j.status === STATUS.COMPLETED);
      const failed = completed.filter(j => j.status === STATUS.FAILED);

      return {
        activeCount: this.activeJobs.size,
        completedCount: this.completedJobs.size,
        successRate: completed.length > 0 
          ? Math.round((successful.length / completed.length) * 100) 
          : 0,
        averageProcessingTime: successful.length > 0
          ? Math.round(
              successful.reduce((sum, j) => sum + (j.result?.metadata?.processingTime || 0), 0) / 
              successful.length
            )
          : 0,
        failureReasons: this.aggregateErrors(failed)
      };
    }

    /**
     * Aggregate error reasons
     */
    aggregateErrors(failedJobs) {
      const reasons = {};
      failedJobs.forEach(job => {
        const code = job.error?.code || 'UNKNOWN';
        reasons[code] = (reasons[code] || 0) + 1;
      });
      return reasons;
    }

    /**
     * Clear all completed jobs
     */
    clearHistory() {
      this.completedJobs.clear();
    }
  }

  // Export singleton
  window.ExtractionOrchestrator = new ExtractionOrchestrator();

  console.log('[ShopOpti+] ExtractionOrchestrator v5.7.0 loaded');

})();
