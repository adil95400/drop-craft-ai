// Drop Craft AI - Reviews Extractor v4.1
// Extract and filter customer reviews from product pages with auto-scroll support

(function() {
  'use strict';

  if (window.__dropCraftReviewsLoaded) return;
  window.__dropCraftReviewsLoaded = true;

  const CONFIG = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    MAX_REVIEWS: 200,
    SCROLL_DELAY_MS: 800,
    MAX_SCROLL_ATTEMPTS: 10,
    PLATFORMS: {
      'aliexpress': {
        reviewsContainer: '.feedback-list, .product-evaluation, [class*="review"], .comet-v2-modal-body, .feedback--wrap--bDEEKp5, [class*="feedback-list"]',
        reviewItem: '.feedback-item, .buyer-feedback, [data-pl="feedback-item"], .feedback--list--dJsbH8z .feedback--item--dj2j9tN, [class*="feedback-item"], .feedback--item, .review-item',
        author: '.user-name, .buyer-name, .feedback-author, .feedback--userName--QsU0Wf0, [class*="user-name"], [class*="userName"]',
        rating: '.star-view, .star-score, [class*="rating"], .feedback--stars--t9_W6T4, [class*="stars"], .stars',
        content: '.buyer-feedback, .feedback-content, .review-content, .feedback--content--UWfgMTD, [class*="feedback-content"], [class*="review-text"]',
        date: '.feedback-time, .review-date, .feedback--time--c_Tn30j, [class*="feedback-time"], [class*="date"]',
        images: '.feedback-images img, .review-images img, .feedback--photos--K3Gn6C1 img, [class*="feedback-photo"] img, [class*="review-image"] img',
        verified: '.buyer-verified, .verified-purchase, [class*="verified"]',
        scrollTarget: '.feedback-list, [class*="feedback"], [class*="review"]'
      },
      'amazon': {
        reviewsContainer: '#cm_cr-review_list, #reviewsMedley, .reviews-content, #customer-reviews',
        reviewItem: '[data-hook="review"], .review, .a-section.review, .review-views .review',
        author: '.a-profile-name, [data-hook="genome-widget"] span, .review-byline a',
        rating: '.review-rating span, [data-hook="review-star-rating"] span, .a-icon-star span, [class*="star-rating"]',
        content: '[data-hook="review-body"] span, .review-text span, .review-text-content span, .reviewText',
        date: '[data-hook="review-date"], .review-date, .review-date-submissionDate',
        images: '.review-image-tile img, .review-image img, [data-hook="review-image-tile"] img, .cr-lightbox-image-thumbnail img',
        verified: '.avp-badge, [data-hook="avp-badge"], .a-size-mini, [class*="verified"]',
        scrollTarget: '#cm_cr-review_list, #reviewsMedley'
      },
      'ebay': {
        reviewsContainer: '.reviews-content, .product-reviews, #rwid, [class*="review-list"]',
        reviewItem: '.review-item, .ebay-review-section, .rvw-card, [class*="review-item"]',
        author: '.review-item-author, .reviewer-name, .rvw-card__author, [class*="author"]',
        rating: '.star-rating, .review-stars, .rvw-card__rating, [class*="star"]',
        content: '.review-item-content, .rvw-card__body, [class*="review-text"], [class*="content"]',
        date: '.review-item-date, .rvw-card__date, [class*="date"]',
        images: '.review-images img, .rvw-card__image img',
        verified: '.verified-purchase, [class*="verified"]',
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
        verified: '[class*="verified"]',
        scrollTarget: '[class*="reviews"], [class*="comment"]'
      },
      'walmart': {
        reviewsContainer: '[data-testid="reviews-list"], .reviews-list, #reviews-list',
        reviewItem: '[data-testid="review-card"], .review-card, [class*="review-item"]',
        author: '[data-testid="reviewer-name"], .reviewer-name, [class*="author"]',
        rating: '[data-testid="star-rating"], .star-rating, [class*="rating"]',
        content: '[data-testid="review-text"], .review-text, [class*="content"]',
        date: '[data-testid="review-date"], .review-date, [class*="date"]',
        images: '[data-testid="review-image"] img, .review-image img',
        verified: '[data-testid="verified-purchase"], [class*="verified"]',
        scrollTarget: '[data-testid="reviews-list"], .reviews-list'
      },
      'etsy': {
        reviewsContainer: '.reviews-list, [data-region="reviews"], [class*="reviews"]',
        reviewItem: '.review-item, [data-region="review"], [class*="review-item"]',
        author: '.shop2-review-attribution a, .reviewer-name, [class*="author"]',
        rating: '.stars-svg, .review-stars, [class*="star"]',
        content: '.prose, .review-text, [class*="content"]',
        date: '.review-date, [data-date], [class*="date"]',
        images: '.listing-page-image img, .review-image img',
        verified: '.verified-buyer, [class*="verified"]',
        scrollTarget: '.reviews-list, [data-region="reviews"]'
      },
      'shein': {
        reviewsContainer: '[class*="reviews"], [class*="comment"], .goods-review',
        reviewItem: '[class*="review-item"], [class*="comment-item"], .review-item',
        author: '[class*="user-name"], [class*="nickname"]',
        rating: '[class*="star"], [class*="rating"]',
        content: '[class*="review-content"], [class*="text"]',
        date: '[class*="date"], [class*="time"]',
        images: '[class*="review"] img, [class*="photo"] img',
        verified: '[class*="verified"]',
        scrollTarget: '[class*="reviews"]'
      },
      'cdiscount': {
        reviewsContainer: '.reviews, #product-reviews, [class*="review"]',
        reviewItem: '.review, [class*="review-item"], .avis',
        author: '.author, [class*="author"], .reviewer',
        rating: '.rating, [class*="star"], .note',
        content: '.review-text, [class*="content"], .comment',
        date: '.date, [class*="date"]',
        images: '.review img',
        verified: '.verified, [class*="verified"]',
        scrollTarget: '.reviews, #product-reviews'
      }
    }
  };

  class DropCraftReviewsExtractor {
    constructor() {
      this.platform = null;
      this.selectors = null;
      this.extractedReviews = [];
      
      this.detectPlatform();
      if (this.platform) {
        this.injectUI();
        this.bindEvents();
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
    }

    injectUI() {
      // Inject styles
      const style = document.createElement('style');
      style.id = 'dc-reviews-styles';
      style.textContent = `
        .dc-reviews-panel {
          position: fixed;
          top: 70px;
          right: 20px;
          width: 380px;
          max-height: calc(100vh - 100px);
          background: linear-gradient(135deg, #1e1e2e 0%, #2d2d3d 100%);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          z-index: 10001;
          display: none;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .dc-reviews-panel.active {
          display: flex;
          flex-direction: column;
        }
        
        .dc-reviews-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .dc-reviews-title {
          color: white;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .dc-reviews-close {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          font-size: 18px;
          padding: 4px;
        }
        
        .dc-reviews-close:hover {
          color: #ef4444;
        }
        
        .dc-reviews-filters {
          padding: 12px 20px;
          background: rgba(0, 0, 0, 0.2);
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .dc-reviews-filter {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.05);
          padding: 6px 12px;
          border-radius: 8px;
          color: #94a3b8;
          font-size: 12px;
        }
        
        .dc-reviews-filter input,
        .dc-reviews-filter select {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: white;
          padding: 4px 8px;
          font-size: 12px;
          max-width: 80px;
        }
        
        .dc-reviews-filter select {
          max-width: 100px;
        }
        
        .dc-reviews-filter input:focus,
        .dc-reviews-filter select:focus {
          outline: none;
          border-color: #667eea;
        }
        
        .dc-reviews-stats {
          padding: 12px 20px;
          display: flex;
          gap: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .dc-reviews-stat {
          text-align: center;
        }
        
        .dc-reviews-stat-value {
          color: white;
          font-size: 18px;
          font-weight: 700;
        }
        
        .dc-reviews-stat-label {
          color: #64748b;
          font-size: 10px;
          margin-top: 2px;
        }
        
        .dc-reviews-list {
          flex: 1;
          overflow-y: auto;
          max-height: 400px;
          padding: 12px 20px;
        }
        
        .dc-review-item {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }
        
        .dc-review-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        
        .dc-review-item.selected {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.1);
        }
        
        .dc-review-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .dc-review-author {
          color: white;
          font-weight: 500;
          font-size: 13px;
        }
        
        .dc-review-rating {
          color: #fbbf24;
          font-size: 12px;
        }
        
        .dc-review-content {
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.5;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }
        
        .dc-review-badges {
          display: flex;
          gap: 6px;
          margin-top: 8px;
          flex-wrap: wrap;
        }
        
        .dc-review-badge {
          background: rgba(102, 126, 234, 0.2);
          color: #818cf8;
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 4px;
        }
        
        .dc-review-badge.verified {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }
        
        .dc-review-badge.photos {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }
        
        .dc-reviews-actions {
          padding: 16px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 10px;
        }
        
        .dc-reviews-btn {
          flex: 1;
          padding: 10px 16px;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .dc-reviews-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .dc-reviews-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        
        .dc-reviews-btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .dc-reviews-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        
        .dc-reviews-empty {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
        }
        
        .dc-reviews-checkbox {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 20px;
          height: 20px;
          background: rgba(30, 30, 46, 0.9);
          border: 2px solid rgba(102, 126, 234, 0.5);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: transparent;
          font-size: 12px;
        }
        
        .dc-review-item.selected .dc-reviews-checkbox {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
      `;
      document.head.appendChild(style);

      // Create panel
      const panel = document.createElement('div');
      panel.className = 'dc-reviews-panel';
      panel.id = 'dc-reviews-panel';
      panel.innerHTML = `
        <div class="dc-reviews-header">
          <div class="dc-reviews-title">
            ⭐ Import Avis
          </div>
          <button class="dc-reviews-close" id="dc-reviews-close">✕</button>
        </div>
        
        <div class="dc-reviews-filters">
          <div class="dc-reviews-filter">
            <span>Note min:</span>
            <select id="dc-reviews-min-rating">
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4" selected>4+</option>
              <option value="5">5</option>
            </select>
          </div>
          <div class="dc-reviews-filter">
            <label>
              <input type="checkbox" id="dc-reviews-photos-only">
              Avec photos
            </label>
          </div>
          <div class="dc-reviews-filter">
            <label>
              <input type="checkbox" id="dc-reviews-verified-only">
              Vérifiés
            </label>
          </div>
        </div>
        
        <div class="dc-reviews-stats">
          <div class="dc-reviews-stat">
            <div class="dc-reviews-stat-value" id="dc-reviews-total">0</div>
            <div class="dc-reviews-stat-label">Total</div>
          </div>
          <div class="dc-reviews-stat">
            <div class="dc-reviews-stat-value" id="dc-reviews-selected">0</div>
            <div class="dc-reviews-stat-label">Sélectionnés</div>
          </div>
          <div class="dc-reviews-stat">
            <div class="dc-reviews-stat-value" id="dc-reviews-avg">-</div>
            <div class="dc-reviews-stat-label">Note moy.</div>
          </div>
          <div class="dc-reviews-stat">
            <div class="dc-reviews-stat-value" id="dc-reviews-photos">0</div>
            <div class="dc-reviews-stat-label">Photos</div>
          </div>
        </div>
        
        <div class="dc-reviews-list" id="dc-reviews-list">
          <div class="dc-reviews-empty">
            Cliquez sur "Extraire" pour détecter les avis de cette page
          </div>
        </div>
        
        <div class="dc-reviews-actions">
          <button class="dc-reviews-btn dc-reviews-btn-secondary" id="dc-reviews-extract">
            🔍 Extraire
          </button>
          <button class="dc-reviews-btn dc-reviews-btn-primary" id="dc-reviews-import">
            📥 Importer (<span id="dc-reviews-import-count">0</span>)
          </button>
        </div>
      `;
      document.body.appendChild(panel);
    }

    bindEvents() {
      document.getElementById('dc-reviews-close')?.addEventListener('click', () => this.hide());
      document.getElementById('dc-reviews-extract')?.addEventListener('click', () => this.extractReviews());
      document.getElementById('dc-reviews-import')?.addEventListener('click', () => this.importReviews());
      
      // Filter change events
      document.getElementById('dc-reviews-min-rating')?.addEventListener('change', () => this.applyFilters());
      document.getElementById('dc-reviews-photos-only')?.addEventListener('change', () => this.applyFilters());
      document.getElementById('dc-reviews-verified-only')?.addEventListener('change', () => this.applyFilters());

      // Listen for show command from popup/sidebar
      window.addEventListener('message', (event) => {
        if (event.data.type === 'SHOW_REVIEWS_PANEL') {
          this.show();
        }
      });
    }

    show() {
      const panel = document.getElementById('dc-reviews-panel');
      if (panel) panel.classList.add('active');
    }

    hide() {
      const panel = document.getElementById('dc-reviews-panel');
      if (panel) panel.classList.remove('active');
    }

    extractReviews() {
      if (!this.selectors) {
        this.showToast('Plateforme non supportée pour l\'extraction d\'avis', 'error');
        return;
      }

      // Show loading state
      const extractBtn = document.getElementById('dc-reviews-extract');
      if (extractBtn) {
        extractBtn.textContent = '⏳ Extraction...';
        extractBtn.disabled = true;
      }

      // Start extraction with auto-scroll
      this.extractWithAutoScroll().then(reviews => {
        this.extractedReviews = reviews;
        this.applyFilters();
        
        if (extractBtn) {
          extractBtn.textContent = '🔍 Extraire';
          extractBtn.disabled = false;
        }
        
        if (reviews.length > 0) {
          this.showToast(`${reviews.length} avis détectés`, 'success');
        } else {
          this.showToast('Aucun avis trouvé - faites défiler jusqu\'à la section avis', 'warning');
        }
      });
    }

    async extractWithAutoScroll() {
      const reviews = [];
      let scrollAttempts = 0;
      let lastReviewCount = 0;
      
      // Try to find and scroll to reviews section first
      const reviewsSection = document.querySelector(this.selectors.scrollTarget || this.selectors.reviewsContainer);
      if (reviewsSection) {
        reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        await this.sleep(500);
      }

      // Extract with progressive scrolling
      while (scrollAttempts < CONFIG.MAX_SCROLL_ATTEMPTS) {
        // Extract current visible reviews
        const currentReviews = this.extractVisibleReviews();
        
        // Merge new reviews (deduplicate by content hash)
        for (const review of currentReviews) {
          const hash = this.hashReview(review);
          if (!reviews.find(r => this.hashReview(r) === hash)) {
            reviews.push(review);
          }
        }

        // Check if we got new reviews
        if (reviews.length === lastReviewCount) {
          // No new reviews, try clicking "load more" button
          const loadMoreClicked = await this.tryClickLoadMore();
          if (!loadMoreClicked) {
            break; // No more reviews to load
          }
        }
        
        lastReviewCount = reviews.length;
        
        // Scroll down to load more
        const scrollContainer = document.querySelector(this.selectors.scrollTarget) || window;
        if (scrollContainer === window) {
          window.scrollBy({ top: 500, behavior: 'smooth' });
        } else {
          scrollContainer.scrollBy({ top: 300, behavior: 'smooth' });
        }
        
        await this.sleep(CONFIG.SCROLL_DELAY_MS);
        scrollAttempts++;
        
        // Stop if we have enough reviews
        if (reviews.length >= CONFIG.MAX_REVIEWS) break;
      }

      return reviews.slice(0, CONFIG.MAX_REVIEWS);
    }

    async tryClickLoadMore() {
      const loadMoreSelectors = [
        '[class*="load-more"]', '[class*="show-more"]', '[class*="voir-plus"]',
        'button[class*="more"]', 'a[class*="more"]', '.pagination-next',
        '[data-action="load-more"]', '.see-more', '.btn-load-more'
      ];

      for (const sel of loadMoreSelectors) {
        const btn = document.querySelector(sel);
        if (btn && btn.offsetParent !== null) { // Check if visible
          btn.click();
          await this.sleep(CONFIG.SCROLL_DELAY_MS * 2);
          return true;
        }
      }
      return false;
    }

    hashReview(review) {
      return (review.content || '').substring(0, 50) + (review.author || '');
    }

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    extractVisibleReviews() {
      const reviews = [];

      // Special handling for AliExpress - reviews are often in a modal or lazy-loaded
      if (this.platform === 'aliexpress') {
        // Try to find reviews in the feedback section
        const feedbackSelectors = [
          '.feedback--list--dJsbH8z .feedback--item--dj2j9tN',
          '.feedback--wrap--bDEEKp5 .feedback-item',
          '.comet-v2-modal-body .feedback-item',
          '.product-evaluation .buyer-feedback',
          '[data-pl="feedback-list"] > div',
          '.feedback-list-wrap .feedback-item',
          '.review-list .review-item',
          '[class*="feedback-item"]',
          '[class*="review-item"]'
        ];
        
        for (const selector of feedbackSelectors) {
          const items = document.querySelectorAll(selector);
          if (items.length > 0) {
            console.log('[Reviews] Found AliExpress reviews with selector:', selector, items.length);
            items.forEach((item, index) => {
              if (reviews.length >= CONFIG.MAX_REVIEWS) return;
              const review = this.parseAliExpressReview(item, index);
              if (review && review.content && review.content.length > 5) {
                reviews.push(review);
              }
            });
            break;
          }
        }
        
        // If no reviews found in DOM, show hint
        if (reviews.length === 0) {
          console.log('[Reviews] No AliExpress reviews found in DOM - user may need to scroll to reviews section');
        }
      } else {
        // Generic extraction for other platforms
        const reviewItems = document.querySelectorAll(this.selectors.reviewItem);
        console.log('[Reviews] Found', reviewItems.length, 'review items with selector:', this.selectors.reviewItem);

        reviewItems.forEach((item, index) => {
          if (reviews.length >= CONFIG.MAX_REVIEWS) return;
          const review = this.parseReviewItem(item, index);
          if (review && review.content && review.content.length > 5) {
            reviews.push(review);
          }
        });
      }

      return reviews;
    }

    parseAliExpressReview(item, index) {
      const getText = (selector) => {
        const el = item.querySelector(selector);
        return el ? el.textContent.trim() : '';
      };

      const getImages = () => {
        const imgs = item.querySelectorAll('img[src*="feedback"], img[src*="review"], .feedback--photos--K3Gn6C1 img');
        return Array.from(imgs).map(img => img.src || img.dataset.src).filter(Boolean);
      };

      const parseRating = () => {
        // AliExpress uses star elements
        const starContainer = item.querySelector('.feedback--stars--t9_W6T4, .star-view, [class*="stars"]');
        if (starContainer) {
          const fullStars = starContainer.querySelectorAll('.comet-icon-starreviewfilled, [class*="full"], .star-on');
          return fullStars.length || 5;
        }
        return 5;
      };

      // Try multiple selectors for content
      const contentSelectors = [
        '.feedback--content--UWfgMTD',
        '.buyer-feedback span',
        '.feedback-content',
        '.review-content'
      ];
      
      let contentText = '';
      for (const sel of contentSelectors) {
        const el = item.querySelector(sel);
        if (el) {
          contentText = el.textContent.trim();
          if (contentText.length > 5) break;
        }
      }

      // Author
      const authorSelectors = ['.feedback--userName--QsU0Wf0', '.user-name', '.buyer-name'];
      let authorText = '';
      for (const sel of authorSelectors) {
        authorText = getText(sel);
        if (authorText) break;
      }

      // Date
      const dateSelectors = ['.feedback--time--c_Tn30j', '.feedback-time', '.review-date'];
      let dateText = '';
      for (const sel of dateSelectors) {
        dateText = getText(sel);
        if (dateText) break;
      }

      const images = getImages();

      return {
        id: `review_${index}_${Date.now()}`,
        author: authorText || 'Client AliExpress',
        rating: parseRating(),
        content: contentText,
        date: dateText,
        images: images,
        verified: true,
        selected: true,
        platform: this.platform
      };
    }

    parseReviewItem(item, index) {
      const getText = (selector) => {
        const el = item.querySelector(selector);
        return el ? el.textContent.trim() : '';
      };

      const getImages = (selector) => {
        const imgs = item.querySelectorAll(selector);
        return Array.from(imgs).map(img => img.src || img.dataset.src).filter(Boolean);
      };

      const parseRating = (text) => {
        if (!text) return 5;
        const match = text.match(/[\d.]+/);
        if (match) {
          const rating = parseFloat(match[0]);
          return rating > 5 ? rating / 20 : rating; // Handle percentage ratings
        }
        // Count stars
        const stars = text.match(/★|⭐/g);
        return stars ? stars.length : 5;
      };

      const authorText = getText(this.selectors.author);
      const ratingText = getText(this.selectors.rating);
      const contentText = getText(this.selectors.content);
      const dateText = getText(this.selectors.date);
      const images = getImages(this.selectors.images);
      const isVerified = !!item.querySelector(this.selectors.verified);

      return {
        id: `review_${index}_${Date.now()}`,
        author: authorText || 'Client',
        rating: parseRating(ratingText),
        content: contentText,
        date: dateText,
        images: images,
        verified: isVerified,
        selected: true,
        platform: this.platform
      };
    }

    applyFilters() {
      const minRating = parseInt(document.getElementById('dc-reviews-min-rating')?.value || '1');
      const photosOnly = document.getElementById('dc-reviews-photos-only')?.checked || false;
      const verifiedOnly = document.getElementById('dc-reviews-verified-only')?.checked || false;

      const filtered = this.extractedReviews.filter(review => {
        if (review.rating < minRating) return false;
        if (photosOnly && (!review.images || review.images.length === 0)) return false;
        if (verifiedOnly && !review.verified) return false;
        return true;
      });

      this.renderReviews(filtered);
      this.updateStats(filtered);
    }

    renderReviews(reviews) {
      const list = document.getElementById('dc-reviews-list');
      if (!list) return;

      if (reviews.length === 0) {
        list.innerHTML = '<div class="dc-reviews-empty">Aucun avis correspondant aux filtres</div>';
        return;
      }

      list.innerHTML = reviews.map((review, idx) => `
        <div class="dc-review-item ${review.selected ? 'selected' : ''}" data-id="${review.id}">
          <div class="dc-reviews-checkbox">✓</div>
          <div class="dc-review-header">
            <span class="dc-review-author">${this.escapeHtml(review.author)}</span>
            <span class="dc-review-rating">${'★'.repeat(Math.floor(review.rating))}${'☆'.repeat(5 - Math.floor(review.rating))}</span>
          </div>
          <div class="dc-review-content">${this.escapeHtml(review.content.substring(0, 200))}${review.content.length > 200 ? '...' : ''}</div>
          <div class="dc-review-badges">
            ${review.verified ? '<span class="dc-review-badge verified">✓ Vérifié</span>' : ''}
            ${review.images?.length > 0 ? `<span class="dc-review-badge photos">📷 ${review.images.length} photos</span>` : ''}
            ${review.date ? `<span class="dc-review-badge">${review.date}</span>` : ''}
          </div>
        </div>
      `).join('');

      // Bind click events
      list.querySelectorAll('.dc-review-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.dataset.id;
          const review = this.extractedReviews.find(r => r.id === id);
          if (review) {
            review.selected = !review.selected;
            item.classList.toggle('selected', review.selected);
            this.updateStats(reviews);
          }
        });
      });
    }

    updateStats(reviews) {
      const selected = reviews.filter(r => r.selected);
      const withPhotos = reviews.filter(r => r.images?.length > 0);
      const avgRating = reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : '-';

      document.getElementById('dc-reviews-total').textContent = reviews.length;
      document.getElementById('dc-reviews-selected').textContent = selected.length;
      document.getElementById('dc-reviews-avg').textContent = avgRating;
      document.getElementById('dc-reviews-photos').textContent = withPhotos.length;
      document.getElementById('dc-reviews-import-count').textContent = selected.length;
    }

    async importReviews() {
      const selectedReviews = this.extractedReviews.filter(r => r.selected);
      
      if (selectedReviews.length === 0) {
        this.showToast('Aucun avis sélectionné', 'warning');
        return;
      }

      // First, we need to extract reviews if not already done
      if (this.extractedReviews.length === 0) {
        this.extractReviews();
        if (this.extractedReviews.length === 0) {
          this.showToast('Aucun avis détecté - essayez d\'abord le bouton Extraire', 'warning');
          return;
        }
      }

      this.showToast('Import en cours...', 'info');

      try {
        const result = await this.sendReviewsToAPI(selectedReviews);
        if (result.success) {
          this.showToast(`✓ ${result.imported || selectedReviews.length} avis importés!`, 'success');
          this.hide();
        } else if (result.upgrade_required) {
          this.showToast(`⚠️ Upgrade requis: ${result.error}`, 'warning');
        } else {
          throw new Error(result.error || 'Erreur inconnue');
        }
      } catch (error) {
        console.error('[Reviews] Import error:', error);
        this.showToast(`Erreur: ${error.message || 'Erreur lors de l\'import'}`, 'error');
      }
    }

    async sendReviewsToAPI(reviews) {
      return new Promise((resolve, reject) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['extensionToken'], async (result) => {
            if (!result.extensionToken) {
              reject(new Error('Non connecté - veuillez vous reconnecter via la sidebar'));
              return;
            }

            try {
              // Get current product URL to associate reviews
              const currentUrl = window.location.href;
              const productIdMatch = currentUrl.match(/\/item\/(\d+)|\/dp\/([A-Z0-9]+)|\/product\/(\d+)|\/i\/(\d+)/i);
              const externalProductId = productIdMatch ? (productIdMatch[1] || productIdMatch[2] || productIdMatch[3] || productIdMatch[4]) : null;

              // Use extension-sync-realtime with reviews action since extension-import-reviews requires productId
              const response = await fetch(`${CONFIG.API_URL}/extension-sync-realtime`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-extension-token': result.extensionToken
                },
                body: JSON.stringify({
                  action: 'import_products',
                  products: [{
                    title: document.title || 'Produit avec avis',
                    name: document.title || 'Produit avec avis',
                    price: 0,
                    url: currentUrl,
                    source: 'reviews_import',
                    platform: this.platform || 'unknown',
                    externalProductId: externalProductId,
                    reviews: reviews.map(r => ({
                      author: r.author,
                      rating: r.rating,
                      text: r.content,
                      date: r.date,
                      images: r.images || [],
                      verified: r.verified
                    }))
                  }]
                })
              });

              if (response.ok) {
                const data = await response.json();
                if (data.success || data.imported > 0) {
                  resolve({ 
                    success: true, 
                    imported: reviews.length,
                    message: `${reviews.length} avis importés avec le produit`
                  });
                } else {
                  reject(new Error(data.error || data.errors?.[0]?.error || 'Erreur d\'import'));
                }
              } else {
                const errorData = await response.json().catch(() => ({}));
                reject(new Error(errorData.error || `Erreur HTTP ${response.status}`));
              }
            } catch (error) {
              console.error('[Reviews] API call error:', error);
              reject(error);
            }
          });
        } else {
          reject(new Error('Chrome API not available - extension context error'));
        }
      });
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    showToast(message, type = 'info') {
      const colors = {
        success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      };

      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${colors[type]};
        color: white;
        padding: 12px 24px;
        border-radius: 10px;
        font-weight: 500;
        font-size: 14px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 100002;
        animation: dc-toast-in 0.3s ease;
      `;
      toast.textContent = message;

      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.animation = 'dc-toast-in 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  }

  // Initialize
  new DropCraftReviewsExtractor();
})();
