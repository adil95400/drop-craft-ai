/**
 * Supplier Reliability Hook
 * Provides reliability scoring, comparison, and recommendation
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReliabilityMetrics {
  supplierId: string;
  supplierName: string;
  overallScore: number;
  metrics: {
    deliverySpeed: { score: number; avgDays: number; onTimeRate: number };
    productQuality: { score: number; returnRate: number; defectRate: number };
    communication: { score: number; responseTimeHours: number; resolutionRate: number };
    pricing: { score: number; competitiveness: number; stabilityIndex: number };
    stockAccuracy: { score: number; accuracyRate: number; outOfStockRate: number };
  };
  historicalData: {
    month: string;
    score: number;
    orders: number;
    issues: number;
  }[];
  recommendation: 'excellent' | 'good' | 'fair' | 'caution' | 'avoid';
  warnings: string[];
  strengths: string[];
}

export interface SupplierComparison {
  suppliers: ReliabilityMetrics[];
  bestOverall: string;
  bestDelivery: string;
  bestQuality: string;
  bestPricing: string;
  recommendation: string;
}

export function useSupplierReliability() {
  // Fetch reliability data for all connected suppliers
  const { data: reliabilityData, isLoading } = useQuery({
    queryKey: ['supplier-reliability'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get connected suppliers
      const { data: connections } = await supabase
        .from('premium_supplier_connections')
        .select('premium_supplier_id')
        .eq('user_id', user.id)
        .eq('connection_status', 'active');

      if (!connections?.length) return [];

      // Fetch reliability scores for each
      const scores = await Promise.all(
        connections.map(async (conn) => {
          try {
            const { data } = await supabase.functions.invoke('supplier-scorer', {
              body: { supplier_id: conn.premium_supplier_id, detailed: true },
            });
            return data as ReliabilityMetrics;
          } catch {
            return null;
          }
        })
      );

      return scores.filter(Boolean) as ReliabilityMetrics[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculate reliability score for a specific supplier
  const calculateScoreMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      const { data, error } = await supabase.functions.invoke('supplier-scorer', {
        body: { 
          supplier_id: supplierId,
          detailed: true,
          include_history: true,
        },
      });

      if (error) throw error;
      return data as ReliabilityMetrics;
    },
  });

  // Compare multiple suppliers
  const compareMutation = useMutation({
    mutationFn: async (supplierIds: string[]) => {
      const results = await Promise.all(
        supplierIds.map(async (id) => {
          const { data } = await supabase.functions.invoke('supplier-scorer', {
            body: { supplier_id: id, detailed: true },
          });
          return data as ReliabilityMetrics;
        })
      );

      const validResults = results.filter(Boolean);
      
      // Determine best in each category
      const bestOverall = validResults.reduce((best, curr) => 
        curr.overallScore > (best?.overallScore || 0) ? curr : best
      , validResults[0]);

      const bestDelivery = validResults.reduce((best, curr) => 
        curr.metrics.deliverySpeed.score > (best?.metrics.deliverySpeed.score || 0) ? curr : best
      , validResults[0]);

      const bestQuality = validResults.reduce((best, curr) => 
        curr.metrics.productQuality.score > (best?.metrics.productQuality.score || 0) ? curr : best
      , validResults[0]);

      const bestPricing = validResults.reduce((best, curr) => 
        curr.metrics.pricing.score > (best?.metrics.pricing.score || 0) ? curr : best
      , validResults[0]);

      return {
        suppliers: validResults,
        bestOverall: bestOverall?.supplierId,
        bestDelivery: bestDelivery?.supplierId,
        bestQuality: bestQuality?.supplierId,
        bestPricing: bestPricing?.supplierId,
        recommendation: generateRecommendation(validResults),
      } as SupplierComparison;
    },
  });

  // Get recommendation label
  const getRecommendationLabel = (recommendation: string) => {
    const labels: Record<string, { label: string; color: string; icon: string }> = {
      excellent: { label: 'Excellent', color: 'text-green-600', icon: '⭐' },
      good: { label: 'Bon', color: 'text-blue-600', icon: '👍' },
      fair: { label: 'Correct', color: 'text-yellow-600', icon: '⚠️' },
      caution: { label: 'Attention', color: 'text-orange-600', icon: '⚡' },
      avoid: { label: 'À éviter', color: 'text-red-600', icon: '❌' },
    };
    return labels[recommendation] || labels.fair;
  };

  // Format score as percentage
  const formatScore = (score: number) => Math.round(score * 100);

  return {
    reliabilityData,
    isLoading,

    calculateScore: calculateScoreMutation.mutateAsync,
    isCalculating: calculateScoreMutation.isPending,
    
    compare: compareMutation.mutateAsync,
    isComparing: compareMutation.isPending,
    comparisonResult: compareMutation.data,

    getRecommendationLabel,
    formatScore,
  };
}

function generateRecommendation(suppliers: ReliabilityMetrics[]): string {
  if (!suppliers.length) return 'Aucun fournisseur à comparer';
  
  const excellent = suppliers.filter(s => s.recommendation === 'excellent');
  const good = suppliers.filter(s => s.recommendation === 'good');
  
  if (excellent.length > 0) {
    return `${excellent[0].supplierName} est recommandé pour sa fiabilité exceptionnelle`;
  }
  
  if (good.length > 0) {
    return `${good[0].supplierName} offre un bon équilibre qualité/prix`;
  }
  
  return 'Considérez diversifier vos fournisseurs pour réduire les risques';
}
