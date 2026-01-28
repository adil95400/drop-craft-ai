/**
 * ShopOpti+ Auto Translation Service v5.7.0
 * Provides intelligent translation for product content
 * Supports multiple translation backends with fallback
 */

(function() {
  'use strict';

  if (window.__shopoptiTranslationLoaded) return;
  window.__shopoptiTranslationLoaded = true;

  /**
   * Supported languages with locale codes
   */
  const SUPPORTED_LANGUAGES = {
    fr: { name: 'Français', nativeName: 'Français', flag: '🇫🇷' },
    en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
    de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    it: { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
    nl: { name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
    pl: { name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
    ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    ko: { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' }
  };

  /**
   * Translation quality settings
   */
  const QUALITY_MODES = {
    fast: {
      name: 'Rapide',
      description: 'Traduction basique, idéale pour prévisualisation',
      maxLength: 1000,
      preserveFormatting: false
    },
    balanced: {
      name: 'Équilibré',
      description: 'Bon équilibre qualité/vitesse',
      maxLength: 5000,
      preserveFormatting: true
    },
    quality: {
      name: 'Qualité',
      description: 'Traduction soignée pour publication',
      maxLength: 10000,
      preserveFormatting: true
    }
  };

  class AutoTranslationService {
    constructor() {
      this.cache = new Map();
      this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
      this.pendingTranslations = new Map();
      this.apiEndpoint = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';
      this.defaultSourceLang = 'auto';
      this.defaultTargetLang = 'fr';
    }

    /**
     * Translate product content
     * @param {Object} product - Product data to translate
     * @param {Object} options - Translation options
     * @returns {Promise<TranslatedProduct>}
     */
    async translateProduct(product, options = {}) {
      const targetLang = options.targetLang || this.defaultTargetLang;
      const sourceLang = options.sourceLang || this.detectSourceLanguage(product);
      const mode = options.mode || 'balanced';

      console.log('[Translation] Starting translation:', {
        source: sourceLang,
        target: targetLang,
        mode
      });

      // Skip if same language
      if (sourceLang === targetLang) {
        console.log('[Translation] Source and target language are the same, skipping');
        return { ...product, translated: false, originalLanguage: sourceLang };
      }

      try {
        // Translate each text field
        const translatedProduct = { ...product };
        const fieldsToTranslate = ['name', 'title', 'description', 'shortDescription', 'features'];

        for (const field of fieldsToTranslate) {
          if (product[field]) {
            const originalText = product[field];
            
            // Handle arrays (like features)
            if (Array.isArray(originalText)) {
              translatedProduct[field] = await Promise.all(
                originalText.map(item => this.translateText(item, sourceLang, targetLang, mode))
              );
            } else {
              translatedProduct[field] = await this.translateText(
                originalText, 
                sourceLang, 
                targetLang, 
                mode
              );
            }
          }
        }

        // Translate variant names if present
        if (product.variants && Array.isArray(product.variants)) {
          translatedProduct.variants = await this.translateVariants(
            product.variants, 
            sourceLang, 
            targetLang, 
            mode
          );
        }

        // Store original values
        translatedProduct._original = {
          name: product.name,
          title: product.title,
          description: product.description
        };
        translatedProduct.translated = true;
        translatedProduct.originalLanguage = sourceLang;
        translatedProduct.translatedLanguage = targetLang;
        translatedProduct.translatedAt = new Date().toISOString();

        console.log('[Translation] Completed successfully');
        return translatedProduct;

      } catch (error) {
        console.error('[Translation] Error:', error);
        return { 
          ...product, 
          translated: false, 
          translationError: error.message 
        };
      }
    }

    /**
     * Translate a single text string
     */
    async translateText(text, sourceLang, targetLang, mode) {
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return text;
      }

      // Check cache
      const cacheKey = this.getCacheKey(text, sourceLang, targetLang);
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.translation;
      }

      // Check pending translations (deduplication)
      if (this.pendingTranslations.has(cacheKey)) {
        return this.pendingTranslations.get(cacheKey);
      }

      // Create translation promise
      const translationPromise = this.performTranslation(text, sourceLang, targetLang, mode);
      this.pendingTranslations.set(cacheKey, translationPromise);

      try {
        const translation = await translationPromise;
        
        // Cache result
        this.cache.set(cacheKey, {
          translation,
          timestamp: Date.now()
        });

        return translation;

      } finally {
        this.pendingTranslations.delete(cacheKey);
      }
    }

    /**
     * Perform actual translation via backend
     */
    async performTranslation(text, sourceLang, targetLang, mode) {
      const modeConfig = QUALITY_MODES[mode] || QUALITY_MODES.balanced;

      // Truncate if needed
      let textToTranslate = text;
      if (text.length > modeConfig.maxLength) {
        textToTranslate = text.substring(0, modeConfig.maxLength) + '...';
      }

      try {
        const response = await fetch(`${this.apiEndpoint}/translate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.getAuthToken()}`
          },
          body: JSON.stringify({
            text: textToTranslate,
            source_lang: sourceLang === 'auto' ? null : sourceLang,
            target_lang: targetLang,
            preserve_formatting: modeConfig.preserveFormatting
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.translated_text || data.translation || text;
        }

        // Fallback to local translation hints
        console.warn('[Translation] API failed, using local processing');
        return this.localTranslationFallback(text, sourceLang, targetLang);

      } catch (error) {
        console.error('[Translation] API error:', error);
        return this.localTranslationFallback(text, sourceLang, targetLang);
      }
    }

    /**
     * Local translation fallback (basic processing only)
     */
    localTranslationFallback(text, sourceLang, targetLang) {
      // For now, return original text with a marker
      // In production, could use client-side translation library
      return `[${targetLang.toUpperCase()}] ${text}`;
    }

    /**
     * Translate variant options
     */
    async translateVariants(variants, sourceLang, targetLang, mode) {
      const translated = [];

      for (const variant of variants) {
        const translatedVariant = { ...variant };

        // Translate option names
        if (variant.optionName) {
          translatedVariant.optionName = await this.translateOptionName(
            variant.optionName, 
            sourceLang, 
            targetLang
          );
        }

        // Translate option values (color names, size labels, etc.)
        if (variant.optionValue) {
          translatedVariant.optionValue = await this.translateOptionValue(
            variant.optionValue, 
            sourceLang, 
            targetLang
          );
        }

        // Translate name/title
        if (variant.name) {
          translatedVariant.name = await this.translateText(
            variant.name, 
            sourceLang, 
            targetLang, 
            mode
          );
        }

        translated.push(translatedVariant);
      }

      return translated;
    }

    /**
     * Translate common option names with predefined mappings
     */
    async translateOptionName(name, sourceLang, targetLang) {
      const optionMappings = {
        en: {
          fr: { 'Size': 'Taille', 'Color': 'Couleur', 'Style': 'Style', 'Material': 'Matériau', 'Length': 'Longueur' },
          de: { 'Size': 'Größe', 'Color': 'Farbe', 'Style': 'Stil', 'Material': 'Material', 'Length': 'Länge' },
          es: { 'Size': 'Talla', 'Color': 'Color', 'Style': 'Estilo', 'Material': 'Material', 'Length': 'Longitud' },
          it: { 'Size': 'Taglia', 'Color': 'Colore', 'Style': 'Stile', 'Material': 'Materiale', 'Length': 'Lunghezza' }
        },
        zh: {
          fr: { '尺寸': 'Taille', '颜色': 'Couleur', '尺码': 'Taille', '款式': 'Style' },
          en: { '尺寸': 'Size', '颜色': 'Color', '尺码': 'Size', '款式': 'Style' }
        }
      };

      const langMappings = optionMappings[sourceLang];
      if (langMappings && langMappings[targetLang] && langMappings[targetLang][name]) {
        return langMappings[targetLang][name];
      }

      // Fall back to API translation
      return this.translateText(name, sourceLang, targetLang, 'fast');
    }

    /**
     * Translate option values (colors, sizes, etc.)
     */
    async translateOptionValue(value, sourceLang, targetLang) {
      // Color mappings
      const colorMappings = {
        en: {
          fr: { 'Black': 'Noir', 'White': 'Blanc', 'Red': 'Rouge', 'Blue': 'Bleu', 'Green': 'Vert', 'Yellow': 'Jaune', 'Pink': 'Rose', 'Purple': 'Violet', 'Orange': 'Orange', 'Gray': 'Gris', 'Grey': 'Gris', 'Brown': 'Marron', 'Beige': 'Beige', 'Navy': 'Marine', 'Gold': 'Or', 'Silver': 'Argent' },
          de: { 'Black': 'Schwarz', 'White': 'Weiß', 'Red': 'Rot', 'Blue': 'Blau', 'Green': 'Grün', 'Yellow': 'Gelb', 'Pink': 'Rosa', 'Purple': 'Lila', 'Orange': 'Orange', 'Gray': 'Grau', 'Grey': 'Grau', 'Brown': 'Braun' }
        },
        zh: {
          fr: { '黑色': 'Noir', '白色': 'Blanc', '红色': 'Rouge', '蓝色': 'Bleu', '绿色': 'Vert', '黄色': 'Jaune', '粉色': 'Rose', '紫色': 'Violet', '橙色': 'Orange', '灰色': 'Gris', '棕色': 'Marron' },
          en: { '黑色': 'Black', '白色': 'White', '红色': 'Red', '蓝色': 'Blue', '绿色': 'Green', '黄色': 'Yellow', '粉色': 'Pink', '紫色': 'Purple', '橙色': 'Orange', '灰色': 'Gray', '棕色': 'Brown' }
        }
      };

      const langMappings = colorMappings[sourceLang];
      if (langMappings && langMappings[targetLang]) {
        // Check each mapping
        for (const [original, translated] of Object.entries(langMappings[targetLang])) {
          if (value.toLowerCase() === original.toLowerCase()) {
            return translated;
          }
        }
      }

      // Size labels typically don't need translation (S, M, L, XL, etc.)
      const sizePattern = /^(XXS|XS|S|M|L|XL|XXL|XXXL|\d+)$/i;
      if (sizePattern.test(value.trim())) {
        return value;
      }

      // Fall back to API for other values
      return this.translateText(value, sourceLang, targetLang, 'fast');
    }

    /**
     * Detect source language from product content
     */
    detectSourceLanguage(product) {
      const text = (product.name || '') + ' ' + (product.description || '').substring(0, 200);
      
      // Chinese character detection
      if (/[\u4e00-\u9fa5]/.test(text)) {
        return 'zh';
      }

      // Japanese character detection
      if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
        return 'ja';
      }

      // Korean character detection
      if (/[\uac00-\ud7a3]/.test(text)) {
        return 'ko';
      }

      // Arabic character detection
      if (/[\u0600-\u06ff]/.test(text)) {
        return 'ar';
      }

      // Russian/Cyrillic detection
      if (/[\u0400-\u04ff]/.test(text)) {
        return 'ru';
      }

      // Default to English for Latin scripts
      // Could enhance with language-specific word detection
      return 'en';
    }

    /**
     * Batch translate multiple products
     */
    async translateProducts(products, options = {}) {
      const results = [];
      const batchSize = options.batchSize || 3;
      const onProgress = options.onProgress || (() => {});

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        
        const batchResults = await Promise.all(
          batch.map(product => this.translateProduct(product, options))
        );

        results.push(...batchResults);
        
        onProgress({
          completed: results.length,
          total: products.length,
          percent: Math.round((results.length / products.length) * 100)
        });
      }

      return results;
    }

    /**
     * Translate reviews
     */
    async translateReviews(reviews, targetLang) {
      const translated = [];

      for (const review of reviews) {
        const translatedReview = { ...review };
        
        if (review.text || review.content || review.body) {
          const originalText = review.text || review.content || review.body;
          const sourceLang = this.detectTextLanguage(originalText);
          
          if (sourceLang !== targetLang) {
            const translatedText = await this.translateText(
              originalText, 
              sourceLang, 
              targetLang, 
              'balanced'
            );
            
            translatedReview.translatedText = translatedText;
            translatedReview.originalText = originalText;
            translatedReview.originalLanguage = sourceLang;
          }
        }

        translated.push(translatedReview);
      }

      return translated;
    }

    /**
     * Detect language of a text sample
     */
    detectTextLanguage(text) {
      if (!text || text.length < 10) return 'en';

      // Reuse product language detection
      return this.detectSourceLanguage({ name: text, description: '' });
    }

    /**
     * Get cache key
     */
    getCacheKey(text, source, target) {
      const hash = this.simpleHash(text);
      return `${source}_${target}_${hash}`;
    }

    /**
     * Simple hash function for cache keys
     */
    simpleHash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(36);
    }

    /**
     * Get auth token
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
     * Clear translation cache
     */
    clearCache() {
      this.cache.clear();
    }

    /**
     * Get supported languages
     */
    getSupportedLanguages() {
      return SUPPORTED_LANGUAGES;
    }

    /**
     * Get quality modes
     */
    getQualityModes() {
      return QUALITY_MODES;
    }

    /**
     * Set default target language
     */
    setDefaultTargetLanguage(lang) {
      if (SUPPORTED_LANGUAGES[lang]) {
        this.defaultTargetLang = lang;
        return true;
      }
      return false;
    }

    /**
     * Get translation stats
     */
    getStats() {
      return {
        cacheSize: this.cache.size,
        pendingTranslations: this.pendingTranslations.size,
        supportedLanguages: Object.keys(SUPPORTED_LANGUAGES).length
      };
    }
  }

  // Export singleton
  window.ShopOptiTranslation = new AutoTranslationService();

  console.log('[ShopOpti+] Auto Translation Service v5.7.0 loaded');

})();
