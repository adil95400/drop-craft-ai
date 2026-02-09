/**
 * SEO Service — Thin wrapper around API V1
 * Zero direct Edge Function / DB calls
 */
import { seoApi } from '@/services/api/seoApi';
import { toast } from 'sonner';

class SEOService {
  async runOptimization(targetId: string, fields: Record<string, any>): Promise<any> {
    try {
      const result = await seoApi.apply({
        target_type: 'product',
        target_id: targetId,
        fields,
      });
      toast.success('Optimisation SEO appliquée', { description: `${result.applied_fields.length} champs mis à jour` });
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur optimisation SEO: ${msg}`);
      return { success: false, applied_fields: [], error: msg };
    }
  }

  async launchAudit(url: string, options?: { scope?: string; language?: string }) {
    try {
      const result = await seoApi.audit({
        url,
        scope: (options?.scope as any) ?? 'url',
        language: options?.language ?? 'fr',
      });
      toast.success('Audit SEO lancé', { description: 'L\'analyse est en cours...' });
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur audit SEO: ${msg}`);
      throw error;
    }
  }
}

export const seoService = new SEOService();
