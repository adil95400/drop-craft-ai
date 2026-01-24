/**
 * ShopOpti+ - Winning Product Detector v4.3.16
 * AI-powered analysis to identify high-potential products
 * Unique feature not available in AutoDS or Cartifind
 */

(function() {
  'use strict';

  if (window.__shopoptiWinningDetectorLoaded) return;
  window.__shopoptiWinningDetectorLoaded = true;

  const CONFIG = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    SCORE_THRESHOLDS: {
      excellent: 85,
      good: 70,
      average: 50,
      poor: 30
    },
    WEIGHTS: {
      demand: 0.25,
      competition: 0.20,
      margin: 0.25,
      trend: 0.15,
      reviews: 0.15
    }
  };

  class ShopoptiWinningProductDetector {
    constructor() {
      this.currentProduct = null;
      this.analysisResult = null;
      this.init();
    }

    async init() {
      console.log('🏆 Shopopti+ Winning Product Detector v4.3 initialized');
    }

    /**
     * Analyze a product to determine its winning potential
     */
    async analyzeProduct(product) {
      this.currentProduct = product;

      try {
        // Try API analysis first
        const apiResult = await this.callAnalysisApi(product);
        if (apiResult) {
          this.analysisResult = apiResult;
          return apiResult;
        }
      } catch (error) {
        console.warn('API analysis failed, using local:', error);
      }

      // Fallback to local analysis
      return this.performLocalAnalysis(product);
    }

    async callAnalysisApi(product) {
      const token = await this.getToken();
      if (!token) return null;

      try {
        const response = await fetch(`${CONFIG.API_URL}/analyze-winning-product`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': token
          },
          body: JSON.stringify({ product })
        });

        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('Winning product API error:', error);
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
     * Perform local analysis based on available product data
     */
    performLocalAnalysis(product) {
      const scores = {
        demand: this.analyzeDemand(product),
        competition: this.analyzeCompetition(product),
        margin: this.analyzeMargin(product),
        trend: this.analyzeTrend(product),
        reviews: this.analyzeReviews(product)
      };

      // Calculate weighted total score
      const totalScore = Object.entries(scores).reduce((sum, [key, value]) => {
        return sum + (value.score * CONFIG.WEIGHTS[key]);
      }, 0);

      // Determine verdict
      const verdict = this.getVerdict(totalScore);

      // Generate recommendations
      const recommendations = this.generateRecommendations(scores, product);

      // Identify strengths and weaknesses
      const strengths = this.identifyStrengths(scores);
      const weaknesses = this.identifyWeaknesses(scores);

      const result = {
        totalScore: Math.round(totalScore),
        verdict,
        scores,
        strengths,
        weaknesses,
        recommendations,
        analysis: {
          timestamp: new Date().toISOString(),
          platform: this.detectPlatform(product.source_url),
          product_id: product.external_id || product.id
        }
      };

      this.analysisResult = result;
      return result;
    }

    /**
     * Analyze demand signals
     */
    analyzeDemand(product) {
      let score = 50; // Base score
      const signals = [];

      // Check sales indicators
      if (product.orders_count !== undefined) {
        if (product.orders_count > 10000) {
          score += 40;
          signals.push({ type: 'positive', text: `${product.orders_count.toLocaleString()} commandes` });
        } else if (product.orders_count > 1000) {
          score += 25;
          signals.push({ type: 'positive', text: `${product.orders_count.toLocaleString()} commandes` });
        } else if (product.orders_count > 100) {
          score += 10;
          signals.push({ type: 'neutral', text: `${product.orders_count} commandes` });
        } else {
          signals.push({ type: 'negative', text: 'Peu de commandes' });
        }
      }

      // Check wish list / favorites
      if (product.wishlist_count && product.wishlist_count > 500) {
        score += 15;
        signals.push({ type: 'positive', text: `${product.wishlist_count} favoris` });
      }

      // Analyze title for trending keywords
      const trendingKeywords = this.detectTrendingKeywords(product.title);
      if (trendingKeywords.length > 0) {
        score += trendingKeywords.length * 5;
        signals.push({ type: 'positive', text: `Mots-clés tendance: ${trendingKeywords.join(', ')}` });
      }

      return {
        score: Math.min(100, Math.max(0, score)),
        signals,
        label: 'Demande'
      };
    }

    /**
     * Analyze competition level
     */
    analyzeCompetition(product) {
      let score = 60; // Base score (moderate competition assumed)
      const signals = [];

      // Check seller count if available
      if (product.sellers_count !== undefined) {
        if (product.sellers_count > 1000) {
          score -= 30;
          signals.push({ type: 'negative', text: 'Marché très saturé' });
        } else if (product.sellers_count > 100) {
          score -= 10;
          signals.push({ type: 'neutral', text: 'Concurrence modérée' });
        } else {
          score += 20;
          signals.push({ type: 'positive', text: 'Peu de concurrents' });
        }
      }

      // Check if product is from a known brand
      if (product.brand) {
        const isBigBrand = this.isKnownBrand(product.brand);
        if (isBigBrand) {
          score -= 15;
          signals.push({ type: 'warning', text: 'Produit de marque connue - risque IP' });
        }
      }

      // Check price uniqueness
      if (product.price_range) {
        score += 10;
        signals.push({ type: 'positive', text: 'Possibilité de différenciation prix' });
      }

      return {
        score: Math.min(100, Math.max(0, score)),
        signals,
        label: 'Concurrence'
      };
    }

    /**
     * Analyze profit margin potential
     */
    analyzeMargin(product) {
      let score = 50;
      const signals = [];

      const costPrice = this.extractNumericPrice(product.price || product.cost_price);
      const suggestedSelling = costPrice * 2.5; // Standard markup

      if (costPrice > 0) {
        // Calculate potential margin
        const margin = ((suggestedSelling - costPrice) / suggestedSelling) * 100;

        if (margin > 60) {
          score = 95;
          signals.push({ type: 'positive', text: `Marge potentielle: ${Math.round(margin)}%` });
        } else if (margin > 40) {
          score = 75;
          signals.push({ type: 'positive', text: `Marge correcte: ${Math.round(margin)}%` });
        } else if (margin > 20) {
          score = 50;
          signals.push({ type: 'neutral', text: `Marge faible: ${Math.round(margin)}%` });
        } else {
          score = 25;
          signals.push({ type: 'negative', text: `Marge insuffisante: ${Math.round(margin)}%` });
        }

        // Shipping cost consideration
        if (product.shipping_cost !== undefined) {
          const shippingCost = this.extractNumericPrice(product.shipping_cost);
          if (shippingCost === 0) {
            score += 10;
            signals.push({ type: 'positive', text: 'Livraison gratuite fournisseur' });
          } else if (shippingCost > costPrice * 0.5) {
            score -= 15;
            signals.push({ type: 'warning', text: 'Coût de livraison élevé' });
          }
        }

        // Weight consideration for shipping
        if (product.weight && product.weight > 2) {
          score -= 10;
          signals.push({ type: 'warning', text: 'Produit lourd - frais de port élevés' });
        }
      } else {
        signals.push({ type: 'neutral', text: 'Prix non disponible' });
      }

      return {
        score: Math.min(100, Math.max(0, score)),
        signals,
        label: 'Marge',
        suggestedPrice: suggestedSelling > 0 ? suggestedSelling.toFixed(2) : null
      };
    }

    /**
     * Analyze trend indicators
     */
    analyzeTrend(product) {
      let score = 50;
      const signals = [];

      // Seasonal analysis
      const season = this.detectSeasonality(product.title, product.category);
      if (season.current) {
        score += 25;
        signals.push({ type: 'positive', text: `Produit de saison (${season.name})` });
      } else if (season.upcoming) {
        score += 15;
        signals.push({ type: 'positive', text: `Saison à venir (${season.name})` });
      }

      // Check for evergreen potential
      if (this.isEvergreen(product.title, product.category)) {
        score += 20;
        signals.push({ type: 'positive', text: 'Produit evergreen' });
      }

      // Problem-solving product check
      if (this.isProblemSolver(product.title, product.description)) {
        score += 20;
        signals.push({ type: 'positive', text: 'Résout un problème spécifique' });
      }

      // Viral potential
      if (this.hasViralPotential(product)) {
        score += 15;
        signals.push({ type: 'positive', text: 'Potentiel viral' });
      }

      return {
        score: Math.min(100, Math.max(0, score)),
        signals,
        label: 'Tendance'
      };
    }

    /**
     * Analyze reviews and social proof
     */
    analyzeReviews(product) {
      let score = 50;
      const signals = [];

      // Rating analysis
      if (product.rating !== undefined) {
        if (product.rating >= 4.5) {
          score += 35;
          signals.push({ type: 'positive', text: `Excellent: ${product.rating}/5 ⭐` });
        } else if (product.rating >= 4.0) {
          score += 20;
          signals.push({ type: 'positive', text: `Bon: ${product.rating}/5 ⭐` });
        } else if (product.rating >= 3.5) {
          score += 5;
          signals.push({ type: 'neutral', text: `Correct: ${product.rating}/5 ⭐` });
        } else {
          score -= 20;
          signals.push({ type: 'negative', text: `Faible: ${product.rating}/5 ⭐` });
        }
      }

      // Review count analysis
      if (product.review_count !== undefined) {
        if (product.review_count > 1000) {
          score += 25;
          signals.push({ type: 'positive', text: `${product.review_count.toLocaleString()} avis` });
        } else if (product.review_count > 100) {
          score += 15;
          signals.push({ type: 'positive', text: `${product.review_count} avis` });
        } else if (product.review_count > 10) {
          score += 5;
          signals.push({ type: 'neutral', text: `${product.review_count} avis` });
        } else {
          signals.push({ type: 'warning', text: 'Peu d\'avis clients' });
        }
      }

      // Photo reviews bonus
      if (product.photo_reviews_count && product.photo_reviews_count > 10) {
        score += 10;
        signals.push({ type: 'positive', text: 'Avis avec photos disponibles' });
      }

      return {
        score: Math.min(100, Math.max(0, score)),
        signals,
        label: 'Avis'
      };
    }

    /**
     * Determine verdict based on total score
     */
    getVerdict(score) {
      if (score >= CONFIG.SCORE_THRESHOLDS.excellent) {
        return {
          label: '🏆 WINNING PRODUCT',
          color: '#10b981',
          description: 'Excellent potentiel ! Ce produit présente tous les signaux d\'un winner.',
          action: 'Importer et lancer immédiatement'
        };
      } else if (score >= CONFIG.SCORE_THRESHOLDS.good) {
        return {
          label: '✅ BON POTENTIEL',
          color: '#3b82f6',
          description: 'Bon produit avec un potentiel solide.',
          action: 'À tester avec un budget limité'
        };
      } else if (score >= CONFIG.SCORE_THRESHOLDS.average) {
        return {
          label: '⚡ POTENTIEL MOYEN',
          color: '#f59e0b',
          description: 'Produit correct mais nécessite optimisation.',
          action: 'Optimiser avant de lancer'
        };
      } else if (score >= CONFIG.SCORE_THRESHOLDS.poor) {
        return {
          label: '⚠️ RISQUÉ',
          color: '#ef4444',
          description: 'Plusieurs signaux d\'alerte détectés.',
          action: 'Non recommandé sans amélioration majeure'
        };
      } else {
        return {
          label: '❌ NON RECOMMANDÉ',
          color: '#991b1b',
          description: 'Ce produit ne répond pas aux critères d\'un winner.',
          action: 'Chercher une alternative'
        };
      }
    }

    /**
     * Generate actionable recommendations
     */
    generateRecommendations(scores, product) {
      const recommendations = [];

      // Based on demand score
      if (scores.demand.score < 50) {
        recommendations.push({
          category: 'Demande',
          priority: 'high',
          text: 'Valider la demande via Google Trends et recherche sur les réseaux sociaux'
        });
      }

      // Based on competition score
      if (scores.competition.score < 50) {
        recommendations.push({
          category: 'Concurrence',
          priority: 'medium',
          text: 'Différencier le produit via bundle, couleur unique, ou accessoire exclusif'
        });
      }

      // Based on margin score
      if (scores.margin.score < 60) {
        recommendations.push({
          category: 'Marge',
          priority: 'high',
          text: `Prix de vente suggéré: ${scores.margin.suggestedPrice}€ pour une marge saine`
        });
      }

      // Based on reviews score
      if (scores.reviews.score < 50) {
        recommendations.push({
          category: 'Social Proof',
          priority: 'medium',
          text: 'Importer les avis fournisseur et prévoir une stratégie de collecte d\'avis'
        });
      }

      // General recommendations
      if (!product.video_url && !product.videos?.length) {
        recommendations.push({
          category: 'Marketing',
          priority: 'medium',
          text: 'Créer une vidéo produit pour améliorer le taux de conversion'
        });
      }

      return recommendations;
    }

    identifyStrengths(scores) {
      return Object.entries(scores)
        .filter(([_, data]) => data.score >= 70)
        .map(([key, data]) => ({
          category: data.label,
          score: data.score,
          highlights: data.signals.filter(s => s.type === 'positive').map(s => s.text)
        }));
    }

    identifyWeaknesses(scores) {
      return Object.entries(scores)
        .filter(([_, data]) => data.score < 50)
        .map(([key, data]) => ({
          category: data.label,
          score: data.score,
          issues: data.signals.filter(s => s.type === 'negative' || s.type === 'warning').map(s => s.text)
        }));
    }

    // Helper methods
    detectTrendingKeywords(title) {
      const trendingTerms = [
        'tiktok', 'viral', 'trending', '2024', '2025', 'new', 'smart', 
        'wireless', 'portable', 'led', 'rgb', 'mini', 'compact',
        'eco', 'sustainable', 'organic', 'natural', 'vegan'
      ];
      
      const titleLower = (title || '').toLowerCase();
      return trendingTerms.filter(term => titleLower.includes(term));
    }

    isKnownBrand(brand) {
      const knownBrands = [
        'nike', 'adidas', 'apple', 'samsung', 'sony', 'gucci', 'louis vuitton',
        'chanel', 'dior', 'prada', 'rolex', 'cartier', 'hermes', 'balenciaga'
      ];
      return knownBrands.some(b => (brand || '').toLowerCase().includes(b));
    }

    detectSeasonality(title, category) {
      const month = new Date().getMonth();
      const text = `${title} ${category}`.toLowerCase();

      const seasons = {
        summer: { months: [5, 6, 7], keywords: ['été', 'summer', 'plage', 'beach', 'piscine', 'pool', 'soleil'] },
        winter: { months: [11, 0, 1], keywords: ['hiver', 'winter', 'neige', 'snow', 'noël', 'christmas', 'chaud'] },
        backToSchool: { months: [7, 8], keywords: ['école', 'school', 'bureau', 'office', 'étudiant'] },
        spring: { months: [2, 3, 4], keywords: ['printemps', 'spring', 'jardin', 'garden', 'outdoor'] }
      };

      for (const [name, season] of Object.entries(seasons)) {
        const hasKeyword = season.keywords.some(k => text.includes(k));
        if (hasKeyword) {
          return {
            name,
            current: season.months.includes(month),
            upcoming: season.months.includes((month + 1) % 12)
          };
        }
      }

      return { name: null, current: false, upcoming: false };
    }

    isEvergreen(title, category) {
      const evergreenTerms = [
        'téléphone', 'phone', 'cuisine', 'kitchen', 'maison', 'home',
        'beauté', 'beauty', 'santé', 'health', 'fitness', 'bébé', 'baby',
        'animal', 'pet', 'voiture', 'car', 'bureau', 'office'
      ];
      const text = `${title} ${category}`.toLowerCase();
      return evergreenTerms.some(term => text.includes(term));
    }

    isProblemSolver(title, description) {
      const problemTerms = [
        'anti', 'solution', 'résout', 'solves', 'élimine', 'removes',
        'protège', 'protects', 'organise', 'organizes', 'simplifie', 'simplifies',
        'facilite', 'facilitates', 'améliore', 'improves', 'réduit', 'reduces'
      ];
      const text = `${title} ${description}`.toLowerCase();
      return problemTerms.some(term => text.includes(term));
    }

    hasViralPotential(product) {
      // Products with visual appeal, novelty, or "wow" factor
      const viralIndicators = [
        'unique', 'innovative', 'gadget', 'magic', 'amazing', 'incredible',
        'satisfying', 'asmr', 'oddly', 'genius', 'clever', 'hack'
      ];
      const text = `${product.title} ${product.description}`.toLowerCase();
      
      // Check for viral indicators
      const hasViralKeyword = viralIndicators.some(term => text.includes(term));
      
      // Products with videos have higher viral potential
      const hasVideo = product.video_url || (product.videos && product.videos.length > 0);
      
      return hasViralKeyword || hasVideo;
    }

    detectPlatform(url) {
      if (!url) return 'unknown';
      if (url.includes('aliexpress')) return 'aliexpress';
      if (url.includes('amazon')) return 'amazon';
      if (url.includes('temu')) return 'temu';
      if (url.includes('ebay')) return 'ebay';
      if (url.includes('1688')) return '1688';
      if (url.includes('shopify') || url.includes('myshopify')) return 'shopify';
      return 'other';
    }

    extractNumericPrice(price) {
      if (!price) return 0;
      const match = String(price).match(/[\d.,]+/);
      if (!match) return 0;
      return parseFloat(match[0].replace(',', '.')) || 0;
    }
  }

  // Export globally
  window.ShopoptiWinningProductDetector = ShopoptiWinningProductDetector;
  window.shopoptiWinningDetector = new ShopoptiWinningProductDetector();

  console.log('🏆 Shopopti+ Winning Product Detector loaded');
})();
