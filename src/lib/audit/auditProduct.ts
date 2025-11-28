/**
 * Moteur d'audit produit
 * Calcule les scores de qualité et détecte les problèmes
 */

import { UnifiedProduct } from '@/services/ProductsUnifiedService';
import { 
  ProductAuditResult, 
  ProductAuditScore, 
  ProductAuditIssue,
  AuditConfig,
  DEFAULT_AUDIT_CONFIG,
  AuditSeverity,
  AuditCategory
} from '@/types/audit';

/**
 * Audite un produit et retourne un résultat complet
 */
export function auditProduct(
  product: UnifiedProduct, 
  config: AuditConfig = DEFAULT_AUDIT_CONFIG
): ProductAuditResult {
  const issues: ProductAuditIssue[] = [];
  const strengths: string[] = [];
  
  // Vérifier si le produit a un nom
  const hasName = Boolean(product.name && product.name.trim() !== '' && product.name !== 'Produit sans nom');
  
  // Calcul des scores par catégorie
  const seoScore = config.checkSEO ? calculateSEOScore(product, issues, strengths, config) : 100;
  const contentScore = config.checkContent ? calculateContentScore(product, issues, strengths, config) : 100;
  const imagesScore = config.checkImages ? calculateImagesScore(product, issues, strengths, config) : 100;
  const dataScore = config.checkData ? calculateDataCompletenessScore(product, issues, strengths, config) : 100;
  const aiReadinessScore = config.checkAIReadiness ? calculateAIReadinessScore(product, issues, strengths, config) : 100;
  
  // Score global = moyenne pondérée
  const weights = {
    seo: 0.25,
    content: 0.25,
    images: 0.20,
    data: 0.20,
    ai: 0.10
  };
  
  const globalScore = Math.round(
    seoScore * weights.seo +
    contentScore * weights.content +
    imagesScore * weights.images +
    dataScore * weights.data +
    aiReadinessScore * weights.ai
  );
  
  const score: ProductAuditScore = {
    global: globalScore,
    seo: seoScore,
    content: contentScore,
    images: imagesScore,
    dataCompleteness: dataScore,
    aiReadiness: aiReadinessScore
  };
  
  // Flag "needs correction" si problèmes critiques
  const needsCorrection = !hasName || issues.some(i => i.severity === 'critical');
  
  return {
    productId: product.id,
    productName: product.name || 'Produit sans nom',
    score,
    issues,
    strengths,
    timestamp: new Date().toISOString(),
    hasName,
    needsCorrection
  };
}

/**
 * Calcule le score SEO (title, meta, structure)
 */
function calculateSEOScore(
  product: UnifiedProduct,
  issues: ProductAuditIssue[],
  strengths: string[],
  config: AuditConfig
): number {
  let score = 100;
  const titleLength = product.name?.length || 0;
  
  // Titre vide = critique
  if (!product.name || product.name.trim() === '' || product.name === 'Produit sans nom') {
    issues.push({
      id: `seo-title-empty-${product.id}`,
      severity: 'critical',
      category: 'seo',
      message: 'Titre manquant',
      field: 'name',
      recommendation: 'Ajouter un titre descriptif pour améliorer le référencement'
    });
    score -= 50;
  }
  // Titre trop court
  else if (titleLength < config.minTitleLength) {
    issues.push({
      id: `seo-title-short-${product.id}`,
      severity: 'warning',
      category: 'seo',
      message: `Titre trop court (${titleLength} caractères)`,
      field: 'name',
      recommendation: `Le titre doit faire au moins ${config.minTitleLength} caractères pour le SEO`
    });
    score -= 20;
  }
  // Titre trop long
  else if (titleLength > config.maxTitleLength) {
    issues.push({
      id: `seo-title-long-${product.id}`,
      severity: 'warning',
      category: 'seo',
      message: `Titre trop long (${titleLength} caractères)`,
      field: 'name',
      recommendation: `Le titre ne doit pas dépasser ${config.maxTitleLength} caractères`
    });
    score -= 15;
  }
  // Titre optimal
  else {
    strengths.push('Titre optimisé pour le SEO');
  }
  
  // Catégorie manquante
  if (!product.category) {
    issues.push({
      id: `seo-category-${product.id}`,
      severity: 'warning',
      category: 'seo',
      message: 'Catégorie non définie',
      field: 'category',
      recommendation: 'Ajouter une catégorie pour améliorer la découverte du produit'
    });
    score -= 15;
  } else {
    strengths.push('Catégorie définie');
  }
  
  return Math.max(0, score);
}

