import { supabase } from '@/integrations/supabase/client';

class SEOService {
  async runOptimization(checkType: string, recommendations: string[]): Promise<any> {
    // Get current session to ensure we're authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }

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
