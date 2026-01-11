/**
 * Types pour le Product Audit Engine
 * 4 dimensions d'audit: Rentabilité, Fournisseur, Flux, Marché
 */

export type AuditDimension = 'profitability' | 'supplier' | 'feed' | 'market';

export type AuditStatus = 'passed' | 'warning' | 'failed' | 'not_applicable';

export interface DimensionAuditResult {
  dimension: AuditDimension;
  score: number; // 0-100
  status: AuditStatus;
  checks: AuditCheck[];
  recommendations: string[];
  weight: number; // Poids dans le calcul du score global
}

export interface AuditCheck {
  id: string;
  name: string;
  description: string;
  status: AuditStatus;
  score: number; // 0-100
  value?: string | number | boolean;
  expectedValue?: string | number;
  recommendation?: string;
  impact: 'high' | 'medium' | 'low';
}

// === AUDIT RENTABILITÉ ===
export interface ProfitabilityAuditData {
  sellPrice: number;
  costPrice: number;
  shippingCost: number;
  platformFees: number; // Commission marketplace
  advertisingCost: number;
  returnRate: number; // Taux de retour en %
  targetMargin: number; // Marge cible en %
}

export interface ProfitabilityAuditResult extends DimensionAuditResult {
  dimension: 'profitability';
  metrics: {
    grossMargin: number;
    netMargin: number;
    profitPerUnit: number;
    breakEvenUnits: number;
    roi: number;
    marginHealth: 'excellent' | 'good' | 'warning' | 'critical';
  };
}

// === AUDIT FOURNISSEUR ===
export interface SupplierAuditData {
  supplierId?: string;
  supplierName?: string;
  supplierRating?: number; // 1-5
  averageDeliveryDays?: number;
  onTimeDeliveryRate?: number; // %
  defectRate?: number; // %
  responseTime?: number; // heures
  minimumOrderQuantity?: number;
  hasBackupSupplier?: boolean;
  lastOrderDate?: string;
}

export interface SupplierAuditResult extends DimensionAuditResult {
  dimension: 'supplier';
  metrics: {
    reliabilityScore: number;
    qualityScore: number;
    communicationScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    diversificationStatus: 'diversified' | 'single_source' | 'no_supplier';
  };
}

// === AUDIT FLUX (Feed) ===
export interface FeedAuditData {
  title?: string;
  description?: string;
  category?: string;
  gtin?: string;
  mpn?: string;
  brand?: string;
  imageUrl?: string;
  additionalImages?: string[];
  availability?: string;
  condition?: string;
  price?: number;
  salePrice?: number;
  shippingWeight?: number;
  productType?: string;
  customLabels?: string[];
  lastFeedUpdate?: string;
  feedErrors?: string[];
}

export interface FeedAuditResult extends DimensionAuditResult {
  dimension: 'feed';
  metrics: {
    googleReadyScore: number;
    metaReadyScore: number;
    amazonReadyScore: number;
    completenessScore: number;
    missingRequiredFields: string[];
    missingRecommendedFields: string[];
  };
}

// === AUDIT MARCHÉ ===
export interface MarketAuditData {
  competitorPrices?: number[];
  averageMarketPrice?: number;
  pricePosition?: 'lowest' | 'below_average' | 'average' | 'above_average' | 'highest';
  demandTrend?: 'rising' | 'stable' | 'declining';
  searchVolume?: number;
  competitionLevel?: 'low' | 'medium' | 'high' | 'very_high';
  seasonality?: 'none' | 'low' | 'high';
  marketSaturation?: number; // %
  trendingScore?: number; // 0-100
}

export interface MarketAuditResult extends DimensionAuditResult {
  dimension: 'market';
  metrics: {
    priceCompetitiveness: number;
    demandScore: number;
    opportunityScore: number;
    competitionIndex: number;
    marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
  };
}

// === RÉSULTAT GLOBAL ===
export interface ProductAuditEngineResult {
  productId: string;
  productName: string;
  productSku?: string;
  globalScore: number; // Score global 0-100
  globalStatus: AuditStatus;
  auditedAt: string;
  dimensions: {
    profitability: ProfitabilityAuditResult;
    supplier: SupplierAuditResult;
    feed: FeedAuditResult;
    market: MarketAuditResult;
  };
  summary: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    priorityActions: PriorityAction[];
  };
  trend?: {
    previousScore?: number;
    change: number;
    direction: 'up' | 'down' | 'stable';
  };
}

export interface PriorityAction {
  id: string;
  dimension: AuditDimension;
  action: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  estimatedScoreGain: number;
}

// === CONFIG ===
export interface ProductAuditEngineConfig {
  weights: {
    profitability: number;
    supplier: number;
    feed: number;
    market: number;
  };
  thresholds: {
    excellent: number; // >= 80
    good: number; // >= 60
    warning: number; // >= 40
    // below warning = failed
  };
  targetMargin: number;
  includeMarketData: boolean;
}

export const DEFAULT_AUDIT_ENGINE_CONFIG: ProductAuditEngineConfig = {
  weights: {
    profitability: 0.30, // 30%
    supplier: 0.20,      // 20%
    feed: 0.30,          // 30%
    market: 0.20         // 20%
  },
  thresholds: {
    excellent: 80,
    good: 60,
    warning: 40
  },
  targetMargin: 30, // 30% marge cible
  includeMarketData: true
};
