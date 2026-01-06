/**
 * Competitor Pricing Service
 * Service pour le repricing concurrentiel
 */

export interface Competitor {
  id: string;
  name: string;
  website: string;
  isActive: boolean;
  lastScraped?: string;
  productsTracked: number;
  avgPriceDiff: number;
}

export interface CompetitorPrice {
  id: string;
  productId: string;
  productTitle: string;
  competitorId: string;
  competitorName: string;
  ourPrice: number;
  competitorPrice: number;
  priceDiff: number;
  priceDiffPercent: number;
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
  inStock: boolean;
}

export interface RepricingRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  strategy: 'match' | 'undercut' | 'premium' | 'dynamic';
  offset: number;
  offsetType: 'percentage' | 'fixed';
  minMargin: number;
  maxDiscount: number;
  competitorIds: string[];
  productFilter?: {
    categories?: string[];
    brands?: string[];
    minPrice?: number;
    maxPrice?: number;
  };
  schedule: 'realtime' | 'hourly' | 'daily' | 'weekly';
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string;
  productsAffected: number;
}

export interface RepricingStats {
  totalCompetitors: number;
  activeRules: number;
  productsMonitored: number;
  priceChangesToday: number;
  avgSavings: number;
  competitivePosition: 'leader' | 'competitive' | 'behind';
}

// Mock data
const mockCompetitors: Competitor[] = [
  { id: 'c1', name: 'Amazon', website: 'amazon.fr', isActive: true, lastScraped: new Date(Date.now() - 30 * 60 * 1000).toISOString(), productsTracked: 234, avgPriceDiff: -5.2 },
  { id: 'c2', name: 'Cdiscount', website: 'cdiscount.com', isActive: true, lastScraped: new Date(Date.now() - 45 * 60 * 1000).toISOString(), productsTracked: 189, avgPriceDiff: 2.1 },
  { id: 'c3', name: 'Fnac', website: 'fnac.com', isActive: true, lastScraped: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), productsTracked: 156, avgPriceDiff: 8.5 },
  { id: 'c4', name: 'Darty', website: 'darty.com', isActive: false, lastScraped: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), productsTracked: 98, avgPriceDiff: 12.3 },
];

const mockPrices: CompetitorPrice[] = [
  { id: 'p1', productId: 'prod1', productTitle: 'iPhone 15 Pro 256GB', competitorId: 'c1', competitorName: 'Amazon', ourPrice: 1199, competitorPrice: 1149, priceDiff: -50, priceDiffPercent: -4.2, lastUpdated: new Date(Date.now() - 30 * 60 * 1000).toISOString(), trend: 'down', inStock: true },
  { id: 'p2', productId: 'prod1', productTitle: 'iPhone 15 Pro 256GB', competitorId: 'c2', competitorName: 'Cdiscount', ourPrice: 1199, competitorPrice: 1189, priceDiff: -10, priceDiffPercent: -0.8, lastUpdated: new Date(Date.now() - 45 * 60 * 1000).toISOString(), trend: 'stable', inStock: true },
  { id: 'p3', productId: 'prod2', productTitle: 'Samsung Galaxy S24 Ultra', competitorId: 'c1', competitorName: 'Amazon', ourPrice: 1299, competitorPrice: 1349, priceDiff: 50, priceDiffPercent: 3.9, lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), trend: 'up', inStock: true },
  { id: 'p4', productId: 'prod3', productTitle: 'MacBook Air M3', competitorId: 'c3', competitorName: 'Fnac', ourPrice: 1299, competitorPrice: 1399, priceDiff: 100, priceDiffPercent: 7.7, lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), trend: 'stable', inStock: false },
  { id: 'p5', productId: 'prod4', productTitle: 'Sony WH-1000XM5', competitorId: 'c1', competitorName: 'Amazon', ourPrice: 379, competitorPrice: 349, priceDiff: -30, priceDiffPercent: -7.9, lastUpdated: new Date(Date.now() - 15 * 60 * 1000).toISOString(), trend: 'down', inStock: true },
  { id: 'p6', productId: 'prod5', productTitle: 'iPad Pro 12.9"', competitorId: 'c2', competitorName: 'Cdiscount', ourPrice: 1199, competitorPrice: 1149, priceDiff: -50, priceDiffPercent: -4.2, lastUpdated: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), trend: 'down', inStock: true },
];

