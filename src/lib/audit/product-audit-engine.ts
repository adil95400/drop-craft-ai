/**
 * Product Audit Engine
 * Moteur d'audit complet avec 4 dimensions:
 * - Rentabilité (Profitability)
 * - Fournisseur (Supplier)
 * - Flux (Feed)
 * - Marché (Market)
 */

import {
  ProductAuditEngineResult,
  ProductAuditEngineConfig,
  DEFAULT_AUDIT_ENGINE_CONFIG,
  ProfitabilityAuditResult,
  SupplierAuditResult,
  FeedAuditResult,
  MarketAuditResult,
  ProfitabilityAuditData,
  SupplierAuditData,
  FeedAuditData,
  MarketAuditData,
  AuditCheck,
  AuditStatus,
  PriorityAction,
  AuditDimension
} from '@/types/product-audit-engine';

// ============================================================================
// AUDIT RENTABILITÉ
// ============================================================================

export function auditProfitability(
  data: ProfitabilityAuditData,
  config: ProductAuditEngineConfig = DEFAULT_AUDIT_ENGINE_CONFIG
): ProfitabilityAuditResult {
  const checks: AuditCheck[] = [];
  
  // Calcul des métriques
  const grossProfit = data.sellPrice - data.costPrice - data.shippingCost;
  const grossMargin = data.sellPrice > 0 ? (grossProfit / data.sellPrice) * 100 : 0;
  
  const netProfit = grossProfit - data.platformFees - data.advertisingCost;
  const returnLoss = (data.sellPrice * data.returnRate) / 100;
  const adjustedNetProfit = netProfit - returnLoss;
  const netMargin = data.sellPrice > 0 ? (adjustedNetProfit / data.sellPrice) * 100 : 0;
  
  const profitPerUnit = adjustedNetProfit;
  const totalCosts = data.costPrice + data.shippingCost + data.platformFees + data.advertisingCost;
  const breakEvenUnits = totalCosts > 0 && profitPerUnit > 0 ? Math.ceil(totalCosts / profitPerUnit) : 0;
  const roi = totalCosts > 0 ? ((adjustedNetProfit / totalCosts) * 100) : 0;
  
  // Déterminer la santé de la marge
  let marginHealth: 'excellent' | 'good' | 'warning' | 'critical' = 'critical';
  if (netMargin >= config.targetMargin) marginHealth = 'excellent';
  else if (netMargin >= config.targetMargin * 0.7) marginHealth = 'good';
  else if (netMargin >= config.targetMargin * 0.4) marginHealth = 'warning';
  
  // Check 1: Marge brute
  checks.push({
    id: 'gross-margin',
    name: 'Marge brute',
    description: 'Marge avant frais de plateforme et publicité',
    status: grossMargin >= 40 ? 'passed' : grossMargin >= 25 ? 'warning' : 'failed',
    score: Math.min(100, Math.max(0, grossMargin * 2)),
    value: `${grossMargin.toFixed(1)}%`,
    expectedValue: '≥ 40%',
    recommendation: grossMargin < 40 ? 'Négociez de meilleurs prix fournisseur ou augmentez le prix de vente' : undefined,
    impact: 'high'
  });
  
  // Check 2: Marge nette
  checks.push({
    id: 'net-margin',
    name: 'Marge nette',
    description: 'Marge après tous les frais',
    status: netMargin >= config.targetMargin ? 'passed' : netMargin >= config.targetMargin * 0.6 ? 'warning' : 'failed',
    score: Math.min(100, Math.max(0, (netMargin / config.targetMargin) * 100)),
    value: `${netMargin.toFixed(1)}%`,
    expectedValue: `≥ ${config.targetMargin}%`,
    recommendation: netMargin < config.targetMargin ? 'Réduisez les coûts publicitaires ou les frais de plateforme' : undefined,
    impact: 'high'
  });
  
  // Check 3: ROI
  checks.push({
    id: 'roi',
    name: 'Retour sur investissement',
    description: 'ROI par unité vendue',
    status: roi >= 50 ? 'passed' : roi >= 20 ? 'warning' : 'failed',
    score: Math.min(100, Math.max(0, roi)),
    value: `${roi.toFixed(1)}%`,
    expectedValue: '≥ 50%',
    recommendation: roi < 50 ? 'Optimisez la structure de coûts pour améliorer le ROI' : undefined,
    impact: 'medium'
  });
  
  // Check 4: Taux de retour
  checks.push({
    id: 'return-rate',
    name: 'Taux de retour',
    description: 'Impact des retours sur la rentabilité',
    status: data.returnRate <= 5 ? 'passed' : data.returnRate <= 15 ? 'warning' : 'failed',
    score: Math.max(0, 100 - data.returnRate * 5),
    value: `${data.returnRate}%`,
    expectedValue: '≤ 5%',
    recommendation: data.returnRate > 5 ? 'Améliorez les descriptions et photos pour réduire les retours' : undefined,
    impact: 'medium'
  });
  
  // Check 5: Profit par unité
  checks.push({
    id: 'profit-per-unit',
    name: 'Profit par unité',
    description: 'Bénéfice net par produit vendu',
    status: profitPerUnit >= 5 ? 'passed' : profitPerUnit >= 2 ? 'warning' : 'failed',
    score: Math.min(100, Math.max(0, profitPerUnit * 10)),
    value: `${profitPerUnit.toFixed(2)}€`,
    expectedValue: '≥ 5€',
    recommendation: profitPerUnit < 5 ? 'Ce produit génère peu de profit par vente' : undefined,
    impact: 'high'
  });
  
  const avgScore = checks.reduce((sum, c) => sum + c.score, 0) / checks.length;
  
  return {
    dimension: 'profitability',
    score: Math.round(avgScore),
    status: getStatusFromScore(avgScore),
    checks,
    recommendations: checks.filter(c => c.recommendation).map(c => c.recommendation!),
    weight: config.weights.profitability,
    metrics: {
      grossMargin: Math.round(grossMargin * 10) / 10,
      netMargin: Math.round(netMargin * 10) / 10,
      profitPerUnit: Math.round(profitPerUnit * 100) / 100,
      breakEvenUnits,
      roi: Math.round(roi * 10) / 10,
      marginHealth
    }
  };
}

