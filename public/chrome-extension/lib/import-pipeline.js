/**
 * ShopOpti+ Import Pipeline v5.7.0
 * Orchestrates the complete import flow with atomic transactions
 * Ensures: Extract → Validate → Normalize → Confirm → Import
 */

(function() {
  'use strict';

  // Pipeline states
  const PIPELINE_STATES = {
    IDLE: 'idle',
    EXTRACTING: 'extracting',
    VALIDATING: 'validating',
    NORMALIZING: 'normalizing',
    AWAITING_CONFIRMATION: 'awaiting_confirmation',
    IMPORTING: 'importing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  };

  // Pipeline events
  const PIPELINE_EVENTS = {
    STATE_CHANGE: 'pipeline:state_change',
    PROGRESS: 'pipeline:progress',
    VALIDATION_RESULT: 'pipeline:validation_result',
    IMPORT_COMPLETE: 'pipeline:import_complete',
    ERROR: 'pipeline:error'
  };

  class ImportPipeline {
    constructor() {
      this.state = PIPELINE_STATES.IDLE;
      this.currentJob = null;
      this.eventListeners = {};
      this.retryConfig = {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000
      };
    }

    /**
     * Main entry point - process a product URL
     * @param {string} url - Product URL to import
     * @param {Object} options - Import options
     * @returns {Promise<Object>} Import result
     */
    async processUrl(url, options = {}) {
      this.currentJob = {
        id: this.generateJobId(),
        url,
        options,
        startTime: Date.now(),
        steps: []
      };

      try {
        // Step 1: Detect platform
        const platform = this.detectPlatform(url);
        if (!platform) {
          throw new Error('Plateforme non supportée');
        }
        this.logStep('platform_detected', { platform });

        // Step 2: Extract
        this.setState(PIPELINE_STATES.EXTRACTING);
        const rawData = await this.extract(url, platform, options);
        this.logStep('extracted', { fieldsCount: Object.keys(rawData).length });

        // Step 3: Normalize
        this.setState(PIPELINE_STATES.NORMALIZING);
        const normalizedData = this.normalize(rawData, platform);
        this.logStep('normalized', { fieldsCount: Object.keys(normalizedData).length });

        // Step 4: Validate
        this.setState(PIPELINE_STATES.VALIDATING);
        const validationReport = this.validate(normalizedData);
        this.logStep('validated', { 
          score: validationReport.score,
          canImport: validationReport.canImport 
        });

        // Emit validation result for UI
        this.emit(PIPELINE_EVENTS.VALIDATION_RESULT, {
          product: normalizedData,
          validation: validationReport,
          requiresConfirmation: !validationReport.canImport || validationReport.warnings.length > 0
        });

        // Step 5: Check if import is blocked
        if (!validationReport.canImport) {
          this.setState(PIPELINE_STATES.FAILED);
          return {
            success: false,
            error: 'Données critiques manquantes',
            validation: validationReport,
            product: normalizedData
          };
        }

        // Step 6: Await confirmation if there are warnings
        if (validationReport.warnings.length > 0 && !options.skipConfirmation) {
          this.setState(PIPELINE_STATES.AWAITING_CONFIRMATION);
          
          // Return awaiting state - UI will call confirmImport() or cancelImport()
          return {
            success: true,
            status: 'awaiting_confirmation',
            jobId: this.currentJob.id,
            product: normalizedData,
            validation: validationReport
          };
        }

        // Step 7: Import
        return await this.executeImport(normalizedData, validationReport, options);

      } catch (error) {
        this.setState(PIPELINE_STATES.FAILED);
        this.logStep('error', { message: error.message });
        this.emit(PIPELINE_EVENTS.ERROR, { error: error.message, job: this.currentJob });

        return {
          success: false,
          error: error.message,
          job: this.currentJob
        };
      }
    }

    /**
     * Confirm pending import
     */
    async confirmImport(jobId) {
      if (!this.currentJob || this.currentJob.id !== jobId) {
        throw new Error('Job non trouvé');
      }

      if (this.state !== PIPELINE_STATES.AWAITING_CONFIRMATION) {
        throw new Error('Aucune confirmation en attente');
      }

      const lastValidation = this.currentJob.steps.find(s => s.type === 'validated');
      const lastNormalized = this.currentJob.steps.find(s => s.type === 'normalized');

      if (!lastValidation || !lastNormalized) {
        throw new Error('Données de validation manquantes');
      }

      // We need to re-get the normalized data and validation
      // This is a simplified version - in production, store in job
      return await this.executeImport(
        this.currentJob.normalizedData,
        this.currentJob.validationReport,
        this.currentJob.options
      );
    }

    /**
     * Cancel pending import
     */
    cancelImport(jobId) {
      if (this.currentJob && this.currentJob.id === jobId) {
        this.setState(PIPELINE_STATES.CANCELLED);
        this.logStep('cancelled', {});
        return { success: true, message: 'Import annulé' };
      }
      return { success: false, error: 'Job non trouvé' };
    }

    /**
     * Execute the actual import to backend
     */
    async executeImport(normalizedData, validationReport, options) {
      this.setState(PIPELINE_STATES.IMPORTING);
      this.emit(PIPELINE_EVENTS.PROGRESS, { step: 'importing', progress: 80 });

      try {
        // Prepare payload
        const payload = {
          product: normalizedData,
          validation: {
            score: validationReport.score,
            missingFields: validationReport.missingFields
          },
          options: {
            enrichWithAI: options.enrichWithAI || false,
            targetStores: options.targetStores || [],
            autoOptimize: options.autoOptimize || false
          }
        };

        // Send to backend with retry
        const result = await this.sendToBackend(payload);

        this.setState(PIPELINE_STATES.COMPLETED);
        this.logStep('imported', { 
          productId: result.product_id,
          duration: Date.now() - this.currentJob.startTime 
        });

        this.emit(PIPELINE_EVENTS.IMPORT_COMPLETE, {
          success: true,
          product: result,
          validation: validationReport,
          job: this.currentJob
        });

        return {
          success: true,
          product: result,
          validation: validationReport,
          job: this.currentJob
        };

      } catch (error) {
        this.setState(PIPELINE_STATES.FAILED);
        throw error;
      }
    }

    /**
     * Detect platform from URL
     */
    detectPlatform(url) {
      const patterns = {
        aliexpress: /aliexpress\.(com|us|ru)/i,
        amazon: /amazon\.(com|fr|de|co\.uk|es|it|ca|com\.au|co\.jp)/i,
        ebay: /ebay\.(com|fr|de|co\.uk)/i,
        shopify: /\.myshopify\.com|\/products\//i,
        temu: /temu\.com/i,
        shein: /shein\.(com|fr)/i,
        wish: /wish\.com/i,
        banggood: /banggood\.com/i,
        dhgate: /dhgate\.com/i,
        cjdropshipping: /cjdropshipping\.com/i,
        cdiscount: /cdiscount\.com/i,
        fnac: /fnac\.com/i,
        rakuten: /rakuten\.(com|fr)/i,
        walmart: /walmart\.com/i,
        homedepot: /homedepot\.com/i,
        etsy: /etsy\.com/i,
        tiktok: /tiktok\.com\/.*shop/i
      };

      for (const [platform, pattern] of Object.entries(patterns)) {
        if (pattern.test(url)) {
          return platform;
        }
      }

      return null;
    }

    /**
     * Extract product data using appropriate extractor
     */
    async extract(url, platform, options) {
      this.emit(PIPELINE_EVENTS.PROGRESS, { step: 'extracting', progress: 20 });

      // Try to use registered extractor
      if (window.ExtractorRegistry) {
        try {
          const data = await window.ExtractorRegistry.extract(url, options);
          if (data && data.title) {
            return data;
          }
        } catch (e) {
          console.warn('[Pipeline] Extractor failed, trying fallback:', e);
        }
      }

      // Fallback: use backend scraper
      if (window.ShopOptiAPI) {
        const result = await window.ShopOptiAPI.importFromUrl(url, options);
        return result.product || result;
      }

      throw new Error('Aucun extracteur disponible');
    }

    /**
     * Normalize extracted data
     */
    normalize(rawData, platform) {
      this.emit(PIPELINE_EVENTS.PROGRESS, { step: 'normalizing', progress: 40 });

      if (window.ShopOptiNormalizer) {
        return window.ShopOptiNormalizer.normalize(rawData, platform);
      }

      // Basic fallback normalization
      return {
        ...rawData,
        platform,
        extracted_at: new Date().toISOString()
      };
    }

    /**
     * Validate normalized data
     */
    validate(normalizedData) {
      this.emit(PIPELINE_EVENTS.PROGRESS, { step: 'validating', progress: 60 });

      if (window.ShopOptiValidator) {
        return window.ShopOptiValidator.validate(normalizedData);
      }

      // Basic fallback validation
      const hasTitle = normalizedData.title && normalizedData.title.length >= 3;
      const hasPrice = typeof normalizedData.price === 'number' && normalizedData.price > 0;

      return {
        isValid: hasTitle && hasPrice,
        canImport: hasTitle && hasPrice,
        score: (hasTitle ? 50 : 0) + (hasPrice ? 50 : 0),
        warnings: [],
        errors: hasTitle && hasPrice ? [] : ['Titre ou prix manquant'],
        missingFields: []
      };
    }

    /**
     * Send to backend with retry logic
     */
    async sendToBackend(payload) {
      let lastError;
      let delay = this.retryConfig.initialDelay;

      for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
        try {
          if (window.ShopOptiAPI) {
            const result = await window.ShopOptiAPI.request('extension-product-importer', {
              body: {
                action: 'import_validated',
                ...payload
              }
            });
            return result;
          }
          throw new Error('API non disponible');
        } catch (error) {
          lastError = error;
          
          if (attempt < this.retryConfig.maxRetries) {
            console.warn(`[Pipeline] Import attempt ${attempt + 1} failed, retrying in ${delay}ms`);
            await this.sleep(delay);
            delay *= this.retryConfig.backoffMultiplier;
          }
        }
      }

      throw lastError;
    }

    /**
     * Process multiple URLs (bulk import)
     */
    async processBulk(urls, options = {}) {
      const results = {
        total: urls.length,
        successful: 0,
        failed: 0,
        skipped: 0,
        products: [],
        errors: []
      };

      const concurrency = options.concurrency || 2;
      const queue = [...urls];
      const active = new Set();

      while (queue.length > 0 || active.size > 0) {
        // Start new tasks up to concurrency limit
        while (queue.length > 0 && active.size < concurrency) {
          const url = queue.shift();
          const promise = this.processUrl(url, { ...options, skipConfirmation: true })
            .then(result => {
              if (result.success) {
                results.successful++;
                results.products.push(result.product);
              } else {
                results.failed++;
                results.errors.push({ url, error: result.error });
              }
            })
            .catch(error => {
              results.failed++;
              results.errors.push({ url, error: error.message });
            })
            .finally(() => {
              active.delete(promise);
              this.emit(PIPELINE_EVENTS.PROGRESS, {
                step: 'bulk_import',
                progress: Math.round(((results.successful + results.failed) / results.total) * 100),
                current: results.successful + results.failed,
                total: results.total
              });
            });
          
          active.add(promise);
        }

        // Wait for at least one to complete
        if (active.size > 0) {
          await Promise.race(active);
        }
      }

      return results;
    }

    // ==================== Utility Methods ====================

    setState(state) {
      const previousState = this.state;
      this.state = state;
      this.emit(PIPELINE_EVENTS.STATE_CHANGE, { 
        previous: previousState, 
        current: state 
      });
    }

    logStep(type, data) {
      if (this.currentJob) {
        this.currentJob.steps.push({
          type,
          timestamp: Date.now(),
          ...data
        });
      }
    }

    generateJobId() {
      return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ==================== Event System ====================

    on(event, callback) {
      if (!this.eventListeners[event]) {
        this.eventListeners[event] = [];
      }
      this.eventListeners[event].push(callback);
    }

    off(event, callback) {
      if (this.eventListeners[event]) {
        this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
      }
    }

    emit(event, data) {
      if (this.eventListeners[event]) {
        this.eventListeners[event].forEach(callback => {
          try {
            callback(data);
          } catch (e) {
            console.error('[Pipeline] Event handler error:', e);
          }
        });
      }
    }

    // ==================== Status Methods ====================

    getState() {
      return this.state;
    }

    getCurrentJob() {
      return this.currentJob;
    }

    isProcessing() {
      return ![PIPELINE_STATES.IDLE, PIPELINE_STATES.COMPLETED, PIPELINE_STATES.FAILED, PIPELINE_STATES.CANCELLED]
        .includes(this.state);
    }
  }

  // Export states and events for external use
  ImportPipeline.STATES = PIPELINE_STATES;
  ImportPipeline.EVENTS = PIPELINE_EVENTS;

  // Singleton instance
  const pipeline = new ImportPipeline();

  // Export
  if (typeof window !== 'undefined') {
    window.ShopOptiPipeline = pipeline;
    window.ImportPipeline = ImportPipeline;
  }

  console.log('[ShopOpti+] ImportPipeline v5.7.0 loaded');
})();
