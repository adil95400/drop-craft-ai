import { supabase } from '@/integrations/supabase/client';

class SEOService {
  async runOptimization(checkType: string, recommendations: string[]): Promise<any> {
    const { data, error } = await supabase.functions.invoke('seo-optimizer', {
      body: {
        checkType,
        recommendations
      }
    });

    if (error) throw error;
    return data;
  }
}

export const seoService = new SEOService();
