import { supabase } from "@/integrations/supabase/client";
import { cacheService } from "./cache/CacheService";

interface TranslationResult {
  translations: string[];
  stats: {
    total: number;
    cached: number;
    translated: number;
    processingTimeMs: number;
  };
}

interface TranslationOptions {
  context?: 'product' | 'description' | 'review' | 'general';
  useLocalCache?: boolean;
}

export class LibreTranslateService {
  private static readonly CACHE_PREFIX = 'libre_translate_';
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly MAX_BATCH_SIZE = 50;
  private static readonly SUPPORTED_LANGUAGES = [
    'fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh', 'ar'
  ];

  /**
   * Translate a single text
   */
  static async translateText(
    text: string,
    targetLang: string,
    sourceLang = 'auto',
    options: TranslationOptions = {}
  ): Promise<string> {
    if (!text || text.trim() === '') return '';
    
    const results = await this.translateBatch([text], targetLang, sourceLang, options);
    return results.translations[0] || text;
  }

  /**
   * Translate multiple texts in a batch (efficient)
   */
  static async translateBatch(
    texts: string[],
    targetLang: string,
    sourceLang = 'auto',
    options: TranslationOptions = {}
  ): Promise<TranslationResult> {
    const { context = 'general', useLocalCache = true } = options;
    
    // Validate target language
    if (!this.SUPPORTED_LANGUAGES.includes(targetLang)) {
      console.warn(`Unsupported language: ${targetLang}, falling back to 'en'`);
      targetLang = 'en';
    }

    // Filter out empty texts and track indices
    const nonEmptyTexts: { text: string; index: number }[] = [];
    texts.forEach((text, index) => {
      if (text && text.trim() !== '') {
        nonEmptyTexts.push({ text, index });
      }
    });

    if (nonEmptyTexts.length === 0) {
      return {
        translations: texts.map(() => ''),
        stats: { total: 0, cached: 0, translated: 0, processingTimeMs: 0 }
      };
    }

    // Check local cache first
    const translations: string[] = [...texts];
    const textsToTranslate: { text: string; index: number }[] = [];
    let localCacheHits = 0;

    if (useLocalCache) {
      for (const item of nonEmptyTexts) {
        const cacheKey = this.getCacheKey(item.text, sourceLang, targetLang);
        const cached = cacheService.get<string>(cacheKey);
        
        if (cached) {
          translations[item.index] = cached;
          localCacheHits++;
        } else {
          textsToTranslate.push(item);
        }
      }
    } else {
      textsToTranslate.push(...nonEmptyTexts);
    }

    // If all cached locally, return early
    if (textsToTranslate.length === 0) {
      return {
        translations,
        stats: {
          total: texts.length,
          cached: localCacheHits,
          translated: 0,
          processingTimeMs: 0
        }
      };
    }

    // Split into batches if needed
    const batches: { text: string; index: number }[][] = [];
    for (let i = 0; i < textsToTranslate.length; i += this.MAX_BATCH_SIZE) {
      batches.push(textsToTranslate.slice(i, i + this.MAX_BATCH_SIZE));
    }

    const startTime = Date.now();
    let totalCached = 0;
    let totalTranslated = 0;

    // Process each batch
    for (const batch of batches) {
      try {
        const { data, error } = await supabase.functions.invoke('libretranslate-proxy', {
          body: {
            texts: batch.map(item => item.text),
            sourceLang,
            targetLang,
            context
          }
        });

        if (error) {
          console.error('Translation error:', error);
          // Keep original texts on error
          continue;
        }

        if (data?.success && data.translations) {
          // Map translations back to original indices
          data.translations.forEach((translated: string, batchIndex: number) => {
            const originalItem = batch[batchIndex];
            translations[originalItem.index] = translated;
            
            // Cache locally
            if (useLocalCache) {
              const cacheKey = this.getCacheKey(originalItem.text, sourceLang, targetLang);
              cacheService.set(cacheKey, translated, this.CACHE_TTL);
            }
          });

          totalCached += data.stats?.cached || 0;
          totalTranslated += data.stats?.translated || 0;
        }
      } catch (err) {
        console.error('Batch translation failed:', err);
      }

      // Small delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    return {
      translations,
      stats: {
        total: texts.length,
        cached: localCacheHits + totalCached,
        translated: totalTranslated,
        processingTimeMs: Date.now() - startTime
      }
    };
  }

  /**
   * Translate product data (title, description, etc.)
   */
  static async translateProduct(
    product: {
      title?: string;
      description?: string;
      shortDescription?: string;
      tags?: string[];
    },
    targetLang: string,
    sourceLang = 'auto'
  ): Promise<{
    title: string;
    description: string;
    shortDescription: string;
    tags: string[];
  }> {
    const textsToTranslate: string[] = [];
    const mapping: { field: string; index: number }[] = [];

    // Build texts array
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
    if (product.tags?.length) {
      product.tags.forEach((tag, i) => {
        mapping.push({ field: `tag_${i}`, index: textsToTranslate.length });
        textsToTranslate.push(tag);
      });
    }

    const result = await this.translateBatch(textsToTranslate, targetLang, sourceLang, {
      context: 'product'
    });

    // Reconstruct product
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
   * Translate customer reviews
   */
  static async translateReviews(
    reviews: Array<{ content: string; author?: string }>,
    targetLang: string,
    sourceLang = 'auto'
  ): Promise<Array<{ content: string; author?: string; isTranslated: boolean }>> {
    const contents = reviews.map(r => r.content);
    
    const result = await this.translateBatch(contents, targetLang, sourceLang, {
      context: 'review'
    });

    return reviews.map((review, index) => ({
      ...review,
      content: result.translations[index] || review.content,
      isTranslated: result.translations[index] !== review.content
    }));
  }

  /**
   * Detect the language of a text
   */
  static async detectLanguage(text: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('libretranslate-proxy', {
        body: {
          texts: [text],
          sourceLang: 'auto',
          targetLang: 'en' // Detect by attempting translation
        }
      });

      if (error) throw error;
      
      // The backend should return detected language in the future
      // For now, return 'auto' as we don't have explicit detection
      return 'auto';
    } catch {
      return 'auto';
    }
  }

  /**
   * Get supported languages
   */
  static getSupportedLanguages(): { code: string; name: string; flag: string }[] {
    return [
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
    ];
  }

  /**
   * Clear local translation cache
   */
  static clearCache(): void {
    // Clear all translation-related cache entries
    const stats = cacheService.getStats();
    stats.entries
      .filter(key => key.startsWith(this.CACHE_PREFIX))
      .forEach(key => cacheService.delete(key));
  }

  private static getCacheKey(text: string, sourceLang: string, targetLang: string): string {
    // Create a deterministic cache key
    const normalized = text.toLowerCase().trim().substring(0, 100);
    return `${this.CACHE_PREFIX}${sourceLang}_${targetLang}_${btoa(unescape(encodeURIComponent(normalized))).substring(0, 32)}`;
  }
}
