import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { DataExportService, ExportFormat } from '@/services/dataExportService';

export function useOptimizedExport() {
  const exportData = useCallback(async (
    format: ExportFormat,
    tableName: string = 'imported_products',
    filters?: Record<string, any>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      let query = supabase
        .from(tableName as any)
        .select('*')
        .eq('user_id', user.id);

      // Appliquer les filtres si fournis
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data || data.length === 0) {
        toast({
          title: 'Aucune donnée',
          description: 'Aucune donnée à exporter',
          variant: 'destructive',
        });
        return;
      }

      // Nettoyer les données pour l'export (retirer user_id)
      const cleanData = data.map((item: any) => {
        const { user_id, ...rest } = item;
        return rest;
      });

      await DataExportService.exportData(cleanData, format, tableName);

      toast({
        title: 'Export réussi',
        description: `${data.length} éléments exportés`,
      });
    } catch (error) {
      toast({
        title: 'Erreur d\'export',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  }, []);

  const downloadTemplate = useCallback(() => {
    try {
      DataExportService.generateTemplate();
      toast({
        title: 'Template téléchargé',
        description: 'Utilisez ce template pour préparer votre import',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le template',
        variant: 'destructive',
      });
    }
  }, []);

  return {
    exportData,
    downloadTemplate,
  };
}
