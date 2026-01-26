/**
 * ShopOpti+ Review Translator v5.7.0
 * Extended language support for review translation
 * Supports: FR, EN, ES, DE, IT, PT, NL, PL, RU, ZH, TH, VI, AR, JA, KO
 */

const ReviewTranslator = {
  VERSION: '5.7.0',
  
  // Supported languages with display names
  languages: {
    // European languages
    fr: { name: 'Français', native: 'Français', flag: '🇫🇷' },
    en: { name: 'English', native: 'English', flag: '🇬🇧' },
    es: { name: 'Espagnol', native: 'Español', flag: '🇪🇸' },
    de: { name: 'Allemand', native: 'Deutsch', flag: '🇩🇪' },
    it: { name: 'Italien', native: 'Italiano', flag: '🇮🇹' },
    pt: { name: 'Portugais', native: 'Português', flag: '🇵🇹' },
    nl: { name: 'Néerlandais', native: 'Nederlands', flag: '🇳🇱' },
    pl: { name: 'Polonais', native: 'Polski', flag: '🇵🇱' },
    
    // Asian languages
    zh: { name: 'Chinois', native: '中文', flag: '🇨🇳' },
    ja: { name: 'Japonais', native: '日本語', flag: '🇯🇵' },
    ko: { name: 'Coréen', native: '한국어', flag: '🇰🇷' },
    th: { name: 'Thaï', native: 'ไทย', flag: '🇹🇭' },
    vi: { name: 'Vietnamien', native: 'Tiếng Việt', flag: '🇻🇳' },
    
    // Other
    ru: { name: 'Russe', native: 'Русский', flag: '🇷🇺' },
    ar: { name: 'Arabe', native: 'العربية', flag: '🇸🇦' },
    tr: { name: 'Turc', native: 'Türkçe', flag: '🇹🇷' }
  },
  
  // Default target language
  defaultTarget: 'fr',
  
  // API configuration
  apiConfig: {
    primary: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1/translate-reviews',
    fallback: 'https://libretranslate.de/translate',
    timeout: 10000
  },
  
  /**
   * Detect language of text
   */
  detectLanguage(text) {
    if (!text || text.length < 3) return 'unknown';
    
    // Simple detection based on character ranges
    const patterns = {
      zh: /[\u4e00-\u9fff]/,          // Chinese
      ja: /[\u3040-\u309f\u30a0-\u30ff]/, // Japanese
      ko: /[\uac00-\ud7af]/,          // Korean
      ar: /[\u0600-\u06ff]/,          // Arabic
      th: /[\u0e00-\u0e7f]/,          // Thai
      vi: /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i, // Vietnamese
      ru: /[\u0400-\u04ff]/,          // Cyrillic/Russian
      de: /[äöüß]/i,                  // German specific
      fr: /[àâçéèêëîïôûùüÿœæ]/i,      // French specific
      es: /[áéíóúñ¿¡]/i,              // Spanish specific
      pt: /[ãõáéíóúâêôà]/i,           // Portuguese specific
      it: /[àèéìíîòóùú]/i,            // Italian specific
      pl: /[ąćęłńóśźż]/i,             // Polish specific
      tr: /[çğıöşü]/i                 // Turkish specific
    };
    
    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }
    
    // Default to English if Latin characters
    if (/^[a-zA-Z\s.,!?'\"0-9-]+$/.test(text)) {
      return 'en';
    }
    
    return 'unknown';
  },
  
  /**
   * Translate a single review
   */
  async translateReview(review, targetLang = null) {
    targetLang = targetLang || this.defaultTarget;
    const sourceLang = this.detectLanguage(review.content || review.text);
    
    // Skip if same language or unknown
    if (sourceLang === targetLang || sourceLang === 'unknown') {
      return { ...review, translated: false };
    }
    
    try {
      const translatedContent = await this.translateText(
        review.content || review.text,
        sourceLang,
        targetLang
      );
      
      return {
        ...review,
        originalContent: review.content || review.text,
        content: translatedContent,
        translated: true,
        sourceLang,
        targetLang
      };
    } catch (error) {
      console.warn('[ShopOpti+ Translator] Translation failed:', error);
      return { ...review, translated: false, translationError: error.message };
    }
  },
  
  /**
   * Translate multiple reviews in batch
   */
  async translateReviews(reviews, targetLang = null, options = {}) {
    const { maxConcurrent = 5, onProgress } = options;
    targetLang = targetLang || this.defaultTarget;
    
    const results = [];
    const batches = this.chunkArray(reviews, maxConcurrent);
    let processed = 0;
    
    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(review => this.translateReview(review, targetLang))
      );
      results.push(...batchResults);
      processed += batch.length;
      
      if (onProgress) {
        onProgress({
          processed,
          total: reviews.length,
          percentage: Math.round(processed / reviews.length * 100)
        });
      }
    }
    
    return results;
  },
  
  /**
   * Translate text using API or fallback
   */
  async translateText(text, sourceLang, targetLang) {
    // Try primary API first
    try {
      return await this.translateViaPrimary(text, sourceLang, targetLang);
    } catch (primaryError) {
      console.warn('[ShopOpti+ Translator] Primary API failed, trying fallback...');
      
      // Try fallback
      try {
        return await this.translateViaFallback(text, sourceLang, targetLang);
      } catch (fallbackError) {
        throw new Error('Translation failed on all APIs');
      }
    }
  },
  
  /**
   * Translate via primary API (Supabase Edge Function)
   */
  async translateViaPrimary(text, sourceLang, targetLang) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.apiConfig.timeout);
    
    try {
      // Get auth token
      let authHeader = {};
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const { extensionToken } = await chrome.storage.local.get(['extensionToken']);
        if (extensionToken) {
          authHeader = { 'x-extension-token': extensionToken };
        }
      }
      
      const response = await fetch(this.apiConfig.primary, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        },
        body: JSON.stringify({
          text,
          source: sourceLang,
          target: targetLang
        }),
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.translatedText || data.text;
      
    } finally {
      clearTimeout(timeoutId);
    }
  },
  
  /**
   * Translate via LibreTranslate fallback
   */
  async translateViaFallback(text, sourceLang, targetLang) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.apiConfig.timeout);
    
    try {
      const response = await fetch(this.apiConfig.fallback, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: 'text'
        }),
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`Fallback API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.translatedText;
      
    } finally {
      clearTimeout(timeoutId);
    }
  },
  
  /**
   * Get supported languages list
   */
  getSupportedLanguages() {
    return Object.entries(this.languages).map(([code, info]) => ({
      code,
      ...info
    }));
  },
  
  /**
   * Check if language is supported
   */
  isSupported(langCode) {
    return langCode in this.languages;
  },
  
  /**
   * Get language info
   */
  getLanguageInfo(langCode) {
    return this.languages[langCode] || null;
  },
  
  /**
   * Set default target language
   */
  setDefaultTarget(langCode) {
    if (this.isSupported(langCode)) {
      this.defaultTarget = langCode;
      return true;
    }
    return false;
  },
  
  /**
   * Helper: Chunk array into batches
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
  
  /**
   * Generate language selector HTML
   */
  generateLanguageSelectorHTML(selectedCode = 'fr') {
    const languages = this.getSupportedLanguages();
    
    return `
      <div class="sho-lang-selector">
        <label class="sho-lang-label">Traduire vers:</label>
        <select class="sho-lang-select" id="shoTargetLang">
          ${languages.map(lang => `
            <option value="${lang.code}" ${lang.code === selectedCode ? 'selected' : ''}>
              ${lang.flag} ${lang.name}
            </option>
          `).join('')}
        </select>
      </div>
    `;
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReviewTranslator;
}

if (typeof window !== 'undefined') {
  window.ShopOptiReviewTranslator = ReviewTranslator;
}
