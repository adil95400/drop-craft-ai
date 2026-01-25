/**
 * ShopOpti+ AI Tag Generator v5.6.2
 * Auto-suggest tags based on title, category, description
 */

const ShopOptiTagGenerator = {
  VERSION: '5.6.2',

  // Common dropshipping keywords
  commonTags: {
    fashion: ['mode', 'fashion', 'vêtement', 'clothing', 'style', 'tendance'],
    electronics: ['tech', 'gadget', 'électronique', 'electronic', 'accessoire'],
    home: ['maison', 'home', 'décor', 'intérieur', 'decoration'],
    beauty: ['beauté', 'beauty', 'cosmétique', 'skincare', 'soin'],
    sport: ['sport', 'fitness', 'outdoor', 'training', 'gym'],
    kids: ['enfant', 'kids', 'bébé', 'baby', 'jouet', 'toy'],
    jewelry: ['bijou', 'jewelry', 'accessoire', 'fashion'],
    pet: ['animal', 'pet', 'chien', 'chat', 'dog', 'cat'],
    auto: ['auto', 'voiture', 'car', 'moto', 'accessoire']
  },

  // Material keywords
  materials: ['cotton', 'coton', 'polyester', 'leather', 'cuir', 'metal', 'plastic', 'silicone', 'wood', 'bois', 'glass', 'verre'],

  // Size keywords  
  sizes: ['small', 'medium', 'large', 'xl', 'xxl', 'mini', 'compact', 'portable', 'oversized'],

  // Color keywords
  colors: ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'grey', 'gray', 'gold', 'silver', 'noir', 'blanc', 'rouge', 'bleu', 'vert', 'jaune', 'rose'],

  /**
   * Generate tags from product data
   */
  generateTags(productData, options = {}) {
    const { maxTags = 15, language = 'fr' } = options;
    const tags = new Set();
    const title = (productData.title || '').toLowerCase();
    const description = (productData.description || '').toLowerCase();
    const category = (productData.category || '').toLowerCase();
    const brand = (productData.brand || '').toLowerCase();

    // 1. Extract from title (most important)
    this.extractFromTitle(title).forEach(tag => tags.add(tag));

    // 2. Category-based tags
    for (const [cat, catTags] of Object.entries(this.commonTags)) {
      if (title.includes(cat) || category.includes(cat) || description.includes(cat)) {
        catTags.slice(0, 3).forEach(tag => tags.add(tag));
      }
    }

    // 3. Material detection
    this.materials.forEach(material => {
      if (title.includes(material) || description.includes(material)) {
        tags.add(material);
      }
    });

    // 4. Color detection
    this.colors.forEach(color => {
      if (title.includes(color)) {
        tags.add(color);
      }
    });

    // 5. Size detection
    this.sizes.forEach(size => {
      if (title.includes(size)) {
        tags.add(size);
      }
    });

    // 6. Brand as tag
    if (brand && brand.length > 2 && brand.length < 30) {
      tags.add(brand);
    }

    // 7. Platform-specific tags
    if (productData.platform) {
      if (productData.platform === 'aliexpress') {
        tags.add('aliexpress');
        tags.add('dropshipping');
      } else if (productData.platform === 'amazon') {
        tags.add('amazon');
        tags.add('prime');
      }
    }

    // 8. Generate semantic tags
    const semanticTags = this.generateSemanticTags(title, category);
    semanticTags.forEach(tag => tags.add(tag));

    // Clean and limit
    const cleanedTags = Array.from(tags)
      .filter(tag => tag && tag.length >= 2 && tag.length <= 40)
      .filter(tag => !/^\d+$/.test(tag)) // Remove pure numbers
      .slice(0, maxTags);

    return cleanedTags;
  },

  /**
   * Extract meaningful words from title
   */
  extractFromTitle(title) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'mais', 'dans', 'sur', 'pour', 'avec', 'par',
      'de', 'du', 'en', 'au', 'aux', 'ce', 'cette', 'ces', 'son', 'sa', 'ses',
      'new', 'hot', 'sale', 'free', 'shipping', '2024', '2025', 'pcs', 'pack', 'set'
    ]);

    return title
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 8);
  },

  /**
   * Generate semantic/contextual tags
   */
  generateSemanticTags(title, category) {
    const tags = [];
    const combined = `${title} ${category}`.toLowerCase();

    // Seasonal
    if (/summer|été|beach|plage/i.test(combined)) tags.push('summer', 'été');
    if (/winter|hiver|christmas|noël/i.test(combined)) tags.push('winter', 'hiver');
    if (/spring|printemps/i.test(combined)) tags.push('spring');
    if (/fall|autumn|automne/i.test(combined)) tags.push('autumn');

    // Use cases
    if (/outdoor|extérieur|camping|hiking/i.test(combined)) tags.push('outdoor');
    if (/indoor|intérieur|home/i.test(combined)) tags.push('indoor');
    if (/travel|voyage|portable/i.test(combined)) tags.push('travel');
    if (/office|bureau|work/i.test(combined)) tags.push('office');
    if (/gift|cadeau/i.test(combined)) tags.push('gift', 'cadeau');

    // Target audience
    if (/women|femme|lady/i.test(combined)) tags.push('women', 'femme');
    if (/men|homme|guy/i.test(combined)) tags.push('men', 'homme');
    if (/unisex|mixte/i.test(combined)) tags.push('unisex');
    if (/kid|enfant|child|baby|bébé/i.test(combined)) tags.push('kids');

    return tags;
  },

  /**
   * Get tag suggestions for autocomplete
   */
  getSuggestions(input, existingTags = []) {
    const inputLower = input.toLowerCase();
    const allTags = [
      ...Object.values(this.commonTags).flat(),
      ...this.materials,
      ...this.colors,
      ...this.sizes
    ];

    return allTags
      .filter(tag => tag.startsWith(inputLower) && !existingTags.includes(tag))
      .slice(0, 10);
  },

  /**
   * Validate and clean tags
   */
  validateTags(tags) {
    return tags
      .map(tag => tag.toLowerCase().trim())
      .filter(tag => tag.length >= 2 && tag.length <= 40)
      .filter((tag, index, self) => self.indexOf(tag) === index); // Deduplicate
  }
};

// Export
if (typeof window !== 'undefined') {
  window.ShopOptiTagGenerator = ShopOptiTagGenerator;
}