// ============================================================================
// AUDIT FOURNISSEUR
// ============================================================================

export function auditSupplier(
  data: SupplierAuditData,
  config: ProductAuditEngineConfig = DEFAULT_AUDIT_ENGINE_CONFIG
): SupplierAuditResult {
  const checks: AuditCheck[] = [];
  
  // Check 1: Fournisseur assigné
  const hasSupplier = Boolean(data.supplierId || data.supplierName);
  checks.push({
    id: 'supplier-assigned',
    name: 'Fournisseur assigné',
    description: 'Produit lié à un fournisseur',
    status: hasSupplier ? 'passed' : 'failed',
    score: hasSupplier ? 100 : 0,
    value: hasSupplier ? data.supplierName || 'Oui' : 'Non',
    expectedValue: 'Assigné',
    recommendation: !hasSupplier ? 'Assignez un fournisseur à ce produit' : undefined,
    impact: 'high'
  });
  
  // Check 2: Note fournisseur
  const rating = data.supplierRating || 0;
  checks.push({
    id: 'supplier-rating',
    name: 'Note fournisseur',
    description: 'Évaluation globale du fournisseur',
    status: rating >= 4 ? 'passed' : rating >= 3 ? 'warning' : rating > 0 ? 'failed' : 'not_applicable',
    score: rating > 0 ? rating * 20 : 50,
    value: rating > 0 ? `${rating}/5` : 'Non évalué',
    expectedValue: '≥ 4/5',
    recommendation: rating > 0 && rating < 4 ? 'Envisagez un fournisseur mieux noté' : undefined,
    impact: 'medium'
  });
  
  // Check 3: Délai de livraison
  const deliveryDays = data.averageDeliveryDays || 0;
  checks.push({
    id: 'delivery-time',
    name: 'Délai de livraison',
    description: 'Délai moyen de livraison fournisseur',
    status: deliveryDays <= 7 ? 'passed' : deliveryDays <= 14 ? 'warning' : deliveryDays > 0 ? 'failed' : 'not_applicable',
    score: deliveryDays > 0 ? Math.max(0, 100 - (deliveryDays - 3) * 10) : 50,
    value: deliveryDays > 0 ? `${deliveryDays} jours` : 'Inconnu',
    expectedValue: '≤ 7 jours',
    recommendation: deliveryDays > 7 ? 'Les délais longs impactent la satisfaction client' : undefined,
    impact: 'high'
  });
  
  // Check 4: Taux de livraison à temps
  const onTimeRate = data.onTimeDeliveryRate ?? -1;
  checks.push({
    id: 'on-time-delivery',
    name: 'Livraison à temps',
    description: 'Pourcentage de commandes livrées dans les délais',
    status: onTimeRate >= 95 ? 'passed' : onTimeRate >= 85 ? 'warning' : onTimeRate >= 0 ? 'failed' : 'not_applicable',
    score: onTimeRate >= 0 ? onTimeRate : 50,
    value: onTimeRate >= 0 ? `${onTimeRate}%` : 'Non mesuré',
    expectedValue: '≥ 95%',
    recommendation: onTimeRate >= 0 && onTimeRate < 95 ? 'Fiabilité insuffisante, diversifiez vos fournisseurs' : undefined,
    impact: 'high'
  });
  
  // Check 5: Taux de défaut
  const defectRate = data.defectRate ?? -1;
  checks.push({
    id: 'defect-rate',
    name: 'Taux de défaut',
    description: 'Pourcentage de produits défectueux',
    status: defectRate <= 2 ? 'passed' : defectRate <= 5 ? 'warning' : defectRate >= 0 ? 'failed' : 'not_applicable',
    score: defectRate >= 0 ? Math.max(0, 100 - defectRate * 10) : 50,
    value: defectRate >= 0 ? `${defectRate}%` : 'Non mesuré',
    expectedValue: '≤ 2%',
    recommendation: defectRate > 2 ? 'Qualité produit insuffisante, négociez des améliorations' : undefined,
    impact: 'high'
  });
  
  // Check 6: Fournisseur de secours
  checks.push({
    id: 'backup-supplier',
    name: 'Fournisseur de secours',
    description: 'Alternative en cas de rupture',
    status: data.hasBackupSupplier ? 'passed' : 'warning',
    score: data.hasBackupSupplier ? 100 : 40,
    value: data.hasBackupSupplier ? 'Oui' : 'Non',
    expectedValue: 'Oui',
    recommendation: !data.hasBackupSupplier ? 'Identifiez un fournisseur alternatif pour réduire les risques' : undefined,
    impact: 'medium'
  });
  
  // Calcul des métriques
  const reliabilityScore = (
    (onTimeRate >= 0 ? onTimeRate : 70) * 0.5 +
    (defectRate >= 0 ? Math.max(0, 100 - defectRate * 10) : 70) * 0.5
  );
  
  const qualityScore = defectRate >= 0 ? Math.max(0, 100 - defectRate * 20) : 70;
  const communicationScore = data.responseTime 
    ? Math.max(0, 100 - (data.responseTime - 2) * 10) 
    : 70;
  
  const riskLevel = hasSupplier
    ? (data.hasBackupSupplier 
      ? (reliabilityScore >= 80 ? 'low' : 'medium')
      : (reliabilityScore >= 80 ? 'medium' : 'high'))
    : 'critical';
  
  const diversificationStatus = !hasSupplier 
    ? 'no_supplier' 
    : (data.hasBackupSupplier ? 'diversified' : 'single_source');
  
  const avgScore = checks.reduce((sum, c) => sum + c.score, 0) / checks.length;
  
  return {
    dimension: 'supplier',
    score: Math.round(avgScore),
    status: getStatusFromScore(avgScore),
    checks,
    recommendations: checks.filter(c => c.recommendation).map(c => c.recommendation!),
    weight: config.weights.supplier,
    metrics: {
      reliabilityScore: Math.round(reliabilityScore),
      qualityScore: Math.round(qualityScore),
      communicationScore: Math.round(communicationScore),
      riskLevel,
      diversificationStatus
    }
  };
}

