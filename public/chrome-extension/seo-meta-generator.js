/**
 * Shopopti+ - SEO Meta Tags Generator v4.3.0
 * Generates optimized meta titles, descriptions, OG tags, and structured data
 * Professional SEO module surpassing AutoDS & Cartifind
 */

(function() {
  'use strict';

  if (window.__shopoptiSeoMetaLoaded) return;
  window.__shopoptiSeoMetaLoaded = true;

  const CONFIG = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    MAX_META_TITLE: 60,
    MAX_META_DESCRIPTION: 160,
    MAX_OG_TITLE: 95,
    MAX_OG_DESCRIPTION: 200,
    KEYWORDS_LIMIT: 10
  };

  class ShopoptiSeoMetaGenerator {
    constructor() {
      this.currentProduct = null;
      this.generatedMeta = {};
      this.seoScore = 0;
      this.settings = {
        language: 'fr',
        includeEmojis: false,
        brandName: '',
        targetKeywords: [],
        generateSchema: true,
        generateOgTags: true,
        generateTwitterCards: true
      };
      this.init();
    }

    async init() {
      await this.loadSettings();
      console.log('🔍 Shopopti+ SEO Meta Generator v4.3 initialized');
    }

    async loadSettings() {
      return new Promise(resolve => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['dc_seo_settings'], (result) => {
            if (result.dc_seo_settings) {
              this.settings = { ...this.settings, ...result.dc_seo_settings };
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
    }

    async saveSettings() {
      return new Promise(resolve => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ dc_seo_settings: this.settings }, resolve);
        } else {
          resolve();
        }
      });
    }

    /**
     * Generate complete SEO meta tags for a product
     */
    async generateMetaTags(product) {
      this.currentProduct = product;
      
      try {
        // Try API call first
        const response = await this.callSeoApi(product);
        if (response) {
          this.generatedMeta = response;
          this.seoScore = this.calculateSeoScore(response);
          return response;
        }
      } catch (error) {
        console.warn('API SEO generation failed, using local:', error);
      }

      // Fallback to local generation
      return this.generateLocalMeta(product);
    }

    async callSeoApi(product) {
      const token = await this.getToken();
      if (!token) return null;

      try {
        const response = await fetch(`${CONFIG.API_URL}/ai-seo-meta`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': token
          },
          body: JSON.stringify({
            product,
            settings: this.settings
          })
        });

        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('SEO API error:', error);
      }
      return null;
    }

    async getToken() {
      return new Promise(resolve => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['extensionToken'], (result) => {
            resolve(result.extensionToken);
          });
        } else {
          resolve(null);
        }
      });
    }

    /**
     * Local SEO meta generation with intelligent optimization
     */
    generateLocalMeta(product) {
      const title = product.title || 'Product';
      const description = product.description || '';
      const price = product.price || '';
      const brand = product.brand || this.settings.brandName || '';
      const category = product.category || '';

      // Extract key features
      const features = this.extractFeatures(description);
      const keywords = this.generateKeywords(title, description, category);

      // Generate optimized meta title (max 60 chars)
      const metaTitle = this.generateMetaTitle(title, brand, category);

      // Generate meta description (max 160 chars)
      const metaDescription = this.generateMetaDescription(title, features, price);

      // Generate Open Graph tags
      const ogTags = this.settings.generateOgTags ? this.generateOgTags(product, metaTitle, metaDescription) : null;

      // Generate Twitter Card tags
      const twitterTags = this.settings.generateTwitterCards ? this.generateTwitterTags(product, metaTitle, metaDescription) : null;

      // Generate JSON-LD Schema
      const schemaMarkup = this.settings.generateSchema ? this.generateSchemaMarkup(product) : null;

      const result = {
        metaTitle,
        metaDescription,
        keywords,
        ogTags,
        twitterTags,
        schemaMarkup,
        seoScore: 0,
        suggestions: []
      };

      result.seoScore = this.calculateSeoScore(result);
      result.suggestions = this.generateSuggestions(result, product);
      
      this.generatedMeta = result;
      this.seoScore = result.seoScore;

      return result;
    }

    generateMetaTitle(title, brand, category) {
      // Clean and optimize title
      let cleanTitle = this.cleanText(title);
      
      // Remove common filler words
      cleanTitle = cleanTitle
        .replace(/\b(achetez|acheter|buy|shop|nouveau|new|hot|sale|promo)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Build meta title with brand
      let metaTitle = cleanTitle;
      
      if (brand && !cleanTitle.toLowerCase().includes(brand.toLowerCase())) {
        const withBrand = `${cleanTitle} | ${brand}`;
        if (withBrand.length <= CONFIG.MAX_META_TITLE) {
          metaTitle = withBrand;
        }
      }

      // Add category if space allows
      if (category && metaTitle.length < CONFIG.MAX_META_TITLE - 15) {
        const catSuffix = ` - ${this.capitalizeFirst(category)}`;
        if ((metaTitle + catSuffix).length <= CONFIG.MAX_META_TITLE) {
          metaTitle += catSuffix;
        }
      }

      // Ensure max length
      if (metaTitle.length > CONFIG.MAX_META_TITLE) {
        metaTitle = metaTitle.substring(0, CONFIG.MAX_META_TITLE - 3) + '...';
      }

      return metaTitle;
    }

    generateMetaDescription(title, features, price) {
      const lang = this.settings.language;
      const templates = {
        fr: [
          `Découvrez ${title}. ${features.slice(0, 2).join(', ')}. ${price ? `À partir de ${price}.` : ''} Livraison rapide et retours gratuits.`,
          `${title} de qualité premium. ${features[0] || 'Design exclusif'}. Commandez maintenant et profitez de nos offres.`,
          `Achetez ${title} au meilleur prix. ${features.slice(0, 2).join(' - ')}. Satisfaction garantie.`
        ],
        en: [
          `Discover ${title}. ${features.slice(0, 2).join(', ')}. ${price ? `Starting at ${price}.` : ''} Fast shipping & free returns.`,
          `Premium quality ${title}. ${features[0] || 'Exclusive design'}. Order now and enjoy our special offers.`,
          `Buy ${title} at the best price. ${features.slice(0, 2).join(' - ')}. Satisfaction guaranteed.`
        ]
      };

      const langTemplates = templates[lang] || templates.en;
      let description = langTemplates[Math.floor(Math.random() * langTemplates.length)];

      // Ensure max length
      if (description.length > CONFIG.MAX_META_DESCRIPTION) {
        description = description.substring(0, CONFIG.MAX_META_DESCRIPTION - 3) + '...';
      }

      return description;
    }

    generateOgTags(product, metaTitle, metaDescription) {
      return {
        'og:type': 'product',
        'og:title': metaTitle.length > CONFIG.MAX_OG_TITLE 
          ? metaTitle.substring(0, CONFIG.MAX_OG_TITLE - 3) + '...' 
          : metaTitle,
        'og:description': metaDescription.length > CONFIG.MAX_OG_DESCRIPTION 
          ? metaDescription.substring(0, CONFIG.MAX_OG_DESCRIPTION - 3) + '...' 
          : metaDescription,
        'og:image': product.images?.[0] || product.image_url || '',
        'og:url': product.source_url || window.location.href,
        'og:site_name': this.settings.brandName || 'Shopopti+',
        'product:price:amount': this.extractNumericPrice(product.price),
        'product:price:currency': product.currency || 'EUR',
        'product:availability': product.in_stock !== false ? 'in stock' : 'out of stock'
      };
    }

    generateTwitterTags(product, metaTitle, metaDescription) {
      return {
        'twitter:card': 'summary_large_image',
        'twitter:title': metaTitle,
        'twitter:description': metaDescription,
        'twitter:image': product.images?.[0] || product.image_url || ''
      };
    }

    generateSchemaMarkup(product) {
      const schema = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        'name': product.title,
        'description': product.description?.substring(0, 500) || '',
        'image': product.images || [product.image_url],
        'sku': product.sku || product.external_id || '',
        'brand': {
          '@type': 'Brand',
          'name': product.brand || this.settings.brandName || ''
        },
        'offers': {
          '@type': 'Offer',
          'url': product.source_url || '',
          'priceCurrency': product.currency || 'EUR',
          'price': this.extractNumericPrice(product.price),
          'availability': product.in_stock !== false 
            ? 'https://schema.org/InStock' 
            : 'https://schema.org/OutOfStock',
          'seller': {
            '@type': 'Organization',
            'name': this.settings.brandName || 'Store'
          }
        }
      };

      // Add review data if available
      if (product.rating && product.review_count) {
        schema.aggregateRating = {
          '@type': 'AggregateRating',
          'ratingValue': product.rating,
          'reviewCount': product.review_count
        };
      }

      return schema;
    }

    extractFeatures(description) {
      if (!description) return [];

      // Extract key features from bullet points or sentences
      const features = [];
      
      // Look for bullet points
      const bulletMatches = description.match(/[•\-\*]\s*([^•\-\*\n]+)/g);
      if (bulletMatches) {
        bulletMatches.forEach(match => {
          const clean = match.replace(/^[•\-\*]\s*/, '').trim();
          if (clean.length > 5 && clean.length < 100) {
            features.push(clean);
          }
        });
      }

      // Extract from sentences if not enough bullet points
      if (features.length < 3) {
        const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 10);
        sentences.slice(0, 5).forEach(sentence => {
          const clean = sentence.trim();
          if (clean.length > 5 && clean.length < 100 && !features.includes(clean)) {
            features.push(clean);
          }
        });
      }

      return features.slice(0, 5);
    }

    generateKeywords(title, description, category) {
      const text = `${title} ${description} ${category}`.toLowerCase();
      
      // Extract meaningful words
      const words = text
        .replace(/[^\w\sàâäéèêëïîôùûüç]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3)
        .filter(w => !this.isStopWord(w));

      // Count frequency
      const frequency = {};
      words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
      });

      // Sort by frequency and return top keywords
      return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, CONFIG.KEYWORDS_LIMIT)
        .map(([word]) => word);
    }

    isStopWord(word) {
      const stopWords = [
        'the', 'and', 'for', 'with', 'this', 'that', 'from', 'your', 'have', 'will',
        'les', 'des', 'une', 'pour', 'avec', 'dans', 'sur', 'par', 'plus', 'vous',
        'nous', 'sont', 'être', 'avoir', 'fait', 'tout', 'bien', 'très', 'peut'
      ];
      return stopWords.includes(word);
    }

    calculateSeoScore(meta) {
      let score = 0;
      const maxScore = 100;

      // Meta title scoring (25 points)
      if (meta.metaTitle) {
        const titleLen = meta.metaTitle.length;
        if (titleLen >= 30 && titleLen <= 60) score += 25;
        else if (titleLen >= 20 && titleLen <= 70) score += 15;
        else score += 5;
      }

      // Meta description scoring (25 points)
      if (meta.metaDescription) {
        const descLen = meta.metaDescription.length;
        if (descLen >= 120 && descLen <= 160) score += 25;
        else if (descLen >= 80 && descLen <= 180) score += 15;
        else score += 5;
      }

      // Keywords scoring (15 points)
      if (meta.keywords?.length >= 5) score += 15;
      else if (meta.keywords?.length >= 3) score += 10;
      else if (meta.keywords?.length >= 1) score += 5;

      // Open Graph tags (15 points)
      if (meta.ogTags) {
        if (meta.ogTags['og:title'] && meta.ogTags['og:description'] && meta.ogTags['og:image']) {
          score += 15;
        } else {
          score += 5;
        }
      }

      // Schema markup (20 points)
      if (meta.schemaMarkup) {
        if (meta.schemaMarkup.name && meta.schemaMarkup.offers && meta.schemaMarkup.image) {
          score += 20;
        } else {
          score += 10;
        }
      }

      return Math.min(score, maxScore);
    }

    generateSuggestions(meta, product) {
      const suggestions = [];

      // Title suggestions
      if (!meta.metaTitle || meta.metaTitle.length < 30) {
        suggestions.push({
          type: 'title',
          priority: 'high',
          message: 'Allongez le titre meta à au moins 30 caractères pour un meilleur SEO'
        });
      }
      if (meta.metaTitle?.length > 60) {
        suggestions.push({
          type: 'title',
          priority: 'medium',
          message: 'Réduisez le titre meta à 60 caractères maximum'
        });
      }

      // Description suggestions
      if (!meta.metaDescription || meta.metaDescription.length < 100) {
        suggestions.push({
          type: 'description',
          priority: 'high',
          message: 'Ajoutez une meta description d\'au moins 100 caractères'
        });
      }

      // Image suggestions
      if (!product.images?.length && !product.image_url) {
        suggestions.push({
          type: 'image',
          priority: 'high',
          message: 'Ajoutez au moins une image pour le partage social'
        });
      }

      // Keywords suggestions
      if (!meta.keywords?.length || meta.keywords.length < 3) {
        suggestions.push({
          type: 'keywords',
          priority: 'medium',
          message: 'Identifiez plus de mots-clés pertinents pour le référencement'
        });
      }

      return suggestions;
    }

    /**
     * Generate HTML code for meta tags
     */
    generateHtmlCode(meta) {
      let html = '<!-- SEO Meta Tags generated by Shopopti+ -->\n';
      
      // Basic meta tags
      html += `<title>${this.escapeHtml(meta.metaTitle)}</title>\n`;
      html += `<meta name="description" content="${this.escapeHtml(meta.metaDescription)}">\n`;
      
      if (meta.keywords?.length) {
        html += `<meta name="keywords" content="${meta.keywords.join(', ')}">\n`;
      }

      // Open Graph tags
      if (meta.ogTags) {
        html += '\n<!-- Open Graph / Facebook -->\n';
        Object.entries(meta.ogTags).forEach(([key, value]) => {
          if (value) {
            html += `<meta property="${key}" content="${this.escapeHtml(String(value))}">\n`;
          }
        });
      }

      // Twitter Card tags
      if (meta.twitterTags) {
        html += '\n<!-- Twitter -->\n';
        Object.entries(meta.twitterTags).forEach(([key, value]) => {
          if (value) {
            html += `<meta name="${key}" content="${this.escapeHtml(String(value))}">\n`;
          }
        });
      }

      // Schema markup
      if (meta.schemaMarkup) {
        html += '\n<!-- Structured Data -->\n';
        html += `<script type="application/ld+json">\n${JSON.stringify(meta.schemaMarkup, null, 2)}\n</script>\n`;
      }

      return html;
    }

    // Utility methods
    cleanText(text) {
      return text
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    capitalizeFirst(str) {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    extractNumericPrice(price) {
      if (!price) return '0';
      const match = String(price).match(/[\d.,]+/);
      return match ? match[0].replace(',', '.') : '0';
    }
  }

  // Export globally
  window.ShopoptiSeoMetaGenerator = ShopoptiSeoMetaGenerator;
  window.shopoptiSeoMeta = new ShopoptiSeoMetaGenerator();

  console.log('🔍 Shopopti+ SEO Meta Generator loaded');
})();
