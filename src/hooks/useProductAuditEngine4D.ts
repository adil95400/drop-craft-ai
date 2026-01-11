/**
 * Hook pour le Product Audit Engine 4 dimensions
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  runProductAuditEngine, 
  ProductAuditInput 
} from '@/lib/audit/product-audit-engine';
import {
  ProductAuditEngineResult,
  ProductAuditEngineConfig,
  DEFAULT_AUDIT_ENGINE_CONFIG,
  AuditDimension
} from '@/types/product-audit-engine';
import { UnifiedProduct } from '@/services/ProductsUnifiedService';

export function convertProductToAuditInput(product: UnifiedProduct): ProductAuditInput {
  const sellPrice = product.price || 0;
  const costPrice = product.cost_price || sellPrice * 0.4;
  
  return {
    productId: product.id,
    productName: product.name || 'Produit sans nom',
    productSku: product.sku,
    profitability: {
      sellPrice,
      costPrice,
      shippingCost: 3,
      platformFees: sellPrice * 0.15,
      advertisingCost: sellPrice * 0.10,
      returnRate: 5,
      targetMargin: 30
    },
    supplier: {
      supplierId: product.supplier_ids?.[0],
      supplierName: undefined,
      averageDeliveryDays: 10,
      onTimeDeliveryRate: 90,
      defectRate: 2,
      hasBackupSupplier: false
    },
    feed: {
      title: product.name,
      description: product.description,
      category: product.category,
      gtin: undefined,
      brand: undefined,
      imageUrl: product.image_url,
      additionalImages: product.images,
      availability: product.stock_quantity && product.stock_quantity > 0 ? 'in_stock' : 'out_of_stock',
      price: product.price
    },
    market: {
      pricePosition: 'average',
      demandTrend: 'stable',
      competitionLevel: 'medium',
      trendingScore: 50,
      marketSaturation: 50
    }
  };
}

export function useProductAuditEngine4D(config: ProductAuditEngineConfig = DEFAULT_AUDIT_ENGINE_CONFIG) {
  const [selectedDimension, setSelectedDimension] = useState<AuditDimension | 'all'>('all');
  
  const auditSingleProduct = useCallback((product: UnifiedProduct): ProductAuditEngineResult => {
    const input = convertProductToAuditInput(product);
    return runProductAuditEngine(input, config);
  }, [config]);
  
  const auditProducts = useCallback((products: UnifiedProduct[]): ProductAuditEngineResult[] => {
    return products.map(product => auditSingleProduct(product));
  }, [auditSingleProduct]);
  
  return {
    auditSingleProduct,
    auditProducts,
    selectedDimension,
    setSelectedDimension,
    config
  };
}

export function useAuditEngineStats(auditResults: ProductAuditEngineResult[]) {
  return useMemo(() => {
    if (auditResults.length === 0) {
      return {
        totalProducts: 0,
        averageGlobalScore: 0,
        averageByDimension: { profitability: 0, supplier: 0, feed: 0, market: 0 },
        distribution: { excellent: 0, good: 0, warning: 0, failed: 0 }
      };
    }
    
    const avgGlobal = auditResults.reduce((sum, r) => sum + r.globalScore, 0) / auditResults.length;
    
    return {
      totalProducts: auditResults.length,
      averageGlobalScore: Math.round(avgGlobal),
      averageByDimension: {
        profitability: Math.round(auditResults.reduce((sum, r) => sum + r.dimensions.profitability.score, 0) / auditResults.length),
        supplier: Math.round(auditResults.reduce((sum, r) => sum + r.dimensions.supplier.score, 0) / auditResults.length),
        feed: Math.round(auditResults.reduce((sum, r) => sum + r.dimensions.feed.score, 0) / auditResults.length),
        market: Math.round(auditResults.reduce((sum, r) => sum + r.dimensions.market.score, 0) / auditResults.length)
      },
      distribution: {
        excellent: auditResults.filter(r => r.globalScore >= 80).length,
        good: auditResults.filter(r => r.globalScore >= 60 && r.globalScore < 80).length,
        warning: auditResults.filter(r => r.globalScore >= 40 && r.globalScore < 60).length,
        failed: auditResults.filter(r => r.globalScore < 40).length
      }
    };
  }, [auditResults]);
}
