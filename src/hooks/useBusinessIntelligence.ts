import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for secure access to business intelligence data
 * Only available to admin users
 */
export const useBusinessIntelligence = () => {
  const { logSecurityEvent } = useSecurityMonitoring();

  const getBusinessIntelligence = async () => {
    try {
      // Log access attempt
      await logSecurityEvent(
        'business_intelligence_access',
        'info',
        'Admin user accessing business intelligence data'
      );

      const { data, error } = await supabase.rpc('get_business_intelligence', {
        limit_count: 100
      });

      if (error) {
        await logSecurityEvent(
          'business_intelligence_access_denied',
          'warning',
          `Failed to access business intelligence: ${error.message}`
        );
        throw error;
      }

      await logSecurityEvent(
        'business_intelligence_access_success',
        'info',
        `Successfully accessed ${data?.length || 0} business intelligence records`
      );

      return data;
    } catch (error) {
      console.error('Business intelligence access error:', error);
      throw error;
    }
  };

  const getProductCostAnalysis = async (productId?: string) => {
    try {
      await logSecurityEvent(
        'cost_analysis_access',
        'info',
        'Admin accessing product cost analysis'
      );

      // This is admin-only sensitive data access
      const { data, error } = await supabase
        .from('catalog_products')
        .select('id, name, cost_price, price, profit_margin, supplier_name')
        .eq(productId ? 'id' : 'id', productId || '')
        .order('profit_margin', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      await logSecurityEvent(
        'cost_analysis_access_denied',
        'error',
        `Cost analysis access failed: ${error.message}`
      );
      throw error;
    }
  };

  return {
    getBusinessIntelligence,
    getProductCostAnalysis
  };
};