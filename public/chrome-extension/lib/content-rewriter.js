// ============================================
// ShopOpti+ Content Rewriter v5.6.2
// Title cleaning, translation, and SEO optimization
// ============================================

const ShopOptiContentRewriter = {
  // Forbidden words to remove from titles
  forbiddenWords: [
    // Shipping terms
    'free shipping', 'livraison gratuite', 'envío gratis', 'kostenloser versand',
    'fast shipping', 'quick delivery', 'express delivery',
    // Promo terms
    'hot sale', 'best seller', 'top seller', 'new arrival', 'flash sale',
    'limited time', 'clearance', 'promotion', 'promo', 'discount',
    // Platform terms
    'aliexpress', 'amazon', 'ebay', 'wish', 'temu', 'shein', 'banggood',
    // Spam terms
    'dropshipping', 'wholesale', 'bulk', 'factory direct', 'oem', 'odm',
    '2024', '2025', 'new 2024', 'new 2025',
    // Quality spam
    'high quality', 'best quality', 'top quality', 'premium quality',
    'super quality', 'good quality', 'excellent quality'
  ],

  // Brand patterns to optionally remove
  brandPatterns: [
    /\b(for\s+)?(iphone|samsung|xiaomi|huawei|oppo|vivo|realme)\b/gi,
    /\b(compatible\s+with|fits?|pour)\s+\w+/gi
  ],

  /**
   * Clean product title
   */
  cleanTitle(title, options = {}) {
    if (!title) return '';
    
    let cleaned = title;
    
    // Remove forbidden words
    this.forbiddenWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      cleaned = cleaned.replace(regex, '');
    });
    
    // Remove brand references if requested
    if (options.removeBrands) {
      this.brandPatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
      });
    }
    
    // Clean up special characters
    cleaned = cleaned
      .replace(/[【】「」『』]/g, ' ')  // Chinese brackets
      .replace(/[★☆✓✔✗✘]/g, '')       // Symbols
      .replace(/\s*[-–—]\s*/g, ' - ')   // Normalize dashes
      .replace(/\s*[,،]\s*/g, ', ')     // Normalize commas
      .replace(/\s+/g, ' ')             // Multiple spaces
      .replace(/^\s*[-–—,]\s*/, '')     // Leading punctuation
      .replace(/\s*[-–—,]\s*$/, '')     // Trailing punctuation
      .trim();
    
    // Capitalize first letter of each word (Title Case)
    if (options.titleCase) {
      cleaned = cleaned.replace(/\b\w/g, c => c.toUpperCase());
    }
    
    // Limit length
    if (options.maxLength && cleaned.length > options.maxLength) {
      cleaned = cleaned.substring(0, options.maxLength).replace(/\s+\S*$/, '...');
    }
    
    return cleaned;
  },

  /**
   * Clean product description
   */
  cleanDescription(description, options = {}) {
    if (!description) return '';
    
    let cleaned = description;
    
    // Remove forbidden promotional content
    this.forbiddenWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      cleaned = cleaned.replace(regex, '');
    });
    
    // Remove excessive caps
    cleaned = cleaned.replace(/([A-Z]{5,})/g, match => 
      match.charAt(0) + match.slice(1).toLowerCase()
    );
    
    // Remove repetitive characters
    cleaned = cleaned.replace(/(.)\1{3,}/g, '$1$1');
    
    // Clean HTML if requested
    if (options.stripHtml) {
      cleaned = cleaned.replace(/<[^>]+>/g, ' ');
    }
    
    // Normalize whitespace
    cleaned = cleaned
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleaned;
  },

  /**
   * Generate SEO meta title
   */
  generateMetaTitle(product, options = {}) {
    const { title, category, brand } = product;
    const maxLength = options.maxLength || 60;
    
    let metaTitle = this.cleanTitle(title, { titleCase: true });
    
    // Add brand if available and not too long
    if (brand && metaTitle.length + brand.length + 3 < maxLength) {
      metaTitle = `${metaTitle} | ${brand}`;
    }
    
    // Truncate if needed
    if (metaTitle.length > maxLength) {
      metaTitle = metaTitle.substring(0, maxLength - 3) + '...';
    }
    
    return metaTitle;
  },

  /**
   * Generate SEO meta description
   */
  generateMetaDescription(product, options = {}) {
    const { title, description, price, currency = '€' } = product;
    const maxLength = options.maxLength || 160;
    
    let metaDesc = '';
    
    // Start with price if available
    if (price) {
      metaDesc = `${currency}${price} - `;
    }
    
    // Add cleaned title
    metaDesc += this.cleanTitle(title, { maxLength: 80 });
    
    // Add description excerpt if room
    if (description && metaDesc.length < maxLength - 50) {
      const descClean = this.cleanDescription(description, { stripHtml: true });
      const remaining = maxLength - metaDesc.length - 5;
      if (descClean.length > 0) {
        metaDesc += '. ' + descClean.substring(0, remaining);
      }
    }
    
    // Truncate
    if (metaDesc.length > maxLength) {
      metaDesc = metaDesc.substring(0, maxLength - 3) + '...';
    }
    
    return metaDesc;
  },

  /**
   * Normalize attribute names across languages
   */
  normalizeAttributes(attributes) {
    const mappings = {
      // Colors
      'colour': 'color', 'couleur': 'color', 'farbe': 'color', 'colore': 'color',
      // Sizes
      'taille': 'size', 'größe': 'size', 'taglia': 'size', 'tamaño': 'size',
      // Materials
      'matériau': 'material', 'materiale': 'material', 'material': 'material',
      // Quantity
      'quantité': 'quantity', 'cantidad': 'quantity', 'menge': 'quantity',
      // Style
      'style': 'style', 'estilo': 'style', 'stil': 'style'
    };
    
    const normalized = {};
    
    Object.entries(attributes).forEach(([key, value]) => {
      const normalizedKey = mappings[key.toLowerCase()] || key.toLowerCase();
      normalized[normalizedKey] = value;
    });
    
    return normalized;
  },

  /**
   * Simple translation dictionary (for common terms)
   */
  translations: {
    en: {
      'livraison gratuite': 'free shipping',
      'en stock': 'in stock',
      'rupture de stock': 'out of stock',
      'ajouter au panier': 'add to cart',
      'acheter maintenant': 'buy now'
    },
    fr: {
      'free shipping': 'livraison gratuite',
      'in stock': 'en stock',
      'out of stock': 'rupture de stock',
      'add to cart': 'ajouter au panier',
      'buy now': 'acheter maintenant'
    },
    es: {
      'free shipping': 'envío gratis',
      'in stock': 'en stock',
      'out of stock': 'agotado'
    },
    de: {
      'free shipping': 'kostenloser versand',
      'in stock': 'auf lager',
      'out of stock': 'nicht auf lager'
    }
  },

  /**
   * Translate common terms
   */
  translateTerms(text, targetLang = 'fr') {
    if (!text || !this.translations[targetLang]) return text;
    
    let translated = text;
    Object.entries(this.translations[targetLang]).forEach(([source, target]) => {
      const regex = new RegExp(source, 'gi');
      translated = translated.replace(regex, target);
    });
    
    return translated;
  },

  /**
   * Full product rewrite pipeline
   */
  rewriteProduct(product, options = {}) {
    const rewritten = { ...product };
    
    // Clean title
    rewritten.title = this.cleanTitle(product.title, {
      removeBrands: options.removeBrands,
      titleCase: options.titleCase !== false,
      maxLength: options.maxTitleLength || 200
    });
    
    // Clean description
    rewritten.description = this.cleanDescription(product.description, {
      stripHtml: options.stripHtml
    });
    
    // Generate SEO fields
    rewritten.seo_title = this.generateMetaTitle(rewritten, options);
    rewritten.seo_description = this.generateMetaDescription(rewritten, options);
    
    // Normalize attributes
    if (product.attributes) {
      rewritten.attributes = this.normalizeAttributes(product.attributes);
    }
    
    // Translate if requested
    if (options.targetLanguage) {
      rewritten.title = this.translateTerms(rewritten.title, options.targetLanguage);
      rewritten.description = this.translateTerms(rewritten.description, options.targetLanguage);
    }
    
    return rewritten;
  }
};

// Export
if (typeof window !== 'undefined') {
  window.ShopOptiContentRewriter = ShopOptiContentRewriter;
}
