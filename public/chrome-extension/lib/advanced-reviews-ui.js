/**
 * ShopOpti+ - Advanced Reviews Import UI v5.7.0
 * Full-featured interface for filtering, previewing, and importing reviews
 * Inspired by Ali Reviews with filtering, translation, and video support
 */

(function() {
  'use strict';

  const VERSION = '5.7.0';
  const API_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';

  class AdvancedReviewsUI {
    constructor(options = {}) {
      this.options = {
        productId: options.productId,
        productTitle: options.productTitle,
        maxReviews: options.maxReviews || 100,
        apiUrl: options.apiUrl || API_URL,
        onImport: options.onImport || (() => {}),
        onClose: options.onClose || (() => {})
      };
      
      this.reviews = [];
      this.filteredReviews = [];
      this.selectedReviews = new Set();
      this.filters = {
        minRating: 0,
        withPhotos: false,
        withVideos: false,
        verified: false,
        translated: false,
        countries: []
      };
      
      this.isLoading = false;
      this.isOpen = false;
    }

    /**
     * Open the advanced reviews panel
     */
    async open(reviews = []) {
      if (this.isOpen) return;
      this.isOpen = true;
      
      this.reviews = reviews;
      this.filteredReviews = [...reviews];
      
      this.injectStyles();
      this.render();
      this.bindEvents();
      this.updateStats();
    }

    /**
     * Close the panel
     */
    close() {
      const panel = document.getElementById('shopopti-advanced-reviews');
      if (panel) {
        panel.classList.remove('active');
        setTimeout(() => {
          panel.remove();
          document.getElementById('shopopti-advanced-reviews-styles')?.remove();
        }, 300);
      }
      this.isOpen = false;
      this.options.onClose();
    }

    /**
     * Inject CSS styles
     */
    injectStyles() {
      const existingStyles = document.getElementById('shopopti-advanced-reviews-styles');
      if (existingStyles) existingStyles.remove();

      const style = document.createElement('style');
      style.id = 'shopopti-advanced-reviews-styles';
      style.textContent = `
        .shopopti-adv-reviews {
          position: fixed;
          top: 0;
          right: 0;
          width: 520px;
          height: 100vh;
          background: linear-gradient(165deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          border-left: 1px solid rgba(59, 130, 246, 0.2);
          z-index: 2147483647;
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.3s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-shadow: -10px 0 40px rgba(0, 0, 0, 0.5);
        }
        
        .shopopti-adv-reviews.active {
          transform: translateX(0);
        }
        
        .shopopti-adv-header {
          padding: 20px 24px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .shopopti-adv-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        
        .shopopti-adv-title {
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
          font-size: 18px;
          font-weight: 700;
        }
        
        .shopopti-adv-title svg {
          width: 28px;
          height: 28px;
          color: #f59e0b;
        }
        
        .shopopti-adv-badge {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 12px;
          font-weight: 600;
        }
        
        .shopopti-adv-close {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #94a3b8;
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .shopopti-adv-close:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        
        .shopopti-adv-stats {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
        }
        
        .shopopti-adv-stat {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 12px 8px;
          text-align: center;
        }
        
        .shopopti-adv-stat-value {
          color: white;
          font-size: 18px;
          font-weight: 700;
        }
        
        .shopopti-adv-stat-value.gold { color: #f59e0b; }
        .shopopti-adv-stat-value.green { color: #10b981; }
        .shopopti-adv-stat-value.blue { color: #3b82f6; }
        .shopopti-adv-stat-value.purple { color: #8b5cf6; }
        
        .shopopti-adv-stat-label {
          color: #64748b;
          font-size: 10px;
          margin-top: 4px;
          text-transform: uppercase;
        }
        
        .shopopti-adv-filters {
          padding: 16px 24px;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .shopopti-adv-filters-title {
          color: #94a3b8;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .shopopti-adv-filters-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        
        .shopopti-adv-filter {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }
        
        .shopopti-adv-filter:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        
        .shopopti-adv-filter.active {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.5);
        }
        
        .shopopti-adv-filter input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: #3b82f6;
          cursor: pointer;
        }
        
        .shopopti-adv-filter-label {
          color: #e2e8f0;
          font-size: 12px;
          flex: 1;
        }
        
        .shopopti-adv-filter-count {
          color: #64748b;
          font-size: 11px;
        }
        
        .shopopti-adv-rating-filter {
          grid-column: span 3;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          padding: 10px 12px;
          border-radius: 10px;
        }
        
        .shopopti-adv-rating-filter-label {
          color: #e2e8f0;
          font-size: 12px;
          white-space: nowrap;
        }
        
        .shopopti-adv-rating-stars {
          display: flex;
          gap: 4px;
          flex: 1;
        }
        
        .shopopti-adv-rating-star {
          width: 28px;
          height: 28px;
          background: rgba(255, 255, 255, 0.08);
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .shopopti-adv-rating-star.active,
        .shopopti-adv-rating-star:hover {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }
        
        .shopopti-adv-list {
          flex: 1;
          overflow-y: auto;
          padding: 16px 24px;
        }
        
        .shopopti-adv-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .shopopti-adv-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .shopopti-adv-list::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 3px;
        }
        
        .shopopti-adv-review {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
          position: relative;
        }
        
        .shopopti-adv-review:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        
        .shopopti-adv-review.selected {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }
        
        .shopopti-adv-review-checkbox {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 20px;
          height: 20px;
          accent-color: #3b82f6;
        }
        
        .shopopti-adv-review-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .shopopti-adv-review-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 14px;
          overflow: hidden;
        }
        
        .shopopti-adv-review-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .shopopti-adv-review-meta {
          flex: 1;
        }
        
        .shopopti-adv-review-author {
          color: white;
          font-size: 14px;
          font-weight: 600;
        }
        
        .shopopti-adv-review-date {
          color: #64748b;
          font-size: 11px;
        }
        
        .shopopti-adv-review-rating {
          display: flex;
          gap: 2px;
        }
        
        .shopopti-adv-review-rating svg {
          width: 14px;
          height: 14px;
          color: #f59e0b;
        }
        
        .shopopti-adv-review-rating svg.empty {
          color: #475569;
        }
        
        .shopopti-adv-review-content {
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.6;
          margin-bottom: 12px;
        }
        
        .shopopti-adv-review-media {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .shopopti-adv-review-media-item {
          width: 64px;
          height: 64px;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
        }
        
        .shopopti-adv-review-media-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .shopopti-adv-review-media-item.video::after {
          content: '▶';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.7);
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
        }
        
        .shopopti-adv-review-badges {
          display: flex;
          gap: 6px;
          margin-top: 10px;
        }
        
        .shopopti-adv-review-badge {
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.08);
          color: #94a3b8;
        }
        
        .shopopti-adv-review-badge.verified {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }
        
        .shopopti-adv-review-badge.has-media {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
        }
        
        .shopopti-adv-review-badge.has-video {
          background: rgba(139, 92, 246, 0.15);
          color: #a78bfa;
        }
        
        .shopopti-adv-footer {
          padding: 16px 24px;
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .shopopti-adv-footer-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        
        .shopopti-adv-selected-count {
          color: #94a3b8;
          font-size: 13px;
        }
        
        .shopopti-adv-selected-count strong {
          color: #3b82f6;
        }
        
        .shopopti-adv-select-actions {
          display: flex;
          gap: 8px;
        }
        
        .shopopti-adv-select-btn {
          background: rgba(255, 255, 255, 0.08);
          border: none;
          color: #e2e8f0;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .shopopti-adv-select-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        
        .shopopti-adv-import-btn {
          width: 100%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: none;
          color: white;
          padding: 14px 24px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .shopopti-adv-import-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        
        .shopopti-adv-import-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .shopopti-adv-empty {
          text-align: center;
          padding: 60px 20px;
          color: #64748b;
        }
        
        .shopopti-adv-empty svg {
          width: 64px;
          height: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        
        .shopopti-adv-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }
        
        .shopopti-adv-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(59, 130, 246, 0.2);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: shopopti-spin 0.8s linear infinite;
        }
        
        @keyframes shopopti-spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    /**
     * Render the panel
     */
    render() {
      const panel = document.createElement('div');
      panel.id = 'shopopti-advanced-reviews';
      panel.className = 'shopopti-adv-reviews';
      
      panel.innerHTML = `
        <div class="shopopti-adv-header">
          <div class="shopopti-adv-header-top">
            <div class="shopopti-adv-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Import Avis
              <span class="shopopti-adv-badge">PRO</span>
            </div>
            <button class="shopopti-adv-close" id="shopopti-adv-close">✕</button>
          </div>
          
          <div class="shopopti-adv-stats">
            <div class="shopopti-adv-stat">
              <div class="shopopti-adv-stat-value" id="stat-total">${this.reviews.length}</div>
              <div class="shopopti-adv-stat-label">Total</div>
            </div>
            <div class="shopopti-adv-stat">
              <div class="shopopti-adv-stat-value gold" id="stat-rating">0.0</div>
              <div class="shopopti-adv-stat-label">Note</div>
            </div>
            <div class="shopopti-adv-stat">
              <div class="shopopti-adv-stat-value green" id="stat-photos">0</div>
              <div class="shopopti-adv-stat-label">Photos</div>
            </div>
            <div class="shopopti-adv-stat">
              <div class="shopopti-adv-stat-value purple" id="stat-videos">0</div>
              <div class="shopopti-adv-stat-label">Vidéos</div>
            </div>
            <div class="shopopti-adv-stat">
              <div class="shopopti-adv-stat-value blue" id="stat-verified">0</div>
              <div class="shopopti-adv-stat-label">Vérifiés</div>
            </div>
          </div>
        </div>
        
        <div class="shopopti-adv-filters">
          <div class="shopopti-adv-filters-title">Filtres</div>
          <div class="shopopti-adv-filters-grid">
            <label class="shopopti-adv-filter" data-filter="withPhotos">
              <input type="checkbox" id="filter-photos">
              <span class="shopopti-adv-filter-label">📷 Photos</span>
              <span class="shopopti-adv-filter-count" id="count-photos">0</span>
            </label>
            <label class="shopopti-adv-filter" data-filter="withVideos">
              <input type="checkbox" id="filter-videos">
              <span class="shopopti-adv-filter-label">🎥 Vidéos</span>
              <span class="shopopti-adv-filter-count" id="count-videos">0</span>
            </label>
            <label class="shopopti-adv-filter" data-filter="verified">
              <input type="checkbox" id="filter-verified">
              <span class="shopopti-adv-filter-label">✓ Vérifiés</span>
              <span class="shopopti-adv-filter-count" id="count-verified">0</span>
            </label>
            
            <div class="shopopti-adv-rating-filter">
              <span class="shopopti-adv-rating-filter-label">Note min:</span>
              <div class="shopopti-adv-rating-stars">
                ${[1,2,3,4,5].map(i => `
                  <button class="shopopti-adv-rating-star" data-rating="${i}">
                    ★
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
        
        <div class="shopopti-adv-list" id="shopopti-reviews-list">
          ${this.renderReviewsList()}
        </div>
        
        <div class="shopopti-adv-footer">
          <div class="shopopti-adv-footer-top">
            <span class="shopopti-adv-selected-count">
              <strong id="selected-count">0</strong> avis sélectionnés
            </span>
            <div class="shopopti-adv-select-actions">
              <button class="shopopti-adv-select-btn" id="select-all">Tout</button>
              <button class="shopopti-adv-select-btn" id="select-none">Aucun</button>
              <button class="shopopti-adv-select-btn" id="select-best">Top 5★</button>
            </div>
          </div>
          <button class="shopopti-adv-import-btn" id="import-reviews" disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Importer les avis sélectionnés
          </button>
        </div>
      `;
      
      document.body.appendChild(panel);
      
      // Animate in
      requestAnimationFrame(() => {
        panel.classList.add('active');
      });
    }

    /**
     * Render reviews list
     */
    renderReviewsList() {
      if (this.filteredReviews.length === 0) {
        return `
          <div class="shopopti-adv-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>Aucun avis trouvé</div>
          </div>
        `;
      }

      return this.filteredReviews.map((review, index) => `
        <div class="shopopti-adv-review ${this.selectedReviews.has(index) ? 'selected' : ''}" 
             data-index="${index}">
          <input type="checkbox" class="shopopti-adv-review-checkbox" 
                 ${this.selectedReviews.has(index) ? 'checked' : ''}>
          <div class="shopopti-adv-review-header">
            <div class="shopopti-adv-review-avatar">
              ${review.avatar ? `<img src="${review.avatar}" alt="">` : this.getInitials(review.author)}
            </div>
            <div class="shopopti-adv-review-meta">
              <div class="shopopti-adv-review-author">${this.escapeHtml(review.author || 'Anonymous')}</div>
              <div class="shopopti-adv-review-date">${review.date || ''}</div>
            </div>
            <div class="shopopti-adv-review-rating">
              ${this.renderStars(review.rating || 5)}
            </div>
          </div>
          <div class="shopopti-adv-review-content">
            ${this.escapeHtml(review.content || '')}
          </div>
          ${this.renderReviewMedia(review)}
          ${this.renderReviewBadges(review)}
        </div>
      `).join('');
    }

    /**
     * Render star rating
     */
    renderStars(rating) {
      return [1,2,3,4,5].map(i => `
        <svg class="${i <= rating ? '' : 'empty'}" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      `).join('');
    }

    /**
     * Render review media
     */
    renderReviewMedia(review) {
      const images = review.images || [];
      const videos = review.videos || [];
      
      if (images.length === 0 && videos.length === 0) return '';
      
      return `
        <div class="shopopti-adv-review-media">
          ${images.slice(0, 4).map(img => `
            <div class="shopopti-adv-review-media-item">
              <img src="${typeof img === 'string' ? img : img.url}" alt="">
            </div>
          `).join('')}
          ${videos.slice(0, 2).map(video => `
            <div class="shopopti-adv-review-media-item video">
              <img src="${video.thumbnail || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23334155"/></svg>'}" alt="">
            </div>
          `).join('')}
        </div>
      `;
    }

    /**
     * Render review badges
     */
    renderReviewBadges(review) {
      const badges = [];
      
      if (review.verified) badges.push('<span class="shopopti-adv-review-badge verified">✓ Vérifié</span>');
      if (review.images?.length > 0) badges.push(`<span class="shopopti-adv-review-badge has-media">📷 ${review.images.length}</span>`);
      if (review.videos?.length > 0) badges.push(`<span class="shopopti-adv-review-badge has-video">🎥 ${review.videos.length}</span>`);
      if (review.country) badges.push(`<span class="shopopti-adv-review-badge">${review.country}</span>`);
      
      return badges.length > 0 ? `<div class="shopopti-adv-review-badges">${badges.join('')}</div>` : '';
    }

    /**
     * Bind event handlers
     */
    bindEvents() {
      // Close button
      document.getElementById('shopopti-adv-close')?.addEventListener('click', () => this.close());

      // Filter checkboxes
      document.querySelectorAll('.shopopti-adv-filter input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => this.onFilterChange());
      });

      // Rating filter
      document.querySelectorAll('.shopopti-adv-rating-star').forEach(star => {
        star.addEventListener('click', (e) => {
          const rating = parseInt(e.target.dataset.rating);
          this.filters.minRating = this.filters.minRating === rating ? 0 : rating;
          this.updateRatingFilter();
          this.applyFilters();
        });
      });

      // Review selection
      document.getElementById('shopopti-reviews-list')?.addEventListener('click', (e) => {
        const reviewEl = e.target.closest('.shopopti-adv-review');
        if (reviewEl && !e.target.matches('input, img, .shopopti-adv-review-media-item')) {
          const index = parseInt(reviewEl.dataset.index);
          this.toggleReviewSelection(index);
        }
      });

      // Select all/none/best
      document.getElementById('select-all')?.addEventListener('click', () => this.selectAll());
      document.getElementById('select-none')?.addEventListener('click', () => this.selectNone());
      document.getElementById('select-best')?.addEventListener('click', () => this.selectBest());

      // Import button
      document.getElementById('import-reviews')?.addEventListener('click', () => this.importSelected());
    }

    /**
     * Handle filter change
     */
    onFilterChange() {
      this.filters.withPhotos = document.getElementById('filter-photos')?.checked || false;
      this.filters.withVideos = document.getElementById('filter-videos')?.checked || false;
      this.filters.verified = document.getElementById('filter-verified')?.checked || false;
      
      this.applyFilters();
    }

    /**
     * Update rating filter UI
     */
    updateRatingFilter() {
      document.querySelectorAll('.shopopti-adv-rating-star').forEach(star => {
        const rating = parseInt(star.dataset.rating);
        star.classList.toggle('active', rating <= this.filters.minRating);
      });
    }

    /**
     * Apply filters
     */
    applyFilters() {
      this.filteredReviews = this.reviews.filter(review => {
        if (this.filters.minRating > 0 && (review.rating || 5) < this.filters.minRating) return false;
        if (this.filters.withPhotos && (!review.images || review.images.length === 0)) return false;
        if (this.filters.withVideos && (!review.videos || review.videos.length === 0)) return false;
        if (this.filters.verified && !review.verified) return false;
        return true;
      });

      // Clear selection
      this.selectedReviews.clear();
      
      // Re-render list
      const listEl = document.getElementById('shopopti-reviews-list');
      if (listEl) listEl.innerHTML = this.renderReviewsList();
      
      this.updateSelectedCount();
    }

    /**
     * Toggle review selection
     */
    toggleReviewSelection(index) {
      if (this.selectedReviews.has(index)) {
        this.selectedReviews.delete(index);
      } else {
        this.selectedReviews.add(index);
      }
      
      // Update UI
      const reviewEl = document.querySelector(`.shopopti-adv-review[data-index="${index}"]`);
      const checkbox = reviewEl?.querySelector('.shopopti-adv-review-checkbox');
      if (reviewEl) reviewEl.classList.toggle('selected', this.selectedReviews.has(index));
      if (checkbox) checkbox.checked = this.selectedReviews.has(index);
      
      this.updateSelectedCount();
    }

    /**
     * Select all filtered reviews
     */
    selectAll() {
      this.filteredReviews.forEach((_, index) => this.selectedReviews.add(index));
      this.refreshSelectionUI();
    }

    /**
     * Deselect all
     */
    selectNone() {
      this.selectedReviews.clear();
      this.refreshSelectionUI();
    }

    /**
     * Select best (5-star) reviews
     */
    selectBest() {
      this.selectedReviews.clear();
      this.filteredReviews.forEach((review, index) => {
        if ((review.rating || 5) >= 5) {
          this.selectedReviews.add(index);
        }
      });
      this.refreshSelectionUI();
    }

    /**
     * Refresh selection UI
     */
    refreshSelectionUI() {
      document.querySelectorAll('.shopopti-adv-review').forEach(el => {
        const index = parseInt(el.dataset.index);
        const checkbox = el.querySelector('.shopopti-adv-review-checkbox');
        el.classList.toggle('selected', this.selectedReviews.has(index));
        if (checkbox) checkbox.checked = this.selectedReviews.has(index);
      });
      this.updateSelectedCount();
    }

    /**
     * Update selected count
     */
    updateSelectedCount() {
      const countEl = document.getElementById('selected-count');
      const importBtn = document.getElementById('import-reviews');
      
      if (countEl) countEl.textContent = this.selectedReviews.size;
      if (importBtn) importBtn.disabled = this.selectedReviews.size === 0;
    }

    /**
     * Update stats
     */
    updateStats() {
      const withPhotos = this.reviews.filter(r => r.images?.length > 0).length;
      const withVideos = this.reviews.filter(r => r.videos?.length > 0).length;
      const verified = this.reviews.filter(r => r.verified).length;
      const avgRating = this.reviews.length > 0
        ? (this.reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / this.reviews.length).toFixed(1)
        : '0.0';

      document.getElementById('stat-total').textContent = this.reviews.length;
      document.getElementById('stat-rating').textContent = avgRating;
      document.getElementById('stat-photos').textContent = withPhotos;
      document.getElementById('stat-videos').textContent = withVideos;
      document.getElementById('stat-verified').textContent = verified;

      document.getElementById('count-photos').textContent = withPhotos;
      document.getElementById('count-videos').textContent = withVideos;
      document.getElementById('count-verified').textContent = verified;
    }

    /**
     * Import selected reviews
     */
    async importSelected() {
      if (this.selectedReviews.size === 0) return;

      const selectedReviews = [...this.selectedReviews].map(index => this.filteredReviews[index]);
      
      this.options.onImport(selectedReviews);
      this.close();
    }

    // Utility methods
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    getInitials(name) {
      if (!name) return '?';
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
  }

  // Export
  window.AdvancedReviewsUI = AdvancedReviewsUI;

})();
