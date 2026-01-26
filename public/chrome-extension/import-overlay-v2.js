/**
 * ShopOpti+ - Advanced Import Overlay V2
 * Professional import assistant with AI optimization, variant selection, and image management
 * Version 5.7.0 - Synced with shopopti.io
 */

(function() {
  'use strict';

  if (window.__shopoptiImportOverlayV2Loaded) return;
  window.__shopoptiImportOverlayV2Loaded = true;

  const CONFIG = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    APP_URL: 'https://shopopti.io',
    VERSION: '5.7.0'
  };

  // Secure element creation helper
  const createElement = (tag, attrs = {}, children = []) => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className') el.className = value;
      else if (key === 'textContent') el.textContent = value;
      else if (key.startsWith('data')) el.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), value);
      else if (key === 'style' && typeof value === 'object') {
        Object.assign(el.style, value);
      } else {
        el.setAttribute(key, value);
      }
    });
    children.forEach(child => {
      if (typeof child === 'string') el.appendChild(document.createTextNode(child));
      else if (child) el.appendChild(child);
    });
    return el;
  };

  // Pricing templates
  const PRICING_TEMPLATES = {
    competitive: { name: 'Compétitif', markup: 20, description: 'Marge réduite pour volume' },
    balanced: { name: 'Équilibré', markup: 35, description: 'Bon équilibre marge/volume' },
    premium: { name: 'Premium', markup: 50, description: 'Marge élevée, positionnement haut de gamme' },
    custom: { name: 'Personnalisé', markup: 30, description: 'Définir votre propre marge' }
  };

  class AdvancedImportOverlay {
    constructor() {
      this.overlay = null;
      this.isOpen = false;
      this.productData = null;
      this.stores = [];
      this.selectedStore = null;
      this.selectedStatus = 'draft';
      this.selectedVariants = new Set();
      this.selectedImages = new Set();
      this.enabledFeatures = {
        aiOptimization: false,
        translateReviews: false,
        removeWatermark: false,
        findSuppliers: false
      };
      this.token = null;
      this.userPlan = 'starter';
      this.importRules = null;
      this.currentStep = 1;
      this.totalSteps = 5;
      this.categories = [];
      this.tags = [];
      this.selectedCategory = '';
      this.pricingTemplate = 'balanced';
      this.customMarkup = 35;
      this.aiOptimizedData = null;
      this.supplierResults = [];
      this.isLoading = false;
      this.sessionValid = true;
      
      this.init();
    }

    async init() {
      await this.loadUserData();
      await this.validateSession();
      this.injectStyles();
      this.createOverlay();
      this.setupEventListeners();
    }

    async loadUserData() {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get([
            'extensionToken', 
            'userStores', 
            'userPlan', 
            'defaultStore', 
            'importRules',
            'categories',
            'defaultSettings',
            'sessionExpiry'
          ], (result) => {
            this.token = result.extensionToken;
            this.stores = result.userStores || [];
            this.userPlan = result.userPlan || 'starter';
            this.selectedStore = result.defaultStore || (this.stores[0]?.id) || null;
            this.importRules = result.importRules || this.getDefaultRules();
            this.categories = result.categories || [];
            this.pricingTemplate = result.defaultSettings?.pricingTemplate || 'balanced';
            this.customMarkup = this.importRules?.pricing?.markupValue || 35;
            resolve();
          });
        } else {
          resolve();
        }
      });
    }

    async validateSession() {
      if (!this.token) {
        this.sessionValid = false;
        return;
      }

      try {
        const response = await fetch(`${CONFIG.API_URL}/extension-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': this.token
          },
          body: JSON.stringify({ action: 'validate' })
        });

        if (!response.ok) {
          this.sessionValid = false;
          this.token = null;
          if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.remove(['extensionToken']);
          }
        } else {
          this.sessionValid = true;
        }
      } catch (e) {
        console.warn('Session validation failed:', e);
        // Allow offline mode
        this.sessionValid = !!this.token;
      }
    }

    getDefaultRules() {
      return {
        pricing: {
          enabled: true,
          markupType: 'percentage',
          markupValue: 35,
          roundToNearest: 0.99,
          includeTax: false,
          taxRate: 20
        },
        defaultCategory: null,
        defaultTags: [],
        defaultStatus: 'draft',
        currency: 'EUR',
        autoOptimize: false
      };
    }

    injectStyles() {
      if (document.querySelector('#shopopti-overlay-v2-styles')) return;

      const style = document.createElement('style');
      style.id = 'shopopti-overlay-v2-styles';
      style.textContent = `
        .sho-v2-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(12px);
          z-index: 2147483647;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .sho-v2-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        .sho-v2-modal {
          background: linear-gradient(180deg, #1a1a2e 0%, #16162a 100%);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 24px;
          width: 95%;
          max-width: 780px;
          max-height: 92vh;
          overflow: hidden;
          box-shadow: 0 25px 80px -12px rgba(139, 92, 246, 0.4), 
                      0 0 0 1px rgba(255, 255, 255, 0.05),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transform: scale(0.9) translateY(30px);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sho-v2-overlay.open .sho-v2-modal {
          transform: scale(1) translateY(0);
        }

        /* Header */
        .sho-v2-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
          position: relative;
          overflow: hidden;
        }

        .sho-v2-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="white" opacity="0.1"/><circle cx="80" cy="40" r="1.5" fill="white" opacity="0.15"/><circle cx="40" cy="80" r="1" fill="white" opacity="0.1"/></svg>');
          pointer-events: none;
        }

        .sho-v2-title {
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
          font-size: 18px;
          font-weight: 600;
          position: relative;
          z-index: 1;
        }

        .sho-v2-title-icon {
          font-size: 28px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }

        .sho-v2-version {
          font-size: 10px;
          padding: 2px 8px;
          background: rgba(255,255,255,0.2);
          border-radius: 6px;
          font-weight: 500;
        }

        .sho-v2-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          transition: all 0.2s;
          position: relative;
          z-index: 1;
        }

        .sho-v2-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        /* Progress Steps */
        .sho-v2-steps {
          display: flex;
          padding: 16px 24px;
          background: rgba(0, 0, 0, 0.4);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          gap: 4px;
        }

        .sho-v2-step {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          opacity: 0.4;
          transition: opacity 0.3s;
          position: relative;
        }

        .sho-v2-step.active, .sho-v2-step.completed {
          opacity: 1;
        }

        .sho-v2-step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
          color: white;
          transition: all 0.3s;
        }

        .sho-v2-step.active .sho-v2-step-number {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          box-shadow: 0 0 25px rgba(139, 92, 246, 0.6);
        }

        .sho-v2-step.completed .sho-v2-step-number {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .sho-v2-step-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
          text-align: center;
        }

        .sho-v2-step::after {
          content: '';
          position: absolute;
          top: 16px;
          left: calc(50% + 20px);
          width: calc(100% - 40px);
          height: 2px;
          background: rgba(255, 255, 255, 0.1);
        }

        .sho-v2-step:last-child::after {
          display: none;
        }

        .sho-v2-step.completed::after {
          background: linear-gradient(90deg, #10b981, rgba(16, 185, 129, 0.3));
        }

        /* Body */
        .sho-v2-body {
          padding: 24px;
          overflow-y: auto;
          max-height: calc(92vh - 240px);
        }

        .sho-v2-body::-webkit-scrollbar {
          width: 6px;
        }

        .sho-v2-body::-webkit-scrollbar-track {
          background: transparent;
        }

        .sho-v2-body::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 3px;
        }

        /* Product Preview Card */
        .sho-v2-product-card {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.05));
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 16px;
          margin-bottom: 24px;
        }

        .sho-v2-product-image-container {
          position: relative;
          flex-shrink: 0;
        }

        .sho-v2-product-image {
          width: 130px;
          height: 130px;
          border-radius: 12px;
          object-fit: cover;
          background: rgba(255, 255, 255, 0.05);
        }

        .sho-v2-product-platform {
          position: absolute;
          bottom: -8px;
          right: -8px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
        }

        .sho-v2-product-info {
          flex: 1;
          min-width: 0;
        }

        .sho-v2-product-title {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 10px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.4;
        }

        .sho-v2-product-price {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin-bottom: 12px;
        }

        .sho-v2-price-current {
          color: #10b981;
          font-size: 26px;
          font-weight: 700;
        }

        .sho-v2-price-original {
          color: rgba(255, 255, 255, 0.4);
          font-size: 14px;
          text-decoration: line-through;
        }

        .sho-v2-price-discount {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .sho-v2-product-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .sho-v2-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 10px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 8px;
          color: #a5b4fc;
          font-size: 11px;
          font-weight: 500;
        }

        .sho-v2-badge.success {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.3);
          color: #6ee7b7;
        }

        .sho-v2-badge.warning {
          background: rgba(245, 158, 11, 0.15);
          border-color: rgba(245, 158, 11, 0.3);
          color: #fcd34d;
        }

        .sho-v2-badge.error {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }

        /* Section Styling */
        .sho-v2-section {
          margin-bottom: 24px;
        }

        .sho-v2-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .sho-v2-section-title {
          color: rgba(255, 255, 255, 0.95);
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sho-v2-section-action {
          color: #8b5cf6;
          font-size: 12px;
          cursor: pointer;
          transition: color 0.2s;
          font-weight: 500;
        }

        .sho-v2-section-action:hover {
          color: #a78bfa;
        }

        /* Image Grid */
        .sho-v2-image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(85px, 1fr));
          gap: 10px;
        }

        .sho-v2-image-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
        }

        .sho-v2-image-item:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }

        .sho-v2-image-item.selected {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.3);
        }

        .sho-v2-image-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .sho-v2-image-check {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 22px;
          height: 22px;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          opacity: 0;
          transform: scale(0.5);
          transition: all 0.2s;
        }

        .sho-v2-image-item.selected .sho-v2-image-check {
          opacity: 1;
          transform: scale(1);
        }

        .sho-v2-image-video-badge {
          position: absolute;
          bottom: 6px;
          left: 6px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
        }

        /* Variant Grid */
        .sho-v2-variant-grid {
          display: grid;
          gap: 10px;
          max-height: 300px;
          overflow-y: auto;
        }

        .sho-v2-variant-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sho-v2-variant-item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(139, 92, 246, 0.3);
        }

        .sho-v2-variant-item.selected {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.1);
        }

        .sho-v2-variant-item.unavailable {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .sho-v2-variant-checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .sho-v2-variant-item.selected .sho-v2-variant-checkbox {
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          border-color: #8b5cf6;
        }

        .sho-v2-variant-image {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          object-fit: cover;
          background: rgba(255, 255, 255, 0.05);
        }

        .sho-v2-variant-details {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-width: 0;
        }

        .sho-v2-variant-name {
          color: white;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sho-v2-variant-meta {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-shrink: 0;
        }

        .sho-v2-variant-price {
          color: #10b981;
          font-weight: 600;
          font-size: 14px;
        }

        .sho-v2-variant-stock {
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
        }

        .sho-v2-variant-stock.low {
          color: #f59e0b;
        }

        .sho-v2-variant-stock.out {
          color: #ef4444;
        }

        /* Pricing Templates */
        .sho-v2-pricing-templates {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }

        .sho-v2-pricing-template {
          padding: 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .sho-v2-pricing-template:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .sho-v2-pricing-template.selected {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.15);
        }

        .sho-v2-pricing-template h4 {
          color: white;
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .sho-v2-pricing-template p {
          color: rgba(255, 255, 255, 0.5);
          font-size: 11px;
          margin: 0;
        }

        .sho-v2-pricing-template .markup {
          color: #10b981;
          font-size: 20px;
          font-weight: 700;
          margin-top: 8px;
        }

        /* AI Features Toggle */
        .sho-v2-ai-features {
          display: grid;
          gap: 10px;
        }

        .sho-v2-feature-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sho-v2-feature-toggle:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .sho-v2-feature-toggle.active {
          border-color: #8b5cf6;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(99, 102, 241, 0.1));
        }

        .sho-v2-feature-toggle.loading {
          pointer-events: none;
          opacity: 0.7;
        }

        .sho-v2-feature-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .sho-v2-feature-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .sho-v2-feature-text h4 {
          color: white;
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 3px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sho-v2-feature-text p {
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
          margin: 0;
        }

        .sho-v2-feature-switch {
          width: 48px;
          height: 26px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 13px;
          position: relative;
          transition: all 0.2s;
        }

        .sho-v2-feature-switch::after {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .sho-v2-feature-toggle.active .sho-v2-feature-switch {
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
        }

        .sho-v2-feature-toggle.active .sho-v2-feature-switch::after {
          left: 25px;
        }

        .sho-v2-pro-badge {
          background: linear-gradient(135deg, #f59e0b, #ef4444);
          color: white;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }

        /* Supplier Results */
        .sho-v2-supplier-grid {
          display: grid;
          gap: 10px;
          max-height: 250px;
          overflow-y: auto;
        }

        .sho-v2-supplier-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sho-v2-supplier-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(16, 185, 129, 0.3);
        }

        .sho-v2-supplier-card.selected {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }

        .sho-v2-supplier-platform {
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          color: white;
        }

        .sho-v2-supplier-info {
          flex: 1;
        }

        .sho-v2-supplier-info h4 {
          color: white;
          font-size: 13px;
          font-weight: 500;
          margin: 0 0 4px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sho-v2-supplier-meta {
          display: flex;
          gap: 12px;
          font-size: 11px;
        }

        .sho-v2-supplier-meta span {
          color: rgba(255, 255, 255, 0.5);
        }

        .sho-v2-supplier-meta .rating {
          color: #fcd34d;
        }

        .sho-v2-supplier-pricing {
          text-align: right;
        }

        .sho-v2-supplier-price {
          color: #10b981;
          font-size: 16px;
          font-weight: 700;
        }

        .sho-v2-supplier-margin {
          color: rgba(255, 255, 255, 0.5);
          font-size: 11px;
        }

        .sho-v2-supplier-margin.high {
          color: #10b981;
        }

        /* Store & Settings */
        .sho-v2-store-grid {
          display: grid;
          gap: 10px;
        }

        .sho-v2-store-option {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid transparent;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sho-v2-store-option:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .sho-v2-store-option.selected {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.1);
        }

        .sho-v2-store-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.1));
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .sho-v2-store-info h4 {
          color: white;
          font-size: 15px;
          font-weight: 600;
          margin: 0 0 3px 0;
        }

        .sho-v2-store-info p {
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
          margin: 0;
        }

        .sho-v2-default-badge {
          margin-left: auto;
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          font-size: 10px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
        }

        /* Pricing Preview Card */
        .sho-v2-pricing-card {
          padding: 20px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(99, 102, 241, 0.05));
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 16px;
        }

        .sho-v2-pricing-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .sho-v2-pricing-row:last-child {
          border-bottom: none;
          padding-top: 14px;
          margin-top: 6px;
        }

        .sho-v2-pricing-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
        }

        .sho-v2-pricing-value {
          color: white;
          font-size: 13px;
          font-weight: 500;
        }

        .sho-v2-pricing-value.highlight {
          color: #10b981;
          font-size: 22px;
          font-weight: 700;
        }

        .sho-v2-pricing-value.profit {
          color: #10b981;
        }

        /* Footer */
        .sho-v2-footer {
          display: flex;
          gap: 12px;
          padding: 18px 24px;
          background: rgba(0, 0, 0, 0.4);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .sho-v2-btn {
          flex: 1;
          padding: 14px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
        }

        .sho-v2-btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .sho-v2-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .sho-v2-btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
        }

        .sho-v2-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(99, 102, 241, 0.5);
        }

        .sho-v2-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .sho-v2-btn.loading {
          pointer-events: none;
        }

        .sho-v2-btn.loading .sho-v2-btn-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Success State */
        .sho-v2-success {
          text-align: center;
          padding: 50px 20px;
        }

        .sho-v2-success-icon {
          width: 90px;
          height: 90px;
          margin: 0 auto 24px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          animation: successPop 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 40px rgba(16, 185, 129, 0.4);
        }

        @keyframes successPop {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        .sho-v2-success h2 {
          color: white;
          font-size: 26px;
          font-weight: 700;
          margin: 0 0 10px 0;
        }

        .sho-v2-success p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          margin: 0 0 28px 0;
        }

        .sho-v2-success-stats {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-bottom: 24px;
        }

        .sho-v2-success-stat {
          text-align: center;
        }

        .sho-v2-success-stat-value {
          color: #10b981;
          font-size: 24px;
          font-weight: 700;
        }

        .sho-v2-success-stat-label {
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
        }

        .sho-v2-success-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        /* Status Toggle */
        .sho-v2-status-toggle {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 4px;
        }

        .sho-v2-status-btn {
          flex: 1;
          padding: 12px 16px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .sho-v2-status-btn.selected {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.2));
          color: white;
        }

        /* Input Styling */
        .sho-v2-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }

        .sho-v2-input:focus {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.1);
        }

        .sho-v2-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Tags */
        .sho-v2-tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          min-height: 48px;
        }

        .sho-v2-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 10px;
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.4);
          border-radius: 6px;
          color: #c4b5fd;
          font-size: 12px;
        }

        .sho-v2-tag-remove {
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .sho-v2-tag-remove:hover {
          opacity: 1;
        }

        .sho-v2-tag-input {
          flex: 1;
          min-width: 120px;
          background: transparent;
          border: none;
          color: white;
          font-size: 13px;
          outline: none;
        }

        .sho-v2-tag-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Empty/Login States */
        .sho-v2-empty {
          text-align: center;
          padding: 50px 20px;
          color: rgba(255, 255, 255, 0.5);
        }

        .sho-v2-empty-icon {
          font-size: 56px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .sho-v2-empty h3 {
          color: white;
          font-size: 18px;
          margin: 0 0 8px 0;
        }

        .sho-v2-empty p {
          margin: 0 0 20px 0;
        }

        /* Loading Spinner */
        .sho-v2-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .sho-v2-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(139, 92, 246, 0.2);
          border-top-color: #8b5cf6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        .sho-v2-loading p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        /* AI Optimized Preview */
        .sho-v2-ai-preview {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 12px;
          padding: 16px;
          margin-top: 16px;
        }

        .sho-v2-ai-preview-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .sho-v2-ai-preview-header span {
          color: #a78bfa;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .sho-v2-ai-preview h4 {
          color: white;
          font-size: 14px;
          font-weight: 500;
          margin: 0 0 8px 0;
        }

        .sho-v2-ai-preview p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          margin: 0;
          line-height: 1.5;
        }
      `;
      document.head.appendChild(style);
    }

    createOverlay() {
      this.overlay = createElement('div', { className: 'sho-v2-overlay' });
      this.overlay.innerHTML = this.getModalHTML();
      document.body.appendChild(this.overlay);
    }

    getModalHTML() {
      return `
        <div class="sho-v2-modal">
          <div class="sho-v2-header">
            <div class="sho-v2-title">
              <span class="sho-v2-title-icon">🚀</span>
              <span>ShopOpti+ Import Pro</span>
              <span class="sho-v2-version">v${CONFIG.VERSION}</span>
            </div>
            <button class="sho-v2-close" data-action="close">×</button>
          </div>
          
          <div class="sho-v2-steps" id="sho-steps"></div>
          
          <div class="sho-v2-body" id="sho-body"></div>
          
          <div class="sho-v2-footer" id="sho-footer">
            <button class="sho-v2-btn sho-v2-btn-secondary" data-action="back">
              ← Retour
            </button>
            <button class="sho-v2-btn sho-v2-btn-primary" data-action="next">
              <span class="sho-v2-btn-text">Suivant →</span>
              <span class="sho-v2-btn-icon" style="display:none">⏳</span>
            </button>
          </div>
        </div>
      `;
    }

    setupEventListeners() {
      this.overlay.addEventListener('click', (e) => {
        const target = e.target;
        const action = target.closest('[data-action]')?.dataset.action;
        
        if (target === this.overlay) this.close();
        if (action === 'close') this.close();
        if (action === 'back') this.previousStep();
        if (action === 'next') this.nextStep();
        if (action === 'select-all-images') this.selectAllImages();
        if (action === 'select-all-variants') this.selectAllVariants();
        
        const imageItem = target.closest('.sho-v2-image-item');
        if (imageItem) this.toggleImage(imageItem.dataset.index);
        
        const variantItem = target.closest('.sho-v2-variant-item');
        if (variantItem && !variantItem.classList.contains('unavailable')) {
          this.toggleVariant(variantItem.dataset.id);
        }
        
        const featureToggle = target.closest('.sho-v2-feature-toggle');
        if (featureToggle) this.toggleFeature(featureToggle.dataset.feature);
        
        const storeOption = target.closest('.sho-v2-store-option');
        if (storeOption) this.selectStore(storeOption.dataset.id);
        
        const statusBtn = target.closest('.sho-v2-status-btn');
        if (statusBtn) this.selectStatus(statusBtn.dataset.status);
        
        const pricingTemplate = target.closest('.sho-v2-pricing-template');
        if (pricingTemplate) this.selectPricingTemplate(pricingTemplate.dataset.template);
        
        const supplierCard = target.closest('.sho-v2-supplier-card');
        if (supplierCard) this.selectSupplier(supplierCard.dataset.url);
      });

      // Tag input handling
      this.overlay.addEventListener('keydown', (e) => {
        if (e.target.id === 'tag-input' && e.key === 'Enter') {
          e.preventDefault();
          this.addTag(e.target.value);
          e.target.value = '';
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) this.close();
      });

      window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        if (event.data.type === 'SHOPOPTI_OPEN_IMPORT_V2') {
          this.open(event.data.product);
        }
      });

      window.addEventListener('shopopti:open-import-v2', (e) => {
        this.open(e.detail);
      });
    }

    async open(productData) {
      this.productData = productData;
      this.currentStep = 1;
      this.aiOptimizedData = null;
      this.supplierResults = [];
      this.tags = this.importRules?.defaultTags || [];
      
      this.selectedImages = new Set(
        (productData.images || []).map((_, i) => i.toString())
      );
      this.selectedVariants = new Set(
        (productData.variants || [])
          .filter(v => v.available !== false && v.stock !== 0)
          .map(v => v.id || v.name || v.sku)
      );
      
      this.renderSteps();
      this.renderContent();
      this.overlay.classList.add('open');
      this.isOpen = true;
    }

    close() {
      this.overlay.classList.remove('open');
      this.isOpen = false;
    }

    renderSteps() {
      const stepsContainer = this.overlay.querySelector('#sho-steps');
      const steps = [
        { num: 1, label: 'Aperçu' },
        { num: 2, label: 'Médias' },
        { num: 3, label: 'Pricing' },
        { num: 4, label: 'IA & SEO' },
        { num: 5, label: 'Destination' }
      ];

      stepsContainer.innerHTML = steps.map((step) => `
        <div class="sho-v2-step ${step.num < this.currentStep ? 'completed' : ''} ${step.num === this.currentStep ? 'active' : ''}">
          <div class="sho-v2-step-number">${step.num < this.currentStep ? '✓' : step.num}</div>
          <span class="sho-v2-step-label">${step.label}</span>
        </div>
      `).join('');
    }

    renderContent() {
      const body = this.overlay.querySelector('#sho-body');
      const footer = this.overlay.querySelector('#sho-footer');
      
      footer.style.display = 'flex';

      if (!this.sessionValid || !this.token) {
        body.innerHTML = this.getNotConnectedHTML();
        footer.style.display = 'none';
        return;
      }

      switch (this.currentStep) {
        case 1: body.innerHTML = this.getStep1HTML(); break;
        case 2: body.innerHTML = this.getStep2HTML(); break;
        case 3: body.innerHTML = this.getStep3HTML(); break;
        case 4: body.innerHTML = this.getStep4HTML(); break;
        case 5: body.innerHTML = this.getStep5HTML(); break;
        case 6: body.innerHTML = this.getSuccessHTML(); footer.style.display = 'none'; break;
      }

      this.updateFooterButtons();
    }

    getNotConnectedHTML() {
      return `
        <div class="sho-v2-empty">
          <div class="sho-v2-empty-icon">🔐</div>
          <h3>Connexion requise</h3>
          <p>Connectez-vous à ShopOpti+ pour importer des produits</p>
          <a href="${CONFIG.APP_URL}/auth/extension" target="_blank" class="sho-v2-btn sho-v2-btn-primary" style="display:inline-flex;width:auto">
            Obtenir ma clé d'extension →
          </a>
        </div>
      `;
    }

    getStep1HTML() {
      const p = this.productData || {};
      const price = parseFloat(p.price) || 0;
      const originalPrice = parseFloat(p.originalPrice || p.compare_at_price) || 0;
      const discount = originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0;
      
      return `
        <div class="sho-v2-product-card">
          <div class="sho-v2-product-image-container">
            <img src="${p.images?.[0] || ''}" class="sho-v2-product-image" alt="" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/></svg>'">
            <span class="sho-v2-product-platform">${p.platform || 'Web'}</span>
          </div>
          <div class="sho-v2-product-info">
            <div class="sho-v2-product-title">${this.escapeHTML(p.title || 'Produit')}</div>
            <div class="sho-v2-product-price">
              <span class="sho-v2-price-current">${price.toFixed(2)} ${p.currency || '€'}</span>
              ${originalPrice > price ? `
                <span class="sho-v2-price-original">${originalPrice.toFixed(2)} €</span>
                <span class="sho-v2-price-discount">-${discount}%</span>
              ` : ''}
            </div>
            <div class="sho-v2-product-badges">
              <span class="sho-v2-badge">📷 ${p.images?.length || 0} images</span>
              ${p.videos?.length ? `<span class="sho-v2-badge success">🎬 ${p.videos.length} vidéos</span>` : ''}
              ${(p.variants?.length || 0) > 1 ? `<span class="sho-v2-badge">🎨 ${p.variants.length} variantes</span>` : ''}
              ${p.rating ? `<span class="sho-v2-badge">⭐ ${p.rating.toFixed(1)} ${p.reviews_count ? `(${p.reviews_count})` : ''}</span>` : ''}
            </div>
          </div>
        </div>
        
        <div class="sho-v2-section">
          <div class="sho-v2-section-header">
            <div class="sho-v2-section-title">📋 Données extraites</div>
          </div>
          <div class="sho-v2-pricing-card">
            <div class="sho-v2-pricing-row">
              <span class="sho-v2-pricing-label">SKU / Référence</span>
              <span class="sho-v2-pricing-value">${p.sku || 'Auto-généré'}</span>
            </div>
            <div class="sho-v2-pricing-row">
              <span class="sho-v2-pricing-label">Marque</span>
              <span class="sho-v2-pricing-value">${p.brand || 'Non spécifiée'}</span>
            </div>
            <div class="sho-v2-pricing-row">
              <span class="sho-v2-pricing-label">Stock estimé</span>
              <span class="sho-v2-pricing-value">${p.stock_quantity || 100} unités</span>
            </div>
            <div class="sho-v2-pricing-row">
              <span class="sho-v2-pricing-label">Livraison</span>
              <span class="sho-v2-pricing-value">${p.shipping?.time || p.shipping_time || 'À vérifier'}</span>
            </div>
          </div>
        </div>
      `;
    }

    getStep2HTML() {
      const p = this.productData || {};
      const images = p.images || [];
      const videos = p.videos || [];
      const variants = p.variants || [];
      
      return `
        <div class="sho-v2-section">
          <div class="sho-v2-section-header">
            <div class="sho-v2-section-title">📷 Images (${this.selectedImages.size}/${images.length})</div>
            <span class="sho-v2-section-action" data-action="select-all-images">Tout sélectionner</span>
          </div>
          <div class="sho-v2-image-grid">
            ${images.slice(0, 30).map((img, i) => `
              <div class="sho-v2-image-item ${this.selectedImages.has(i.toString()) ? 'selected' : ''}" data-index="${i}">
                <img src="${img}" alt="" loading="lazy" onerror="this.parentElement.style.display='none'">
                <div class="sho-v2-image-check">✓</div>
              </div>
            `).join('')}
            ${videos.slice(0, 5).map((vid, i) => `
              <div class="sho-v2-image-item selected" data-index="video-${i}">
                <div style="width:100%;height:100%;background:#333;display:flex;align-items:center;justify-content:center;font-size:24px">🎬</div>
                <span class="sho-v2-image-video-badge">Vidéo</span>
                <div class="sho-v2-image-check">✓</div>
              </div>
            `).join('')}
          </div>
        </div>
        
        ${variants.length > 0 ? `
          <div class="sho-v2-section">
            <div class="sho-v2-section-header">
              <div class="sho-v2-section-title">🎨 Variantes (${this.selectedVariants.size}/${variants.length})</div>
              <span class="sho-v2-section-action" data-action="select-all-variants">Tout sélectionner</span>
            </div>
            <div class="sho-v2-variant-grid">
              ${variants.slice(0, 50).map(v => {
                const variantId = v.id || v.name || v.sku;
                const stockClass = v.stock === 0 ? 'out' : (v.stock && v.stock < 10) ? 'low' : '';
                const isAvailable = v.available !== false && v.stock !== 0;
                const variantPrice = parseFloat(v.price) || parseFloat(this.productData?.price) || 0;
                
                return `
                  <div class="sho-v2-variant-item ${this.selectedVariants.has(variantId) ? 'selected' : ''} ${!isAvailable ? 'unavailable' : ''}" data-id="${variantId}">
                    <div class="sho-v2-variant-checkbox">${this.selectedVariants.has(variantId) ? '✓' : ''}</div>
                    ${v.image ? `<img src="${v.image}" class="sho-v2-variant-image" alt="" onerror="this.style.display='none'">` : ''}
                    <div class="sho-v2-variant-details">
                      <span class="sho-v2-variant-name">${this.escapeHTML(v.name || v.title || 'Variante')}</span>
                      <div class="sho-v2-variant-meta">
                        <span class="sho-v2-variant-price">${variantPrice.toFixed(2)} €</span>
                        <span class="sho-v2-variant-stock ${stockClass}">
                          ${v.stock === 0 ? '❌ Rupture' : v.stock ? `${v.stock} en stock` : '✓'}
                        </span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
      `;
    }

    getStep3HTML() {
      const p = this.productData || {};
      const costPrice = parseFloat(p.price) || 0;
      const markup = PRICING_TEMPLATES[this.pricingTemplate]?.markup || this.customMarkup;
      const salePrice = costPrice * (1 + markup / 100);
      const profit = salePrice - costPrice;
      const margin = costPrice > 0 ? (profit / salePrice * 100) : 0;
      const roi = costPrice > 0 ? (profit / costPrice * 100) : 0;
      
      return `
        <div class="sho-v2-section">
          <div class="sho-v2-section-header">
            <div class="sho-v2-section-title">💰 Modèle de tarification</div>
          </div>
          <div class="sho-v2-pricing-templates">
            ${Object.entries(PRICING_TEMPLATES).map(([key, template]) => `
              <div class="sho-v2-pricing-template ${this.pricingTemplate === key ? 'selected' : ''}" data-template="${key}">
                <h4>${template.name}</h4>
                <p>${template.description}</p>
                <div class="markup">${key === 'custom' ? this.customMarkup : template.markup}%</div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="sho-v2-section">
          <div class="sho-v2-section-header">
            <div class="sho-v2-section-title">📊 Calcul de rentabilité</div>
          </div>
          <div class="sho-v2-pricing-card">
            <div class="sho-v2-pricing-row">
              <span class="sho-v2-pricing-label">Prix fournisseur</span>
              <span class="sho-v2-pricing-value">${costPrice.toFixed(2)} €</span>
            </div>
            <div class="sho-v2-pricing-row">
              <span class="sho-v2-pricing-label">Marge appliquée</span>
              <span class="sho-v2-pricing-value">+${markup}%</span>
            </div>
            <div class="sho-v2-pricing-row">
              <span class="sho-v2-pricing-label">Prix de vente</span>
              <span class="sho-v2-pricing-value highlight">${salePrice.toFixed(2)} €</span>
            </div>
            <div class="sho-v2-pricing-row">
              <span class="sho-v2-pricing-label">Bénéfice par vente</span>
              <span class="sho-v2-pricing-value profit">+${profit.toFixed(2)} € (${margin.toFixed(0)}%)</span>
            </div>
            <div class="sho-v2-pricing-row">
              <span class="sho-v2-pricing-label">ROI</span>
              <span class="sho-v2-pricing-value profit">${roi.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      `;
    }

    getStep4HTML() {
      const isPro = ['pro', 'enterprise'].includes(this.userPlan);
      
      return `
        <div class="sho-v2-section">
          <div class="sho-v2-section-header">
            <div class="sho-v2-section-title">🤖 Optimisation IA</div>
          </div>
          <div class="sho-v2-ai-features">
            <div class="sho-v2-feature-toggle ${this.enabledFeatures.aiOptimization ? 'active' : ''}" data-feature="aiOptimization">
              <div class="sho-v2-feature-info">
                <div class="sho-v2-feature-icon">✨</div>
                <div class="sho-v2-feature-text">
                  <h4>Optimisation SEO automatique</h4>
                  <p>Réécrire titre, description et meta tags pour le SEO</p>
                </div>
              </div>
              <div class="sho-v2-feature-switch"></div>
            </div>
            
            <div class="sho-v2-feature-toggle ${this.enabledFeatures.translateReviews ? 'active' : ''}" data-feature="translateReviews">
              <div class="sho-v2-feature-info">
                <div class="sho-v2-feature-icon">🌍</div>
                <div class="sho-v2-feature-text">
                  <h4>Traduction des avis ${!isPro ? '<span class="sho-v2-pro-badge">PRO</span>' : ''}</h4>
                  <p>Traduire automatiquement les avis clients</p>
                </div>
              </div>
              <div class="sho-v2-feature-switch"></div>
            </div>
            
            <div class="sho-v2-feature-toggle ${this.enabledFeatures.findSuppliers ? 'active' : ''}" data-feature="findSuppliers">
              <div class="sho-v2-feature-info">
                <div class="sho-v2-feature-icon">🔍</div>
                <div class="sho-v2-feature-text">
                  <h4>Rechercher fournisseurs alternatifs</h4>
                  <p>Comparer les prix sur AliExpress, 1688, CJ...</p>
                </div>
              </div>
              <div class="sho-v2-feature-switch"></div>
            </div>
          </div>
          
          ${this.aiOptimizedData ? `
            <div class="sho-v2-ai-preview">
              <div class="sho-v2-ai-preview-header">
                <span>✨ Titre optimisé</span>
              </div>
              <h4>${this.escapeHTML(this.aiOptimizedData.title || this.productData?.title)}</h4>
              ${this.aiOptimizedData.seo_description ? `<p>${this.escapeHTML(this.aiOptimizedData.seo_description)}</p>` : ''}
            </div>
          ` : ''}
          
          ${this.supplierResults.length > 0 ? `
            <div class="sho-v2-section" style="margin-top:20px">
              <div class="sho-v2-section-header">
                <div class="sho-v2-section-title">🏭 Fournisseurs trouvés (${this.supplierResults.length})</div>
              </div>
              <div class="sho-v2-supplier-grid">
                ${this.supplierResults.slice(0, 5).map(s => `
                  <div class="sho-v2-supplier-card" data-url="${s.url}">
                    <div class="sho-v2-supplier-platform">${s.platform?.substring(0, 2).toUpperCase() || '??'}</div>
                    <div class="sho-v2-supplier-info">
                      <h4>${this.escapeHTML(s.title?.substring(0, 50) || 'Fournisseur')}</h4>
                      <div class="sho-v2-supplier-meta">
                        <span class="rating">⭐ ${(s.rating || 4.5).toFixed(1)}</span>
                        <span>${s.reviews_count || 0} avis</span>
                        <span>📦 ${s.shipping?.days_min || 7}-${s.shipping?.days_max || 20}j</span>
                      </div>
                    </div>
                    <div class="sho-v2-supplier-pricing">
                      <div class="sho-v2-supplier-price">${(s.price || 0).toFixed(2)} ${s.currency || '€'}</div>
                      <div class="sho-v2-supplier-margin ${s.margin > 40 ? 'high' : ''}">Marge: ${s.margin || 0}%</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
        
        <div class="sho-v2-section">
          <div class="sho-v2-section-header">
            <div class="sho-v2-section-title">🏷️ Tags</div>
          </div>
          <div class="sho-v2-tags-container" id="tags-container">
            ${this.tags.map(tag => `
              <span class="sho-v2-tag">
                ${this.escapeHTML(tag)}
                <span class="sho-v2-tag-remove" onclick="window.__shopoptiOverlay.removeTag('${this.escapeHTML(tag)}')">×</span>
              </span>
            `).join('')}
            <input type="text" class="sho-v2-tag-input" placeholder="Ajouter un tag..." id="tag-input">
          </div>
        </div>
      `;
    }

    getStep5HTML() {
      const p = this.productData || {};
      const costPrice = parseFloat(p.price) || 0;
      const markup = PRICING_TEMPLATES[this.pricingTemplate]?.markup || this.customMarkup;
      const salePrice = costPrice * (1 + markup / 100);
      
      return `
        <div class="sho-v2-section">
          <div class="sho-v2-section-header">
            <div class="sho-v2-section-title">🏪 Boutique de destination</div>
          </div>
          ${this.stores.length === 0 ? `
            <div class="sho-v2-empty">
              <div class="sho-v2-empty-icon">🏪</div>
              <h3>Aucune boutique connectée</h3>
              <p>Connectez une boutique Shopify pour exporter vos produits</p>
              <a href="${CONFIG.APP_URL}/integrations" target="_blank" class="sho-v2-btn sho-v2-btn-secondary" style="display:inline-flex;width:auto">
                Connecter une boutique →
              </a>
            </div>
          ` : `
            <div class="sho-v2-store-grid">
              ${this.stores.map(store => `
                <div class="sho-v2-store-option ${this.selectedStore === store.id ? 'selected' : ''}" data-id="${store.id}">
                  <div class="sho-v2-store-icon">${store.platform === 'shopify' ? '🛍️' : store.platform === 'woocommerce' ? '🔌' : '🏪'}</div>
                  <div class="sho-v2-store-info">
                    <h4>${this.escapeHTML(store.name || 'Ma boutique')}</h4>
                    <p>${this.escapeHTML(store.domain || store.url || store.platform)}</p>
                  </div>
                  ${store.isDefault ? '<span class="sho-v2-default-badge">Par défaut</span>' : ''}
                </div>
              `).join('')}
            </div>
          `}
        </div>
        
        <div class="sho-v2-section">
          <div class="sho-v2-section-header">
            <div class="sho-v2-section-title">📋 Statut de publication</div>
          </div>
          <div class="sho-v2-status-toggle">
            <button class="sho-v2-status-btn ${this.selectedStatus === 'draft' ? 'selected' : ''}" data-status="draft">
              📝 Brouillon
            </button>
            <button class="sho-v2-status-btn ${this.selectedStatus === 'active' ? 'selected' : ''}" data-status="active">
              ✅ Publié
            </button>
          </div>
        </div>
        
        <div class="sho-v2-section">
          <div class="sho-v2-section-header">
            <div class="sho-v2-section-title">📊 Récapitulatif</div>
          </div>
          <div class="sho-v2-pricing-card">
            <div class="sho-v2-pricing-row">
              <span class="sho-v2-pricing-label">Images sélectionnées</span>
              <span class="sho-v2-pricing-value">${this.selectedImages.size}</span>
            </div>
            <div class="sho-v2-pricing-row">
              <span class="sho-v2-pricing-label">Variantes sélectionnées</span>
              <span class="sho-v2-pricing-value">${this.selectedVariants.size}</span>
            </div>
            <div class="sho-v2-pricing-row">
              <span class="sho-v2-pricing-label">Prix de vente final</span>
              <span class="sho-v2-pricing-value highlight">${salePrice.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      `;
    }

    getSuccessHTML() {
      const p = this.productData || {};
      return `
        <div class="sho-v2-success">
          <div class="sho-v2-success-icon">✓</div>
          <h2>Produit importé avec succès !</h2>
          <p>${this.escapeHTML(p.title?.substring(0, 60) || 'Votre produit')}...</p>
          <div class="sho-v2-success-stats">
            <div class="sho-v2-success-stat">
              <div class="sho-v2-success-stat-value">${this.selectedImages.size}</div>
              <div class="sho-v2-success-stat-label">Images</div>
            </div>
            <div class="sho-v2-success-stat">
              <div class="sho-v2-success-stat-value">${this.selectedVariants.size}</div>
              <div class="sho-v2-success-stat-label">Variantes</div>
            </div>
          </div>
          <div class="sho-v2-success-actions">
            <a href="${CONFIG.APP_URL}/products" target="_blank" class="sho-v2-btn sho-v2-btn-secondary" style="display:inline-flex;width:auto">
              Voir mes produits →
            </a>
            <button class="sho-v2-btn sho-v2-btn-primary" data-action="close" style="width:auto">
              Fermer
            </button>
          </div>
        </div>
      `;
    }

    updateFooterButtons() {
      const backBtn = this.overlay.querySelector('[data-action="back"]');
      const nextBtn = this.overlay.querySelector('[data-action="next"]');
      const nextText = nextBtn?.querySelector('.sho-v2-btn-text');
      
      if (backBtn) {
        backBtn.style.display = this.currentStep === 1 ? 'none' : 'flex';
      }
      
      if (nextText) {
        if (this.currentStep === 5) {
          nextText.textContent = '🚀 Importer';
        } else {
          nextText.textContent = 'Suivant →';
        }
      }
    }

    async previousStep() {
      if (this.currentStep > 1) {
        this.currentStep--;
        this.renderSteps();
        this.renderContent();
      }
    }

    async nextStep() {
      if (this.isLoading) return;
      
      // Run AI optimization if enabled on step 4
      if (this.currentStep === 4 && this.enabledFeatures.aiOptimization && !this.aiOptimizedData) {
        await this.runAIOptimization();
      }
      
      if (this.currentStep === 4 && this.enabledFeatures.findSuppliers && this.supplierResults.length === 0) {
        await this.searchSuppliers();
      }
      
      if (this.currentStep < 5) {
        this.currentStep++;
        this.renderSteps();
        this.renderContent();
      } else if (this.currentStep === 5) {
        await this.performImport();
      }
    }

    async runAIOptimization() {
      this.setLoading(true, 'Optimisation IA en cours...');
      
      try {
        const response = await fetch(`${CONFIG.API_URL}/extension-ai-optimize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': this.token
          },
          body: JSON.stringify({
            type: 'full',
            product: {
              title: this.productData?.title,
              description: this.productData?.description,
              price: this.productData?.price,
              category: this.selectedCategory,
              platform: this.productData?.platform
            },
            language: 'fr',
            targetMarket: 'France'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          this.aiOptimizedData = data.optimized;
        }
      } catch (e) {
        console.warn('AI optimization failed:', e);
      }
      
      this.setLoading(false);
    }

    async searchSuppliers() {
      this.setLoading(true, 'Recherche de fournisseurs...');
      
      try {
        const response = await fetch(`${CONFIG.API_URL}/extension-supplier-search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': this.token
          },
          body: JSON.stringify({
            product: {
              title: this.productData?.title,
              images: this.productData?.images?.slice(0, 3),
              price: this.productData?.price,
              sku: this.productData?.sku,
              platform: this.productData?.platform
            },
            platforms: ['aliexpress', '1688', 'cjdropshipping', 'temu'],
            maxResults: 10
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          this.supplierResults = data.results || [];
        }
      } catch (e) {
        console.warn('Supplier search failed:', e);
      }
      
      this.setLoading(false);
      this.renderContent();
    }

    async performImport() {
      this.setLoading(true, 'Import en cours...');
      
      const p = this.productData || {};
      const markup = PRICING_TEMPLATES[this.pricingTemplate]?.markup || this.customMarkup;
      const costPrice = parseFloat(p.price) || 0;
      const salePrice = costPrice * (1 + markup / 100);
      
      // Filter selected images and variants
      const selectedImageUrls = (p.images || []).filter((_, i) => this.selectedImages.has(i.toString()));
      const selectedVariantData = (p.variants || []).filter(v => this.selectedVariants.has(v.id || v.name || v.sku));
      
      const importData = {
        ...p,
        title: this.aiOptimizedData?.title || p.title,
        description: this.aiOptimizedData?.description || p.description,
        seo_title: this.aiOptimizedData?.seo_title,
        seo_description: this.aiOptimizedData?.seo_description,
        price: salePrice,
        cost_price: costPrice,
        images: selectedImageUrls,
        variants: selectedVariantData,
        tags: [...this.tags, ...(this.aiOptimizedData?.tags || [])],
        status: this.selectedStatus,
        store_id: this.selectedStore
      };
      
      try {
        const response = await fetch(`${CONFIG.API_URL}/extension-scraper`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': this.token
          },
          body: JSON.stringify({
            action: 'scrape_and_import',
            url: p.source_url || p.url,
            extractedData: importData,
            options: {
              aiOptimized: this.enabledFeatures.aiOptimization,
              translateReviews: this.enabledFeatures.translateReviews
            }
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          this.currentStep = 6;
          this.renderContent();
          
          // Notify extension
          if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({
              type: 'IMPORT_SUCCESS',
              product: result.product
            });
          }
        } else {
          this.showError(result.error || 'Erreur lors de l\'import');
        }
      } catch (e) {
        this.showError('Erreur de connexion');
      }
      
      this.setLoading(false);
    }

    setLoading(loading, message = 'Chargement...') {
      this.isLoading = loading;
      const nextBtn = this.overlay.querySelector('[data-action="next"]');
      const icon = nextBtn?.querySelector('.sho-v2-btn-icon');
      const text = nextBtn?.querySelector('.sho-v2-btn-text');
      
      if (nextBtn) {
        nextBtn.disabled = loading;
        nextBtn.classList.toggle('loading', loading);
      }
      if (icon) icon.style.display = loading ? 'inline' : 'none';
      if (text && loading) text.textContent = message;
    }

    showError(message) {
      // Simple toast notification
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #ef4444;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 2147483648;
        animation: fadeIn 0.3s;
      `;
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    }

    toggleImage(index) {
      if (this.selectedImages.has(index)) {
        this.selectedImages.delete(index);
      } else {
        this.selectedImages.add(index);
      }
      this.renderContent();
    }

    selectAllImages() {
      const images = this.productData?.images || [];
      if (this.selectedImages.size === images.length) {
        this.selectedImages.clear();
      } else {
        images.forEach((_, i) => this.selectedImages.add(i.toString()));
      }
      this.renderContent();
    }

    toggleVariant(id) {
      if (this.selectedVariants.has(id)) {
        this.selectedVariants.delete(id);
      } else {
        this.selectedVariants.add(id);
      }
      this.renderContent();
    }

    selectAllVariants() {
      const variants = (this.productData?.variants || []).filter(v => v.available !== false && v.stock !== 0);
      if (this.selectedVariants.size === variants.length) {
        this.selectedVariants.clear();
      } else {
        variants.forEach(v => this.selectedVariants.add(v.id || v.name || v.sku));
      }
      this.renderContent();
    }

    toggleFeature(feature) {
      if (feature === 'translateReviews' || feature === 'removeWatermark') {
        const isPro = ['pro', 'enterprise'].includes(this.userPlan);
        if (!isPro) {
          window.open(`${CONFIG.APP_URL}/pricing`, '_blank');
          return;
        }
      }
      this.enabledFeatures[feature] = !this.enabledFeatures[feature];
      this.renderContent();
    }

    selectStore(id) {
      this.selectedStore = id;
      this.renderContent();
    }

    selectStatus(status) {
      this.selectedStatus = status;
      this.renderContent();
    }

    selectPricingTemplate(template) {
      this.pricingTemplate = template;
      this.renderContent();
    }

    selectSupplier(url) {
      window.open(url, '_blank');
    }

    addTag(tag) {
      tag = tag.trim();
      if (tag && !this.tags.includes(tag)) {
        this.tags.push(tag);
        this.renderContent();
      }
    }

    removeTag(tag) {
      this.tags = this.tags.filter(t => t !== tag);
      this.renderContent();
    }

    escapeHTML(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  }

  // Initialize
  window.__shopoptiOverlay = new AdvancedImportOverlay();
})();
