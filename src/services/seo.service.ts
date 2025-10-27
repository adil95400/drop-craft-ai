import { supabase } from '@/integrations/supabase/client';

class SEOService {
  async runOptimization(checkType: string, recommendations: string[]): Promise<any> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/seo-optimizer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        checkType,
        recommendations
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to apply optimizations');
    }

    return response.json();
  }
}

export const seoService = new SEOService();