const mockRules: RepricingRule[] = [
  {
    id: 'r1',
    name: 'Aligner sur Amazon',
    description: 'Aligne les prix sur Amazon avec une marge minimum de 10%',
    isActive: true,
    strategy: 'match',
    offset: 0,
    offsetType: 'percentage',
    minMargin: 10,
    maxDiscount: 15,
    competitorIds: ['c1'],
    schedule: 'hourly',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastExecutedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    productsAffected: 145
  },
  {
    id: 'r2',
    name: 'Battre Cdiscount -2%',
    description: 'Prix inférieur de 2% à Cdiscount',
    isActive: true,
    strategy: 'undercut',
    offset: 2,
    offsetType: 'percentage',
    minMargin: 8,
    maxDiscount: 20,
    competitorIds: ['c2'],
    schedule: 'daily',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    lastExecutedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    productsAffected: 89
  },
  {
    id: 'r3',
    name: 'Premium Fnac +5%',
    description: 'Prix supérieur de 5% à la Fnac pour les produits premium',
    isActive: false,
    strategy: 'premium',
    offset: 5,
    offsetType: 'percentage',
    minMargin: 15,
    maxDiscount: 0,
    competitorIds: ['c3'],
    productFilter: { categories: ['Audio Premium', 'Apple'] },
    schedule: 'weekly',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    productsAffected: 34
  }
];

export const CompetitorPricingService = {
  async getCompetitors(): Promise<Competitor[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...mockCompetitors];
  },

  async addCompetitor(competitor: Omit<Competitor, 'id' | 'productsTracked' | 'avgPriceDiff'>): Promise<Competitor> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const newCompetitor: Competitor = {
      ...competitor,
      id: `comp_${Date.now()}`,
      productsTracked: 0,
      avgPriceDiff: 0
    };
    mockCompetitors.push(newCompetitor);
    return newCompetitor;
  },

  async removeCompetitor(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = mockCompetitors.findIndex(c => c.id === id);
    if (index !== -1) mockCompetitors.splice(index, 1);
  },

  async toggleCompetitor(id: string): Promise<Competitor> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const competitor = mockCompetitors.find(c => c.id === id);
    if (!competitor) throw new Error('Competitor not found');
    competitor.isActive = !competitor.isActive;
    return competitor;
  },

  async getCompetitorPrices(filters?: { competitorId?: string; productId?: string }): Promise<CompetitorPrice[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    let prices = [...mockPrices];
    if (filters?.competitorId) {
      prices = prices.filter(p => p.competitorId === filters.competitorId);
    }
    if (filters?.productId) {
      prices = prices.filter(p => p.productId === filters.productId);
    }
    return prices;
  },

  async refreshPrices(competitorId?: string): Promise<{ updated: number; failed: number }> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { updated: Math.floor(Math.random() * 50) + 20, failed: Math.floor(Math.random() * 5) };
  },

  async getRepricingRules(): Promise<RepricingRule[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...mockRules];
  },

  async createRepricingRule(rule: Omit<RepricingRule, 'id' | 'createdAt' | 'updatedAt' | 'productsAffected'>): Promise<RepricingRule> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const newRule: RepricingRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      productsAffected: 0
    };
    mockRules.push(newRule);
    return newRule;
  },

  async updateRepricingRule(id: string, updates: Partial<RepricingRule>): Promise<RepricingRule> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockRules.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Rule not found');
    mockRules[index] = { ...mockRules[index], ...updates, updatedAt: new Date().toISOString() };
    return mockRules[index];
  },

  async deleteRepricingRule(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = mockRules.findIndex(r => r.id === id);
    if (index !== -1) mockRules.splice(index, 1);
  },

  async toggleRepricingRule(id: string): Promise<RepricingRule> {
    const rule = mockRules.find(r => r.id === id);
    if (!rule) throw new Error('Rule not found');
    return this.updateRepricingRule(id, { isActive: !rule.isActive });
  },

  async executeRepricingRule(id: string): Promise<{ success: boolean; priceChanges: number; errors: number }> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const rule = mockRules.find(r => r.id === id);
    if (!rule) throw new Error('Rule not found');
    
    const changes = Math.floor(Math.random() * 30) + 5;
    rule.lastExecutedAt = new Date().toISOString();
    rule.productsAffected = changes;
    
    return { success: true, priceChanges: changes, errors: Math.floor(Math.random() * 3) };
  },

  async getStats(): Promise<RepricingStats> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const activeCompetitors = mockCompetitors.filter(c => c.isActive);
    const activeRules = mockRules.filter(r => r.isActive);
    
    return {
      totalCompetitors: activeCompetitors.length,
      activeRules: activeRules.length,
      productsMonitored: mockPrices.length,
      priceChangesToday: Math.floor(Math.random() * 50) + 10,
      avgSavings: 4.5,
      competitivePosition: 'competitive'
    };
  },

  async simulatePriceChange(productId: string, newPrice: number): Promise<{ 
    currentMargin: number; 
    newMargin: number; 
    competitorComparison: { name: string; theirPrice: number; difference: number }[] 
  }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const productPrices = mockPrices.filter(p => p.productId === productId);
    
    return {
      currentMargin: 25,
      newMargin: 22,
      competitorComparison: productPrices.map(p => ({
        name: p.competitorName,
        theirPrice: p.competitorPrice,
        difference: newPrice - p.competitorPrice
      }))
    };
  }
};