/**
 * Calcule le score de contenu (description, richesse)
 */
function calculateContentScore(
  product: UnifiedProduct,
  issues: ProductAuditIssue[],
  strengths: string[],
  config: AuditConfig
): number {
  let score = 100;
  const descLength = product.description?.length || 0;
  
  // Description vide
  if (!product.description || product.description.trim() === '') {
    issues.push({
      id: `content-desc-empty-${product.id}`,
      severity: 'critical',
      category: 'content',
      message: 'Description manquante',
      field: 'description',
      recommendation: 'Ajouter une description détaillée pour convaincre les acheteurs'
    });
    score -= 50;
  }
  // Description trop courte
  else if (descLength < config.minDescriptionLength) {
    issues.push({
      id: `content-desc-short-${product.id}`,
      severity: 'warning',
      category: 'content',
      message: `Description trop courte (${descLength} caractères)`,
      field: 'description',
      recommendation: `La description doit faire au moins ${config.minDescriptionLength} caractères`
    });
    score -= 30;
  }
  // Description complète
  else {
    strengths.push('Description complète et détaillée');
    if (descLength > 300) {
      strengths.push('Description très riche');
    }
  }
  
  return Math.max(0, score);
}

/**
 * Calcule le score des images (nombre, qualité)
 */
function calculateImagesScore(
  product: UnifiedProduct,
  issues: ProductAuditIssue[],
  strengths: string[],
  config: AuditConfig
): number {
  let score = 100;
  const imageCount = product.images?.length || (product.image_url ? 1 : 0);
  
  // Aucune image
  if (imageCount === 0) {
    issues.push({
      id: `images-none-${product.id}`,
      severity: 'critical',
      category: 'images',
      message: 'Aucune image',
      field: 'images',
      recommendation: 'Ajouter au moins 2-3 images de qualité'
    });
    score -= 60;
  }
  // Une seule image
  else if (imageCount === 1) {
    issues.push({
      id: `images-single-${product.id}`,
      severity: 'warning',
      category: 'images',
      message: 'Une seule image',
      field: 'images',
      recommendation: 'Ajouter plusieurs images sous différents angles'
    });
    score -= 30;
  }
  // Nombre insuffisant d'images
  else if (imageCount < config.minImageCount) {
    issues.push({
      id: `images-few-${product.id}`,
      severity: 'info',
      category: 'images',
      message: `Seulement ${imageCount} images`,
      field: 'images',
      recommendation: `Ajouter au moins ${config.minImageCount} images pour optimiser la conversion`
    });
    score -= 15;
  }
  // Bon nombre d'images
  else {
    strengths.push(`${imageCount} images disponibles`);
    if (imageCount >= 5) {
      strengths.push('Galerie d\'images complète');
    }
  }
  
  return Math.max(0, score);
}

/**
 * Calcule le score de complétude des données (SKU, GTIN, brand)
 */
function calculateDataCompletenessScore(
  product: UnifiedProduct,
  issues: ProductAuditIssue[],
  strengths: string[],
  config: AuditConfig
): number {
  let score = 100;
  
  // SKU manquant
  if (!product.sku) {
    issues.push({
      id: `data-sku-${product.id}`,
      severity: 'warning',
      category: 'data',
      message: 'SKU manquant',
      field: 'sku',
      recommendation: 'Ajouter un SKU pour faciliter la gestion des stocks'
    });
    score -= 25;
  } else {
    strengths.push('SKU défini');
  }
  
  // Prix manquant ou nul
  if (!product.price || product.price === 0) {
    issues.push({
      id: `data-price-${product.id}`,
      severity: 'critical',
      category: 'data',
      message: 'Prix manquant ou nul',
      field: 'price',
      recommendation: 'Définir un prix de vente'
    });
    score -= 40;
  } else {
    strengths.push('Prix défini');
  }
  
  // Prix de revient manquant
  if (!product.cost_price) {
    issues.push({
      id: `data-cost-${product.id}`,
      severity: 'info',
      category: 'data',
      message: 'Prix de revient non renseigné',
      field: 'cost_price',
      recommendation: 'Renseigner le prix de revient pour calculer la marge'
    });
    score -= 10;
  } else {
    strengths.push('Marge calculée');
  }
  
  // Stock
  if (product.stock_quantity === undefined || product.stock_quantity === null) {
    issues.push({
      id: `data-stock-${product.id}`,
      severity: 'info',
      category: 'data',
      message: 'Stock non renseigné',
      field: 'stock_quantity',
      recommendation: 'Renseigner le stock disponible'
    });
    score -= 10;
  }
  
  return Math.max(0, score);
}