// ============================================================================
// AUDIT FLUX (Feed)
// ============================================================================

export function auditFeed(
  data: FeedAuditData,
  config: ProductAuditEngineConfig = DEFAULT_AUDIT_ENGINE_CONFIG
): FeedAuditResult {
  const checks: AuditCheck[] = [];
  
  // Champs requis Google Shopping
  const googleRequiredFields = ['title', 'description', 'imageUrl', 'price', 'availability'];
  const googleRecommendedFields = ['gtin', 'mpn', 'brand', 'category', 'condition', 'shippingWeight'];
  
  // Check 1: Titre
  const titleLength = data.title?.length || 0;
  checks.push({
    id: 'feed-title',
    name: 'Titre produit',
    description: 'Titre optimisé pour les flux',
    status: titleLength >= 30 && titleLength <= 150 ? 'passed' : titleLength >= 20 ? 'warning' : 'failed',
    score: titleLength >= 30 ? Math.min(100, 50 + (titleLength <= 150 ? 50 : 30)) : titleLength * 2,
    value: titleLength > 0 ? `${titleLength} car.` : 'Manquant',
    expectedValue: '30-150 caractères',
    recommendation: titleLength < 30 ? 'Enrichissez le titre avec des mots-clés pertinents' : undefined,
    impact: 'high'
  });
  
  // Check 2: Description
  const descLength = data.description?.length || 0;
  checks.push({
    id: 'feed-description',
    name: 'Description',
    description: 'Description détaillée du produit',
    status: descLength >= 150 ? 'passed' : descLength >= 50 ? 'warning' : 'failed',
    score: Math.min(100, Math.max(0, descLength / 3)),
    value: descLength > 0 ? `${descLength} car.` : 'Manquante',
    expectedValue: '≥ 150 caractères',
    recommendation: descLength < 150 ? 'Ajoutez une description détaillée pour améliorer la visibilité' : undefined,
    impact: 'high'
  });
  
  // Check 3: Image principale
  const hasImage = Boolean(data.imageUrl);
  checks.push({
    id: 'feed-image',
    name: 'Image principale',
    description: 'Image de qualité pour les plateformes',
    status: hasImage ? 'passed' : 'failed',
    score: hasImage ? 100 : 0,
    value: hasImage ? 'Présente' : 'Manquante',
    expectedValue: 'Requise',
    recommendation: !hasImage ? 'Ajoutez une image haute résolution (min. 800x800px)' : undefined,
    impact: 'high'
  });
  
  // Check 4: Images additionnelles
  const additionalImagesCount = data.additionalImages?.length || 0;
  checks.push({
    id: 'feed-additional-images',
    name: 'Images additionnelles',
    description: 'Galerie d\'images complète',
    status: additionalImagesCount >= 3 ? 'passed' : additionalImagesCount >= 1 ? 'warning' : 'failed',
    score: Math.min(100, additionalImagesCount * 25),
    value: `${additionalImagesCount} images`,
    expectedValue: '≥ 3 images',
    recommendation: additionalImagesCount < 3 ? 'Ajoutez plus d\'images sous différents angles' : undefined,
    impact: 'medium'
  });
  
  // Check 5: GTIN/EAN
  const hasGtin = Boolean(data.gtin);
  checks.push({
    id: 'feed-gtin',
    name: 'GTIN/EAN',
    description: 'Code-barres international',
    status: hasGtin ? 'passed' : 'warning',
    score: hasGtin ? 100 : 40,
    value: hasGtin ? data.gtin! : 'Non renseigné',
    expectedValue: 'Requis pour Google',
    recommendation: !hasGtin ? 'Ajoutez le GTIN pour améliorer la visibilité Google Shopping' : undefined,
    impact: 'high'
  });
  
  // Check 6: Marque
  const hasBrand = Boolean(data.brand);
  checks.push({
    id: 'feed-brand',
    name: 'Marque',
    description: 'Nom de la marque du produit',
    status: hasBrand ? 'passed' : 'warning',
    score: hasBrand ? 100 : 50,
    value: hasBrand ? data.brand! : 'Non renseignée',
    expectedValue: 'Recommandé',
    recommendation: !hasBrand ? 'Renseignez la marque pour le filtrage marketplace' : undefined,
    impact: 'medium'
  });
  
  // Check 7: Catégorie
  const hasCategory = Boolean(data.category);
  checks.push({
    id: 'feed-category',
    name: 'Catégorie Google',
    description: 'Catégorie taxonomie Google',
    status: hasCategory ? 'passed' : 'warning',
    score: hasCategory ? 100 : 40,
    value: hasCategory ? 'Définie' : 'Non définie',
    expectedValue: 'Requise',
    recommendation: !hasCategory ? 'Mappez le produit à une catégorie Google Product Category' : undefined,
    impact: 'high'
  });
  
  // Check 8: Disponibilité
  const hasAvailability = Boolean(data.availability);
  checks.push({
    id: 'feed-availability',
    name: 'Disponibilité',
    description: 'Statut de stock',
    status: hasAvailability ? 'passed' : 'warning',
    score: hasAvailability ? 100 : 60,
    value: hasAvailability ? data.availability! : 'Non définie',
    expectedValue: 'in_stock / out_of_stock',
    recommendation: !hasAvailability ? 'Indiquez la disponibilité pour les flux' : undefined,
    impact: 'medium'
  });
  
  // Calcul des métriques
  const missingRequired = googleRequiredFields.filter(f => {
    const key = f === 'imageUrl' ? 'imageUrl' : f;
    return !data[key as keyof FeedAuditData];
  });
  
  const missingRecommended = googleRecommendedFields.filter(f => {
    return !data[f as keyof FeedAuditData];
  });
  
  const googleScore = Math.round(100 - (missingRequired.length * 15) - (missingRecommended.length * 5));
  const metaScore = Math.round(100 - (missingRequired.length * 12) - (missingRecommended.length * 3));
  const amazonScore = Math.round(100 - (missingRequired.length * 10) - (missingRecommended.length * 8));
  
  const completenessScore = Math.round(
    (Object.values(data).filter(v => v !== undefined && v !== null && v !== '').length /
    Object.keys(data).length) * 100
  );
  
  const avgScore = checks.reduce((sum, c) => sum + c.score, 0) / checks.length;
  
  return {
    dimension: 'feed',
    score: Math.round(avgScore),
    status: getStatusFromScore(avgScore),
    checks,
    recommendations: checks.filter(c => c.recommendation).map(c => c.recommendation!),
    weight: config.weights.feed,
    metrics: {
      googleReadyScore: Math.max(0, googleScore),
      metaReadyScore: Math.max(0, metaScore),
      amazonReadyScore: Math.max(0, amazonScore),
      completenessScore: Math.max(0, completenessScore),
      missingRequiredFields: missingRequired,
      missingRecommendedFields: missingRecommended
    }
  };
}

