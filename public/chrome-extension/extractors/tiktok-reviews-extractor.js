/**
 * ShopOpti+ - TikTok Shop Reviews Extractor v5.7.0
 * Advanced review extraction with video reviews, filtering, and translation support
 */

(function() {
  'use strict';

  const VERSION = '5.7.0';
  const PLATFORM = 'tiktok_shop';

  class TikTokReviewsExtractor {
    constructor(options = {}) {
      this.options = {
        maxReviews: options.maxReviews || 100,
        minRating: options.minRating || 0,
        withPhotos: options.withPhotos || false,
        withVideos: options.withVideos || false,
        autoScroll: options.autoScroll !== false,
        scrollDelay: options.scrollDelay || 500,
        maxScrollAttempts: options.maxScrollAttempts || 10
      };
      
      this.reviews = [];
      this.scrollAttempts = 0;
      this.lastReviewCount = 0;
    }

    /**
     * Main extraction method
     */
    async extract() {
      console.log('[TikTok Reviews] Starting extraction with options:', this.options);
      
      try {
        // Try to find and click "See all reviews" button first
        await this.expandReviews();
        
        // Auto-scroll to load more reviews
        if (this.options.autoScroll) {
          await this.autoScrollReviews();
        }

        // Extract reviews from DOM
        this.extractFromDOM();

        // Extract from scripts for additional reviews
        this.extractFromScripts();

        // Apply filters
        this.applyFilters();

        // Deduplicate
        this.deduplicateReviews();

        console.log(`[TikTok Reviews] Extracted ${this.reviews.length} reviews`);
        return this.reviews;
      } catch (error) {
        console.error('[TikTok Reviews] Extraction failed:', error);
        return this.reviews;
      }
    }

    /**
     * Expand reviews section if collapsed
     */
    async expandReviews() {
      const expandButtons = [
        '[class*="see-all-reviews"]',
        '[class*="view-all-reviews"]',
        '[class*="more-reviews"]',
        '[data-e2e*="review"] [class*="more"]',
        'button:contains("See all")',
        '[class*="ReviewSection"] button'
      ];

      for (const selector of expandButtons) {
        const button = document.querySelector(selector);
        if (button && button.offsetParent !== null) {
          button.click();
          await this.wait(1000);
          console.log('[TikTok Reviews] Expanded reviews section');
          break;
        }
      }
    }

    /**
     * Auto-scroll to load more reviews
     */
    async autoScrollReviews() {
      const reviewContainer = document.querySelector(
        '[class*="review-list"], [class*="ReviewList"], [data-e2e*="review"]'
      ) || document.scrollingElement;

      while (this.scrollAttempts < this.options.maxScrollAttempts) {
        const currentCount = this.countVisibleReviews();
        
        if (currentCount >= this.options.maxReviews) {
          console.log('[TikTok Reviews] Reached max reviews limit');
          break;
        }

        if (currentCount === this.lastReviewCount) {
          this.scrollAttempts++;
          if (this.scrollAttempts >= 3) {
            // Try to click "Load more" button
            const loadMoreClicked = await this.clickLoadMore();
            if (!loadMoreClicked && this.scrollAttempts >= this.options.maxScrollAttempts) {
              console.log('[TikTok Reviews] No more reviews to load');
              break;
            }
          }
        } else {
          this.scrollAttempts = 0;
          this.lastReviewCount = currentCount;
        }

        // Scroll down
        reviewContainer.scrollTo({
          top: reviewContainer.scrollHeight,
          behavior: 'smooth'
        });

        await this.wait(this.options.scrollDelay);
      }
    }

    /**
     * Click load more button if exists
     */
    async clickLoadMore() {
      const loadMoreSelectors = [
        '[class*="load-more"]',
        '[class*="LoadMore"]',
        '[class*="view-more"]',
        'button[class*="more"]'
      ];

      for (const selector of loadMoreSelectors) {
        const button = document.querySelector(selector);
        if (button && button.offsetParent !== null) {
          button.click();
          await this.wait(1000);
          return true;
        }
      }
      return false;
    }

    /**
     * Count visible reviews
     */
    countVisibleReviews() {
      return document.querySelectorAll(
        '[class*="review-item"], [class*="ReviewItem"], [data-e2e*="review-item"]'
      ).length;
    }

    /**
     * Extract reviews from DOM
     */
    extractFromDOM() {
      const reviewContainers = document.querySelectorAll(
        '[class*="review-item"], [class*="ReviewItem"], [data-e2e*="review-item"], [class*="comment-item"]'
      );

      reviewContainers.forEach((container, index) => {
        if (this.reviews.length >= this.options.maxReviews) return;

        try {
          const review = this.parseReviewElement(container);
          if (review && review.content) {
            review.id = `tt-review-${index}-${Date.now()}`;
            this.reviews.push(review);
          }
        } catch (e) {
          console.warn('[TikTok Reviews] Error parsing review:', e);
        }
      });
    }

    /**
     * Parse a single review element
     */
    parseReviewElement(container) {
      const review = {
        author: null,
        avatar: null,
        rating: null,
        content: null,
        date: null,
        images: [],
        videos: [],
        verified: false,
        helpful: 0,
        variant: null,
        country: null,
        platform: PLATFORM
      };

      // Author
      const authorEl = container.querySelector(
        '[class*="user-name"], [class*="author"], [class*="nickname"], [class*="UserName"]'
      );
      if (authorEl) review.author = this.cleanText(authorEl.textContent);

      // Avatar
      const avatarEl = container.querySelector(
        '[class*="avatar"] img, [class*="user-avatar"] img, [class*="Avatar"] img'
      );
      if (avatarEl) review.avatar = avatarEl.src || avatarEl.dataset.src;

      // Rating
      const ratingEl = container.querySelector(
        '[class*="star"], [class*="rating"], [class*="Rating"]'
      );
      if (ratingEl) {
        // Count filled stars
        const filledStars = ratingEl.querySelectorAll(
          '[class*="filled"], [class*="active"], [class*="selected"], svg[fill*="gold"], svg[fill*="yellow"]'
        ).length;
        
        if (filledStars > 0) {
          review.rating = filledStars;
        } else {
          // Try to extract from aria-label or text
          const ratingText = ratingEl.getAttribute('aria-label') || ratingEl.textContent;
          const match = ratingText?.match(/(\d+\.?\d*)/);
          if (match) review.rating = parseFloat(match[1]);
        }
      }

      // Content
      const contentEl = container.querySelector(
        '[class*="content"], [class*="text"], [class*="comment"], [class*="Review-text"]'
      );
      if (contentEl) review.content = this.cleanText(contentEl.textContent);

      // Date
      const dateEl = container.querySelector(
        '[class*="date"], [class*="time"], [class*="Date"], [class*="Time"]'
      );
      if (dateEl) review.date = this.cleanText(dateEl.textContent);

      // Images
      container.querySelectorAll(
        '[class*="review-image"] img, [class*="photo"] img, [class*="ReviewImage"] img'
      ).forEach(img => {
        const src = img.src || img.dataset.src;
        if (src && this.isValidImageUrl(src)) {
          review.images.push(this.getHighResImage(src));
        }
      });

      // Videos
      container.querySelectorAll(
        'video, [class*="video"] video, [data-video-url]'
      ).forEach(video => {
        const src = video.src || video.querySelector('source')?.src || video.dataset.videoUrl;
        if (src) {
          review.videos.push({
            url: src,
            thumbnail: video.poster
          });
        }
      });

      // Also check for video play buttons
      container.querySelectorAll('[class*="video-play"], [class*="play-button"]').forEach(playBtn => {
        const videoUrl = playBtn.dataset.videoUrl || playBtn.closest('[data-video-url]')?.dataset.videoUrl;
        if (videoUrl && !review.videos.some(v => v.url === videoUrl)) {
          review.videos.push({ url: videoUrl });
        }
      });

      // Verified purchase
      review.verified = container.querySelector(
        '[class*="verified"], [class*="Verified"], [data-verified]'
      ) !== null;

      // Helpful count
      const helpfulEl = container.querySelector(
        '[class*="helpful"], [class*="like"], [class*="Helpful"]'
      );
      if (helpfulEl) {
        const match = helpfulEl.textContent?.match(/(\d+)/);
        if (match) review.helpful = parseInt(match[1]);
      }

      // Variant info
      const variantEl = container.querySelector(
        '[class*="variant"], [class*="sku"], [class*="option"], [class*="spec"]'
      );
      if (variantEl) review.variant = this.cleanText(variantEl.textContent);

      // Country/Location
      const countryEl = container.querySelector(
        '[class*="country"], [class*="location"], [class*="flag"]'
      );
      if (countryEl) {
        review.country = this.cleanText(countryEl.textContent) || 
                        countryEl.getAttribute('title') || 
                        countryEl.getAttribute('alt');
      }

      return review;
    }

    /**
     * Extract reviews from embedded scripts
     */
    extractFromScripts() {
      if (this.reviews.length >= this.options.maxReviews) return;

      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const content = script.textContent || '';
        
        const patterns = [
          /"reviews"\s*:\s*(\[[\s\S]*?\])/,
          /"commentList"\s*:\s*(\[[\s\S]*?\])/,
          /"reviewList"\s*:\s*(\[[\s\S]*?\])/
        ];

        for (const pattern of patterns) {
          const match = content.match(pattern);
          if (match) {
            try {
              const scriptReviews = JSON.parse(match[1]);
              for (const r of scriptReviews) {
                if (this.reviews.length >= this.options.maxReviews) break;
                
                const review = this.parseScriptReview(r);
                if (review && review.content && !this.isDuplicate(review)) {
                  this.reviews.push(review);
                }
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    }

    /**
     * Parse review from script data
     */
    parseScriptReview(data) {
      return {
        id: `tt-script-${data.id || Date.now()}`,
        author: data.userName || data.author || data.nickname || 'Anonymous',
        avatar: data.avatar || data.userAvatar,
        rating: data.rating || data.score || data.stars,
        content: data.content || data.text || data.comment,
        date: data.createTime || data.date || data.time,
        images: Array.isArray(data.images) ? data.images : (data.images ? [data.images] : []),
        videos: Array.isArray(data.videos) ? data.videos.map(v => ({ url: v })) : [],
        verified: data.verified || data.isVerified || false,
        helpful: data.helpful || data.likeCount || 0,
        variant: data.variant || data.sku || data.specs,
        country: data.country || data.location,
        platform: PLATFORM
      };
    }

    /**
     * Apply filters based on options
     */
    applyFilters() {
      this.reviews = this.reviews.filter(review => {
        // Min rating filter
        if (this.options.minRating > 0 && review.rating < this.options.minRating) {
          return false;
        }

        // With photos filter
        if (this.options.withPhotos && review.images.length === 0) {
          return false;
        }

        // With videos filter
        if (this.options.withVideos && review.videos.length === 0) {
          return false;
        }

        return true;
      });
    }

    /**
     * Deduplicate reviews
     */
    deduplicateReviews() {
      const seen = new Set();
      this.reviews = this.reviews.filter(review => {
        const key = `${review.author}-${review.content?.substring(0, 50)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    /**
     * Check if review is duplicate
     */
    isDuplicate(review) {
      return this.reviews.some(existing => 
        existing.author === review.author && 
        existing.content?.substring(0, 50) === review.content?.substring(0, 50)
      );
    }

    // Utility methods
    cleanText(text) {
      return text?.trim().replace(/\s+/g, ' ') || null;
    }

    isValidImageUrl(url) {
      if (!url) return false;
      const invalidPatterns = [/analytics/, /tracking/, /pixel/, /beacon/, /1x1/, /spacer/];
      return !invalidPatterns.some(p => p.test(url)) && url.length > 20;
    }

    getHighResImage(url) {
      return url
        .replace(/\/\d+x\d+\//, '/720x720/')
        .replace(/_\d+x\d+/, '_720x720');
    }

    wait(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get summary statistics
     */
    getStatistics() {
      const totalReviews = this.reviews.length;
      const avgRating = totalReviews > 0 
        ? this.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews 
        : 0;
      const withPhotos = this.reviews.filter(r => r.images.length > 0).length;
      const withVideos = this.reviews.filter(r => r.videos.length > 0).length;
      const verified = this.reviews.filter(r => r.verified).length;

      const ratingDistribution = {};
      for (let i = 1; i <= 5; i++) {
        ratingDistribution[i] = this.reviews.filter(r => Math.round(r.rating) === i).length;
      }

      return {
        total: totalReviews,
        averageRating: Math.round(avgRating * 10) / 10,
        withPhotos,
        withVideos,
        verified,
        ratingDistribution
      };
    }
  }

  // Export for use in content script
  window.TikTokReviewsExtractor = TikTokReviewsExtractor;

})();
