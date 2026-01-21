/**
 * Drop Craft AI - Review Translator Module
 * AI-powered translation for customer reviews
 */

(function() {
  'use strict';

  if (window.__dropCraftReviewTranslatorLoaded) return;
  window.__dropCraftReviewTranslatorLoaded = true;

  const CONFIG = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    SUPPORTED_LANGUAGES: [
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'en', name: 'English', flag: '🇬🇧' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'it', name: 'Italiano', flag: '🇮🇹' },
      { code: 'pt', name: 'Português', flag: '🇵🇹' },
      { code: 'nl', name: 'Nederlands', flag: '🇳🇱' }
    ],
    BATCH_SIZE: 10
  };

  class DropCraftReviewTranslator {
    constructor() {
      this.targetLanguage = 'fr';
      this.translationCache = new Map();
    }

    setTargetLanguage(langCode) {
      this.targetLanguage = langCode;
    }

    getLanguageInfo(code) {
      return CONFIG.SUPPORTED_LANGUAGES.find(l => l.code === code) || CONFIG.SUPPORTED_LANGUAGES[0];
    }

    detectLanguage(text) {
      // Simple language detection based on common words
      const patterns = {
        'zh': /[\u4e00-\u9fff]/,
        'ja': /[\u3040-\u309f\u30a0-\u30ff]/,
        'ko': /[\uac00-\ud7af]/,
        'ru': /[\u0400-\u04ff]/,
        'ar': /[\u0600-\u06ff]/,
        'th': /[\u0e00-\u0e7f]/,
        'vi': /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i,
        'es': /\b(muy|pero|como|para|está|son|los|las|del)\b/i,
        'de': /\b(und|ist|das|die|der|nicht|ich|sie)\b/i,
        'fr': /\b(très|mais|comme|pour|est|sont|les|des|avec)\b/i,
        'pt': /\b(muito|mas|como|para|está|são|dos|das|com)\b/i,
        'it': /\b(molto|ma|come|per|sono|gli|con)\b/i,
        'en': /\b(the|and|is|are|was|were|have|has|this|that|with|for)\b/i
      };

      for (const [lang, pattern] of Object.entries(patterns)) {
        if (pattern.test(text)) return lang;
      }

      return 'unknown';
    }

    async translateReview(review) {
      const cacheKey = `${review.content}_${this.targetLanguage}`;
      
      if (this.translationCache.has(cacheKey)) {
        return this.translationCache.get(cacheKey);
      }

      const sourceLang = this.detectLanguage(review.content);
      
      // No translation needed if same language
      if (sourceLang === this.targetLanguage) {
        return { ...review, translatedContent: review.content, isTranslated: false };
      }

      try {
        const response = await fetch(`${CONFIG.API_URL}/translate-review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: review.content,
            targetLanguage: this.targetLanguage,
            sourceLanguage: sourceLang
          })
        });

        if (!response.ok) {
          // Fallback: return original with flag
          return { 
            ...review, 
            translatedContent: review.content, 
            isTranslated: false,
            sourceLanguage: sourceLang
          };
        }

        const data = await response.json();
        const result = {
          ...review,
          translatedContent: data.translatedText || review.content,
          isTranslated: true,
          sourceLanguage: sourceLang
        };

        this.translationCache.set(cacheKey, result);
        return result;

      } catch (error) {
        console.error('Translation error:', error);
        return { 
          ...review, 
          translatedContent: review.content, 
          isTranslated: false,
          error: error.message 
        };
      }
    }

    async translateBatch(reviews, onProgress) {
      const translatedReviews = [];
      const batches = [];
      
      // Split into batches
      for (let i = 0; i < reviews.length; i += CONFIG.BATCH_SIZE) {
        batches.push(reviews.slice(i, i + CONFIG.BATCH_SIZE));
      }

      let processed = 0;
      
      for (const batch of batches) {
        const batchResults = await Promise.all(
          batch.map(review => this.translateReview(review))
        );
        
        translatedReviews.push(...batchResults);
        processed += batch.length;
        
        if (onProgress) {
          onProgress({
            processed,
            total: reviews.length,
            percentage: Math.round((processed / reviews.length) * 100)
          });
        }
        
        // Small delay between batches to avoid rate limiting
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(r => setTimeout(r, 200));
        }
      }

      return translatedReviews;
    }

    // Local translation fallback using simple word replacement
    localTranslate(text, targetLang) {
      // This is a basic fallback - real translation uses the AI API
      const translations = {
        'fr': {
          'good': 'bon',
          'great': 'super',
          'excellent': 'excellent',
          'bad': 'mauvais',
          'poor': 'médiocre',
          'quality': 'qualité',
          'fast': 'rapide',
          'slow': 'lent',
          'recommend': 'recommande',
          'love': 'adore',
          'perfect': 'parfait',
          'shipping': 'livraison',
          'product': 'produit',
          'arrived': 'arrivé',
          'very': 'très',
          'satisfied': 'satisfait',
          'happy': 'content'
        },
        'en': {
          'bon': 'good',
          'super': 'great',
          'mauvais': 'bad',
          'qualité': 'quality',
          'rapide': 'fast',
          'lent': 'slow',
          'adore': 'love',
          'parfait': 'perfect',
          'livraison': 'shipping',
          'produit': 'product',
          'arrivé': 'arrived',
          'très': 'very',
          'satisfait': 'satisfied',
          'content': 'happy'
        }
      };

      const dict = translations[targetLang];
      if (!dict) return text;

      let translated = text;
      for (const [from, to] of Object.entries(dict)) {
        translated = translated.replace(new RegExp(`\\b${from}\\b`, 'gi'), to);
      }

      return translated;
    }

    renderLanguageSelector(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = `
        <div class="dc-lang-selector">
          <label style="color: #94a3b8; font-size: 12px; margin-right: 8px;">Traduire en:</label>
          <select id="dc-target-lang" style="
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            color: white;
            padding: 6px 10px;
            font-size: 12px;
            cursor: pointer;
          ">
            ${CONFIG.SUPPORTED_LANGUAGES.map(lang => `
              <option value="${lang.code}" ${lang.code === this.targetLanguage ? 'selected' : ''}>
                ${lang.flag} ${lang.name}
              </option>
            `).join('')}
          </select>
        </div>
      `;

      document.getElementById('dc-target-lang')?.addEventListener('change', (e) => {
        this.setTargetLanguage(e.target.value);
      });
    }
  }

  window.DropCraftReviewTranslator = DropCraftReviewTranslator;
})();