// ============================================================================
// AUDIT MARCHÉ
// ============================================================================

export function auditMarket(
  data: MarketAuditData,
  config: ProductAuditEngineConfig = DEFAULT_AUDIT_ENGINE_CONFIG
): MarketAuditResult {
  const checks: AuditCheck[] = [];
  
  // Check 1: Position prix
  const pricePositionMap = {
    'lowest': { score: 90, status: 'passed' as AuditStatus },
    'below_average': { score: 80, status: 'passed' as AuditStatus },
    'average': { score: 60, status: 'warning' as AuditStatus },
    'above_average': { score: 40, status: 'warning' as AuditStatus },
    'highest': { score: 20, status: 'failed' as AuditStatus }
  };
  
  const pricePosition = data.pricePosition || 'average';
  checks.push({
    id: 'market-price-position',
    name: 'Position prix',
    description: 'Votre prix par rapport au marché',
    status: pricePositionMap[pricePosition].status,
    score: pricePositionMap[pricePosition].score,
    value: pricePosition.replace('_', ' '),
    expectedValue: 'Compétitif',
    recommendation: pricePosition === 'highest' || pricePosition === 'above_average' 
      ? 'Votre prix est au-dessus du marché, envisagez une réduction' 
      : undefined,
    impact: 'high'
  });
  
  // Check 2: Tendance de demande
  const demandMap = {
    'rising': { score: 100, status: 'passed' as AuditStatus },
    'stable': { score: 70, status: 'passed' as AuditStatus },
    'declining': { score: 30, status: 'warning' as AuditStatus }
  };
  
  const demand = data.demandTrend || 'stable';
  checks.push({
    id: 'market-demand',
    name: 'Tendance demande',
    description: 'Évolution de la demande',
    status: demandMap[demand].status,
    score: demandMap[demand].score,
    value: demand === 'rising' ? 'En hausse' : demand === 'stable' ? 'Stable' : 'En baisse',
    expectedValue: 'Hausse ou stable',
    recommendation: demand === 'declining' 
      ? 'La demande baisse, envisagez de réduire les stocks ou les promotions' 
      : undefined,
    impact: 'high'
  });
  
  // Check 3: Niveau de concurrence
  const competitionMap = {
    'low': { score: 95, status: 'passed' as AuditStatus },
    'medium': { score: 70, status: 'passed' as AuditStatus },
    'high': { score: 45, status: 'warning' as AuditStatus },
    'very_high': { score: 25, status: 'failed' as AuditStatus }
  };
  
  const competition = data.competitionLevel || 'medium';
  checks.push({
    id: 'market-competition',
    name: 'Niveau concurrence',
    description: 'Intensité concurrentielle',
    status: competitionMap[competition].status,
    score: competitionMap[competition].score,
    value: competition.replace('_', ' '),
    expectedValue: 'Faible à moyen',
    recommendation: competition === 'very_high' || competition === 'high'
      ? 'Marché très concurrentiel, différenciez-vous par le service ou la qualité'
      : undefined,
    impact: 'medium'
  });
  
  // Check 4: Score trending
  const trendingScore = data.trendingScore ?? 50;
  checks.push({
    id: 'market-trending',
    name: 'Score tendance',
    description: 'Popularité du produit',
    status: trendingScore >= 70 ? 'passed' : trendingScore >= 40 ? 'warning' : 'failed',
    score: trendingScore,
    value: `${trendingScore}/100`,
    expectedValue: '≥ 70',
    recommendation: trendingScore < 70 ? 'Produit peu tendance, optimisez le marketing' : undefined,
    impact: 'medium'
  });
  
  // Check 5: Saturation marché
  const saturation = data.marketSaturation ?? 50;
  checks.push({
    id: 'market-saturation',
    name: 'Saturation marché',
    description: 'Niveau de saturation du marché',
    status: saturation <= 40 ? 'passed' : saturation <= 70 ? 'warning' : 'failed',
    score: Math.max(0, 100 - saturation),
    value: `${saturation}%`,
    expectedValue: '≤ 40%',
    recommendation: saturation > 70 ? 'Marché saturé, envisagez des niches ou différenciez-vous' : undefined,
    impact: 'medium'
  });
  
  // Check 6: Volume de recherche
  const searchVolume = data.searchVolume ?? 0;
  const searchScore = searchVolume >= 10000 ? 100 : searchVolume >= 5000 ? 80 : searchVolume >= 1000 ? 60 : searchVolume >= 100 ? 40 : 20;
  checks.push({
    id: 'market-search-volume',
    name: 'Volume recherche',
    description: 'Nombre de recherches mensuelles',
    status: searchScore >= 60 ? 'passed' : searchScore >= 40 ? 'warning' : 'failed',
    score: searchScore,
    value: searchVolume > 0 ? `${searchVolume.toLocaleString()}/mois` : 'Non mesuré',
    expectedValue: '≥ 1000/mois',
    recommendation: searchVolume < 1000 ? 'Faible demande, considérez l\'optimisation SEO' : undefined,
    impact: 'medium'
  });
  
  // Calcul des métriques
  const priceCompetitiveness = pricePositionMap[pricePosition].score;
  const demandScore = demandMap[demand].score;
  const opportunityScore = Math.round((priceCompetitiveness + demandScore + (100 - saturation)) / 3);
  const competitionIndex = competitionMap[competition].score;
  
  let marketPosition: 'leader' | 'challenger' | 'follower' | 'niche' = 'follower';
  if (priceCompetitiveness >= 80 && demandScore >= 70) marketPosition = 'leader';
  else if (priceCompetitiveness >= 60 && demandScore >= 60) marketPosition = 'challenger';
  else if (saturation <= 30) marketPosition = 'niche';
  
  const avgScore = checks.reduce((sum, c) => sum + c.score, 0) / checks.length;
  
  return {
    dimension: 'market',
    score: Math.round(avgScore),
    status: getStatusFromScore(avgScore),
    checks,
    recommendations: checks.filter(c => c.recommendation).map(c => c.recommendation!),
    weight: config.weights.market,
    metrics: {
      priceCompetitiveness,
      demandScore,
      opportunityScore,
      competitionIndex,
      marketPosition
    }
  };
}

