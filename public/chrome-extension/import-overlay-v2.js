/**
 * ShopOpti+ - Advanced Import Overlay V2
 * Professional import assistant with AI optimization, variant selection, and image management
 * Version 5.6.0 - Synced with shopopti.io
 */

(function() {
  'use strict';

  if (window.__shopoptiImportOverlayV2Loaded) return;
  window.__shopoptiImportOverlayV2Loaded = true;

  const CONFIG = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    APP_URL: 'https://shopopti.io',
    VERSION: '5.6.0'
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
        removeWatermark: false
      };
      this.token = null;
      this.userPlan = 'starter';
      this.importRules = null;
      this.currentStep = 1;
      this.totalSteps = 4;
      this.categories = [];
      
      this.init();
    }

    async init() {
      await this.loadUserData();
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
            'defaultSettings'
          ], (result) => {
            this.token = result.extensionToken;
            this.stores = result.userStores || [];
            this.userPlan = result.userPlan || 'starter';
            this.selectedStore = result.defaultStore || null;
            this.importRules = result.importRules || this.getDefaultRules();
            this.categories = result.categories || [];
            resolve();
          });
        } else {
          resolve();
        }
      });
    }

    getDefaultRules() {
      return {
        pricing: {
          enabled: true,
          markupType: 'percentage',
          markupValue: 30,
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
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
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
          background: linear-gradient(180deg, #1e1e2e 0%, #181825 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          width: 95%;
          max-width: 700px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 25px 80px -12px rgba(0, 0, 0, 0.8), 
                      0 0 0 1px rgba(255, 255, 255, 0.05);
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
          padding: 2px 6px;
          background: rgba(255,255,255,0.2);
          border-radius: 4px;
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
          background: rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .sho-v2-step {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 0.4;
          transition: opacity 0.3s;
        }

        .sho-v2-step.active, .sho-v2-step.completed {
          opacity: 1;
        }

        .sho-v2-step-number {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: white;
          transition: all 0.3s;
        }

        .sho-v2-step.active .sho-v2-step-number {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
        }

        .sho-v2-step.completed .sho-v2-step-number {
          background: #10b981;
        }

        .sho-v2-step-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }

        .sho-v2-step-connector {
          flex: 1;
          height: 2px;
          background: rgba(255, 255, 255, 0.1);
          margin: 0 8px;
        }

        .sho-v2-step.completed + .sho-v2-step-connector,
        .sho-v2-step-connector.completed {
          background: linear-gradient(90deg, #10b981, rgba(16, 185, 129, 0.3));
        }

        /* Body */
        .sho-v2-body {
          padding: 24px;
          overflow-y: auto;
          max-height: calc(90vh - 220px);
        }

        .sho-v2-body::-webkit-scrollbar {
          width: 6px;
        }

        .sho-v2-body::-webkit-scrollbar-track {
          background: transparent;
        }

        .sho-v2-body::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        /* Product Preview Card */
        .sho-v2-product-card {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          margin-bottom: 24px;
        }

        .sho-v2-product-image {
          width: 120px;
          height: 120px;
          border-radius: 12px;
          object-fit: cover;
          background: rgba(255, 255, 255, 0.05);
          flex-shrink: 0;
        }

        .sho-v2-product-info {
          flex: 1;
          min-width: 0;
        }

        .sho-v2-product-title {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .sho-v2-product-price {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 8px;
        }

        .sho-v2-price-current {
          color: #10b981;
          font-size: 24px;
          font-weight: 700;
        }

        .sho-v2-price-original {
          color: rgba(255, 255, 255, 0.4);
          font-size: 14px;
          text-decoration: line-through;
        }

        .sho-v2-price-discount {
          background: #ef4444;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
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
          padding: 4px 10px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 6px;
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

        /* Section Styling */
        .sho-v2-section {
          margin-bottom: 24px;
        }

        .sho-v2-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .sho-v2-section-title {
          color: rgba(255, 255, 255, 0.9);
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
        }

        .sho-v2-section-action:hover {
          color: #a78bfa;
        }

        /* Image Grid */
        .sho-v2-image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 8px;
        }

        .sho-v2-image-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 10px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
        }

        .sho-v2-image-item:hover {
          transform: scale(1.05);
        }

        .sho-v2-image-item.selected {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3);
        }

        .sho-v2-image-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .sho-v2-image-check {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          background: #8b5cf6;
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

        /* Variant Grid */
        .sho-v2-variant-grid {
          display: grid;
          gap: 8px;
        }

        .sho-v2-variant-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sho-v2-variant-item:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .sho-v2-variant-item.selected {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.1);
        }

        .sho-v2-variant-item.unavailable {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .sho-v2-variant-checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .sho-v2-variant-item.selected .sho-v2-variant-checkbox {
          background: #8b5cf6;
          border-color: #8b5cf6;
        }

        .sho-v2-variant-details {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sho-v2-variant-name {
          color: white;
          font-size: 14px;
          font-weight: 500;
        }

        .sho-v2-variant-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sho-v2-variant-price {
          color: #10b981;
          font-weight: 600;
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

        /* AI Features Toggle */
        .sho-v2-ai-features {
          display: grid;
          gap: 8px;
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
          background: rgba(139, 92, 246, 0.1);
        }

        .sho-v2-feature-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sho-v2-feature-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .sho-v2-feature-text h4 {
          color: white;
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 2px 0;
        }

        .sho-v2-feature-text p {
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
          margin: 0;
        }

        .sho-v2-feature-switch {
          width: 44px;
          height: 24px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          position: relative;
          transition: all 0.2s;
        }

        .sho-v2-feature-switch::after {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .sho-v2-feature-toggle.active .sho-v2-feature-switch {
          background: #8b5cf6;
        }

        .sho-v2-feature-toggle.active .sho-v2-feature-switch::after {
          left: 23px;
        }

        .sho-v2-pro-badge {
          background: linear-gradient(135deg, #f59e0b, #ef4444);
          color: white;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 5px;
          border-radius: 3px;
          margin-left: 6px;
        }

        /* Store & Settings */
        .sho-v2-store-grid {
          display: grid;
          gap: 8px;
        }

        .sho-v2-store-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid transparent;
          border-radius: 12px;
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
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .sho-v2-store-info h4 {
          color: white;
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 2px 0;
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
          padding: 3px 8px;
          border-radius: 4px;
        }

        /* Pricing Preview */
        .sho-v2-pricing-card {
          padding: 16px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(99, 102, 241, 0.1));
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 12px;
        }

        .sho-v2-pricing-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .sho-v2-pricing-row:last-child {
          border-bottom: none;
          padding-top: 12px;
          margin-top: 4px;
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
          font-size: 18px;
          font-weight: 700;
        }

        .sho-v2-pricing-value.profit {
          color: #10b981;
        }

        /* Footer */
        .sho-v2-footer {
          display: flex;
          gap: 12px;
          padding: 16px 24px;
          background: rgba(0, 0, 0, 0.3);
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
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
        }

        .sho-v2-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
        }

        .sho-v2-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
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
          padding: 40px 20px;
        }

        .sho-v2-success-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          animation: successPop 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes successPop {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        .sho-v2-success h2 {
          color: white;
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .sho-v2-success p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          margin: 0 0 24px 0;
        }

        .sho-v2-success-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        /* Category Search */
        .sho-v2-category-search {
          position: relative;
        }

        .sho-v2-category-input {
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

        .sho-v2-category-input:focus {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.1);
        }

        .sho-v2-category-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .sho-v2-category-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          max-height: 200px;
          overflow-y: auto;
          background: #1e1e2e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          margin-top: 4px;
          z-index: 10;
          display: none;
        }

        .sho-v2-category-suggestions.open {
          display: block;
        }

        .sho-v2-category-option {
          padding: 10px 16px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .sho-v2-category-option:hover {
          background: rgba(139, 92, 246, 0.2);
          color: white;
        }

        /* Tags Input */
        .sho-v2-tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          min-height: 44px;
        }

        .sho-v2-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
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
          min-width: 100px;
          background: transparent;
          border: none;
          color: white;
          font-size: 13px;
          outline: none;
        }

        .sho-v2-tag-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Status Toggle */
        .sho-v2-status-toggle {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 4px;
        }

        .sho-v2-status-btn {
          flex: 1;
          padding: 10px 16px;
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
          background: rgba(139, 92, 246, 0.3);
          color: white;
        }

        /* Empty State */
        .sho-v2-empty {
          text-align: center;
          padding: 40px 20px;
          color: rgba(255, 255, 255, 0.5);
        }

        .sho-v2-empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
          opacity: 0.5;
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
              <span>ShopOpti+ Import</span>
              <span class="sho-v2-version">v${CONFIG.VERSION}</span>
            </div>
            <button class="sho-v2-close" data-action="close">×</button>
          </div>
          
          <div class="sho-v2-steps" id="sho-steps">
            <!-- Steps rendered dynamically -->
          </div>
          
          <div class="sho-v2-body" id="sho-body">
            <!-- Content rendered dynamically -->
          </div>
          
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
      // Delegate events to overlay
      this.overlay.addEventListener('click', (e) => {
        const target = e.target;
        const action = target.closest('[data-action]')?.dataset.action;
        
        if (target === this.overlay) this.close();
        if (action === 'close') this.close();
        if (action === 'back') this.previousStep();
        if (action === 'next') this.nextStep();
        
        // Image selection
        const imageItem = target.closest('.sho-v2-image-item');
        if (imageItem) this.toggleImage(imageItem.dataset.index);
        
        // Variant selection
        const variantItem = target.closest('.sho-v2-variant-item');
        if (variantItem && !variantItem.classList.contains('unavailable')) {
          this.toggleVariant(variantItem.dataset.id);
        }
        
        // Feature toggle
        const featureToggle = target.closest('.sho-v2-feature-toggle');
        if (featureToggle) this.toggleFeature(featureToggle.dataset.feature);
        
        // Store selection
        const storeOption = target.closest('.sho-v2-store-option');
        if (storeOption) this.selectStore(storeOption.dataset.id);
        
        // Status selection
        const statusBtn = target.closest('.sho-v2-status-btn');
        if (statusBtn) this.selectStatus(statusBtn.dataset.status);
      });

      // ESC key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) this.close();
      });

      // Message listener
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

    open(productData) {
      this.productData = productData;
      this.currentStep = 1;
      
      // Initialize selections
      this.selectedImages = new Set(
        (productData.images || []).map((_, i) => i.toString())
      );
      this.selectedVariants = new Set(
        (productData.variants || []).filter(v => v.available !== false && v.stock !== 0).map(v => v.id || v.name)
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
        { num: 1, label: 'Produit' },
        { num: 2, label: 'Images & Variantes' },
        { num: 3, label: 'Optimisation' },
        { num: 4, label: 'Destination' }
      ];

      stepsContainer.innerHTML = steps.map((step, i) => `
        <div class="sho-v2-step ${step.num < this.currentStep ? 'completed' : ''} ${step.num === this.currentStep ? 'active' : ''}">
          <div class="sho-v2-step-number">${step.num < this.currentStep ? '✓' : step.num}</div>
          <span class="sho-v2-step-label">${step.label}</span>
        </div>
        ${i < steps.length - 1 ? `<div class="sho-v2-step-connector ${step.num < this.currentStep ? 'completed' : ''}"></div>` : ''}
      `).join('');
    }

    renderContent() {
      const body = this.overlay.querySelector('#sho-body');
      const footer = this.overlay.querySelector('#sho-footer');
      
      footer.style.display = 'flex';

      if (!this.token) {
        body.innerHTML = this.getNotConnectedHTML();
        footer.style.display = 'none';
        return;
      }

      switch (this.currentStep) {
        case 1:
          body.innerHTML = this.getStep1HTML();
          break;
        case 2:
          body.innerHTML = this.getStep2HTML();
          break;
        case 3:
          body.innerHTML = this.getStep3HTML();
          break;
        case 4:
          body.innerHTML = this.getStep4HTML();
          break;
      }

      this.updateFooterButtons();
    }

    getNotConnectedHTML() {
      return `
        <div class="sho-v2-empty">
          <div class="sho-v2-empty-icon">🔐</div>
          <p>Connectez-vous à ShopOpti+ pour importer des produits</p>
          <br>
          <a href="${CONFIG.APP_URL}/extensions/chrome" target="_blank" class="sho-v2-btn sho-v2-btn-primary" style="display:inline-flex;width:auto">
            Obtenir ma clé d'extension →
          </a>
        </div>
      `;
    }

    getStep1HTML() {
      const p = this.productData || {};
      const price = parseFloat(p.price) || 0;
      const originalPrice = parseFloat(p.originalPrice) || 0;
      const discount = originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0;
      
      return `
        <div class="sho-v2-product-card">
          <img src="${p.images?.[0] || ''}" class="sho-v2-product-image" alt="">
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
              ${p.variants?.length > 1 ? `<span class="sho-v2-badge">🎨 ${p.variants.length} variantes</span>` : ''}
              ${p.reviews?.count ? `<span class="sho-v2-badge">⭐ ${p.reviews.average} (${p.reviews.count})</span>` : ''}
              <span class="sho-v2-badge">${p.platform || 'Web'}</span>
            </div>
          </div>
        </div>
        
        <div class="sho-v2-section">
          <div class="sho-v2-section-header">
            <div class="sho-v2-section-title">📋 Résumé de l'extraction</div>
          </div>
          <div class="sho-v2-pricing-card">
            <div class="sho-v2-pricing-row">
              <span class="sho-v2-pricing-label">Titre</span>
              <span class="sho-v2-pricing-value">${p.title?.substring(0, 40)}...</span>
            </div>
            <div class="sho-v2-pricing-row">
              <span class="sho-v2-pricing-label">Prix fournisseur</span>
              <span class="sho-v2-pricing-value">${price.toFixed(2)} ${p.currency || '€'}</span>
            </div>
            <div class="sho-v2-pricing-row">
              <span class="sho-v2-pricing-label">Livraison</span>
              <span class="sho-v2-pricing-value">${p.shipping?.free ? '✅ Gratuite' : p.shipping?.cost ? p.shipping.cost + ' €' : 'À vérifier'}</span>
            </div>
            <div class="sho-v2-pricing-row">
              <span class="sho-v2-pricing-label">Délai estimé</span>
              <span class="sho-v2-pricing-value">${p.shipping?.deliveryDays ? `${p.shipping.deliveryDays.min}-${p.shipping.deliveryDays.max} jours` : 'Non disponible'}</span>
            </div>
          </div>
        </div>
      `;
    }

    getStep2HTML() {
      const p = this.productData || {};
      const images = p.images || [];
      const variants = p.variants || [];
      
      return `
        <div class="sho-v2-section">
          <div class="sho-v2-section-header">
            <div class="sho-v2-section-title">📷 Images (${this.selectedImages.size}/${images.length})</div>
            <span class="sho-v2-section-action" data-action="select-all-images">Tout sélectionner</span>
          </div>
          <div class="sho-v2-image-grid">
            ${images.map((img, i) => `
              <div class="sho-v2-image-item ${this.selectedImages.has(i.toString()) ? 'selected' : ''}" data-index="${i}">
                <img src="${img}" alt="">
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
              ${variants.map(v => {
                const variantId = v.id || v.name;
                const stockClass = v.stock === 0 ? 'out' : v.stock < 10 ? 'low' : '';
                const isAvailable = v.available !== false && v.stock !== 0;
                
                return `
                  <div class="sho-v2-variant-item ${this.selectedVariants.has(variantId) ? 'selected' : ''} ${!isAvailable ? 'unavailable' : ''}" data-id="${variantId}">
                    <div class="sho-v2-variant-checkbox">${this.selectedVariants.has(variantId) ? '✓' : ''}</div>
                    <div class="sho-v2-variant-details">
                      <span class="sho-v2-variant-name">${this.escapeHTML(v.name || v.color || v.size || 'Variante')}</span>
                      <div class="sho-v2-variant-meta">
                        <span class="sho-v2-variant-price">${parseFloat(v.price).toFixed(2)} €</span>
                        <span class="sho-v2-variant-stock ${stockClass}">
                          ${v.stock === 0 ? '❌ Rupture' : v.stock ? `${v.stock} en stock` : ''}
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
                  <p>Réécriture du titre et description pour le SEO</p>
                </div>
              </div>
              <div class="sho-v2-feature-switch"></div>
            </div>
            
            <div class="sho-v2-feature-toggle ${this.enabledFeatures.translateReviews ? 'active' : ''}" data-feature="translateReviews">
              <div class="sho-v2-feature-info">
                <div class="sho-v2-feature-icon">🌍</div>
                <div class="sho-v2-feature-text">
                  <h4>Traduction des avis${!isPro ? '<span class="sho-v2-pro-badge">PRO</span>' : ''}</h4>
                  <p>Traduire automatiquement les avis clients</p>
                </div>
              </div>
              <div class="sho-v2-feature-switch"></div>
            </div>
            
            <div class="sho-v2-feature-toggle ${this.enabledFeatures.removeWatermark ? 'active' : ''}" data-feature="removeWatermark">
              <div class="sho-v2-feature-info">
                <div class="sho-v2-feature-icon">🖼️</div>
                <div class="sho-v2-feature-text">
                  <h4>Suppression watermarks${!isPro ? '<span class="sho-v2-pro-badge">PRO</span>' : ''}</h4>
                  <p>Nettoyer les filigranes des images</p>
                </div>
              </div>
              <div class="sho-v2-feature-switch"></div>
            </div>
          </div>
        </div>
        
        <div class="sho-v2-section">
          <div class="sho-v2-section-header">
            <div class="sho-v2-section-title">🏷️ Catégorie & Tags</div>
          </div>
          <div class="sho-v2-category-search">
            <input type="text" class="sho-v2-category-input" placeholder="Rechercher une catégorie..." id="category-input">
            <div class="sho-v2-category-suggestions" id="category-suggestions"></div>
          </div>
          <div class="sho-v2-tags-container" style="margin-top:12px" id="tags-container">
            ${(this.importRules?.defaultTags || []).map(tag => `
              <span class="sho-v2-tag">
                ${this.escapeHTML(tag)}
                <span class="sho-v2-tag-remove" data-tag="${this.escapeHTML(tag)}">×</span>
              </span>
            `).join('')}
            <input type="text" class="sho-v2-tag-input" placeholder="Ajouter un tag..." id="tag-input">
          </div>
        </div>
      `;
    }

    getStep4HTML() {
      const p = this.productData || {};
      const rules = this.importRules || this.getDefaultRules();
      const costPrice = parseFloat(p.price) || 0;
      const markup = rules.pricing?.markupValue || 30;
      const salePrice = costPrice * (1 + markup / 100);
      const profit = salePrice - costPrice;
      const margin = costPrice > 0 ? (profit / salePrice * 100) : 0;
      
      return `
        <div class="sho-v2-section">
          <div class="sho-v2-section-header">
            <div class="sho-v2-section-title">🏪 Boutique de destination</div>
          </div>
          ${this.stores.length === 0 ? `
            <div class="sho-v2-empty">
              <p>Aucune boutique connectée</p>
              <a href="${CONFIG.APP_URL}/stores" target="_blank" class="sho-v2-btn sho-v2-btn-secondary" style="display:inline-flex;width:auto;margin-top:12px">
                Connecter une boutique →
              </a>
            </div>
          ` : `
            <div class="sho-v2-store-grid">
              ${this.stores.map(store => `
                <div class="sho-v2-store-option ${this.selectedStore === store.id ? 'selected' : ''}" data-id="${store.id}">
                  <div class="sho-v2-store-icon">${store.platform === 'shopify' ? '🛍️' : '🏪'}</div>
                  <div class="sho-v2-store-info">
                    <h4>${this.escapeHTML(store.name || 'Ma boutique')}</h4>
                    <p>${this.escapeHTML(store.domain || store.platform)}</p>
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
              ✅ Publier
            </button>
          </div>
        </div>
        
        <div class="sho-v2-section">
          <div class="sho-v2-section-header">
            <div class="sho-v2-section-title">💰 Calcul de prix</div>
          </div>
          <div class="sho-v2-pricing-card">
            <div class="sho-v2-pricing-row">
              <span class="sho-v2-pricing-label">Prix d'achat</span>
              <span class="sho-v2-pricing-value">${costPrice.toFixed(2)} €</span>
            </div>
            <div class="sho-v2-pricing-row">
              <span class="sho-v2-pricing-label">Marge (+${markup}%)</span>
              <span class="sho-v2-pricing-value profit">+${profit.toFixed(2)} €</span>
            </div>
            <div class="sho-v2-pricing-row">
              <span class="sho-v2-pricing-label">Prix de vente</span>
              <span class="sho-v2-pricing-value highlight">${salePrice.toFixed(2)} €</span>
            </div>
            <div class="sho-v2-pricing-row">
              <span class="sho-v2-pricing-label">Marge nette</span>
              <span class="sho-v2-pricing-value profit">${margin.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      `;
    }

    updateFooterButtons() {
      const backBtn = this.overlay.querySelector('[data-action="back"]');
      const nextBtn = this.overlay.querySelector('[data-action="next"]');
      const nextText = nextBtn.querySelector('.sho-v2-btn-text');
      
      backBtn.style.display = this.currentStep === 1 ? 'none' : 'flex';
      
      if (this.currentStep === this.totalSteps) {
        nextText.textContent = '🚀 Importer maintenant';
      } else {
        nextText.textContent = 'Suivant →';
      }
    }

    previousStep() {
      if (this.currentStep > 1) {
        this.currentStep--;
        this.renderSteps();
        this.renderContent();
      }
    }

    nextStep() {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        this.renderSteps();
        this.renderContent();
      } else {
        this.executeImport();
      }
    }

    toggleImage(index) {
      if (this.selectedImages.has(index)) {
        this.selectedImages.delete(index);
      } else {
        this.selectedImages.add(index);
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

    toggleFeature(feature) {
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

    escapeHTML(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    async executeImport() {
      const nextBtn = this.overlay.querySelector('[data-action="next"]');
      const btnText = nextBtn.querySelector('.sho-v2-btn-text');
      const btnIcon = nextBtn.querySelector('.sho-v2-btn-icon');
      
      nextBtn.classList.add('loading');
      nextBtn.disabled = true;
      btnText.style.display = 'none';
      btnIcon.style.display = 'inline';

      try {
        const enrichedProduct = this.buildImportPayload();
        const response = await this.sendImportRequest(enrichedProduct);

        if (response.success) {
          this.showSuccess(response);
        } else {
          this.showError(response.error || 'Erreur lors de l\'import');
        }
      } catch (error) {
        console.error('[ShopOpti+] Import error:', error);
        this.showError(error.message);
      } finally {
        nextBtn.classList.remove('loading');
        nextBtn.disabled = false;
        btnText.style.display = 'inline';
        btnIcon.style.display = 'none';
      }
    }

    buildImportPayload() {
      const p = this.productData;
      const rules = this.importRules || this.getDefaultRules();
      
      // Filter images
      const selectedImages = p.images?.filter((_, i) => this.selectedImages.has(i.toString())) || [];
      
      // Filter variants
      const selectedVariants = p.variants?.filter(v => 
        this.selectedVariants.has(v.id || v.name)
      ) || [];
      
      // Apply pricing
      const costPrice = parseFloat(p.price) || 0;
      const markup = rules.pricing?.markupValue || 30;
      let salePrice = rules.pricing?.markupType === 'percentage' 
        ? costPrice * (1 + markup / 100)
        : costPrice + markup;
      
      if (rules.pricing?.roundToNearest) {
        salePrice = Math.ceil(salePrice) - (1 - rules.pricing.roundToNearest);
      }

      return {
        ...p,
        images: selectedImages,
        variants: selectedVariants,
        costPrice,
        salePrice: Math.round(salePrice * 100) / 100,
        status: this.selectedStatus,
        targetStore: this.selectedStore,
        aiOptimization: this.enabledFeatures.aiOptimization,
        translateReviews: this.enabledFeatures.translateReviews,
        removeWatermark: this.enabledFeatures.removeWatermark,
        metadata: {
          importedAt: new Date().toISOString(),
          extensionVersion: CONFIG.VERSION,
          selectedImagesCount: selectedImages.length,
          selectedVariantsCount: selectedVariants.length
        }
      };
    }

    async sendImportRequest(product) {
      const response = await fetch(`${CONFIG.API_URL}/extension-sync-realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': this.token
        },
        body: JSON.stringify({
          action: 'import_products',
          products: [product],
          options: {
            targetStore: this.selectedStore,
            status: this.selectedStatus,
            applyRules: true,
            aiOptimize: this.enabledFeatures.aiOptimization
          }
        })
      });

      return await response.json();
    }

    showSuccess(response) {
      const body = this.overlay.querySelector('#sho-body');
      const footer = this.overlay.querySelector('#sho-footer');

      body.innerHTML = `
        <div class="sho-v2-success">
          <div class="sho-v2-success-icon">✅</div>
          <h2>Import réussi!</h2>
          <p>Votre produit a été importé avec succès dans ShopOpti+</p>
          <div class="sho-v2-success-actions">
            <a href="${CONFIG.APP_URL}/products" target="_blank" class="sho-v2-btn sho-v2-btn-secondary">
              Voir mes produits
            </a>
            <button class="sho-v2-btn sho-v2-btn-primary" data-action="close">
              Fermer
            </button>
          </div>
        </div>
      `;

      footer.style.display = 'none';
      this.saveToHistory(this.productData);
    }

    showError(message) {
      alert(`❌ Erreur: ${message}`);
    }

    saveToHistory(product) {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['importHistory'], (result) => {
          const history = result.importHistory || [];
          history.unshift({
            title: product.title,
            image: product.images?.[0],
            platform: product.platform,
            timestamp: new Date().toISOString(),
            success: true
          });
          chrome.storage.local.set({ importHistory: history.slice(0, 50) });
        });
      }
    }
  }

  // Initialize
  window.ShopoptiAdvancedImportOverlay = new AdvancedImportOverlay();

})();
