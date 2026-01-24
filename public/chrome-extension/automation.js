// ShopOpti+ - Post-Import Automation v4.3.16
// Auto-apply rules, pricing, categories, and publishing

(function() {
  'use strict';

  if (window.__shopOptiAutomationLoaded) return;
  window.__shopOptiAutomationLoaded = true;

  const CONFIG = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    DEFAULT_RULES: {
      marginPercent: 30,
      roundToNearestCent: 99,
      defaultCategory: 'general',
      autoPublish: false,
      autoTranslate: false,
      removeWatermarks: false,
      optimizeImages: true,
      seoOptimize: true
    }
  };

  class ShopOptiAutomation {
    constructor() {
      this.rules = { ...CONFIG.DEFAULT_RULES };
      this.isProcessing = false;
      this.queue = [];
      
      this.init();
    }

    async init() {
      await this.loadRules();
      this.listenForImports();
    }

    async loadRules() {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['automationRules'], (result) => {
            if (result.automationRules) {
              this.rules = { ...CONFIG.DEFAULT_RULES, ...result.automationRules };
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
    }

    async saveRules() {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ automationRules: this.rules });
      }
    }

    listenForImports() {
      // Listen for product import events
      window.addEventListener('message', async (event) => {
        if (event.data.type === 'PRODUCT_IMPORTED') {
          await this.processProduct(event.data.product);
        } else if (event.data.type === 'PRODUCTS_IMPORTED') {
          for (const product of event.data.products) {
            await this.processProduct(product);
          }
        } else if (event.data.type === 'UPDATE_AUTOMATION_RULES') {
          this.rules = { ...this.rules, ...event.data.rules };
          await this.saveRules();
        }
      });

      // Also listen for chrome runtime messages
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (message.type === 'APPLY_AUTOMATION') {
            this.processProduct(message.product).then(() => {
              sendResponse({ success: true });
            });
            return true;
          } else if (message.type === 'GET_AUTOMATION_RULES') {
            sendResponse(this.rules);
          } else if (message.type === 'SET_AUTOMATION_RULES') {
            this.rules = { ...this.rules, ...message.rules };
            this.saveRules().then(() => {
              sendResponse({ success: true });
            });
            return true;
          }
        });
      }
    }

    async processProduct(product) {
      if (!product) return product;
      
      console.log('[ShopOpti+ Automation] Processing product:', product.title);
      
      const processed = { ...product };
      
      // Apply pricing rules
      if (this.rules.marginPercent > 0) {
        processed.sellPrice = this.calculateSellPrice(
          product.price,
          this.rules.marginPercent,
          this.rules.roundToNearestCent
        );
        processed.margin = this.rules.marginPercent;
        processed.profit = processed.sellPrice - product.price;
      }
      
      // Apply category mapping
      if (this.rules.defaultCategory && !product.category) {
        processed.category = this.rules.defaultCategory;
      }
      
      // Apply category rules based on keywords
      processed.suggestedCategories = this.suggestCategories(product.title, product.description);
      
      // SEO optimization
      if (this.rules.seoOptimize) {
        processed.seoTitle = this.generateSeoTitle(product.title);
        processed.seoDescription = this.generateSeoDescription(product.title, product.description);
        processed.tags = this.generateTags(product.title, product.description);
      }
      
      // Set publish status
      processed.status = this.rules.autoPublish ? 'active' : 'draft';
      
      // Add automation metadata
      processed.automationApplied = true;
      processed.automationRules = {
        marginApplied: this.rules.marginPercent,
        seoOptimized: this.rules.seoOptimize,
        autoPublished: this.rules.autoPublish
      };
      processed.processedAt = new Date().toISOString();
      
      // Send updated product back
      this.notifyProductProcessed(processed);
      
      return processed;
    }

    calculateSellPrice(costPrice, marginPercent, roundTo = 99) {
      if (!costPrice || costPrice <= 0) return 0;
      
      // Calculate price with margin
      const priceWithMargin = costPrice * (1 + marginPercent / 100);
      
      // Round to nearest .99 or .95
      if (roundTo === 99) {
        return Math.ceil(priceWithMargin) - 0.01;
      } else if (roundTo === 95) {
        return Math.ceil(priceWithMargin) - 0.05;
      } else if (roundTo === 0) {
        return Math.round(priceWithMargin);
      }
      
      return Math.round(priceWithMargin * 100) / 100;
    }

    suggestCategories(title, description) {
      const text = `${title} ${description || ''}`.toLowerCase();
      const categories = [];
      
      const categoryKeywords = {
        'Électronique': ['phone', 'téléphone', 'smartphone', 'tablet', 'tablette', 'computer', 'ordinateur', 'laptop', 'electronic', 'électronique', 'cable', 'câble', 'charger', 'chargeur', 'headphone', 'écouteur', 'speaker', 'bluetooth', 'wireless', 'sans fil'],
        'Mode Femme': ['dress', 'robe', 'women', 'femme', 'lady', 'girl', 'fille', 'skirt', 'jupe', 'blouse', 'lingerie', 'bikini', 'bra', 'soutien'],
        'Mode Homme': ['men', 'homme', 'boy', 'garçon', 'shirt', 'chemise', 't-shirt', 'polo', 'pants', 'pantalon', 'jeans', 'suit', 'costume', 'tie', 'cravate'],
        'Chaussures': ['shoe', 'chaussure', 'sneaker', 'basket', 'boot', 'botte', 'sandal', 'sandale', 'heel', 'talon', 'loafer', 'mocassin'],
        'Maison & Jardin': ['home', 'maison', 'house', 'garden', 'jardin', 'kitchen', 'cuisine', 'bathroom', 'salle de bain', 'bedroom', 'chambre', 'furniture', 'meuble', 'decor', 'décor', 'lamp', 'lampe', 'rug', 'tapis'],
        'Beauté': ['beauty', 'beauté', 'makeup', 'maquillage', 'cosmetic', 'skincare', 'soin', 'cream', 'crème', 'perfume', 'parfum', 'hair', 'cheveux', 'nail', 'ongle'],
        'Sports': ['sport', 'fitness', 'gym', 'yoga', 'running', 'course', 'bicycle', 'vélo', 'swimming', 'natation', 'football', 'basketball', 'tennis', 'camping', 'hiking', 'randonnée'],
        'Jouets': ['toy', 'jouet', 'game', 'jeu', 'puzzle', 'doll', 'poupée', 'lego', 'plush', 'peluche', 'kids', 'enfant', 'baby', 'bébé'],
        'Bijoux': ['jewelry', 'bijou', 'necklace', 'collier', 'bracelet', 'ring', 'bague', 'earring', 'boucle', 'watch', 'montre', 'gold', 'or', 'silver', 'argent', 'diamond', 'diamant'],
        'Auto & Moto': ['car', 'voiture', 'auto', 'motorcycle', 'moto', 'vehicle', 'véhicule', 'tire', 'pneu', 'engine', 'moteur', 'accessories', 'accessoire'],
        'Animaux': ['pet', 'animal', 'dog', 'chien', 'cat', 'chat', 'bird', 'oiseau', 'fish', 'poisson', 'collar', 'collier', 'leash', 'laisse', 'food', 'nourriture']
      };
      
      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        const score = keywords.filter(keyword => text.includes(keyword)).length;
        if (score > 0) {
          categories.push({ category, score, confidence: Math.min(score / 3, 1) });
        }
      }
      
      // Sort by score descending
      categories.sort((a, b) => b.score - a.score);
      
      return categories.slice(0, 3);
    }

    generateSeoTitle(title) {
      if (!title) return '';
      
      // Clean and optimize title
      let seoTitle = title
        .replace(/[^\w\s\-àâäéèêëïîôùûüç]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Capitalize first letter of each word
      seoTitle = seoTitle
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      // Limit length for SEO (60 chars max)
      if (seoTitle.length > 60) {
        seoTitle = seoTitle.substring(0, 57) + '...';
      }
      
      return seoTitle;
    }

    generateSeoDescription(title, description) {
      const text = description || title || '';
      
      // Clean and limit to 160 characters
      let seoDesc = text
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (seoDesc.length > 160) {
        seoDesc = seoDesc.substring(0, 157) + '...';
      }
      
      return seoDesc;
    }

    generateTags(title, description) {
      const text = `${title} ${description || ''}`.toLowerCase();
      const tags = new Set();
      
      // Extract words (3+ characters)
      const words = text.match(/\b\w{3,}\b/g) || [];
      
      // Common stop words to exclude
      const stopWords = ['the', 'and', 'for', 'with', 'this', 'that', 'from', 'your', 'have', 'more', 'will', 'can', 'all', 'are', 'was', 'were', 'been', 'being', 'has', 'had', 'does', 'did', 'une', 'des', 'les', 'est', 'pour', 'avec', 'dans', 'sur', 'par', 'aux', 'tout', 'tous'];
      
      words.forEach(word => {
        if (!stopWords.includes(word) && word.length >= 3) {
          tags.add(word);
        }
      });
      
      // Limit to top 15 tags
      return Array.from(tags).slice(0, 15);
    }

    notifyProductProcessed(product) {
      // Notify sidebar/popup
      window.postMessage({
        type: 'PRODUCT_AUTOMATION_COMPLETE',
        product
      }, '*');
      
      // Send to background script
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'PRODUCT_AUTOMATION_COMPLETE',
          product
        });
      }
    }

    // Public methods for external use
    getRules() {
      return { ...this.rules };
    }

    setRules(newRules) {
      this.rules = { ...this.rules, ...newRules };
      this.saveRules();
    }

    previewPricing(costPrice) {
      return {
        costPrice,
        sellPrice: this.calculateSellPrice(costPrice, this.rules.marginPercent, this.rules.roundToNearestCent),
        margin: this.rules.marginPercent,
        profit: this.calculateSellPrice(costPrice, this.rules.marginPercent, this.rules.roundToNearestCent) - costPrice
      };
    }
  }

  // Initialize automation engine
  window.__shopOptiAutomation = new ShopOptiAutomation();
  
  // Expose API for external use
  window.ShopOptiAutomation = {
    getRules: () => window.__shopOptiAutomation.getRules(),
    setRules: (rules) => window.__shopOptiAutomation.setRules(rules),
    previewPricing: (price) => window.__shopOptiAutomation.previewPricing(price),
    processProduct: (product) => window.__shopOptiAutomation.processProduct(product)
  };
  
  // Legacy compatibility
  window.DropCraftAutomation = window.ShopOptiAutomation;
})();