// ============================================================================
// MOTEUR PRINCIPAL
// ============================================================================

export interface ProductAuditInput {
  productId: string;
  productName: string;
  productSku?: string;
  profitability: ProfitabilityAuditData;
  supplier: SupplierAuditData;
  feed: FeedAuditData;
  market: MarketAuditData;
}

export function runProductAuditEngine(
  input: ProductAuditInput,
  config: ProductAuditEngineConfig = DEFAULT_AUDIT_ENGINE_CONFIG
): ProductAuditEngineResult {
  // Exécuter les 4 audits
  const profitabilityResult = auditProfitability(input.profitability, config);
  const supplierResult = auditSupplier(input.supplier, config);
  const feedResult = auditFeed(input.feed, config);
  const marketResult = auditMarket(input.market, config);
  
  // Calcul du score global pondéré
  const globalScore = Math.round(
    profitabilityResult.score * config.weights.profitability +
    supplierResult.score * config.weights.supplier +
    feedResult.score * config.weights.feed +
    marketResult.score * config.weights.market
  );
  
  // Générer le résumé SWOT
  const summary = generateSWOTSummary(
    profitabilityResult,
    supplierResult,
    feedResult,
    marketResult
  );
  
  // Générer les actions prioritaires
  const priorityActions = generatePriorityActions(
    profitabilityResult,
    supplierResult,
    feedResult,
    marketResult
  );
  
  return {
    productId: input.productId,
    productName: input.productName,
    productSku: input.productSku,
    globalScore,
    globalStatus: getStatusFromScore(globalScore),
    auditedAt: new Date().toISOString(),
    dimensions: {
      profitability: profitabilityResult,
      supplier: supplierResult,
      feed: feedResult,
      market: marketResult
    },
    summary: {
      ...summary,
      priorityActions
    }
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function getStatusFromScore(score: number): AuditStatus {
  if (score >= 80) return 'passed';
  if (score >= 60) return 'warning';
  return 'failed';
}

function generateSWOTSummary(
  profitability: ProfitabilityAuditResult,
  supplier: SupplierAuditResult,
  feed: FeedAuditResult,
  market: MarketAuditResult
): { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const threats: string[] = [];
  
  // Analyse rentabilité
  if (profitability.metrics.marginHealth === 'excellent') {
    strengths.push('Excellente marge bénéficiaire');
  } else if (profitability.metrics.marginHealth === 'critical') {
    weaknesses.push('Marge insuffisante');
    threats.push('Risque de non-rentabilité');
  }
  
  // Analyse fournisseur
  if (supplier.metrics.riskLevel === 'low') {
    strengths.push('Chaîne d\'approvisionnement fiable');
  } else if (supplier.metrics.riskLevel === 'critical') {
    threats.push('Risque rupture fournisseur');
  }
  
  if (supplier.metrics.diversificationStatus === 'single_source') {
    weaknesses.push('Dépendance à un seul fournisseur');
    opportunities.push('Diversifier les sources d\'approvisionnement');
  }
  
  // Analyse flux
  if (feed.metrics.googleReadyScore >= 80) {
    strengths.push('Produit optimisé pour Google Shopping');
  } else if (feed.metrics.missingRequiredFields.length > 0) {
    weaknesses.push(`Champs manquants: ${feed.metrics.missingRequiredFields.join(', ')}`);
    opportunities.push('Compléter les données produit pour améliorer la visibilité');
  }
  
  // Analyse marché
  if (market.metrics.marketPosition === 'leader') {
    strengths.push('Position de leader sur le marché');
  } else if (market.metrics.marketPosition === 'niche') {
    opportunities.push('Potentiel de croissance sur un marché de niche');
  }
  
  if (market.metrics.opportunityScore >= 70) {
    opportunities.push('Fort potentiel de croissance');
  }
  
  if (market.metrics.competitionIndex < 50) {
    threats.push('Forte pression concurrentielle');
  }
  
  return { strengths, weaknesses, opportunities, threats };
}

function generatePriorityActions(
  profitability: ProfitabilityAuditResult,
  supplier: SupplierAuditResult,
  feed: FeedAuditResult,
  market: MarketAuditResult
): PriorityAction[] {
  const actions: PriorityAction[] = [];
  
  // Analyser tous les checks échoués
  const allResults = [
    { dimension: 'profitability' as AuditDimension, result: profitability },
    { dimension: 'supplier' as AuditDimension, result: supplier },
    { dimension: 'feed' as AuditDimension, result: feed },
    { dimension: 'market' as AuditDimension, result: market }
  ];
  
  allResults.forEach(({ dimension, result }) => {
    result.checks
      .filter(check => check.status === 'failed' || check.status === 'warning')
      .forEach(check => {
        if (check.recommendation) {
          actions.push({
            id: check.id,
            dimension,
            action: check.recommendation,
            impact: check.impact,
            effort: check.impact === 'high' ? 'medium' : 'low',
            estimatedScoreGain: check.impact === 'high' ? 15 : check.impact === 'medium' ? 10 : 5
          });
        }
      });
  });
  
  // Trier par impact puis par effort (quick wins en premier)
  return actions.sort((a, b) => {
    const impactOrder = { high: 3, medium: 2, low: 1 };
    const effortOrder = { low: 3, medium: 2, high: 1 };
    
    const scoreA = impactOrder[a.impact] * 2 + effortOrder[a.effort];
    const scoreB = impactOrder[b.impact] * 2 + effortOrder[b.effort];
    
    return scoreB - scoreA;
  }).slice(0, 10); // Top 10 actions
}
