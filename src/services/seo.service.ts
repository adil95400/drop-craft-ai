import { shopOptiApi } from '@/services/api/ShopOptiApiClient';

class SEOService {
  async runOptimization(checkType: string, recommendations: string[]): Promise<any> {
    const res = await shopOptiApi.request('/seo/optimize', {
      method: 'POST',
      body: { checkType, recommendations }
    });
    if (!res.success) throw new Error(res.error || 'Failed to apply optimizations');
    return res.data;
  }
}

export const seoService = new SEOService();
