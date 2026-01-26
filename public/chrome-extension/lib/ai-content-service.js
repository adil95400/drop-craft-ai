/**
 * ShopOpti+ AI Content Service v5.7.0
 * AI-powered content optimization for product titles, descriptions, and SEO
 * Integrates with backend AI services
 */

const AIContentService = {
  VERSION: '5.7.0',
  API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
  
  // Content optimization presets
  presets: {
    title: {
      maxLength: 80,
      styles: ['professional', 'catchy', 'seo_optimized', 'minimal']
    },
    description: {
      maxLength: 5000,
      formats: ['html', 'bullet_points', 'paragraph', 'mixed']
    },
    seo: {
      metaTitle: 60,
      metaDescription: 160
    }
  },
  
  /**
   * Optimize product title
   */
  async optimizeTitle(title, options = {}) {
    const style = options.style || 'professional';
    const language = options.language || 'fr';
    const keywords = options.keywords || [];
    
    try {
      const response = await this.callAPI('ai-content-generator', {
        action: 'optimize_title',
        content: title,
        options: {
          style,
          language,
          keywords,
          maxLength: this.presets.title.maxLength,
          removeBrand: options.removeBrand || false,
          removeSpecialChars: options.removeSpecialChars || true
        }
      });
      
      return response;
    } catch (error) {
      console.error('[ShopOpti+ AI] Title optimization error:', error);
      return { success: false, optimized: this.localTitleCleanup(title), error: error.message };
    }
  },
  
  /**
   * Local title cleanup (fallback when API unavailable)
   */
  localTitleCleanup(title) {
    if (!title) return '';
    
    return title
      // Remove excessive punctuation
      .replace(/[!]{2,}/g, '!')
      .replace(/[.]{2,}/g, '.')
      // Remove promotional text
      .replace(/\b(hot sale|new arrival|free shipping|best seller|limited time|sale|promo)\b/gi, '')
      // Remove brackets and their content
      .replace(/\([^)]*\)/g, '')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/【[^】]*】/g, '')
      // Remove size indicators if standalone
      .replace(/\b[SMLXL]{1,3}\b\s*/g, '')
      // Clean whitespace
      .replace(/\s+/g, ' ')
      .trim()
      // Capitalize first letter
      .replace(/^./, c => c.toUpperCase())
      // Limit length
      .substring(0, 80);
  },
  
  /**
   * Generate optimized description
   */
  async generateDescription(productData, options = {}) {
    const format = options.format || 'mixed';
    const language = options.language || 'fr';
    
    try {
      const response = await this.callAPI('ai-content-generator', {
        action: 'generate_description',
        product: {
          title: productData.title,
          description: productData.description,
          specifications: productData.specifications,
          features: productData.features
        },
        options: {
          format,
          language,
          tone: options.tone || 'professional',
          length: options.length || 'medium',
          includeBulletPoints: options.includeBulletPoints !== false,
          includeSEO: options.includeSEO || true
        }
      });
      
      return response;
    } catch (error) {
      console.error('[ShopOpti+ AI] Description generation error:', error);
      return { success: false, description: productData.description, error: error.message };
    }
  },
  
  /**
   * Generate SEO meta tags
   */
  async generateSEOMeta(productData, options = {}) {
    try {
      const response = await this.callAPI('ai-content-generator', {
        action: 'generate_seo',
        product: {
          title: productData.title,
          description: productData.description,
          category: productData.category
        },
        options: {
          language: options.language || 'fr',
          keywords: options.keywords || []
        }
      });
      
      return response;
    } catch (error) {
      console.error('[ShopOpti+ AI] SEO generation error:', error);
      return this.localSEOGeneration(productData);
    }
  },
  
  /**
   * Local SEO generation fallback
   */
  localSEOGeneration(productData) {
    const title = productData.title || '';
    const description = productData.description || '';
    
    // Generate meta title (max 60 chars)
    const metaTitle = title.substring(0, 55) + (title.length > 55 ? '...' : '');
    
    // Generate meta description (max 160 chars)
    const cleanDesc = description
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const metaDescription = cleanDesc.substring(0, 155) + (cleanDesc.length > 155 ? '...' : '');
    
    // Extract keywords from title
    const keywords = title
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 10);
    
    return {
      success: true,
      seo: {
        metaTitle,
        metaDescription,
        keywords,
        slug: this.generateSlug(title)
      }
    };
  },
  
  /**
   * Generate URL-friendly slug
   */
  generateSlug(title) {
    if (!title) return '';
    
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 80);
  },
  
  /**
   * Generate bullet points from description
   */
  async generateBulletPoints(description, options = {}) {
    try {
      const response = await this.callAPI('ai-content-generator', {
        action: 'generate_bullets',
        content: description,
        options: {
          count: options.count || 5,
          language: options.language || 'fr',
          style: options.style || 'benefit_focused'
        }
      });
      
      return response;
    } catch (error) {
      return this.localBulletPointExtraction(description);
    }
  },
  
  /**
   * Local bullet point extraction
   */
  localBulletPointExtraction(description) {
    if (!description) return { success: true, bullets: [] };
    
    // Clean HTML
    const text = description.replace(/<[^>]+>/g, '\n').replace(/\s+/g, ' ').trim();
    
    // Split into sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // Take first 5 meaningful sentences
    const bullets = sentences
      .slice(0, 5)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1));
    
    return { success: true, bullets };
  },
  
  /**
   * Translate content
   */
  async translateContent(content, targetLanguage, options = {}) {
    try {
      const response = await this.callAPI('ai-content-generator', {
        action: 'translate',
        content,
        targetLanguage,
        options: {
          preserveFormatting: options.preserveFormatting !== false,
          optimizeForEcommerce: options.optimizeForEcommerce || true
        }
      });
      
      return response;
    } catch (error) {
      console.error('[ShopOpti+ AI] Translation error:', error);
      return { success: false, translated: content, error: error.message };
    }
  },
  
  /**
   * Rewrite content to avoid duplicate content
   */
  async rewriteContent(content, options = {}) {
    try {
      const response = await this.callAPI('ai-content-generator', {
        action: 'rewrite',
        content,
        options: {
          preserveMeaning: true,
          changeLevel: options.changeLevel || 'moderate', // light, moderate, heavy
          language: options.language || 'fr'
        }
      });
      
      return response;
    } catch (error) {
      return { success: false, rewritten: content, error: error.message };
    }
  },
  
  /**
   * Generate product tags
   */
  async generateTags(productData, options = {}) {
    try {
      const response = await this.callAPI('ai-content-generator', {
        action: 'generate_tags',
        product: {
          title: productData.title,
          description: productData.description,
          category: productData.category
        },
        options: {
          count: options.count || 10,
          language: options.language || 'fr'
        }
      });
      
      return response;
    } catch (error) {
      return this.localTagGeneration(productData);
    }
  },
  
  /**
   * Local tag generation
   */
  localTagGeneration(productData) {
    const title = (productData.title || '').toLowerCase();
    const description = (productData.description || '').toLowerCase().replace(/<[^>]+>/g, '');
    
    const allText = title + ' ' + description;
    
    // Extract meaningful words
    const words = allText
      .split(/\s+/)
      .filter(w => w.length > 3)
      .filter(w => !['pour', 'avec', 'dans', 'this', 'that', 'from', 'with'].includes(w));
    
    // Count frequency
    const freq = {};
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    
    // Sort by frequency and take top 10
    const tags = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
    
    return { success: true, tags };
  },
  
  /**
   * Call API with auth
   */
  async callAPI(endpoint, data) {
    const token = await this.getToken();
    
    const response = await fetch(`${this.API_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'x-extension-token': token })
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  },
  
  /**
   * Get auth token from storage
   */
  async getToken() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['extensionToken'], (result) => {
          resolve(result.extensionToken || null);
        });
      } else {
        resolve(null);
      }
    });
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIContentService;
}

if (typeof window !== 'undefined') {
  window.ShopOptiAIContent = AIContentService;
}
