/**
 * ShopOpti+ Import Pipeline v5.7.1
 * Orchestrates the complete import flow with atomic transactions
 * PHASE 1: Strict validation - products with missing critical data are BLOCKED or DRAFTED
 * Ensures: Extract → Validate → Normalize → Confirm → Import (or Draft)
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
    IMPORTING_AS_DRAFT: 'importing_as_draft',
    COMPLETED: 'completed',
    COMPLETED_AS_DRAFT: 'completed_as_draft',
    BLOCKED: 'blocked',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  };

  // Pipeline events
  const PIPELINE_EVENTS = {
    STATE_CHANGE: 'pipeline:state_change',
    PROGRESS: 'pipeline:progress',
    VALIDATION_RESULT: 'pipeline:validation_result',
    IMPORT_COMPLETE: 'pipeline:import_complete',
    IMPORT_BLOCKED: 'pipeline:import_blocked',
    IMPORT_DRAFTED: 'pipeline:import_drafted',
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
     * PHASE 1: Enforces atomic import with strict validation
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
        steps: [],
        normalizedData: null,
        validationReport: null
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
        this.currentJob.normalizedData = normalizedData;
        this.logStep('normalized', { fieldsCount: Object.keys(normalizedData).length });

        // Step 4: Validate with STRICT rules (Phase 1)
        this.setState(PIPELINE_STATES.VALIDATING);
        const validationReport = this.validate(normalizedData);
        this.currentJob.validationReport = validationReport;
        
        this.logStep('validated', { 
          score: validationReport.score,
          canImport: validationReport.canImport,
          decision: validationReport.importDecision?.action || 'unknown'
        });

        // Emit validation result for UI
        this.emit(PIPELINE_EVENTS.VALIDATION_RESULT, {
          product: normalizedData,
          validation: validationReport,
          requiresConfirmation: !validationReport.canImport || validationReport.warnings.length > 0
        });

        // PHASE 1 DECISION LOGIC

        // Case 1: BLOCKED - Critical data missing (title, price, or images)
        if (!validationReport.canImport) {
          this.setState(PIPELINE_STATES.BLOCKED);
          
          const blockResult = {
            success: false,
            status: 'blocked',
            error: validationReport.importDecision.reason,
            details: validationReport.importDecision.details,
            validation: validationReport,
            product: normalizedData,
            job: this.currentJob
          };

          this.emit(PIPELINE_EVENTS.IMPORT_BLOCKED, blockResult);
          
          // Log for debugging
          console.error('[Pipeline] IMPORT BLOCKED:', {
            url,
            platform,
            reason: validationReport.importDecision.reason,
            missingCritical: validationReport.critical.failed.map(f => f.field)
          });

          return blockResult;
        }

        // Case 2: DRAFT - Important data missing or low score
        if (validationReport.shouldBeDraft && !options.forceFull) {
          // Import as draft with explicit flag
          return await this.executeImport(normalizedData, validationReport, {
            ...options,
            status: 'draft',
            backlogReason: validationReport.importDecision.reason
          });
        }

        // Case 3: Await confirmation if there are warnings and not skipping
        if (validationReport.warnings.length > 0 && !options.skipConfirmation) {
          this.setState(PIPELINE_STATES.AWAITING_CONFIRMATION);
          
          return {
            success: true,
            status: 'awaiting_confirmation',
            jobId: this.currentJob.id,
            product: normalizedData,
            validation: validationReport
          };
        }

        // Case 4: Full import - all critical data present
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
     * PHASE 1: Supports 'draft' status for incomplete products
     */
    async executeImport(normalizedData, validationReport, options) {
      const isDraft = options.status === 'draft';
      
      this.setState(isDraft ? PIPELINE_STATES.IMPORTING_AS_DRAFT : PIPELINE_STATES.IMPORTING);
      this.emit(PIPELINE_EVENTS.PROGRESS, { step: 'importing', progress: 80, isDraft });

      try {
        // Prepare payload with explicit status
        const payload = {
          product: {
            ...normalizedData,
            // PHASE 1: Explicit status based on validation
            status: isDraft ? 'draft' : (options.autoPublish ? 'active' : 'draft'),
            // Track why it was drafted
            import_notes: isDraft ? options.backlogReason : null,
            needs_review: isDraft || validationReport.shouldBeBacklogged
          },
          validation: {
            score: validationReport.score,
            missingFields: validationReport.missingFields,
            decision: validationReport.importDecision,
            backlogReasons: validationReport.backlogReasons || []
          },
          options: {
            enrichWithAI: options.enrichWithAI || false,
            targetStores: options.targetStores || [],
            autoOptimize: options.autoOptimize || false,
            isDraft: isDraft
          }
        };

        // Send to backend with retry
        const result = await this.sendToBackend(payload);

        const finalState = isDraft ? PIPELINE_STATES.COMPLETED_AS_DRAFT : PIPELINE_STATES.COMPLETED;
        this.setState(finalState);
        
        this.logStep('imported', { 
          productId: result.product_id,
          status: isDraft ? 'draft' : 'active',
          duration: Date.now() - this.currentJob.startTime 
        });

        const importResult = {
          success: true,
          status: isDraft ? 'drafted' : 'imported',
          product: result,
          validation: validationReport,
          job: this.currentJob,
          message: isDraft 
            ? `Produit créé en brouillon → À traiter (${options.backlogReason})`
            : 'Produit importé avec succès'
        };

        this.emit(
          isDraft ? PIPELINE_EVENTS.IMPORT_DRAFTED : PIPELINE_EVENTS.IMPORT_COMPLETE, 
          importResult
        );

        return importResult;

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
     * Validate normalized data using strict Phase 1 rules
     */
    validate(normalizedData) {
      this.emit(PIPELINE_EVENTS.PROGRESS, { step: 'validating', progress: 60 });

      if (window.ShopOptiValidator) {
        return window.ShopOptiValidator.validate(normalizedData);
      }

      // Strict fallback validation (Phase 1 compliant)
      const hasTitle = normalizedData.title && normalizedData.title.length >= 3;
      const hasPrice = typeof normalizedData.price === 'number' && normalizedData.price > 0;
      const hasImages = Array.isArray(normalizedData.images) && normalizedData.images.length > 0;

      const canImport = hasTitle && hasPrice && hasImages;
      const errors = [];
      
      if (!hasTitle) errors.push('Titre manquant ou trop court');
      if (!hasPrice) errors.push('Prix invalide');
      if (!hasImages) errors.push('Aucune image disponible');

      return {
        isValid: canImport,
        canImport: canImport,
        shouldBeDraft: false,
        shouldBeBacklogged: false,
        backlogReasons: [],
        score: (hasTitle ? 33 : 0) + (hasPrice ? 34 : 0) + (hasImages ? 33 : 0),
        warnings: [],
        errors: errors,
        missingFields: errors,
        importDecision: {
          action: canImport ? 'import' : 'block',
          reason: canImport ? 'Données critiques présentes' : 'Données critiques manquantes',
          details: errors
        }
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
     * Process multiple URLs (bulk import) with Phase 1 compliance
     */
    async processBulk(urls, options = {}) {
      const results = {
        total: urls.length,
        successful: 0,
        drafted: 0,
        blocked: 0,
        failed: 0,
        products: [],
        drafts: [],
        errors: [],
        blockedProducts: []
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
                if (result.status === 'drafted') {
                  results.drafted++;
                  results.drafts.push(result.product);
                } else {
                  results.successful++;
                  results.products.push(result.product);
                }
              } else if (result.status === 'blocked') {
                results.blocked++;
                results.blockedProducts.push({ 
                  url, 
                  reason: result.error,
                  details: result.details 
                });
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
              const processed = results.successful + results.drafted + results.blocked + results.failed;
              this.emit(PIPELINE_EVENTS.PROGRESS, {
                step: 'bulk_import',
                progress: Math.round((processed / results.total) * 100),
                current: processed,
                total: results.total,
                stats: {
                  successful: results.successful,
                  drafted: results.drafted,
                  blocked: results.blocked,
                  failed: results.failed
                }
              });
            });
          
          active.add(promise);
        }

        // Wait for at least one to complete
        if (active.size > 0) {
          await Promise.race(active);
        }
      }

      // Generate final summary
      results.summary = this.generateBulkSummary(results);
      
      return results;
    }

    /**
     * Generate human-readable bulk import summary
     */
    generateBulkSummary(results) {
      const lines = [];
      
      if (results.successful > 0) {
        lines.push(`✅ ${results.successful} produit(s) importé(s) avec succès`);
      }
      if (results.drafted > 0) {
        lines.push(`📝 ${results.drafted} produit(s) créé(s) en brouillon (données incomplètes)`);
      }
      if (results.blocked > 0) {
        lines.push(`🚫 ${results.blocked} produit(s) bloqué(s) (données critiques manquantes)`);
      }
      if (results.failed > 0) {
        lines.push(`❌ ${results.failed} erreur(s) technique(s)`);
      }

      return lines.join('\n');
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
      return ![
        PIPELINE_STATES.IDLE, 
        PIPELINE_STATES.COMPLETED, 
        PIPELINE_STATES.COMPLETED_AS_DRAFT,
        PIPELINE_STATES.BLOCKED,
        PIPELINE_STATES.FAILED, 
        PIPELINE_STATES.CANCELLED
      ].includes(this.state);
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

  console.log('[ShopOpti+] ImportPipeline v5.7.1 loaded - Phase 1 Atomic Import');
})();
