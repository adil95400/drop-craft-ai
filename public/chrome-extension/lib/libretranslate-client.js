/**
 * ShopOpti+ - LibreTranslate Client
 * Self-hosted translation via ShopOpti backend proxy
 * v5.6.3
 */

(function() {
  'use strict';

  if (window.__shopOptiLibreTranslateLoaded) return;
  window.__shopOptiLibreTranslateLoaded = true;

  const CONFIG = {
    // Translation goes through our backend, not directly to LibreTranslate
    API_ENDPOINT: '/libretranslate-proxy',
    MAX_BATCH_SIZE: 50,
    CACHE_TTL: 24 * 60 * 60 * 1000, // 24 hours
    SUPPORTED_LANGUAGES: [
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'en', name: 'English', flag: '🇬🇧' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'it', name: 'Italiano', flag: '🇮🇹' },
      { code: 'pt', name: 'Português', flag: '🇵🇹' },
      { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
      { code: 'pl', name: 'Polski', flag: '🇵🇱' },
      { code: 'ru', name: 'Русский', flag: '🇷🇺' },
      { code: 'ja', name: '日本語', flag: '🇯🇵' },
      { code: 'ko', name: '한국어', flag: '🇰🇷' },
      { code: 'zh', name: '中文', flag: '🇨🇳' },
      { code: 'ar', name: 'العربية', flag: '🇸🇦' }
    ]
  };

  class LibreTranslateClient {
    constructor(baseApiUrl) {
      this.baseApiUrl = baseApiUrl || 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';
      this.cache = new Map();
      this.pendingRequests = new Map();
    }

    /**
     * Get supported languages
     */
    getSupportedLanguages() {
      return CONFIG.SUPPORTED_LANGUAGES;
    }

    /**
     * Generate cache key
     */
    getCacheKey(text, sourceLang, targetLang) {
      const normalized = text.toLowerCase().trim().substring(0, 100);
      return `${sourceLang}:${targetLang}:${normalized}`;
    }

    /**
     * Get from local cache
     */
    getFromCache(text, sourceLang, targetLang) {
      const key = this.getCacheKey(text, sourceLang, targetLang);
      const cached = this.cache.get(key);
      
      if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_TTL) {
        return cached.translation;
      }
      
      return null;
    }

    /**
     * Save to local cache
     */
    saveToCache(text, sourceLang, targetLang, translation) {
      const key = this.getCacheKey(text, sourceLang, targetLang);
      this.cache.set(key, {
        translation,
        timestamp: Date.now()
      });
      
      // Limit cache size
      if (this.cache.size > 1000) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }
    }

    /**
     * Translate a single text
     */
    async translate(text, targetLang, sourceLang = 'auto', context = 'general') {
      if (!text || text.trim() === '') return '';
      
      // Check cache first
      const cached = this.getFromCache(text, sourceLang, targetLang);
      if (cached) {
        return cached;
      }
      
      const results = await this.translateBatch([text], targetLang, sourceLang, context);
      return results.translations[0] || text;
    }

    /**
     * Translate multiple texts efficiently
     */
    async translateBatch(texts, targetLang, sourceLang = 'auto', context = 'general') {
      const validTexts = texts.filter(t => t && t.trim() !== '');
      
      if (validTexts.length === 0) {
        return {
          translations: texts.map(() => ''),
          stats: { total: 0, cached: 0, translated: 0 }
        };
      }

      // Check local cache for each text
      const translations = [...texts];
      const textsToTranslate = [];
      const indicesToTranslate = [];
      let localCacheHits = 0;

      texts.forEach((text, index) => {
        if (!text || text.trim() === '') {
          translations[index] = '';
          return;
        }
        
        const cached = this.getFromCache(text, sourceLang, targetLang);
        if (cached) {
          translations[index] = cached;
          localCacheHits++;
        } else {
          textsToTranslate.push(text);
          indicesToTranslate.push(index);
        }
      });

      // All cached locally
      if (textsToTranslate.length === 0) {
        return {
          translations,
          stats: { total: texts.length, cached: localCacheHits, translated: 0 }
        };
      }

      // Split into batches
      const batches = [];
      for (let i = 0; i < textsToTranslate.length; i += CONFIG.MAX_BATCH_SIZE) {
        batches.push({
          texts: textsToTranslate.slice(i, i + CONFIG.MAX_BATCH_SIZE),
          indices: indicesToTranslate.slice(i, i + CONFIG.MAX_BATCH_SIZE)
        });
      }

      let serverCached = 0;
      let serverTranslated = 0;

      // Process batches
      for (const batch of batches) {
        try {
          const response = await this.callApi(batch.texts, targetLang, sourceLang, context);
          
          if (response.success && response.translations) {
            response.translations.forEach((translated, batchIdx) => {
              const originalIdx = batch.indices[batchIdx];
              translations[originalIdx] = translated;
              
              // Save to local cache
              this.saveToCache(batch.texts[batchIdx], sourceLang, targetLang, translated);
            });
            
            serverCached += response.stats?.cached || 0;
            serverTranslated += response.stats?.translated || 0;
          }
        } catch (error) {
          console.error('[LibreTranslate] Batch error:', error);
        }

        // Delay between batches
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(r => setTimeout(r, 100));
        }
      }

      return {
        translations,
        stats: {
          total: texts.length,
          cached: localCacheHits + serverCached,
          translated: serverTranslated
        }
      };
    }

    /**
     * Call the backend translation API
     */
    async callApi(texts, targetLang, sourceLang, context) {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${this.baseApiUrl}/libretranslate-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          texts,
          targetLang,
          sourceLang,
          context
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Translation API error: ${response.status} - ${error}`);
      }

      return await response.json();
    }

    /**
     * Get auth token from storage
     */
    async getAuthToken() {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['authToken'], (result) => {
            resolve(result.authToken || null);
          });
        } else {
          resolve(null);
        }
      });
    }

    /**
     * Translate product data
     */
    async translateProduct(product, targetLang, sourceLang = 'auto') {
      const textsToTranslate = [];
      const mapping = [];

      if (product.title) {
        mapping.push({ field: 'title', index: textsToTranslate.length });
        textsToTranslate.push(product.title);
      }
      if (product.description) {
        mapping.push({ field: 'description', index: textsToTranslate.length });
        textsToTranslate.push(product.description);
      }
      if (product.shortDescription) {
        mapping.push({ field: 'shortDescription', index: textsToTranslate.length });
        textsToTranslate.push(product.shortDescription);
      }
      if (product.tags && Array.isArray(product.tags)) {
        product.tags.forEach((tag, i) => {
          mapping.push({ field: `tag_${i}`, index: textsToTranslate.length });
          textsToTranslate.push(tag);
        });
      }

      const result = await this.translateBatch(textsToTranslate, targetLang, sourceLang, 'product');

      const translated = {
        title: product.title || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        tags: [...(product.tags || [])]
      };

      mapping.forEach(map => {
        if (map.field === 'title') {
          translated.title = result.translations[map.index];
        } else if (map.field === 'description') {
          translated.description = result.translations[map.index];
        } else if (map.field === 'shortDescription') {
          translated.shortDescription = result.translations[map.index];
        } else if (map.field.startsWith('tag_')) {
          const tagIndex = parseInt(map.field.split('_')[1]);
          translated.tags[tagIndex] = result.translations[map.index];
        }
      });

      return translated;
    }

    /**
     * Translate reviews
     */
    async translateReviews(reviews, targetLang, sourceLang = 'auto') {
      const contents = reviews.map(r => r.content || r.text || '');
      
      const result = await this.translateBatch(contents, targetLang, sourceLang, 'review');

      return reviews.map((review, index) => ({
        ...review,
        content: result.translations[index] || review.content || review.text,
        originalContent: review.content || review.text,
        isTranslated: result.translations[index] !== (review.content || review.text)
      }));
    }

    /**
     * Clear local cache
     */
    clearCache() {
      this.cache.clear();
    }

    /**
     * Get cache stats
     */
    getCacheStats() {
      return {
        size: this.cache.size,
        entries: Array.from(this.cache.keys()).slice(0, 20)
      };
    }
  }

  // Export for use in extension
  window.LibreTranslateClient = LibreTranslateClient;
  window.ShopOptiTranslate = new LibreTranslateClient();

  console.log('[ShopOpti+] LibreTranslate client loaded');
})();
