// ShopOpti+ - Reviews Extractor v4.3.16
// Professional multi-platform review extraction with auto-scroll, filtering, and AI translation support

(function() {
  'use strict';

  if (window.__shopOptiReviewsLoaded) return;
  window.__shopOptiReviewsLoaded = true;

  const CONFIG = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    MAX_REVIEWS: 200,
    SCROLL_DELAY_MS: 600,
    MAX_SCROLL_ATTEMPTS: 15,
    LOAD_MORE_DELAY: 800,
    VERSION: '4.3.9',
    PLATFORMS: {
      'aliexpress': {
        reviewsContainer: '.feedback-list, .product-evaluation, [class*="review"], .comet-v2-modal-body, .feedback--wrap--bDEEKp5, [class*="feedback-list"], .feedback--list--dJsbH8z',
        reviewItem: '.feedback-item, .buyer-feedback, [data-pl="feedback-item"], .feedback--list--dJsbH8z .feedback--item--dj2j9tN, [class*="feedback-item"], .feedback--item, .review-item',
        author: '.user-name, .buyer-name, .feedback-author, .feedback--userName--QsU0Wf0, [class*="user-name"], [class*="userName"]',
        rating: '.star-view, .star-score, [class*="rating"], .feedback--stars--t9_W6T4, [class*="stars"], .stars',
        content: '.buyer-feedback, .feedback-content, .review-content, .feedback--content--UWfgMTD, [class*="feedback-content"], [class*="review-text"]',
        date: '.feedback-time, .review-date, .feedback--time--c_Tn30j, [class*="feedback-time"], [class*="date"]',
        images: '.feedback-images img, .review-images img, .feedback--photos--K3Gn6C1 img, [class*="feedback-photo"] img, [class*="review-image"] img',
        videos: '.feedback-video video, [class*="video"] video',
        verified: '.buyer-verified, .verified-purchase, [class*="verified"]',
        helpful: '.feedback-helpful, [class*="helpful"]',
        country: '.feedback-country, [class*="country"], .user-country',
        loadMore: '.next-btn, .comet-btn, [class*="load-more"], [class*="view-more"]',
        scrollTarget: '.feedback-list, [class*="feedback"], [class*="review"]'
      },
      'amazon': {
        reviewsContainer: '#cm_cr-review_list, #reviewsMedley, .reviews-content, #customer-reviews, [data-hook="reviews-medley"]',
        reviewItem: '[data-hook="review"], .review, .a-section.review, .review-views .review',
        author: '.a-profile-name, [data-hook="genome-widget"] span, .review-byline a',
        rating: '.review-rating span, [data-hook="review-star-rating"] span, .a-icon-star span, [class*="star-rating"]',
        content: '[data-hook="review-body"] span, .review-text span, .review-text-content span, .reviewText',
        title: '[data-hook="review-title"] span, .review-title span',
        date: '[data-hook="review-date"], .review-date, .review-date-submissionDate',
        images: '.review-image-tile img, .review-image img, [data-hook="review-image-tile"] img, .cr-lightbox-image-thumbnail img',
        videos: '.review-video video, [data-hook="review-video"] video',
        verified: '.avp-badge, [data-hook="avp-badge"], .a-size-mini:contains("Verified"), [class*="verified"]',
        helpful: '[data-hook="helpful-vote-statement"], .helpful-votes',
        country: '.a-profile-descriptor, [data-hook="review-date"]',
        loadMore: '#cm-cr-see-all-link, [data-hook="see-all-reviews-link"], .a-pagination-next a',
        scrollTarget: '#cm_cr-review_list, #reviewsMedley'
      },
      'ebay': {
        reviewsContainer: '.reviews-content, .product-reviews, #rwid, [class*="review-list"], .rvw-l',
        reviewItem: '.review-item, .ebay-review-section, .rvw-card, [class*="review-item"], .rvw',
        author: '.review-item-author, .reviewer-name, .rvw-card__author, [class*="author"], .rvw__auth',
        rating: '.star-rating, .review-stars, .rvw-card__rating, [class*="star"], .rvw__rat',
        content: '.review-item-content, .rvw-card__body, [class*="review-text"], [class*="content"], .rvw__txt',
        date: '.review-item-date, .rvw-card__date, [class*="date"], .rvw__date',
        images: '.review-images img, .rvw-card__image img, .rvw__img img',
        verified: '.verified-purchase, [class*="verified"]',
        loadMore: '.pagination__next, [class*="load-more"]',
        scrollTarget: '.reviews-content, #rwid'
      },
      'temu': {
        reviewsContainer: '[class*="reviews"], [class*="comment"], [class*="ReviewList"], [class*="feedback"]',
        reviewItem: '[class*="review-item"], [class*="comment-item"], [class*="ReviewItem"], [class*="feedback-item"]',
        author: '[class*="user-name"], [class*="userName"], [class*="nickname"], [class*="author"]',
        rating: '[class*="star"], [class*="rating"], [class*="Stars"]',
        content: '[class*="review-content"], [class*="comment-content"], [class*="Content"], [class*="text"]',
        date: '[class*="date"], [class*="time"], [class*="Date"]',
        images: '[class*="review"] img, [class*="ReviewImage"] img, [class*="photo"] img',
        videos: '[class*="video"] video',
        verified: '[class*="verified"]',
        country: '[class*="country"], [class*="location"]',
        loadMore: '[class*="load-more"], [class*="view-more"], button[class*="more"]',
        scrollTarget: '[class*="reviews"], [class*="comment"]'
      },
      'walmart': {
        reviewsContainer: '[data-testid="reviews-list"], .reviews-list, #reviews-list, [class*="review-list"]',
        reviewItem: '[data-testid="review-card"], .review-card, [class*="review-item"], .review',
        author: '[data-testid="reviewer-name"], .reviewer-name, [class*="author"]',
        rating: '[data-testid="star-rating"], .star-rating, [class*="rating"], [class*="stars"]',
        content: '[data-testid="review-text"], .review-text, [class*="content"], .review-body',
        date: '[data-testid="review-date"], .review-date, [class*="date"]',
        images: '[data-testid="review-image"] img, .review-image img',
        verified: '[data-testid="verified-purchase"], [class*="verified"]',
        helpful: '[data-testid="helpful-count"]',
        loadMore: '[data-testid="load-more"], .load-more-btn',
        scrollTarget: '[data-testid="reviews-list"], .reviews-list'
      },
      'etsy': {
        reviewsContainer: '.reviews-list, [data-region="reviews"], [class*="reviews"], .wt-grid__item-xs-12',
        reviewItem: '.review-item, [data-region="review"], [class*="review-item"], .wt-display-flex-xs',
        author: '.shop2-review-attribution a, .reviewer-name, [class*="author"]',
        rating: '.stars-svg, .review-stars, [class*="star"], input[name="rating"]',
        content: '.prose, .review-text, [class*="content"], .wt-text-body-01',
        date: '.review-date, [data-date], [class*="date"]',
        images: '.listing-page-image img, .review-image img, .wt-max-width-full',
        verified: '.verified-buyer, [class*="verified"]',
        loadMore: '.wt-btn--small, [data-load-more]',
        scrollTarget: '.reviews-list, [data-region="reviews"]'
      },
      'shein': {
        reviewsContainer: '[class*="reviews"], [class*="comment"], .goods-review, .j-expose__common-reviews',
        reviewItem: '[class*="review-item"], [class*="comment-item"], .review-item, .j-expose__review-item',
        author: '[class*="user-name"], [class*="nickname"], .review-user-name',
        rating: '[class*="star"], [class*="rating"], .rate-star',
        content: '[class*="review-content"], [class*="text"], .review-content',
        date: '[class*="date"], [class*="time"], .review-time',
        images: '[class*="review"] img, [class*="photo"] img, .review-img',
        verified: '[class*="verified"]',
        country: '[class*="country"], .review-country',
        loadMore: '[class*="load-more"], .view-more-btn',
        scrollTarget: '[class*="reviews"]'
      },
      'cdiscount': {
        reviewsContainer: '.reviews, #product-reviews, [class*="review"], .avis-list',
        reviewItem: '.review, [class*="review-item"], .avis, .avis-item',
        author: '.author, [class*="author"], .reviewer, .avis-author',
        rating: '.rating, [class*="star"], .note, .avis-rating',
        content: '.review-text, [class*="content"], .comment, .avis-text',
        date: '.date, [class*="date"], .avis-date',
        images: '.review img, .avis-img img',
        verified: '.verified, [class*="verified"], .achat-verifie',
        loadMore: '.voir-plus, [class*="load-more"]',
        scrollTarget: '.reviews, #product-reviews'
      },
      'shopify': {
        reviewsContainer: '.spr-reviews, .jdgm-rev__container, [class*="reviews"], .reviews-container, #shopify-product-reviews',
        reviewItem: '.spr-review, .jdgm-rev, [class*="review-item"], .review',
        author: '.spr-review-header-byline-author, .jdgm-rev__author, [class*="author"]',
        rating: '.spr-starrating, .jdgm-rev__rating, [class*="star"], [class*="rating"]',
        content: '.spr-review-content-body, .jdgm-rev__body, [class*="content"], .review-body',
        date: '.spr-review-header-byline-date, .jdgm-rev__timestamp, [class*="date"]',
        images: '.spr-review-image img, .jdgm-rev__media img',
        verified: '.spr-badge-verified, .jdgm-verified, [class*="verified"]',
        loadMore: '.spr-pagination-next, .jdgm-paginate__next, [class*="load-more"]',
        scrollTarget: '.spr-reviews, .jdgm-rev__container'
      }
    }
  };

  class ShopOptiReviewsExtractor {
    constructor() {
      this.platform = null;
      this.selectors = null;
      this.extractedReviews = [];
      this.selectedReviews = new Set();
      this.isExtracting = false;
      this.scrollAttempts = 0;
      this.lastReviewCount = 0;
      
      this.detectPlatform();
      if (this.platform) {
        this.injectUI();
        this.bindEvents();
        console.log(`[ShopOpti+] Reviews Extractor v${CONFIG.VERSION} initialized for ${this.platform}`);
      }
    }

    detectPlatform() {
      const hostname = window.location.hostname.toLowerCase();
      
      for (const [key, config] of Object.entries(CONFIG.PLATFORMS)) {
        if (hostname.includes(key)) {
          this.platform = key;
          this.selectors = config;
          return;
        }
      }

      // Check for Shopify stores
      if (window.Shopify || document.querySelector('[data-shopify]') || hostname.includes('myshopify')) {
        this.platform = 'shopify';
        this.selectors = CONFIG.PLATFORMS.shopify;
      }
    }

    injectUI() {
      // Remove existing UI
      document.getElementById('shopopti-reviews-styles')?.remove();
      document.getElementById('shopopti-reviews-panel')?.remove();

      const style = document.createElement('style');
      style.id = 'shopopti-reviews-styles';
      style.textContent = `
        .shopopti-reviews-panel {
          position: fixed;
          top: 80px;
          right: 20px;
          width: 400px;
          max-height: calc(100vh - 120px);
          background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.1);
          z-index: 2147483646;
          display: none;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .shopopti-reviews-panel.active {
          display: flex;
          flex-direction: column;
          animation: shopoptiSlideIn 0.3s ease-out;
        }

        @keyframes shopoptiSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .shopopti-reviews-header {
          padding: 16px 20px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.15));
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .shopopti-reviews-title {
          color: white;
          font-size: 15px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .shopopti-reviews-title img {
          width: 24px;
          height: 24px;
          border-radius: 6px;
        }

        .shopopti-reviews-badge {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 600;
        }
        
        .shopopti-reviews-close {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 16px;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .shopopti-reviews-close:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        
        .shopopti-reviews-filters {
          padding: 14px 20px;
          background: rgba(0, 0, 0, 0.3);
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        
        .shopopti-reviews-filter {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.05);
          padding: 8px 12px;
          border-radius: 10px;
          color: #94a3b8;
          font-size: 11px;
          border: 1px solid transparent;
          transition: all 0.2s;
        }

        .shopopti-reviews-filter:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .shopopti-reviews-filter.active {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.5);
          color: #60a5fa;
        }
        
        .shopopti-reviews-filter input[type="checkbox"] {
          width: 14px;
          height: 14px;
          accent-color: #3b82f6;
          cursor: pointer;
        }

        .shopopti-reviews-filter select {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: white;
          padding: 4px 8px;
          font-size: 11px;
          cursor: pointer;
          max-width: 70px;
        }
        
        .shopopti-reviews-stats {
          padding: 14px 20px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .shopopti-reviews-stat {
          text-align: center;
          padding: 10px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          transition: all 0.2s;
        }

        .shopopti-reviews-stat:hover {
          background: rgba(255, 255, 255, 0.06);
        }
        
        .shopopti-reviews-stat-value {
          color: white;
          font-size: 20px;
          font-weight: 700;
          line-height: 1.2;
        }

        .shopopti-reviews-stat-value.positive { color: #10b981; }
        .shopopti-reviews-stat-value.warning { color: #f59e0b; }
        
        .shopopti-reviews-stat-label {
          color: #64748b;
          font-size: 10px;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .shopopti-reviews-progress {
          padding: 0 20px;
          display: none;
        }

        .shopopti-reviews-progress.active {
          display: block;
          padding: 14px 20px;
        }

        .shopopti-reviews-progress-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .shopopti-reviews-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          border-radius: 3px;
          transition: width 0.3s ease;
          width: 0%;
        }

        .shopopti-reviews-progress-text {
          color: #94a3b8;
          font-size: 11px;
          margin-top: 8px;
          text-align: center;
        }
        
        .shopopti-reviews-list {
          flex: 1;
          overflow-y: auto;
          max-height: 350px;
          padding: 14px 20px;
        }

        .shopopti-reviews-list::-webkit-scrollbar {
          width: 6px;
        }

        .shopopti-reviews-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .shopopti-reviews-list::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 3px;
        }
        
        .shopopti-review-item {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid transparent;
          position: relative;
        }
        
        .shopopti-review-item:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateX(2px);
        }
        
        .shopopti-review-item.selected {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }

        .shopopti-review-checkbox {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 22px;
          height: 22px;
          background: rgba(15, 23, 42, 0.9);
          border: 2px solid rgba(59, 130, 246, 0.4);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: transparent;
          font-size: 12px;
          transition: all 0.2s;
        }

        .shopopti-review-item.selected .shopopti-review-checkbox {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-color: transparent;
          color: white;
        }
        
        .shopopti-review-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          padding-right: 30px;
        }
        
        .shopopti-review-author {
          color: white;
          font-weight: 600;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .shopopti-review-country {
          font-size: 11px;
          color: #64748b;
        }
        
        .shopopti-review-rating {
          color: #fbbf24;
          font-size: 13px;
          display: flex;
          gap: 1px;
        }
        
        .shopopti-review-content {
          color: #cbd5e1;
          font-size: 12px;
          line-height: 1.6;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          margin-bottom: 10px;
        }

        .shopopti-review-images {
          display: flex;
          gap: 6px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }

        .shopopti-review-images img {
          width: 48px;
          height: 48px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .shopopti-review-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        
        .shopopti-review-badge {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 6px;
          font-weight: 500;
        }
        
        .shopopti-review-badge.verified {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
        }
        
        .shopopti-review-badge.photos {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
        }

        .shopopti-review-badge.helpful {
          background: rgba(168, 85, 247, 0.15);
          color: #c084fc;
        }
        
        .shopopti-reviews-actions {
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .shopopti-reviews-actions-row {
          grid-column: 1 / -1;
          display: flex;
          gap: 10px;
        }
        
        .shopopti-reviews-btn {
          flex: 1;
          padding: 12px 16px;
          border-radius: 10px;
          border: none;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .shopopti-reviews-btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
        }
        
        .shopopti-reviews-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
        }

        .shopopti-reviews-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .shopopti-reviews-btn-secondary {
          background: rgba(255, 255, 255, 0.08);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .shopopti-reviews-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(59, 130, 246, 0.3);
        }
        
        .shopopti-reviews-empty {
          text-align: center;
          padding: 50px 20px;
          color: #64748b;
        }

        .shopopti-reviews-empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .shopopti-reviews-empty-text {
          font-size: 14px;
          margin-bottom: 8px;
        }

        .shopopti-reviews-empty-hint {
          font-size: 12px;
          color: #475569;
        }

        .shopopti-reviews-options {
          padding: 10px 20px;
          background: rgba(0, 0, 0, 0.2);
          display: flex;
          gap: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .shopopti-reviews-option {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #94a3b8;
          font-size: 11px;
        }

        .shopopti-reviews-option input[type="checkbox"] {
          accent-color: #3b82f6;
        }

        .shopopti-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: shopoptiSpin 0.8s linear infinite;
        }

        @keyframes shopoptiSpin {
          to { transform: rotate(360deg); }
        }

        .shopopti-toast {
          position: fixed;
          bottom: 100px;
          right: 30px;
          background: linear-gradient(145deg, #1e293b, #0f172a);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 12px;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          z-index: 2147483647;
          animation: shopoptiToastIn 0.3s ease-out;
        }

        .shopopti-toast.success { border-color: rgba(16, 185, 129, 0.5); }
        .shopopti-toast.error { border-color: rgba(239, 68, 68, 0.5); }

        .shopopti-toast-icon { font-size: 18px; }
        .shopopti-toast-text { color: #e2e8f0; font-size: 13px; }

        @keyframes shopoptiToastIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);

      const panel = document.createElement('div');
      panel.className = 'shopopti-reviews-panel';
      panel.id = 'shopopti-reviews-panel';
      panel.innerHTML = `
        <div class="shopopti-reviews-header">
          <div class="shopopti-reviews-title">
            <span>⭐</span>
            <span>Import Avis</span>
            <span class="shopopti-reviews-badge">${this.platform.toUpperCase()}</span>
          </div>
          <button class="shopopti-reviews-close" id="shopopti-reviews-close">✕</button>
        </div>
        
        <div class="shopopti-reviews-filters">
          <div class="shopopti-reviews-filter">
            <span>Note:</span>
            <select id="shopopti-reviews-min-rating">
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4" selected>4+</option>
              <option value="5">5 ⭐</option>
            </select>
          </div>
          <div class="shopopti-reviews-filter" id="shopopti-filter-photos">
            <input type="checkbox" id="shopopti-reviews-photos-only">
            <label for="shopopti-reviews-photos-only">📷 Photos</label>
          </div>
          <div class="shopopti-reviews-filter" id="shopopti-filter-verified">
            <input type="checkbox" id="shopopti-reviews-verified-only">
            <label for="shopopti-reviews-verified-only">✓ Vérifiés</label>
          </div>
        </div>

        <div class="shopopti-reviews-options">
          <label class="shopopti-reviews-option">
            <input type="checkbox" id="shopopti-reviews-translate" checked>
            <span>🌐 Traduire en français</span>
          </label>
          <label class="shopopti-reviews-option">
            <input type="checkbox" id="shopopti-reviews-auto-scroll" checked>
            <span>📜 Auto-scroll</span>
          </label>
        </div>
        
        <div class="shopopti-reviews-stats">
          <div class="shopopti-reviews-stat">
            <div class="shopopti-reviews-stat-value" id="shopopti-reviews-total">0</div>
            <div class="shopopti-reviews-stat-label">Total</div>
          </div>
          <div class="shopopti-reviews-stat">
            <div class="shopopti-reviews-stat-value" id="shopopti-reviews-selected">0</div>
            <div class="shopopti-reviews-stat-label">Sélect.</div>
          </div>
          <div class="shopopti-reviews-stat">
            <div class="shopopti-reviews-stat-value" id="shopopti-reviews-avg">-</div>
            <div class="shopopti-reviews-stat-label">Moy.</div>
          </div>
          <div class="shopopti-reviews-stat">
            <div class="shopopti-reviews-stat-value" id="shopopti-reviews-photos">0</div>
            <div class="shopopti-reviews-stat-label">Photos</div>
          </div>
        </div>

        <div class="shopopti-reviews-progress" id="shopopti-reviews-progress">
          <div class="shopopti-reviews-progress-bar">
            <div class="shopopti-reviews-progress-fill" id="shopopti-reviews-progress-fill"></div>
          </div>
          <div class="shopopti-reviews-progress-text" id="shopopti-reviews-progress-text">Extraction en cours...</div>
        </div>
        
        <div class="shopopti-reviews-list" id="shopopti-reviews-list">
          <div class="shopopti-reviews-empty">
            <div class="shopopti-reviews-empty-icon">🔍</div>
            <div class="shopopti-reviews-empty-text">Prêt à extraire les avis</div>
            <div class="shopopti-reviews-empty-hint">Cliquez sur "Extraire" pour détecter les avis de cette page</div>
          </div>
        </div>
        
        <div class="shopopti-reviews-actions">
          <button class="shopopti-reviews-btn shopopti-reviews-btn-secondary" id="shopopti-reviews-extract">
            🔍 Extraire
          </button>
          <button class="shopopti-reviews-btn shopopti-reviews-btn-secondary" id="shopopti-reviews-select-all">
            ☑️ Tout sélect.
          </button>
          <div class="shopopti-reviews-actions-row">
            <button class="shopopti-reviews-btn shopopti-reviews-btn-primary" id="shopopti-reviews-import" disabled>
              📥 Importer (<span id="shopopti-reviews-import-count">0</span>)
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(panel);
    }

    bindEvents() {
      document.getElementById('shopopti-reviews-close')?.addEventListener('click', () => this.hide());
      document.getElementById('shopopti-reviews-extract')?.addEventListener('click', () => this.startExtraction());
      document.getElementById('shopopti-reviews-import')?.addEventListener('click', () => this.importReviews());
      document.getElementById('shopopti-reviews-select-all')?.addEventListener('click', () => this.toggleSelectAll());
      
      // Filter changes
      ['shopopti-reviews-min-rating', 'shopopti-reviews-photos-only', 'shopopti-reviews-verified-only'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => this.applyFilters());
      });

      // Listen for show command
      window.addEventListener('message', (event) => {
        if (event.data.type === 'SHOW_REVIEWS_PANEL' || event.data.type === 'SHOPOPTI_SHOW_REVIEWS') {
          this.show();
        }
      });

      // Chrome runtime messages
      if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (message.type === 'SHOW_REVIEWS_PANEL' || message.type === 'EXTRACT_REVIEWS') {
            this.show();
            if (message.autoExtract) {
              setTimeout(() => this.startExtraction(), 500);
            }
            sendResponse({ success: true });
          }
          return true;
        });
      }
    }

    show() {
      const panel = document.getElementById('shopopti-reviews-panel');
      if (panel) {
        panel.classList.add('active');
      }
    }

    hide() {
      const panel = document.getElementById('shopopti-reviews-panel');
      if (panel) {
        panel.classList.remove('active');
      }
    }

    async startExtraction() {
      if (this.isExtracting) return;
      
      this.isExtracting = true;
      this.extractedReviews = [];
      this.selectedReviews.clear();
      this.scrollAttempts = 0;
      this.lastReviewCount = 0;

      const extractBtn = document.getElementById('shopopti-reviews-extract');
      if (extractBtn) {
        extractBtn.innerHTML = '<span class="shopopti-spinner"></span> Extraction...';
        extractBtn.disabled = true;
      }

      this.showProgress(true);
      this.updateProgress(0, 'Initialisation...');

      const autoScroll = document.getElementById('shopopti-reviews-auto-scroll')?.checked ?? true;

      try {
        if (autoScroll) {
          await this.autoScrollAndExtract();
        } else {
          this.extractVisibleReviews();
        }
      } catch (error) {
        console.error('[ShopOpti+] Extraction error:', error);
        this.showToast('Erreur lors de l\'extraction', 'error');
      }

      this.isExtracting = false;
      this.showProgress(false);

      if (extractBtn) {
        extractBtn.innerHTML = '🔍 Extraire';
        extractBtn.disabled = false;
      }

      this.applyFilters();
      this.showToast(`${this.extractedReviews.length} avis extraits`, 'success');
    }

    async autoScrollAndExtract() {
      const scrollTarget = document.querySelector(this.selectors.scrollTarget) || window;
      const maxScrollAttempts = CONFIG.MAX_SCROLL_ATTEMPTS;
      
      while (this.scrollAttempts < maxScrollAttempts && this.extractedReviews.length < CONFIG.MAX_REVIEWS) {
        // Extract current visible reviews
        this.extractVisibleReviews();
        
        const progress = Math.min((this.extractedReviews.length / CONFIG.MAX_REVIEWS) * 100, 95);
        this.updateProgress(progress, `${this.extractedReviews.length} avis trouvés...`);

        // Check if we got new reviews
        if (this.extractedReviews.length === this.lastReviewCount) {
          // Try clicking "Load More" button
          const loadMoreBtn = document.querySelector(this.selectors.loadMore);
          if (loadMoreBtn && !loadMoreBtn.disabled) {
            loadMoreBtn.click();
            await this.sleep(CONFIG.LOAD_MORE_DELAY);
          }
        }

        this.lastReviewCount = this.extractedReviews.length;

        // Scroll down
        if (scrollTarget === window) {
          window.scrollBy({ top: 600, behavior: 'smooth' });
        } else {
          scrollTarget.scrollTop += 400;
        }

        await this.sleep(CONFIG.SCROLL_DELAY_MS);
        this.scrollAttempts++;
      }

      this.updateProgress(100, 'Extraction terminée!');
    }

    extractVisibleReviews() {
      const reviewElements = document.querySelectorAll(this.selectors.reviewItem);
      
      reviewElements.forEach((element, index) => {
        const reviewId = `review_${this.platform}_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Skip if already extracted (check by content hash)
        const contentEl = element.querySelector(this.selectors.content);
        const content = contentEl?.textContent?.trim() || '';
        if (!content || this.extractedReviews.some(r => r.content === content)) {
          return;
        }

        // Extract rating
        const ratingEl = element.querySelector(this.selectors.rating);
        let rating = this.extractRating(ratingEl);

        // Extract author
        const authorEl = element.querySelector(this.selectors.author);
        const author = authorEl?.textContent?.trim() || 'Anonymous';

        // Extract date
        const dateEl = element.querySelector(this.selectors.date);
        const dateText = dateEl?.textContent?.trim() || '';
        const date = this.parseDate(dateText);

        // Extract images
        const imageEls = element.querySelectorAll(this.selectors.images);
        const images = Array.from(imageEls).map(img => {
          const src = img.getAttribute('src') || img.getAttribute('data-src');
          return this.normalizeImageUrl(src);
        }).filter(Boolean);

        // Extract videos
        const videoEls = element.querySelectorAll(this.selectors.videos || 'video');
        const videos = Array.from(videoEls).map(vid => vid.getAttribute('src')).filter(Boolean);

        // Check verified
        const verifiedEl = element.querySelector(this.selectors.verified);
        const verified = !!verifiedEl;

        // Extract helpful count
        const helpfulEl = element.querySelector(this.selectors.helpful);
        const helpfulText = helpfulEl?.textContent?.trim() || '';
        const helpfulMatch = helpfulText.match(/(\d+)/);
        const helpfulCount = helpfulMatch ? parseInt(helpfulMatch[1]) : 0;

        // Extract country
        const countryEl = element.querySelector(this.selectors.country);
        const country = this.extractCountry(countryEl?.textContent || dateText);

        // Extract title (Amazon specific)
        const titleEl = element.querySelector(this.selectors.title);
        const title = titleEl?.textContent?.trim() || '';

        const review = {
          id: reviewId,
          platform: this.platform,
          author,
          rating,
          title,
          content,
          date,
          dateRaw: dateText,
          images,
          videos,
          verified,
          helpfulCount,
          country,
          url: window.location.href,
          extractedAt: new Date().toISOString()
        };

        this.extractedReviews.push(review);
      });
    }

    extractRating(element) {
      if (!element) return null;

      // Try aria-label first
      const ariaLabel = element.getAttribute('aria-label');
      if (ariaLabel) {
        const match = ariaLabel.match(/(\d+(?:\.\d+)?)/);
        if (match) return parseFloat(match[1]);
      }

      // Try data attributes
      const dataRating = element.getAttribute('data-rating') || element.getAttribute('data-value');
      if (dataRating) return parseFloat(dataRating);

      // Try text content
      const text = element.textContent || '';
      const textMatch = text.match(/(\d+(?:\.\d+)?)/);
      if (textMatch) return parseFloat(textMatch[1]);

      // Count star icons
      const starIcons = element.querySelectorAll('[class*="star"][class*="full"], [class*="filled"], .a-icon-star');
      if (starIcons.length > 0) return starIcons.length;

      // Try style width (for progress bar style ratings)
      const style = element.getAttribute('style');
      if (style) {
        const widthMatch = style.match(/width:\s*(\d+(?:\.\d+)?)/);
        if (widthMatch) return Math.round(parseFloat(widthMatch[1]) / 20);
      }

      return null;
    }

    parseDate(dateText) {
      if (!dateText) return new Date().toISOString();

      // Common date patterns
      const patterns = [
        /(\d{1,2})\s*(jan|fev|mar|avr|mai|jun|jul|aou|sep|oct|nov|dec)/i,
        /(\d{4})-(\d{2})-(\d{2})/,
        /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,
        /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s*(\d{4})?/i
      ];

      try {
        const parsed = new Date(dateText);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
      } catch (e) {}

      return new Date().toISOString();
    }

    extractCountry(text) {
      const countries = {
        'france': '🇫🇷 France',
        'united states': '🇺🇸 USA',
        'germany': '🇩🇪 Allemagne',
        'spain': '🇪🇸 Espagne',
        'italy': '🇮🇹 Italie',
        'uk': '🇬🇧 UK',
        'united kingdom': '🇬🇧 UK',
        'canada': '🇨🇦 Canada',
        'australia': '🇦🇺 Australie',
        'china': '🇨🇳 Chine',
        'japan': '🇯🇵 Japon',
        'brazil': '🇧🇷 Brésil'
      };

      const textLower = (text || '').toLowerCase();
      for (const [key, value] of Object.entries(countries)) {
        if (textLower.includes(key)) return value;
      }

      return null;
    }

    normalizeImageUrl(url) {
      if (!url) return null;

      // Remove size transforms for high-res
      url = url.replace(/_\d+x\d+\./g, '.')
               .replace(/\._[A-Z]+_\d+/g, '')
               .replace(/\?.*$/, '');

      // Ensure https
      if (url.startsWith('//')) {
        url = 'https:' + url;
      }

      return url;
    }

    applyFilters() {
      const minRating = parseInt(document.getElementById('shopopti-reviews-min-rating')?.value) || 1;
      const photosOnly = document.getElementById('shopopti-reviews-photos-only')?.checked || false;
      const verifiedOnly = document.getElementById('shopopti-reviews-verified-only')?.checked || false;

      // Update filter button states
      document.getElementById('shopopti-filter-photos')?.classList.toggle('active', photosOnly);
      document.getElementById('shopopti-filter-verified')?.classList.toggle('active', verifiedOnly);

      const filteredReviews = this.extractedReviews.filter(review => {
        if (review.rating !== null && review.rating < minRating) return false;
        if (photosOnly && (!review.images || review.images.length === 0)) return false;
        if (verifiedOnly && !review.verified) return false;
        return true;
      });

      this.renderReviews(filteredReviews);
      this.updateStats(filteredReviews);
    }

    renderReviews(reviews) {
      const list = document.getElementById('shopopti-reviews-list');
      if (!list) return;

      if (reviews.length === 0) {
        list.innerHTML = `
          <div class="shopopti-reviews-empty">
            <div class="shopopti-reviews-empty-icon">${this.extractedReviews.length > 0 ? '🔍' : '📭'}</div>
            <div class="shopopti-reviews-empty-text">${this.extractedReviews.length > 0 ? 'Aucun avis ne correspond aux filtres' : 'Aucun avis extrait'}</div>
            <div class="shopopti-reviews-empty-hint">${this.extractedReviews.length > 0 ? 'Modifiez les filtres pour voir plus d\'avis' : 'Cliquez sur "Extraire" pour commencer'}</div>
          </div>
        `;
        return;
      }

      list.innerHTML = reviews.slice(0, 50).map(review => `
        <div class="shopopti-review-item ${this.selectedReviews.has(review.id) ? 'selected' : ''}" data-id="${review.id}">
          <div class="shopopti-review-checkbox">✓</div>
          <div class="shopopti-review-header">
            <div class="shopopti-review-author">
              ${review.author}
              ${review.country ? `<span class="shopopti-review-country">${review.country}</span>` : ''}
            </div>
            <div class="shopopti-review-rating">
              ${'★'.repeat(Math.floor(review.rating || 0))}${'☆'.repeat(5 - Math.floor(review.rating || 0))}
            </div>
          </div>
          ${review.title ? `<div style="color: #e2e8f0; font-weight: 600; font-size: 12px; margin-bottom: 6px;">${review.title}</div>` : ''}
          <div class="shopopti-review-content">${review.content}</div>
          ${review.images?.length > 0 ? `
            <div class="shopopti-review-images">
              ${review.images.slice(0, 4).map(img => `<img src="${img}" alt="Review image" loading="lazy">`).join('')}
              ${review.images.length > 4 ? `<span style="color: #64748b; font-size: 11px; align-self: center;">+${review.images.length - 4}</span>` : ''}
            </div>
          ` : ''}
          <div class="shopopti-review-badges">
            ${review.verified ? '<span class="shopopti-review-badge verified">✓ Vérifié</span>' : ''}
            ${review.images?.length > 0 ? `<span class="shopopti-review-badge photos">📷 ${review.images.length}</span>` : ''}
            ${review.helpfulCount > 0 ? `<span class="shopopti-review-badge helpful">👍 ${review.helpfulCount}</span>` : ''}
            ${review.dateRaw ? `<span class="shopopti-review-badge">${review.dateRaw.slice(0, 20)}</span>` : ''}
          </div>
        </div>
      `).join('');

      // Bind click events
      list.querySelectorAll('.shopopti-review-item').forEach(item => {
        item.addEventListener('click', () => this.toggleReviewSelection(item.dataset.id));
      });
    }

    toggleReviewSelection(reviewId) {
      if (this.selectedReviews.has(reviewId)) {
        this.selectedReviews.delete(reviewId);
      } else {
        this.selectedReviews.add(reviewId);
      }

      // Update UI
      const item = document.querySelector(`.shopopti-review-item[data-id="${reviewId}"]`);
      item?.classList.toggle('selected', this.selectedReviews.has(reviewId));

      this.updateSelectionCount();
    }

    toggleSelectAll() {
      const btn = document.getElementById('shopopti-reviews-select-all');
      const allSelected = this.selectedReviews.size === this.extractedReviews.length;

      if (allSelected) {
        this.selectedReviews.clear();
        if (btn) btn.innerHTML = '☑️ Tout sélect.';
      } else {
        this.extractedReviews.forEach(r => this.selectedReviews.add(r.id));
        if (btn) btn.innerHTML = '☐ Désélect.';
      }

      document.querySelectorAll('.shopopti-review-item').forEach(item => {
        item.classList.toggle('selected', this.selectedReviews.has(item.dataset.id));
      });

      this.updateSelectionCount();
    }

    updateSelectionCount() {
      const count = this.selectedReviews.size;
      document.getElementById('shopopti-reviews-selected').textContent = count;
      document.getElementById('shopopti-reviews-import-count').textContent = count;
      
      const importBtn = document.getElementById('shopopti-reviews-import');
      if (importBtn) {
        importBtn.disabled = count === 0;
      }
    }

    updateStats(reviews) {
      const total = reviews.length;
      const avgRating = total > 0 
        ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / total).toFixed(1)
        : '-';
      const photosCount = reviews.filter(r => r.images?.length > 0).length;

      document.getElementById('shopopti-reviews-total').textContent = total;
      document.getElementById('shopopti-reviews-avg').textContent = avgRating;
      document.getElementById('shopopti-reviews-photos').textContent = photosCount;

      // Color coding for average
      const avgEl = document.getElementById('shopopti-reviews-avg');
      if (avgEl) {
        avgEl.classList.remove('positive', 'warning');
        if (avgRating >= 4) avgEl.classList.add('positive');
        else if (avgRating >= 3 && avgRating < 4) avgEl.classList.add('warning');
      }

      this.updateSelectionCount();
    }

    showProgress(show) {
      const progress = document.getElementById('shopopti-reviews-progress');
      if (progress) {
        progress.classList.toggle('active', show);
      }
    }

    updateProgress(percent, text) {
      const fill = document.getElementById('shopopti-reviews-progress-fill');
      const textEl = document.getElementById('shopopti-reviews-progress-text');
      
      if (fill) fill.style.width = `${percent}%`;
      if (textEl) textEl.textContent = text;
    }

    async importReviews() {
      if (this.selectedReviews.size === 0) {
        this.showToast('Sélectionnez des avis à importer', 'error');
        return;
      }

      const importBtn = document.getElementById('shopopti-reviews-import');
      if (importBtn) {
        importBtn.innerHTML = '<span class="shopopti-spinner"></span> Import...';
        importBtn.disabled = true;
      }

      try {
        const reviewsToImport = this.extractedReviews.filter(r => this.selectedReviews.has(r.id));
        const translate = document.getElementById('shopopti-reviews-translate')?.checked ?? true;

        // Get extension token
        const storage = await chrome.storage.local.get(['extensionToken']);
        const token = storage.extensionToken;

        if (!token) {
          this.showToast('Connectez-vous à ShopOpti+ d\'abord', 'error');
          return;
        }

        const response = await fetch(`${CONFIG.API_URL}/import-reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': token
          },
          body: JSON.stringify({
            reviews: reviewsToImport,
            options: {
              translate,
              targetLanguage: 'fr',
              platform: this.platform,
              productUrl: window.location.href
            }
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          this.showToast(`${result.imported || reviewsToImport.length} avis importés!`, 'success');
          
          // Update stats in extension storage
          const stats = (await chrome.storage.local.get(['stats'])).stats || {};
          await chrome.storage.local.set({
            stats: {
              ...stats,
              reviews: (stats.reviews || 0) + reviewsToImport.length
            }
          });

          // Clear selection
          this.selectedReviews.clear();
          this.updateSelectionCount();
          
          // Close panel after success
          setTimeout(() => this.hide(), 1500);
        } else {
          throw new Error(result.error || 'Échec de l\'import');
        }
      } catch (error) {
        console.error('[ShopOpti+] Import error:', error);
        this.showToast(`Erreur: ${error.message}`, 'error');
      } finally {
        if (importBtn) {
          importBtn.innerHTML = `📥 Importer (<span id="shopopti-reviews-import-count">${this.selectedReviews.size}</span>)`;
          importBtn.disabled = this.selectedReviews.size === 0;
        }
      }
    }

    showToast(message, type = 'info') {
      // Remove existing
      document.querySelectorAll('.shopopti-toast').forEach(t => t.remove());

      const toast = document.createElement('div');
      toast.className = `shopopti-toast ${type}`;
      toast.innerHTML = `
        <span class="shopopti-toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span class="shopopti-toast-text">${message}</span>
      `;
      document.body.appendChild(toast);

      setTimeout(() => toast.remove(), 3000);
    }

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }

  // Initialize
  const extractor = new ShopOptiReviewsExtractor();

  // Expose for external access
  window.ShopOptiReviewsExtractor = extractor;
})();
