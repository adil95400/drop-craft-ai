import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

class SEOService {
  async runOptimization(checkType: string, recommendations: string[]): Promise<any> {
    try {
      const response = await supabase.functions.invoke('seo-fix-apply', {
        body: { checkType, recommendations }
      });
      if (response.error) throw new Error(response.error.message || 'Erreur SEO');
      toast.success(`Optimisation "${checkType}" appliquée`, { description: `${response.data?.applied || 0} corrections effectuées` });
      return response.data || { success: true, applied: 0 };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur optimisation SEO: ${msg}`);
      return { success: false, applied: 0, error: msg };
    }
  }
}

export const seoService = new SEOService();
