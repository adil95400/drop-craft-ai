/**
 * Types pour le système d'audit produit
 * Utilisés pour évaluer la qualité des produits (SEO, contenu, images, etc.)
 */

export type ProductAuditScore = {
  global: number;           // Score global 0-100
  seo: number;              // Score SEO (title, meta, keywords)
  content: number;          // Score contenu (description, richesse)
  images: number;           // Score images (nombre, qualité)
  dataCompleteness: number; // Score complétude des données (SKU, brand, GTIN)
  aiReadiness: number;      // Score préparation pour AI Shopping (Google, ChatGPT)
};

export type AuditSeverity = 'critical' | 'warning' | 'info';

export type AuditCategory = 'seo' | 'content' | 'images' | 'data' | 'ai';

export interface ProductAuditIssue {
  id: string;
  severity: AuditSeverity;
  category: AuditCategory;
  message: string;
  field?: string;
  recommendation?: string;
}

export interface ProductAuditResult {
  productId: string;
  productName: string;
  score: ProductAuditScore;
  issues: ProductAuditIssue[];
  strengths: string[];        // Points forts du produit
  timestamp: string;
  hasName: boolean;           // Flag pour produits sans nom
  needsCorrection: boolean;   // Flag pour produits à corriger
}

export interface CatalogAuditStats {
  totalProducts: number;
  averageScore: number;
  excellentCount: number;     // Score > 70
  goodCount: number;          // Score 40-70
  poorCount: number;          // Score < 40
  criticalIssuesCount: number;
  topIssues: Array<{
    category: AuditCategory;
    count: number;
    message: string;
  }>;
  needsCorrectionCount: number; // Produits sans nom ou données critiques manquantes
}

export interface AuditConfig {
  // Seuils configurables
  minTitleLength: number;
  maxTitleLength: number;
  minDescriptionLength: number;
  minImageCount: number;
  requiredFields: string[];
  
  // Options d'audit
  checkSEO: boolean;
  checkContent: boolean;
  checkImages: boolean;
  checkData: boolean;
  checkAIReadiness: boolean;
}

export const DEFAULT_AUDIT_CONFIG: AuditConfig = {
  minTitleLength: 20,
  maxTitleLength: 70,
  minDescriptionLength: 100,
  minImageCount: 2,
  requiredFields: ['name', 'description', 'price', 'sku', 'category'],
  checkSEO: true,
  checkContent: true,
  checkImages: true,
  checkData: true,
  checkAIReadiness: true
};
