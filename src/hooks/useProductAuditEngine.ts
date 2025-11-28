/**
 * Hook pour utiliser le moteur d'audit produit
 * Calcule les audits en temps réel avec mémoïsation
 */

import { useMemo } from 'react';
import { UnifiedProduct } from '@/services/ProductsUnifiedService';
import { auditProduct, calculateCatalogStats } from '@/lib/audit/auditProduct';
import { ProductAuditResult, AuditConfig, DEFAULT_AUDIT_CONFIG } from '@/types/audit';

export function useProductAudit(
  product: UnifiedProduct | undefined,
  config: AuditConfig = DEFAULT_AUDIT_CONFIG
): ProductAuditResult | null {
  return useMemo(() => {
    if (!product) return null;
    return auditProduct(product, config);
  }, [product, config]);
}

export function useProductsAudit(
  products: UnifiedProduct[],
  config: AuditConfig = DEFAULT_AUDIT_CONFIG
): {
  auditResults: ProductAuditResult[];
  stats: ReturnType<typeof calculateCatalogStats>;
} {
  const auditResults = useMemo(() => {
    return products.map(product => auditProduct(product, config));
  }, [products, config]);

  const stats = useMemo(() => {
    return calculateCatalogStats(auditResults);
  }, [auditResults]);

  return { auditResults, stats };
}

/**
 * Hook pour filtrer les produits par score d'audit
 */
export function useAuditScoreFilter(
  auditResults: ProductAuditResult[],
  minScore?: number,
  maxScore?: number,
  criticalOnly?: boolean
) {
  return useMemo(() => {
    let filtered = auditResults;

    if (minScore !== undefined) {
      filtered = filtered.filter(r => r.score.global >= minScore);
    }

    if (maxScore !== undefined) {
      filtered = filtered.filter(r => r.score.global <= maxScore);
    }

    if (criticalOnly) {
      filtered = filtered.filter(r => 
        r.issues.some(issue => issue.severity === 'critical')
      );
    }

    return filtered;
  }, [auditResults, minScore, maxScore, criticalOnly]);
}