/**
 * Calcule le score de préparation pour AI Shopping (Google, ChatGPT)
 */
function calculateAIReadinessScore(
  product: UnifiedProduct,
  issues: ProductAuditIssue[],
  strengths: string[],
  config: AuditConfig
): number {
  let score = 100;
  let missingFields = 0;
  
  // Champs critiques pour AI Shopping
  const requiredForAI = ['name', 'description', 'category', 'price'];
  const hasImages = (product.images?.length || 0) > 0 || Boolean(product.image_url);
  
  requiredForAI.forEach(field => {
    const value = product[field as keyof UnifiedProduct];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missingFields++;
    }
  });
  
  if (!hasImages) {
    missingFields++;
  }
  
  if (missingFields > 0) {
    const missingFieldsList = requiredForAI.filter(f => {
      const value = product[f as keyof UnifiedProduct];
      return !value || (typeof value === 'string' && value.trim() === '');
    });
    if (!hasImages) missingFieldsList.push('images');
    
    issues.push({
      id: `ai-missing-${product.id}`,
      severity: missingFields >= 3 ? 'critical' : 'warning',
      category: 'ai',
      message: `${missingFields} champ(s) manquant(s) pour AI Shopping`,
      field: 'multiple',
      recommendation: `Compléter: ${missingFieldsList.join(', ')}`
    });
    score -= missingFields * 20;
  } else {
    strengths.push('Prêt pour Google AI Shopping / ChatGPT Shopping');
  }
  
  return Math.max(0, score);
}

/**
 * Calcule les statistiques d'audit pour un catalogue complet
 */
export function calculateCatalogStats(auditResults: ProductAuditResult[]): {
  totalProducts: number;
  averageScore: number;
  excellentCount: number;
  goodCount: number;
  poorCount: number;
  criticalIssuesCount: number;
  needsCorrectionCount: number;
  topIssues: Array<{ category: string; count: number; message: string }>;
} {
  const totalProducts = auditResults.length;
  
  if (totalProducts === 0) {
    return {
      totalProducts: 0,
      averageScore: 0,
      excellentCount: 0,
      goodCount: 0,
      poorCount: 0,
      criticalIssuesCount: 0,
      needsCorrectionCount: 0,
      topIssues: []
    };
  }
  
  const averageScore = Math.round(
    auditResults.reduce((sum, r) => sum + r.score.global, 0) / totalProducts
  );
  
  const excellentCount = auditResults.filter(r => r.score.global > 70).length;
  const goodCount = auditResults.filter(r => r.score.global >= 40 && r.score.global <= 70).length;
  const poorCount = auditResults.filter(r => r.score.global < 40).length;
  
  const criticalIssuesCount = auditResults.reduce(
    (sum, r) => sum + r.issues.filter(i => i.severity === 'critical').length,
    0
  );
  
  const needsCorrectionCount = auditResults.filter(r => r.needsCorrection).length;
  
  // Compter les issues par catégorie
  const issuesByCategory: Record<string, { count: number; messages: Set<string> }> = {};
  
  auditResults.forEach(result => {
    result.issues.forEach(issue => {
      const key = issue.category;
      if (!issuesByCategory[key]) {
        issuesByCategory[key] = { count: 0, messages: new Set() };
      }
      issuesByCategory[key].count++;
      issuesByCategory[key].messages.add(issue.message);
    });
  });
  
  const topIssues = Object.entries(issuesByCategory)
    .map(([category, data]) => ({
      category,
      count: data.count,
      message: Array.from(data.messages)[0] // Premier message comme exemple
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  return {
    totalProducts,
    averageScore,
    excellentCount,
    goodCount,
    poorCount,
    criticalIssuesCount,
    needsCorrectionCount,
    topIssues
  };
}
